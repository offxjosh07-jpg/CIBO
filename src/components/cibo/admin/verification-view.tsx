"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  CheckCircle2,
  XCircle,
  HelpCircle,
  BadgeCheck,
  MapPin,
  Phone,
  Mail,
  FileText,
} from "lucide-react";
import { fmtDate, initials } from "@/lib/utils";
import { PageShell, PageHeader, AdminEmptyState, VerificationPill } from "./shared";
import { useState } from "react";

export function VerificationView() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const q = useQuery({
    queryKey: ["admin", "providers"],
    queryFn: () => adminApi.providers(),
  });
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);

  const verifyMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.verifyProvider(id, status),
    onSuccess: (_d, vars) => {
      toast({
        title:
          vars.status === "VERIFIED"
            ? "Provider approved & verified"
            : vars.status === "REJECTED"
            ? "Provider rejected"
            : "Marked for more info",
        description: "The provider has been notified of the update.",
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

  const all = q.data?.providers || [];
  // Pending queue: PENDING + UNDER_REVIEW
  const queue = all.filter(
    (p: any) => p.verificationStatus === "PENDING" || p.verificationStatus === "UNDER_REVIEW"
  );

  return (
    <PageShell className="space-y-5">
      <PageHeader
        title="Verification queue"
        subtitle={`${queue.length} provider${queue.length === 1 ? "" : "s"} awaiting review`}
      />

      {q.isLoading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl cibo-skeleton" />
          ))}
        </div>
      ) : queue.length === 0 ? (
        <div className="rounded-2xl border border-forest/8 bg-card cibo-shadow">
          <AdminEmptyState
            title="Queue is clear"
            description="No providers are pending verification right now. Great work!"
            icon={<BadgeCheck className="size-5" />}
          />
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {queue.map((p: any) => (
            <article
              key={p.id}
              className="flex flex-col gap-3 rounded-2xl border border-forest/8 bg-card p-4 cibo-shadow"
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-olive text-sm font-bold text-ivory">
                  {initials(p.businessName || "?")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-bold text-forest">
                    {p.businessName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.ownerName} · {p.businessType}
                  </p>
                  <div className="mt-1.5">
                    <VerificationPill status={p.verificationStatus} />
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Meta label="City" value={p.city} icon={<MapPin className="size-3" />} />
                <Meta label="Phone" value={p.phone} icon={<Phone className="size-3" />} />
                <Meta label="Email" value={p.email} icon={<Mail className="size-3" />} />
                <Meta
                  label="FSSAI license"
                  value={p.licenseNumber || "Not provided"}
                  icon={<FileText className="size-3" />}
                />
              </div>

              {/* Address */}
              <div className="rounded-xl border border-forest/8 bg-cream/30 p-2.5 text-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Business address
                </p>
                <p className="mt-0.5 text-forest">
                  {p.addressLine}, {p.city}, {p.state} {p.pincode}
                </p>
              </div>

              {/* Documents */}
              {p.documents?.length > 0 && (
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Submitted documents
                  </p>
                  <ul className="space-y-1">
                    {p.documents.map((doc: any) => (
                      <li
                        key={doc.id}
                        className="flex items-center gap-2 rounded-lg border border-forest/8 bg-cream/20 p-2 text-xs"
                      >
                        <FileText className="size-3.5 text-gold" />
                        <span className="flex-1 font-semibold text-forest">
                          {doc.type?.replace(/_/g, " ").toLowerCase() || "Document"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {fmtDate(doc.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer / actions */}
              <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-forest/8 pt-3">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-success hover:bg-success/90"
                  onClick={() => verifyMut.mutate({ id: p.id, status: "VERIFIED" })}
                >
                  <CheckCircle2 className="size-4" /> Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => verifyMut.mutate({ id: p.id, status: "UNDER_REVIEW" })}
                >
                  <HelpCircle className="size-4" /> Request info
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto border-danger/30 text-danger hover:bg-danger/10"
                  onClick={() => setRejectTarget(p)}
                >
                  <XCircle className="size-4" /> Reject
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Reject confirm */}
      <AlertDialog
        open={!!rejectTarget}
        onOpenChange={(o) => !o && setRejectTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject {rejectTarget?.businessName}?</AlertDialogTitle>
            <AlertDialogDescription>
              The provider will be marked as REJECTED and notified. They may resubmit
              documents after reviewing the requirements.
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
    </PageShell>
  );
}

function Meta({
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
