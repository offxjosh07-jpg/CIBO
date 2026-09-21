"use client";

import { useApp } from "@/lib/store";
import { useAuth } from "@/components/providers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { complaintApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageShell } from "./shared";
import { toast } from "sonner";
import {
  LifeBuoy,
  Mail,
  Phone,
  MessageCircle,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    q: "How does CIBO food rescue work?",
    a: "Local food businesses (chefs, bakeries, caterers, event organizers) post their surplus food on CIBO at deeply discounted prices. You browse available rescues near you, place an order, and pick it up within the pickup window — or have it delivered. It's fresh, it's local, and it stops food waste.",
  },
  {
    q: "Is the food safe to eat?",
    a: "Yes. Every provider on CIBO must submit a food safety declaration covering prep time, packing time, storage, packaging, allergens, and handling. Each listing shows these details in the Food Safety section. Providers are also verified by CIBO before they can list.",
  },
  {
    q: "What if I miss the pickup window?",
    a: "Each listing has a strict pickup deadline. If you miss it, the order is marked as no-show and no refund is issued. We'll send reminders before the deadline. You can see your deadline on the order tracking page.",
  },
  {
    q: "Can I get my order delivered?",
    a: "Some listings support delivery (look for the delivery icon on the listing). If available, you can choose delivery at checkout for a small fee. Pickup is always free.",
  },
  {
    q: "How do refunds work?",
    a: "If you cancel before the provider confirms, you'll be refunded automatically. If the provider cancels, you'll be refunded in full. For food quality or safety issues, file a complaint and our team will investigate and process a refund if warranted.",
  },
  {
    q: "What is Halal Verified?",
    a: "Halal Verified means the provider has provided evidence of halal certification or halal-verified practices, and CIBO has reviewed it. You can filter listings to only show Halal Verified food on the Explore and Rescue pages.",
  },
  {
    q: "How do I become a CIBO provider?",
    a: "Tap the profile tab and choose 'Are you a food business?' or go to the sign-up page and select provider. You'll need to submit business documents and a food safety declaration. Our team will review your application within 1-2 business days.",
  },
];

export function HelpView() {
  const { user } = useAuth();
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
      toast.success("Complaint filed. Our team will be in touch.");
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
          Help & support
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Find quick answers or reach out to our team.
        </p>
      </div>

      {/* Contact cards */}
      <section className="grid gap-3 sm:grid-cols-3">
        <ContactCard
          icon={<Mail className="size-4" />}
          title="Email"
          value="support@cibo.food"
        />
        <ContactCard
          icon={<Phone className="size-4" />}
          title="Phone"
          value="1800-CIBO-FOOD"
        />
        <ContactCard
          icon={<MessageCircle className="size-4" />}
          title="WhatsApp"
          value="+91 90000 00000"
        />
      </section>

      {/* FAQ */}
      <section className="rounded-2xl border border-forest/8 bg-card p-5 cibo-shadow">
        <h2 className="mb-2 font-display text-base font-bold text-forest">
          Frequently asked questions
        </h2>
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
      </section>

      {/* File complaint */}
      <section className="rounded-2xl border border-gold/30 bg-cream/40 p-5">
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
              onClick={() => {
                if (!user) {
                  useApp.getState().setAuthView("login");
                  return;
                }
                setOpen(true);
              }}
            >
              <AlertTriangle className="size-3.5" /> File a complaint
            </Button>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="grid gap-3 sm:grid-cols-2">
        <QuickLink
          label="View your orders"
          onClick={() => useApp.getState().setCustomer("orders")}
        />
        <QuickLink
          label="Manage addresses"
          onClick={() => useApp.getState().setCustomer("addresses")}
        />
      </section>

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
                  <SelectItem value="PROVIDER">Provider behavior</SelectItem>
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
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-forest/8 bg-card p-4 cibo-shadow">
      <div className="grid size-9 place-items-center rounded-lg bg-cream text-forest">
        {icon}
      </div>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="font-display text-sm font-bold text-forest">{value}</p>
    </div>
  );
}

function QuickLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl border border-forest/8 bg-card p-4 text-left transition hover:border-gold hover:bg-cream/40 cibo-shadow"
    >
      <span className="text-sm font-semibold text-forest">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  );
}
