"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { providerApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Banknote,
  Loader2,
  Check,
  Star,
  Sparkles,
  Leaf,
  ShoppingBag,
} from "lucide-react";
import { cn, fmtPrice } from "@/lib/utils";
import { PageShell, Panel, VerificationPill } from "./shared";
import type { ProviderProfileExt } from "./shared";

const CITIES = ["Tirunelveli", "Nagercoil", "Madurai", "Chennai"];

export function ProfileView() {
  const q = useQuery({
    queryKey: ["provider", "me"],
    queryFn: () => providerApi.me(),
  });
  const provider = q.data?.provider as ProviderProfileExt | undefined;

  if (q.isLoading) {
    return (
      <PageShell className="space-y-5">
        <Skeleton className="h-32 w-full rounded-3xl cibo-skeleton" />
        <Skeleton className="h-96 w-full rounded-2xl cibo-skeleton" />
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

  return <ProfileForm key={provider.id + (provider as any).updatedAt} initial={provider} />;
}

function ProfileForm({ initial }: { initial: ProviderProfileExt }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    businessName: initial.businessName || "",
    ownerName: initial.ownerName || "",
    phone: initial.phone || "",
    email: initial.email || "",
    addressLine: initial.addressLine || "",
    city: initial.city || "Tirunelveli",
    state: initial.state || "Tamil Nadu",
    pincode: initial.pincode || "",
    bio: initial.bio || "",
    fulfillment:
      initial.fulfillment === "PICKUP_AND_DELIVERY" ? "BOTH" : "PICKUP",
    deliveryFee: String(initial.deliveryFee ?? 0),
    upiId: initial.upiId || "",
    bankName: initial.bankName || "",
    bankAccount: initial.bankAccount || "",
    bankIfsc: initial.bankIfsc || "",
    licenseNumber: initial.licenseNumber || "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const mut = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        businessName: form.businessName.trim(),
        ownerName: form.ownerName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        addressLine: form.addressLine.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        bio: form.bio.trim() || null,
        fulfillment:
          form.fulfillment === "BOTH" ? "PICKUP_AND_DELIVERY" : "PICKUP_ONLY",
        deliveryFee: Number(form.deliveryFee) || 0,
        upiId: form.upiId.trim() || null,
        bankName: form.bankName.trim() || null,
        bankAccount: form.bankAccount.trim() || null,
        bankIfsc: form.bankIfsc.trim() || null,
        licenseNumber: form.licenseNumber.trim() || null,
      };
      return providerApi.update(payload);
    },
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["provider", "me"] });
    },
    onError: (e: any) => toast.error(e?.message || "Could not save profile"),
  });

  const showsDelivery = form.fulfillment === "BOTH";

  return (
    <PageShell className="space-y-5">
      {/* Header card with stats */}
      <div className="overflow-hidden rounded-3xl border border-forest/8 bg-forest p-6 text-ivory cibo-shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-14 place-items-center rounded-2xl bg-cream text-xl font-bold text-forest">
              {initial.businessName?.[0]?.toUpperCase() || "P"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold">
                  {initial.businessName}
                </h1>
                <VerificationPill status={initial.verificationStatus} />
              </div>
              <p className="text-xs text-ivory/70">
                {initial.businessType.replace(/_/g, " ").toLowerCase()} · {initial.city}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HeaderStat
              icon={<Star className="size-3.5" />}
              value={initial.rating?.toFixed(1) || "—"}
              label="Rating"
            />
            <HeaderStat
              icon={<ShoppingBag className="size-3.5" />}
              value={initial.totalOrders}
              label="Orders"
            />
            <HeaderStat
              icon={<Sparkles className="size-3.5" />}
              value={initial.mealsRescued}
              label="Meals"
            />
            <HeaderStat
              icon={<Leaf className="size-3.5" />}
              value={`${Math.round(initial.wasteAvoidedKg)}kg`}
              label="Waste saved"
            />
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
        className="grid gap-4 lg:grid-cols-2"
      >
        {/* Business info */}
        <Panel title="Business information" subtitle="Visible to customers">
          <div className="space-y-3">
            <Field label="Business name" icon={<Store className="size-4" />}>
              <Input
                value={form.businessName}
                onChange={(e) => set("businessName", e.target.value)}
                className="h-10 rounded-xl border-forest/15 bg-card pl-9"
              />
            </Field>
            <Field label="Owner name" icon={<User className="size-4" />}>
              <Input
                value={form.ownerName}
                onChange={(e) => set("ownerName", e.target.value)}
                className="h-10 rounded-xl border-forest/15 bg-card pl-9"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" icon={<Phone className="size-4" />}>
                <Input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className="h-10 rounded-xl border-forest/15 bg-card pl-9"
                />
              </Field>
              <Field label="Email" icon={<Mail className="size-4" />}>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className="h-10 rounded-xl border-forest/15 bg-card pl-9"
                />
              </Field>
            </div>
            <Field label="Bio" icon={<Store className="size-4" />}>
              <Textarea
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                rows={3}
                placeholder="Tell customers about your business…"
                className="rounded-xl border-forest/15 bg-card"
              />
            </Field>
            <Field label="FSSAI license number" icon={<Building2 className="size-4" />}>
              <Input
                value={form.licenseNumber}
                onChange={(e) => set("licenseNumber", e.target.value)}
                placeholder="FSSAI-XXXXXXXXXXXXXX"
                className="h-10 rounded-xl border-forest/15 bg-card pl-9"
              />
            </Field>
          </div>
        </Panel>

        {/* Address & fulfillment */}
        <Panel title="Address & fulfillment" subtitle="Where customers collect">
          <div className="space-y-3">
            <Field label="Address line" icon={<MapPin className="size-4" />}>
              <Input
                value={form.addressLine}
                onChange={(e) => set("addressLine", e.target.value)}
                placeholder="Street, landmark"
                className="h-10 rounded-xl border-forest/15 bg-card pl-9"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-forest">City</Label>
                <Select
                  value={form.city}
                  onValueChange={(v) => set("city", v)}
                >
                  <SelectTrigger className="h-10 rounded-xl border-forest/15 bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Pincode" icon={<MapPin className="size-4" />}>
                <Input
                  value={form.pincode}
                  onChange={(e) => set("pincode", e.target.value)}
                  inputMode="numeric"
                  placeholder="627001"
                  className="h-10 rounded-xl border-forest/15 bg-card pl-9"
                />
              </Field>
            </div>
            <Field label="State" icon={<MapPin className="size-4" />}>
              <Input
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                className="h-10 rounded-xl border-forest/15 bg-card pl-9"
              />
            </Field>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-forest">Fulfillment</Label>
              <RadioGroup
                value={form.fulfillment}
                onValueChange={(v) => set("fulfillment", v)}
                className="grid grid-cols-2 gap-2"
              >
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-xs transition",
                    form.fulfillment === "PICKUP"
                      ? "border-forest bg-cream/50"
                      : "border-forest/10 hover:bg-cream/30"
                  )}
                >
                  <RadioGroupItem value="PICKUP" />
                  Pickup only
                </label>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-xs transition",
                    form.fulfillment === "BOTH"
                      ? "border-forest bg-cream/50"
                      : "border-forest/10 hover:bg-cream/30"
                  )}
                >
                  <RadioGroupItem value="BOTH" />
                  Pickup + Delivery
                </label>
              </RadioGroup>
            </div>
            {showsDelivery && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-forest">
                  Delivery fee (₹)
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.deliveryFee}
                  onChange={(e) => set("deliveryFee", e.target.value)}
                  className="h-10 rounded-xl border-forest/15 bg-card"
                />
              </div>
            )}
          </div>
        </Panel>

        {/* Payout details */}
        <Panel
          title="Payout details"
          subtitle="Where your earnings are sent"
          className="lg:col-span-2"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="UPI ID" icon={<Banknote className="size-4" />}>
              <Input
                value={form.upiId}
                onChange={(e) => set("upiId", e.target.value)}
                placeholder="business@upi"
                className="h-10 rounded-xl border-forest/15 bg-card pl-9"
              />
            </Field>
            <Field label="Bank name" icon={<Building2 className="size-4" />}>
              <Input
                value={form.bankName}
                onChange={(e) => set("bankName", e.target.value)}
                placeholder="HDFC Bank"
                className="h-10 rounded-xl border-forest/15 bg-card pl-9"
              />
            </Field>
            <Field label="Account number" icon={<Banknote className="size-4" />}>
              <Input
                value={form.bankAccount}
                onChange={(e) => set("bankAccount", e.target.value)}
                placeholder="0000 0000 0000"
                className="h-10 rounded-xl border-forest/15 bg-card pl-9"
              />
            </Field>
            <Field label="IFSC code" icon={<Building2 className="size-4" />}>
              <Input
                value={form.bankIfsc}
                onChange={(e) => set("bankIfsc", e.target.value)}
                placeholder="HDFC0001234"
                className="h-10 rounded-xl border-forest/15 bg-card pl-9"
              />
            </Field>
          </div>
          <div className="mt-3 rounded-xl bg-cream/40 p-3 text-[11px] text-forest">
            <p className="font-bold">Payout schedule</p>
            <p className="mt-0.5 text-muted-foreground">
              Earnings are settled every Monday. Minimum payout: {fmtPrice(500)}.
              Update details at least 24 hours before payout.
            </p>
          </div>
        </Panel>

        {/* Submit */}
        <div className="lg:col-span-2">
          <Button
            type="submit"
            variant="rescue"
            size="lg"
            disabled={mut.isPending}
            className="w-full sm:w-auto"
          >
            {mut.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Save profile
          </Button>
        </div>
      </form>
    </PageShell>
  );
}

function HeaderStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-ivory/10 px-3 py-2">
      <div className="flex items-center gap-1 text-gold">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-0.5 font-display text-base font-extrabold">{value}</p>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-forest">{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-forest/40">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}
