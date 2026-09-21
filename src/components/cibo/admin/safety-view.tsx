"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Ban,
  MoreHorizontal,
  Refrigerator,
  Leaf,
  FileWarning,
} from "lucide-react";
import { fmtDateTime, cn } from "@/lib/utils";
import {
  PageShell,
  PageHeader,
  AdminEmptyState,
  TableSkeleton,
  Stat,
} from "./shared";

type SafetyFilter = "ALL" | "MISSING_DECLARATION" | "EXPIRED_ACTIVE" | "NO_STORAGE";

export function SafetyView() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const q = useQuery({
    queryKey: ["admin", "listings"],
    queryFn: () => adminApi.listings(),
  });
  const [filter, setFilter] = useState<SafetyFilter>("ALL");
  const [takedownTarget, setTakedownTarget] = useState<any | null>(null);

  const takedownMut = useMutation({
    mutationFn: (id: string) => adminApi.takedownListing(id),
    onSuccess: () => {
      toast({
        title: "Listing suspended",
        description: "The listing has been taken down for safety review.",
      });
      qc.invalidateQueries({ queryKey: ["admin", "listings"] });
    },
    onError: (e: any) =>
      toast({
        title: "Action failed",
        description: e?.message || "Please try again.",
        variant: "destructive",
      }),
  });

  const listings = q.data?.listings || [];

  // Compute safety issues for each listing
  const rows = useMemo(() => {
    const now = Date.now();
    return listings.map((l: any) => {
      const issues: { kind: SafetyFilter; label: string; severity: "low" | "med" | "high" }[] = [];
      const expiredButActive =
        l.status === "ACTIVE" && new Date(l.pickupDeadline).getTime() < now;
      if (expiredButActive) {
        issues.push({
          kind: "EXPIRED_ACTIVE",
          label: "Active past pickup deadline",
          severity: "high",
        });
      }
      if (!l.storageInfo || l.storageInfo.trim() === "") {
        issues.push({
          kind: "NO_STORAGE",
          label: "No storage info provided",
          severity: "med",
        });
      }
      if (!l.specialInstructions || l.specialInstructions.trim() === "") {
        issues.push({
          kind: "MISSING_DECLARATION",
          label: "Missing handling/safety declaration",
          severity: "low",
        });
      }
      return { listing: l, issues };
    });
  }, [listings]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return rows;
    return rows.filter((r) => r.issues.some((i) => i.kind === filter));
  }, [rows, filter]);

  // Stats
  const stats = useMemo(() => {
    let missing = 0;
    let expired = 0;
    let noStorage = 0;
    let incidents = 0;
    for (const r of rows) {
      for (const i of r.issues) {
        incidents++;
        if (i.kind === "MISSING_DECLARATION") missing++;
        if (i.kind === "EXPIRED_ACTIVE") expired++;
        if (i.kind === "NO_STORAGE") noStorage++;
      }
    }
    return { missing, expired, noStorage, incidents };
  }, [rows]);

  return (
    <PageShell className="space-y-5">
      <PageHeader
        title="Food Safety Console"
        subtitle="Operational safety review of all listings on the platform."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Total issues"
          value={stats.incidents}
          icon={<ShieldCheck className="size-5" />}
          tone="forest"
        />
        <Stat
          label="Expired & active"
          value={stats.expired}
          icon={<Clock className="size-5" />}
          tone={stats.expired > 0 ? "danger" : "success"}
        />
        <Stat
          label="Missing storage info"
          value={stats.noStorage}
          icon={<Refrigerator className="size-5" />}
          tone="gold"
        />
        <Stat
          label="Missing declaration"
          value={stats.missing}
          icon={<FileWarning className="size-5" />}
          tone="orange"
        />
      </div>

      {/* Safety incidents banner */}
      <div className="rounded-2xl border border-orange/20 bg-orange/5 p-4">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange/15 text-orange">
            <AlertTriangle className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-forest">
              {stats.expired > 0
                ? `${stats.expired} listing${stats.expired === 1 ? "" : "s"} are active past their pickup deadline`
                : "No active listings past their pickup deadline"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {stats.expired > 0
                ? "These should be taken down immediately to prevent food safety incidents."
                : "Pickup deadlines are being respected across the platform."}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1">
        {(
          [
            { k: "ALL", label: "All listings" },
            { k: "EXPIRED_ACTIVE", label: "Expired & active" },
            { k: "NO_STORAGE", label: "No storage info" },
            { k: "MISSING_DECLARATION", label: "Missing declaration" },
          ] as { k: SafetyFilter; label: string }[]
        ).map((opt) => (
          <button
            key={opt.k}
            onClick={() => setFilter(opt.k)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              filter === opt.k
                ? "bg-forest text-ivory"
                : "bg-card text-forest/70 border border-forest/15 hover:bg-cream/60"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-forest/8 bg-card cibo-shadow">
        {q.isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            title="No safety issues"
            description="All listings meet the current safety review criteria."
            icon={<Leaf className="size-5" />}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-cream/40 hover:bg-cream/40">
                <TableHead className="pl-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Listing</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Provider</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pickup deadline</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Issues</TableHead>
                <TableHead className="pr-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(({ listing: l, issues }) => (
                <TableRow key={l.id} className={cn("text-sm", issues.some(i => i.severity === "high") && "bg-danger/5")}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={l.images?.[0] || "/cibo-logo.svg"}
                        alt=""
                        className="size-10 shrink-0 rounded-lg object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/cibo-logo.svg";
                        }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-forest">{l.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {l.foodType} · {l.city}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {l.provider?.businessName || "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        l.status === "ACTIVE"
                          ? "bg-success/10 text-success"
                          : l.status === "EXPIRED"
                          ? "bg-muted text-muted-foreground"
                          : "bg-danger/10 text-danger"
                      )}
                    >
                      {l.status.replace("_", " ").toLowerCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    <span
                      className={cn(
                        new Date(l.pickupDeadline).getTime() < Date.now()
                          ? "font-bold text-danger"
                          : "text-muted-foreground"
                      )}
                    >
                      {fmtDateTime(l.pickupDeadline)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {issues.length === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-success">
                        <ShieldCheck className="size-3" /> Clear
                      </span>
                    ) : (
                      <ul className="space-y-0.5">
                        {issues.map((i, idx) => (
                          <li
                            key={idx}
                            className={cn(
                              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                              i.severity === "high"
                                ? "bg-danger/10 text-danger"
                                : i.severity === "med"
                                ? "bg-gold/15 text-gold"
                                : "bg-cream text-forest"
                            )}
                          >
                            <AlertTriangle className="size-2.5" />
                            {i.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {l.status !== "TAKEN_DOWN" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setTakedownTarget(l)}
                            >
                              <Ban className="size-3.5" /> Suspend listing
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Takedown confirm */}
      <AlertDialog
        open={!!takedownTarget}
        onOpenChange={(o) => !o && setTakedownTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{takedownTarget?.title}&quot; will be taken down immediately for
              safety review. The provider will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              onClick={() => {
                if (takedownTarget) {
                  takedownMut.mutate(takedownTarget.id);
                  setTakedownTarget(null);
                }
              }}
            >
              Suspend listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
