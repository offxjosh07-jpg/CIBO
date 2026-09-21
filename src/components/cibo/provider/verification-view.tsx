"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { providerApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ShieldCheck,
  Clock,
  Check,
  X,
  FileText,
  Upload,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Building2,
  Award,
} from "lucide-react";
import { fmtDate, cn } from "@/lib/utils";
import {
  EmptyState,
  PageShell,
  Panel,
  VerificationPill,
} from "./shared";
import type { ProviderProfileExt, ProviderDocument } from "./shared";

const DOC_TYPES = [
  { v: "FSSAI", label: "FSSAI License" },
  { v: "LICENSE", label: "Business License" },
  { v: "ID_PROOF", label: "ID Proof" },
  { v: "GST", label: "GST Certificate" },
  { v: "BANK_PROOF", label: "Bank Proof" },
];

export function VerificationView() {
  const q = useQuery({
    queryKey: ["provider", "me"],
    queryFn: () => providerApi.me(),
  });
  const provider = q.data?.provider as ProviderProfileExt | undefined;
  const documents = (q.data?.documents || []) as ProviderDocument[];

  if (q.isLoading) {
    return (
      <PageShell className="space-y-5">
        <Skeleton className="h-40 w-full rounded-3xl cibo-skeleton" />
        <Skeleton className="h-72 w-full rounded-2xl cibo-skeleton" />
      </PageShell>
    );
  }
  if (!provider) {
    return (
      <PageShell>
        <p className="text-sm text-muted-foreground">No provider profile found.</p>
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-forest sm:text-3xl">
          Verification
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Manage your business verification status and documents.
        </p>
      </div>

      {/* Status hero */}
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border p-6 cibo-shadow",
          statusTone(provider.verificationStatus).card
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "grid size-14 place-items-center rounded-2xl",
                statusTone(provider.verificationStatus).iconBg
              )}
            >
              {statusTone(provider.verificationStatus).icon}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Verification status
              </p>
              <p className="font-display text-2xl font-extrabold text-forest">
                {statusTone(provider.verificationStatus).label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {statusTone(provider.verificationStatus).desc}
              </p>
            </div>
          </div>
          <VerificationPill status={provider.verificationStatus} />
        </div>

        {(provider.verificationStatus === "REJECTED" ||
          provider.verificationStatus === "SUSPENDED") && (
          <div className="mt-4 rounded-2xl bg-danger/10 p-3 text-xs text-danger">
            <p className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="size-3.5" /> Action required
            </p>
            <p className="mt-1">
              Please review and resubmit your documents. If you believe this is
              an error, request a re-review.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 border-danger/30 text-danger hover:bg-danger/10"
              onClick={() => toast.success("Re-review requested. We'll be in touch within 48 hours.")}
            >
              <RefreshCw className="size-3.5" /> Request re-review
            </Button>
          </div>
        )}

        {provider.verificationStatus === "VERIFIED" && (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">
            <Award className="size-3.5" /> Your listings can be published.
          </div>
        )}
      </div>

      {/* License info */}
      <Panel title="License information" subtitle="FSSAI / business license on file">
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoTile
            label="License number"
            value={provider.licenseNumber || "—"}
            icon={<FileText className="size-4" />}
          />
          <InfoTile
            label="License type"
            value={provider.licenseType || "FSSAI"}
            icon={<Building2 className="size-4" />}
          />
          <InfoTile
            label="Business type"
            value={provider.businessType?.replace(/_/g, " ").toLowerCase() || "—"}
            icon={<Building2 className="size-4" />}
          />
        </div>
      </Panel>

      {/* Documents */}
      <Panel
        title="Submitted documents"
        subtitle="Documents you've uploaded for verification"
        right={<UploadDialog />}
      >
        {documents.length === 0 ? (
          <EmptyState
            title="No documents uploaded"
            description="Upload your FSSAI license, ID proof, or business documents to start verification."
            icon={<FileText className="size-5" />}
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {documents.map((d) => (
              <DocumentCard key={d.id} doc={d} />
            ))}
          </div>
        )}
      </Panel>

      {/* Verification steps */}
      <Panel title="How verification works" subtitle="The 4-step verification journey">
        <ol className="space-y-3">
          <Step
            n={1}
            label="Sign up & submit documents"
            desc="You provide business info and upload verification documents."
            done
          />
          <Step
            n={2}
            label="Document review"
            desc="Our team reviews your submission (1-2 business days)."
            active={provider.verificationStatus === "UNDER_REVIEW"}
            done={
              provider.verificationStatus === "VERIFIED" ||
              provider.verificationStatus === "REJECTED"
            }
          />
          <Step
            n={3}
            label="Approval"
            desc="Once approved, you can publish listings and accept orders."
            active={provider.verificationStatus === "VERIFIED"}
            done={provider.verificationStatus === "VERIFIED"}
          />
          <Step
            n={4}
            label="Stay verified"
            desc="Keep your info updated. Re-verification may be required periodically."
            done={provider.verificationStatus === "VERIFIED"}
          />
        </ol>
      </Panel>
    </PageShell>
  );
}

