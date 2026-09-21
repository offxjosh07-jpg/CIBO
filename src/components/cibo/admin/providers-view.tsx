"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  Ban,
  Store,
  Star,
  MapPin,
  Phone,
  FileText,
} from "lucide-react";
import { fmtPrice, fmtDate, initials, cn } from "@/lib/utils";
import {
  PageShell,
  PageHeader,
  AdminEmptyState,
  TableSkeleton,
  VerificationPill,
} from "./shared";

export function ProvidersView() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const q = useQuery({
    queryKey: ["admin", "providers"],
    queryFn: () => adminApi.providers(),
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [detail, setDetail] = useState<any | null>(null);
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<any | null>(null);

  const verifyMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.verifyProvider(id, status),
    onSuccess: (_d, vars) => {
      toast({
        title:
          vars.status === "VERIFIED"
            ? "Provider verified"
            : vars.status === "REJECTED"
            ? "Provider rejected"
            : vars.status === "SUSPENDED"
            ? "Provider suspended"
            : "Provider updated",
        description: "The verification status has been updated.",
      });
      qc.invalidateQueries({ queryKey: ["admin", "providers"] });
    },
    onError: (e: any) =>
      toast({
        title: "Action failed",
        description: e?.message || "Please try again.",
        variant: "destructive",
      }),
  });

  const providers = q.data?.providers || [];

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return providers.filter((p: any) => {
      const matchSearch =
        !s ||
        p.businessName?.toLowerCase().includes(s) ||
        p.ownerName?.toLowerCase().includes(s) ||
        p.city?.toLowerCase().includes(s) ||
        p.email?.toLowerCase().includes(s);
      const matchStatus =
        statusFilter === "ALL" || p.verificationStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [providers, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { ALL: providers.length };
    for (const p of providers) c[p.verificationStatus] = (c[p.verificationStatus] || 0) + 1;
    return c;
  }, [providers]);

  return (
    <PageShell className="space-y-5">
      <PageHeader
        title="Providers"
        subtitle={`${providers.length} total · ${statusCounts.VERIFIED || 0} verified · ${statusCounts.PENDING || 0} pending`}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by business, owner, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border-forest/15 bg-card pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {["ALL", "VERIFIED", "PENDING", "UNDER_REVIEW", "REJECTED", "SUSPENDED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                statusFilter === s
                  ? "bg-forest text-ivory"
                  : "bg-card text-forest/70 border border-forest/15 hover:bg-cream/60"
              )}
            >
              {s === "ALL" ? "All" : s.replace("_", " ").toLowerCase()}
              <span className="ml-1 opacity-70">{statusCounts[s] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-forest/8 bg-card cibo-shadow">
        {q.isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            title="No providers found"
            description="Try adjusting your filters."
            icon={<Store className="size-5" />}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-cream/40 hover:bg-cream/40">
                <TableHead className="pl-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Business</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">City</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Type</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Rating</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Orders</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Revenue</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Meals</TableHead>
                <TableHead className="pr-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p: any) => (
                <TableRow key={p.id} className="text-sm">
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-9 place-items-center rounded-full bg-olive text-[10px] font-bold text-ivory">
                        {initials(p.businessName || "?")}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-forest">{p.businessName}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{p.ownerName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3 text-gold" />
                      {p.city}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.businessType || "—"}
                  </TableCell>
                  <TableCell>
                    <VerificationPill status={p.verificationStatus} />
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-forest">
                      <Star className="size-3 text-gold" />
                      {p.rating?.toFixed(1) || "—"}
                      <span className="text-muted-foreground">({p.totalRatings || 0})</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-forest">{p.totalOrders || 0}</TableCell>
                  <TableCell className="text-xs font-bold text-forest">{fmtPrice(p.totalRevenue || 0)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.mealsRescued || 0}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setDetail(p)}>
                          <Eye className="size-3.5" /> View details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {p.verificationStatus !== "VERIFIED" && (
                          <DropdownMenuItem
                            onClick={() => verifyMut.mutate({ id: p.id, status: "VERIFIED" })}
                          >
                            <CheckCircle2 className="size-3.5" /> Verify
                          </DropdownMenuItem>
                        )}
                        {p.verificationStatus !== "REJECTED" && (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setRejectTarget(p)}
                          >
                            <XCircle className="size-3.5" /> Reject
                          </DropdownMenuItem>
                        )}
                        {p.verificationStatus !== "SUSPENDED" && (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setSuspendTarget(p)}
                          >
                            <Ban className="size-3.5" /> Suspend
                          </DropdownMenuItem>
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

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Provider details</DialogTitle>
            <DialogDescription>
              Full business profile and submitted documents.
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="max-h-[70vh] overflow-y-auto space-y-4 pr-1">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="grid size-14 place-items-center rounded-2xl bg-olive text-base font-bold text-ivory">
                  {initials(detail.businessName || "?")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold text-forest">{detail.businessName}</p>
                  <p className="text-xs text-muted-foreground">{detail.ownerName} · {detail.businessType}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <VerificationPill status={detail.verificationStatus} />
                    <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold text-forest">
                      <Star className="size-2.5 text-gold" /> {detail.rating?.toFixed(1) || "—"} ({detail.totalRatings || 0})
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2">
                <Stat label="Orders" value={detail.totalOrders || 0} />
                <Stat label="Revenue" value={fmtPrice(detail.totalRevenue || 0)} />
                <Stat label="Meals rescued" value={detail.mealsRescued || 0} />
                <Stat label="Waste avoided" value={`${Math.round(detail.wasteAvoidedKg || 0)}kg`} />
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Info label="Email" value={detail.email} icon={<FileText className="size-3" />} />
                <Info label="Phone" value={detail.phone} icon={<Phone className="size-3" />} />
                <Info label="City" value={detail.city} icon={<MapPin className="size-3" />} />
                <Info label="FSSAI license" value={detail.licenseNumber || "—"} icon={<FileText className="size-3" />} />
              </div>

              {/* Address */}
              <div className="rounded-xl border border-forest/8 bg-cream/30 p-3 text-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Address</p>
                <p className="mt-1 text-forest">
                  {detail.addressLine}, {detail.city}, {detail.state} {detail.pincode}
                </p>
              </div>

              {/* Documents */}
              {detail.documents?.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Documents ({detail.documents.length})
                  </p>
                  <ul className="space-y-1.5">
                    {detail.documents.map((doc: any) => (
                      <li
                        key={doc.id}
                        className="flex items-center gap-2 rounded-lg border border-forest/8 bg-card p-2 text-xs"
                      >
                        <FileText className="size-4 text-gold" />
                        <span className="flex-1 font-semibold text-forest">
                          {doc.type?.replace(/_/g, " ").toLowerCase() || "Document"}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {doc.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bio */}
              {detail.bio && (
                <div className="rounded-xl border border-forest/8 bg-card p-3 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bio</p>
                  <p className="mt-1 text-forest">{detail.bio}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 border-t border-forest/8 pt-3">
                {detail.verificationStatus !== "VERIFIED" && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      verifyMut.mutate({ id: detail.id, status: "VERIFIED" });
                      setDetail(null);
                    }}
                  >
                    <CheckCircle2 className="size-4" /> Verify provider
                  </Button>
                )}
                {detail.verificationStatus !== "REJECTED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-danger/30 text-danger"
                    onClick={() => {
                      setRejectTarget(detail);
                      setDetail(null);
                    }}
                  >
                    <XCircle className="size-4" /> Reject
                  </Button>
                )}
                {detail.verificationStatus !== "SUSPENDED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-danger/30 text-danger"
                    onClick={() => {
                      setSuspendTarget(detail);
                      setDetail(null);
                    }}
                  >
                    <Ban className="size-4" /> Suspend
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject confirm */}
      <AlertDialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this provider?</AlertDialogTitle>
            <AlertDialogDescription>
              {rejectTarget?.businessName} will be marked as REJECTED and notified.
              They can resubmit documents if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              onClick={() => {
                if (rejectTarget) {
                  verifyMut.mutate({ id: rejectTarget.id, status: "REJECTED" });
                  setRejectTarget(null);
                }
              }}
            >
              Reject provider
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend confirm */}
      <AlertDialog open={!!suspendTarget} onOpenChange={(o) => !o && setSuspendTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend this provider?</AlertDialogTitle>
            <AlertDialogDescription>
              {suspendTarget?.businessName} will be unable to operate on CIBO until reinstated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              onClick={() => {
                if (suspendTarget) {
                  verifyMut.mutate({ id: suspendTarget.id, status: "SUSPENDED" });
                  setSuspendTarget(null);
                }
              }}
            >
              Suspend provider
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-forest/8 bg-card p-2.5 text-center">
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-sm font-bold text-forest">{value}</p>
    </div>
  );
}

function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-forest/8 bg-card p-2.5">
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-0.5 truncate text-forest">{value}</p>
    </div>
  );
}
