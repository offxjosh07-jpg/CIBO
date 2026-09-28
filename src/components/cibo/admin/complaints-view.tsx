"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { MoreHorizontal, MessageSquareWarning, Search, Eye, Gavel, XCircle } from "lucide-react";
import { fmtDateTime, timeAgo, cn } from "@/lib/utils";
import {
  PageShell,
  PageHeader,
  AdminEmptyState,
  TableSkeleton,
  ComplaintStatusPill,
} from "./shared";

export function ComplaintsView() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const q = useQuery({
    queryKey: ["admin", "complaints"],
    queryFn: () => adminApi.complaints(),
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [detail, setDetail] = useState<any | null>(null);
  const [resolveTarget, setResolveTarget] = useState<any | null>(null);
  const [resolutionText, setResolutionText] = useState("");

  const resolveMut = useMutation({
    mutationFn: ({ id, status, resolution }: { id: string; status: string; resolution: string }) =>
      adminApi.resolveComplaint(id, status, resolution),
    onSuccess: (_d, vars) => {
      toast({
        title:
          vars.status === "RESOLVED"
            ? "Complaint resolved"
            : vars.status === "REJECTED"
            ? "Complaint rejected"
            : "Marked as investigating",
        description: "The customer has been notified of the update.",
      });
      qc.invalidateQueries({ queryKey: ["admin", "complaints"] });
    },
    onError: (e: any) =>
      toast({
        title: "Action failed",
        description: e?.message || "Please try again.",
        variant: "destructive",
      }),
  });

  const complaints = q.data?.complaints || [];

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return complaints.filter((c: any) => {
      const matchSearch =
        !s ||
        c.type?.toLowerCase().includes(s) ||
        c.description?.toLowerCase().includes(s) ||
        c.user?.name?.toLowerCase().includes(s);
      const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [complaints, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { ALL: complaints.length };
    for (const x of complaints) c[x.status] = (c[x.status] || 0) + 1;
    return c;
  }, [complaints]);

  return (
    <PageShell className="space-y-5">
      <PageHeader
        title="Complaints"
        subtitle={`${complaints.length} total · ${statusCounts.OPEN || 0} open · ${statusCounts.INVESTIGATING || 0} investigating · ${statusCounts.RESOLVED || 0} resolved`}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by type, description, customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border-forest/15 bg-card pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {["ALL", "OPEN", "INVESTIGATING", "RESOLVED", "REJECTED"].map((s) => (
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
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              <span className="ml-1 opacity-70">{statusCounts[s] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-forest/8 bg-card cibo-shadow">
        {q.isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            title="No complaints found"
            description="Try adjusting your filters."
            icon={<MessageSquareWarning className="size-5" />}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-cream/40 hover:bg-cream/40">
                <TableHead className="pl-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Type</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Customer</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Provider</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Order ref</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Filed</TableHead>
                <TableHead className="pr-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c: any) => (
                <TableRow key={c.id} className="text-sm">
                  <TableCell className="pl-4">
                    <p className="text-xs font-bold text-forest">{c.type}</p>
                    <p className="line-clamp-1 max-w-xs text-[10px] text-muted-foreground">
                      {c.description}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.user?.name || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.provider?.businessName || "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {c.order ? (
                      <span className="font-mono text-[10px] text-forest">
                        {c.order.orderNumber}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell><ComplaintStatusPill status={c.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span title={fmtDateTime(c.createdAt)}>{timeAgo(c.createdAt)}</span>
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
                        <DropdownMenuItem onClick={() => setDetail(c)}>
                          <Eye className="size-3.5" /> View details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {c.status === "OPEN" && (
                          <DropdownMenuItem
                            onClick={() =>
                              resolveMut.mutate({
                                id: c.id,
                                status: "INVESTIGATING",
                                resolution: "",
                              })
                            }
                          >
                            <Gavel className="size-3.5" /> Mark investigating
                          </DropdownMenuItem>
                        )}
                        {(c.status === "OPEN" || c.status === "INVESTIGATING") && (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setResolveTarget(c);
                                setResolutionText("");
                              }}
                            >
                              <Eye className="size-3.5" /> Resolve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() =>
                                resolveMut.mutate({
                                  id: c.id,
                                  status: "REJECTED",
                                  resolution: "Complaint rejected after review.",
                                })
                              }
                            >
                              <XCircle className="size-3.5" /> Reject
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

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Complaint details</DialogTitle>
            <DialogDescription>
              Filed {detail ? fmtDateTime(detail.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              <div className="flex flex-wrap items-center gap-2">
                <ComplaintStatusPill status={detail.status} />
                <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-forest">
                  {detail.type}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <Cell label="Customer" value={detail.user?.name || "—"} />
                <Cell label="Provider" value={detail.provider?.businessName || "—"} />
                <Cell label="Order ref" value={detail.order?.orderNumber || "—"} />
                <Cell label="Listing" value={detail.listing?.title || "—"} />
              </div>

              <div className="rounded-xl border border-forest/8 bg-cream/30 p-3 text-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Description
                </p>
                <p className="mt-1 whitespace-pre-wrap text-forest">{detail.description}</p>
              </div>

              {detail.evidence?.length > 0 && (
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Evidence ({detail.evidence.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {detail.evidence.map((url: string, i: number) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-lg border border-forest/8"
                      >
                        <img
                          src={url}
                          alt={`Evidence ${i + 1}`}
                          className="aspect-square w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/cibo-logo.svg";
                          }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {detail.resolution && (
                <div className="rounded-xl border border-success/20 bg-success/5 p-3 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-success">
                    Resolution
                  </p>
                  <p className="mt-0.5 text-forest">{detail.resolution}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 border-t border-forest/8 pt-3">
                {detail.status === "OPEN" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      resolveMut.mutate({
                        id: detail.id,
                        status: "INVESTIGATING",
                        resolution: "",
                      });
                      setDetail(null);
                    }}
                  >
                    <Gavel className="size-4" /> Mark investigating
                  </Button>
                )}
                {(detail.status === "OPEN" || detail.status === "INVESTIGATING") && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setResolveTarget(detail);
                        setResolutionText("");
                        setDetail(null);
                      }}
                    >
                      Resolve complaint
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-danger/30 text-danger hover:bg-danger/10"
                      onClick={() => {
                        resolveMut.mutate({
                          id: detail.id,
                          status: "REJECTED",
                          resolution: "Complaint rejected after review.",
                        });
                        setDetail(null);
                      }}
                    >
                      <XCircle className="size-4" /> Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve dialog */}
      <Dialog
        open={!!resolveTarget}
        onOpenChange={(o) => !o && setResolveTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve complaint</DialogTitle>
            <DialogDescription>
              Provide a resolution note. The customer will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="resolution">Resolution note</Label>
              <Textarea
                id="resolution"
                placeholder="e.g. Refund of ₹X has been initiated. Provider warned about expiry handling."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-success hover:bg-success/90"
              disabled={!resolutionText.trim() || resolveMut.isPending}
              onClick={() => {
                if (resolveTarget) {
                  resolveMut.mutate({
                    id: resolveTarget.id,
                    status: "RESOLVED",
                    resolution: resolutionText.trim(),
                  });
                  setResolveTarget(null);
                }
              }}
            >
              {resolveMut.isPending ? "Resolving…" : "Mark as resolved"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Cell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-forest/8 bg-card p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate text-forest">{value}</p>
    </div>
  );
}