function statusTone(status: ProviderProfileExt["verificationStatus"]) {
  const map: Record<
    ProviderProfileExt["verificationStatus"],
    {
      label: string;
      desc: string;
      card: string;
      iconBg: string;
      icon: React.ReactNode;
    }
  > = {
    PENDING: {
      label: "Pending",
      desc: "Awaiting document submission and review.",
      card: "bg-gold/10 border-gold/30",
      iconBg: "bg-gold/30 text-gold",
      icon: <Clock className="size-6" />,
    },
    UNDER_REVIEW: {
      label: "Under review",
      desc: "Our team is reviewing your documents.",
      card: "bg-gold/10 border-gold/30",
      iconBg: "bg-gold/30 text-gold",
      icon: <Clock className="size-6" />,
    },
    VERIFIED: {
      label: "Verified",
      desc: "Your business is verified. You can publish listings.",
      card: "bg-success/10 border-success/30",
      iconBg: "bg-success/20 text-success",
      icon: <ShieldCheck className="size-6" />,
    },
    REJECTED: {
      label: "Rejected",
      desc: "Your verification was rejected. Review and resubmit.",
      card: "bg-danger/10 border-danger/30",
      iconBg: "bg-danger/20 text-danger",
      icon: <X className="size-6" />,
    },
    SUSPENDED: {
      label: "Suspended",
      desc: "Your account is suspended. Contact support.",
      card: "bg-danger/10 border-danger/30",
      iconBg: "bg-danger/20 text-danger",
      icon: <X className="size-6" />,
    },
  };
  return map[status] || map.PENDING;
}

function InfoTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-cream/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <span className="text-gold">{icon}</span> {label}
      </div>
      <p className="mt-1 truncate text-xs font-bold text-forest">{value}</p>
    </div>
  );
}

function DocumentCard({ doc }: { doc: ProviderDocument }) {
  const statusCls: Record<string, string> = {
    PENDING: "bg-gold/15 text-gold",
    VERIFIED: "bg-success/15 text-success",
    REJECTED: "bg-danger/15 text-danger",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-forest/8 bg-card p-3">
      <div className="grid size-10 place-items-center rounded-lg bg-cream text-forest">
        <FileText className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-forest">{doc.type}</p>
        <p className="truncate text-[10px] text-muted-foreground">
          Uploaded {fmtDate(doc.createdAt)}
        </p>
      </div>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
          statusCls[doc.status] || statusCls.PENDING
        )}
      >
        {doc.status}
      </span>
    </div>
  );
}

function UploadDialog() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("FSSAI");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!url.trim()) {
      toast.error("Please paste a document URL");
      return;
    }
    setLoading(true);
    // Mock: no API endpoint exists for uploads. Just simulate success.
    setTimeout(() => {
      toast.success("Document submitted for review (mock)");
      setOpen(false);
      setUrl("");
      setLoading(false);
    }, 800);
  };

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Upload className="size-3.5" /> Upload
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-forest/8 bg-card p-5 cibo-shadow-lg">
        <h3 className="font-display text-base font-bold text-forest">
          Upload document
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Paste a URL to your document. We'll review it within 1-2 business days.
        </p>
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-forest">Document type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-10 rounded-xl border-forest/15">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((d) => (
                  <SelectItem key={d.v} value={d.v}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-forest">Document URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="h-10 rounded-xl border-forest/15"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="rescue"
            size="sm"
            onClick={submit}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Upload className="size-3.5" />
            )}
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}

function Step({
  n,
  label,
  desc,
  active,
  done,
}: {
  n: number;
  label: string;
  desc: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <li className="flex gap-3">
      <div
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold",
          done
            ? "bg-success text-white"
            : active
            ? "bg-orange text-white"
            : "bg-muted text-muted-foreground"
        )}
      >
        {done ? <Check className="size-3.5" /> : n}
      </div>
      <div className="flex-1">
        <p
          className={cn(
            "text-xs font-bold",
            active ? "text-orange" : "text-forest"
          )}
        >
          {label} {active && <span className="text-[10px]">· in progress</span>}
        </p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
    </li>
  );
}
