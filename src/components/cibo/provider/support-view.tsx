"use client";

import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  MessageCircle,
  LifeBuoy,
  ChevronRight,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { complaintApi } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageShell, Panel } from "./shared";

const FAQS = [
  {
    q: "How do I publish a listing?",
    a: "Go to Create Listing, fill in the 5-step wizard (food details, pricing, safety, pickup, preview), and tap Publish. You must be verified to publish — unverified providers can save drafts only.",
  },
  {
    q: "When do I get paid?",
    a: "Earnings are settled every Monday to your UPI ID or bank account on file. Minimum payout is ₹500. Update your payout details on the Profile page at least 24 hours before payout.",
  },
  {
    q: "What's the platform commission?",
    a: "CIBO charges a 10% commission on each completed order. This is deducted from your gross revenue before payout. The commission covers payment processing, customer support, and platform maintenance.",
  },
  {
    q: "How does order fulfillment work?",
    a: "When a customer places an order, you'll see it in the Orders tab under 'New'. Tap Confirm to accept, then Mark Ready when food is packed. When the customer arrives, ask for their 4-digit OTP and tap Verify OTP & Complete to finish the order.",
  },
  {
    q: "What if a customer doesn't show up?",
    a: "If a customer misses the pickup deadline, the order auto-expires. You keep 50% of the order value as a no-show fee, and the customer is refunded the rest.",
  },
  {
    q: "Can I edit or delete a listing?",
    a: "Yes. Go to Active Listings and tap Edit to change quantity, price, or status. Tap Delete to permanently remove (blocked if active orders exist). For full edits, create a new listing.",
  },
  {
    q: "How do I get verified?",
    a: "Go to the Verification page and upload your FSSAI license, ID proof, or business documents. Our team reviews submissions within 1-2 business days. You'll be notified once approved.",
  },
  {
    q: "What happens if my verification is rejected?",
    a: "You'll see the rejection reason on the Verification page. Fix the issue, upload fresh documents, and tap Request re-review. We'll re-evaluate within 48 hours.",
  },
];

export function SupportView() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const [type, setType] = useState("OTHER");
  const [desc, setDesc] = useState("");

  const mut = useMutation({
    mutationFn: () =>
      complaintApi.create({
        type,
        description: desc,
      }),
    onSuccess: () => {
      toast.success("Complaint filed. Our team will be in touch within 24 hours.");
      setOpen(false);
      setDesc("");
      qc.invalidateQueries({ queryKey: ["complaints"] });
    },
    onError: () => toast.error("Could not submit complaint"),
  });

  return (
    <PageShell className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-forest sm:text-3xl">
          Support
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Get help, find answers, or file a complaint.
        </p>
      </div>

      {/* Contact cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <ContactCard
          icon={<Mail className="size-4" />}
          title="Email"
          value="support@cibo.app"
          desc="Response within 24 hours"
          onClick={() => (window.location.href = "mailto:support@cibo.app")}
        />
        <ContactCard
          icon={<Phone className="size-4" />}
          title="Phone"
          value="+91 90000 12345"
          desc="Mon-Sat, 9am-9pm"
          onClick={() => (window.location.href = "tel:+919000012345")}
        />
        <ContactCard
          icon={<MessageCircle className="size-4" />}
          title="WhatsApp"
          value="+91 90000 12345"
          desc="Fastest response"
          onClick={() => toast.info("Opening WhatsApp…")}
        />
      </div>

      {/* FAQ */}
      <Panel title="Frequently asked questions" subtitle="Quick answers for providers">
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-sm font-semibold text-forest hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Panel>

      {/* File complaint */}
      <div className="rounded-2xl border border-gold/30 bg-cream/40 p-5">
        <div className="flex items-start gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-orange text-white">
            <LifeBuoy className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-base font-bold text-forest">
              Still need help?
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              File a complaint and our support team will investigate and get
              back to you within 24 hours.
            </p>
            <Button
              variant="rescue"
              size="sm"
              className="mt-3"
              onClick={() => setOpen(true)}
            >
              <AlertTriangle className="size-3.5" /> File a complaint
            </Button>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink
          label="Verification help"
          desc="Submit documents and get verified"
          icon={<HelpCircle className="size-4" />}
          onClick={() => useApp.getState().setProvider("verification")}
        />
        <QuickLink
          label="Edit payout details"
          desc="Update bank/UPI for payouts"
          icon={<ChevronRight className="size-4" />}
          onClick={() => useApp.getState().setProvider("profile")}
        />
      </div>

      {/* Resources */}
      <Panel title="Resources" subtitle="Guides and policies">
        <ul className="space-y-2">
          {[
            ["Provider onboarding guide", "#"],
            ["Food safety best practices", "#"],
            ["Pricing & commission policy", "#"],
            ["Terms of service", "#"],
            ["Privacy policy", "#"],
          ].map(([label, href]) => (
            <li key={label}>
              <a
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Docs coming soon");
                }}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-forest transition hover:bg-cream/40"
              >
                {label}
                <ExternalLink className="size-3.5 text-muted-foreground" />
              </a>
            </li>
          ))}
        </ul>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File a complaint</DialogTitle>
            <DialogDescription>
              Tell us what went wrong. Our team will review and follow up.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Issue type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOOD_QUALITY">Food quality</SelectItem>
                  <SelectItem value="SAFETY">Food safety concern</SelectItem>
                  <SelectItem value="PICKUP">Pickup issue</SelectItem>
                  <SelectItem value="REFUND">Refund request</SelectItem>
                  <SelectItem value="PAYMENT">Payment issue</SelectItem>
                  <SelectItem value="APP">App / technical issue</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={4}
                placeholder="Describe what happened…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="rescue"
              disabled={!desc.trim() || mut.isPending}
              onClick={() => mut.mutate()}
            >
              {mut.isPending ? "Submitting…" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function ContactCard({
  icon,
  title,
  value,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-forest/8 bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-gold cibo-shadow"
    >
      <div className="grid size-9 place-items-center rounded-lg bg-cream text-forest">
        {icon}
      </div>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="font-display text-sm font-bold text-forest">{value}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{desc}</p>
    </button>
  );
}

function QuickLink({
  label,
  desc,
  icon,
  onClick,
}: {
  label: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-forest/8 bg-card p-4 text-left transition hover:border-gold hover:bg-cream/40 cibo-shadow"
    >
      <div className="grid size-9 place-items-center rounded-lg bg-cream text-forest">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-forest">{label}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  );
}
