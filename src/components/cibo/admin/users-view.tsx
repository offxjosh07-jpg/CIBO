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
import { MoreHorizontal, Search, Ban, CheckCircle2, Eye, Users as UsersIcon } from "lucide-react";
import { fmtDate, initials, cn } from "@/lib/utils";
import { PageShell, PageHeader, AdminEmptyState, TableSkeleton } from "./shared";
import { RolePill } from "./shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function UsersView() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const q = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminApi.users(),
  });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [detail, setDetail] = useState<any | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<any | null>(null);

  const suspendMut = useMutation({
    mutationFn: ({ id, suspended }: { id: string; suspended: boolean }) =>
      adminApi.suspendUser(id, suspended),
    onSuccess: (_d, vars) => {
      toast({
        title: vars.suspended ? "User suspended" : "User reinstated",
        description: "The user's access has been updated.",
      });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: any) => {
      toast({
        title: "Action failed",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const users = q.data?.users || [];

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return users.filter((u: any) => {
      const matchSearch =
        !s ||
        u.name?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        u.phone?.toLowerCase().includes(s);
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const roleCounts = useMemo(() => {
    const c: Record<string, number> = { ALL: users.length };
    for (const u of users) c[u.role] = (c[u.role] || 0) + 1;
    return c;
  }, [users]);

  return (
    <PageShell className="space-y-5">
      <PageHeader
        title="Users"
        subtitle={`${users.length} total · ${roleCounts.ADMIN || 0} admins · ${roleCounts.PROVIDER || 0} providers · ${roleCounts.CUSTOMER || 0} customers`}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border-forest/15 bg-card pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {["ALL", "CUSTOMER", "PROVIDER", "ADMIN", "SUPPORT"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                roleFilter === r
                  ? "bg-forest text-ivory"
                  : "bg-card text-forest/70 border border-forest/15 hover:bg-cream/60"
              )}
            >
              {r === "ALL" ? "All" : r.charAt(0) + r.slice(1).toLowerCase()}
              <span className="ml-1 opacity-70">
                {roleCounts[r] || 0}
              </span>
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
            title="No users found"
            description="Try adjusting your search or role filter."
            icon={<UsersIcon className="size-5" />}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-cream/40 hover:bg-cream/40">
                <TableHead className="pl-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">User</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Role</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Phone</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Joined</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Provider link</TableHead>
                <TableHead className="pr-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u: any) => (
                <TableRow key={u.id} className="text-sm">
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-9 place-items-center rounded-full bg-forest text-[10px] font-bold text-ivory">
                        {initials(u.name || "?")}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-forest">{u.name}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><RolePill role={u.role} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.phone || "—"}
                  </TableCell>
                  <TableCell>
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
                        <span className="size-1.5 rounded-full bg-success" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-danger">
                        <span className="size-1.5 rounded-full bg-danger" /> Suspended
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {fmtDate(u.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {u.provider ? (
                      <span className="inline-flex items-center gap-1 text-forest">
                        <span className="truncate">{u.provider.businessName}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
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
                        <DropdownMenuItem onClick={() => setDetail(u)}>
                          <Eye className="size-3.5" /> View profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {u.isActive ? (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setSuspendTarget(u)}
                          >
                            <Ban className="size-3.5" /> Suspend
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              suspendMut.mutate({ id: u.id, suspended: false })
                            }
                          >
                            <CheckCircle2 className="size-3.5" /> Reinstate
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User profile</DialogTitle>
            <DialogDescription>
              Detailed view of the user account.
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="grid size-14 place-items-center rounded-2xl bg-forest text-base font-bold text-ivory">
                  {initials(detail.name || "?")}
                </div>
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold text-forest">{detail.name}</p>
                  <p className="text-xs text-muted-foreground">{detail.email}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <RolePill role={detail.role} />
                    {detail.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-danger">
                        Suspended
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <DetailField label="User ID" value={<span className="font-mono">{detail.id}</span>} />
                <DetailField label="Phone" value={detail.phone || "—"} />
                <DetailField label="Joined" value={fmtDate(detail.createdAt)} />
                <DetailField label="Last active" value="Just now" />
              </div>
              {detail.provider && (
                <div className="rounded-xl border border-forest/8 bg-cream/30 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Provider profile
                  </p>
                  <p className="mt-1 text-sm font-bold text-forest">
                    {detail.provider.businessName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {detail.provider.city} · {detail.provider.businessType}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Status: {detail.provider.verificationStatus}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspend confirm */}
      <AlertDialog open={!!suspendTarget} onOpenChange={(o) => !o && setSuspendTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend this user?</AlertDialogTitle>
            <AlertDialogDescription>
              {suspendTarget?.name} ({suspendTarget?.email}) will be immediately
              signed out and unable to access CIBO until reinstated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              onClick={() => {
                if (suspendTarget) {
                  suspendMut.mutate({ id: suspendTarget.id, suspended: true });
                  setSuspendTarget(null);
                }
              }}
            >
              Suspend user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-forest/8 bg-card p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-forest">{value}</p>
    </div>
  );
}
