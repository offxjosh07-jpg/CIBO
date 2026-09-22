"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/lib/store";
import { providerApi, listingApi, catApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { VegBadge, DiscountTag, RescueBadge } from "../badges";
import { toast } from "sonner";
import { cn, fmtPrice, discountPct } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  ImagePlus,
  Trash2,
  ShieldCheck,
  Calendar,
  MapPin,
  Tag,
  Package,
  Sparkles,
  ChefHat,
} from "lucide-react";
import { EmptyState, PageShell, Panel } from "./shared";
import type { ProviderProfileExt } from "./shared";
import type { FoodType, HalalStatus, Fulfillment } from "@/lib/types";

const FOOD_TYPES: { v: FoodType; label: string }[] = [
  { v: "VEG", label: "Veg" },
  { v: "NON_VEG", label: "Non-Veg" },
  { v: "EGG", label: "Egg" },
  { v: "VEGAN", label: "Vegan" },
  { v: "JAIN", label: "Jain" },
];

const HALAL_STATUSES: { v: HalalStatus; label: string }[] = [
  { v: "DECLARED", label: "Declared" },
  { v: "UNSPECIFIED", label: "Unspecified" },
];

const EVENT_TYPES = [
  "WEDDING",
  "BIRTHDAY",
  "COLLEGE",
  "CORPORATE",
  "FUNCTION",
  "CATERING",
];

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=70",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=70",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=70",
  "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=70",
  "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=70",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=70",
];

type FormState = {
  title: string;
  description: string;
  categoryId: string;
  foodType: FoodType;
  halalStatus: HalalStatus;
  images: string[];
  isEvent: boolean;
  eventType: string;
  eventName: string;
  quantity: string;
  originalPrice: string;
  ciboPrice: string;
  prepTime: string;
  packingTime: string;
  storageInfo: string;
  packagingInfo: string;
  allergens: string;
  specialInstructions: string;
  handlingDeclaration: string;
  safetyDeclaration: boolean;
  pickupStart: string;
  pickupDeadline: string;
  addressLine: string;
  city: string;
  fulfillment: Fulfillment;
  deliveryFee: string;
};

const STEPS = [
  { n: 1, label: "Food details", icon: Tag },
  { n: 2, label: "Quantity & pricing", icon: Package },
  { n: 3, label: "Food safety", icon: ShieldCheck },
  { n: 4, label: "Pickup & delivery", icon: MapPin },
  { n: 5, label: "Preview", icon: Sparkles },
];

function emptyForm(): FormState {
  return {
    title: "",
    description: "",
    categoryId: "",
    foodType: "VEG",
    halalStatus: "UNSPECIFIED",
    images: [],
    isEvent: false,
    eventType: "WEDDING",
    eventName: "",
    quantity: "",
    originalPrice: "",
    ciboPrice: "",
    prepTime: "",
    packingTime: "",
    storageInfo: "",
    packagingInfo: "",
    allergens: "",
    specialInstructions: "",
    handlingDeclaration: "",
    safetyDeclaration: false,
    pickupStart: "",
    pickupDeadline: "",
    addressLine: "",
    city: "",
    fulfillment: "PICKUP",
    deliveryFee: "0",
  };
}

export function CreateView() {
  const setProvider = useApp((s) => s.setProvider);
  const qc = useQueryClient();
  const meQ = useQuery({
    queryKey: ["provider", "me"],
    queryFn: () => providerApi.me(),
  });
  const catQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => catApi.list(),
  });
  const provider = meQ.data?.provider as ProviderProfileExt | undefined;
  const isVerified = provider?.verificationStatus === "VERIFIED";

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(() => {
    const init = emptyForm();
    if (provider) {
      init.addressLine = provider.addressLine || "";
      init.city = provider.city || "";
      init.fulfillment =
        (provider.fulfillment === "PICKUP_AND_DELIVERY" ? "BOTH" : "PICKUP") as Fulfillment;
      init.deliveryFee = String(provider.deliveryFee || 0);
    }
    return init;
  });

  // Prefill address from provider if form is empty when provider loads
  const effectiveAddress = form.addressLine || provider?.addressLine || "";
  const effectiveCity = form.city || provider?.city || "";

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const qty = Number(form.quantity) || 0;
  const originalPrice = Number(form.originalPrice) || 0;
  const ciboPrice = Number(form.ciboPrice) || 0;
  const pct = discountPct(originalPrice, ciboPrice);
  const potentialRevenue = ciboPrice * qty;
  const showsDelivery = form.fulfillment === "DELIVERY" || form.fulfillment === "BOTH";

  // ---------- step validation ----------
  const step1Valid =
    form.title.trim().length > 2 &&
    form.description.trim().length > 5 &&
    form.foodType;
  const step2Valid =
    qty > 0 && originalPrice > 0 && ciboPrice > 0 && ciboPrice <= originalPrice;
  const step3Valid = form.safetyDeclaration === true;
  const step4Valid =
    !!form.pickupStart &&
    !!form.pickupDeadline &&
    new Date(form.pickupDeadline) > new Date(form.pickupStart) &&
    !!effectiveAddress.trim() &&
    !!effectiveCity.trim();

  const canPublish =
    step1Valid && step2Valid && step3Valid && step4Valid && isVerified;

  // ---------- mutation ----------
  const mut = useMutation({
    mutationFn: (vars: { status: "DRAFT" | "ACTIVE" }) => {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        categoryId: form.categoryId || null,
        foodType: form.foodType,
        halalStatus: form.halalStatus,
        images: form.images,
        isEvent: form.isEvent,
        eventType: form.isEvent ? form.eventType : null,
        eventName: form.isEvent ? form.eventName.trim() : null,
        quantity: qty,
        originalPrice,
        ciboPrice,
        prepTime: form.prepTime.trim() || null,
        packingTime: form.packingTime.trim() || null,
        storageInfo: form.storageInfo.trim() || null,
        packagingInfo: form.packagingInfo.trim() || null,
        allergens: form.allergens
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        specialInstructions: form.specialInstructions.trim() || null,
        safetyDeclaration: form.safetyDeclaration,
        pickupStart: form.pickupStart,
        pickupDeadline: form.pickupDeadline,
        addressLine: effectiveAddress.trim(),
        city: effectiveCity.trim(),
        latitude: provider?.latitude ?? 8.7139,
        longitude: provider?.longitude ?? 77.7567,
        fulfillment: form.fulfillment,
        deliveryFee: showsDelivery ? Number(form.deliveryFee) || 0 : 0,
        status: vars.status,
      };
      return listingApi.create(payload);
    },
    onSuccess: (r, vars) => {
      qc.invalidateQueries({ queryKey: ["provider", "listings"] });
      qc.invalidateQueries({ queryKey: ["provider", "analytics"] });
      toast.success(
        vars.status === "DRAFT"
          ? "Draft saved"
          : "Listing published!",
        {
          description: r.listing.title,
        }
      );
      setProvider("listings");
    },
    onError: (e: any) => {
      toast.error("Could not save listing", {
        description: e?.message || "Please try again",
      });
    },
  });

  const goNext = () => {
    if (step === 1 && !step1Valid) {
      toast.error("Please complete food details first");
      return;
    }
    if (step === 2 && !step2Valid) {
      toast.error("Please enter valid quantity and pricing");
      return;
    }
    if (step === 3 && !step3Valid) {
      toast.error("You must accept the safety declaration to continue");
      return;
    }
    if (step === 4 && !step4Valid) {
      toast.error("Please fill in pickup times and address");
      return;
    }
    setStep((s) => Math.min(5, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  return (
    <PageShell className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-1 px-2"
            onClick={() => setProvider("listings")}
          >
            <ArrowLeft className="size-4" /> Back to listings
          </Button>
          <h1 className="font-display text-2xl font-bold text-forest sm:text-3xl">
            Create a listing
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isVerified
              ? "List your surplus food for rescue."
              : "Your account is pending verification — you can save drafts but cannot publish until verified."}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="relative overflow-hidden rounded-2xl border border-forest/8 bg-card p-5 cibo-shadow">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Step {step} of {STEPS.length}
          </p>
          <p className="text-[11px] font-bold text-orange">
            {Math.round((step / STEPS.length) * 100)}% complete
          </p>
        </div>
        {/* Overall progress bar */}
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold to-orange transition-all duration-500"
            style={{ width: `${(step / STEPS.length) * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = step === s.n;
            const done = step > s.n;
            return (
              <div key={s.n} className="flex flex-1 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (s.n < step) setStep(s.n);
                  }}
                  className={cn(
                    "group flex items-center gap-2 rounded-xl px-1.5 py-1 text-xs font-bold transition",
                    active
                      ? "bg-cream/80 text-forest"
                      : done
                      ? "text-success"
                      : "text-muted-foreground",
                    s.n < step ? "cursor-pointer hover:bg-cream/40" : "cursor-default"
                  )}
                  disabled={s.n > step}
                >
                  <span
                    className={cn(
                      "relative grid size-8 place-items-center rounded-full text-[11px] font-bold transition",
                      active
                        ? "bg-orange text-white cibo-shadow-gold"
                        : done
                        ? "bg-success text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {done ? (
                      <Check className="size-4" />
                    ) : (
                      <>
                        <Icon className="size-4" />
                        {active && (
                          <span className="absolute -inset-1 rounded-full ring-2 ring-orange/30" />
                        )}
                      </>
                    )}
                  </span>
                  <span className="hidden items-center gap-1.5 sm:inline-flex">
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 rounded-full transition-all",
                      step > s.n
                        ? "bg-gradient-to-r from-success to-success/50"
                        : "bg-forest/8"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {step === 1 && (
            <Step1
              form={form}
              set={set}
              catQ={catQ}
              isVerified={isVerified}
            />
          )}
          {step === 2 && (
            <Step2
              form={form}
              set={set}
              qty={qty}
              originalPrice={originalPrice}
              ciboPrice={ciboPrice}
              pct={pct}
              potentialRevenue={potentialRevenue}
            />
          )}
          {step === 3 && <Step3 form={form} set={set} />}
          {step === 4 && (
            <Step4
              form={form}
              set={set}
              effectiveAddress={effectiveAddress}
              effectiveCity={effectiveCity}
              showsDelivery={showsDelivery}
            />
          )}
          {step === 5 && <Step5 form={form} pct={pct} qty={qty} />}
        </div>

        {/* Live preview side */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Panel title="Live preview">
            <ListingPreview
              form={form}
              pct={pct}
              qty={qty}
              ciboPrice={ciboPrice}
              originalPrice={originalPrice}
            />
            <div className="mt-3 space-y-2 rounded-xl bg-cream/40 p-3 text-[11px]">
              <PreviewRow label="Discount" value={`${pct}%`} />
              <PreviewRow label="Potential revenue" value={fmtPrice(potentialRevenue)} />
              <PreviewRow label="Est. rescued meals" value={`${qty}`} />
              <PreviewRow
                label="Pickup window"
                value={
                  form.pickupStart && form.pickupDeadline
                    ? `${shortTime(form.pickupStart)} – ${shortTime(form.pickupDeadline)}`
                    : "—"
                }
              />
              <PreviewRow
                label="Fulfillment"
                value={
                  form.fulfillment === "BOTH"
                    ? "Pickup + Delivery"
                    : form.fulfillment === "DELIVERY"
                    ? "Delivery only"
                    : "Pickup only"
                }
              />
            </div>
          </Panel>
        </aside>
      </div>

      {/* Footer nav */}
      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-2 border-t border-forest/8 bg-card/95 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
        <Button
          variant="outline"
          size="sm"
          onClick={goBack}
          disabled={step === 1 || mut.isPending}
        >
          <ArrowLeft className="size-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          {step === 5 && (
            <Button
              variant="outline"
              size="sm"
              disabled={mut.isPending}
              onClick={() => mut.mutate({ status: "DRAFT" })}
            >
              {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save as draft
            </Button>
          )}
          {step < 5 ? (
            <Button variant="default" size="sm" onClick={goNext}>
              Next <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              variant="rescue"
              size="sm"
              disabled={!canPublish || mut.isPending}
              onClick={() => mut.mutate({ status: "ACTIVE" })}
              title={!isVerified ? "Verification required to publish" : undefined}
            >
              {mut.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Publish listing
            </Button>
          )}
        </div>
      </div>
    </PageShell>
  );
}

// ---------------- Step 1 ----------------
function Step1({
  form,
  set,
  catQ,
  isVerified,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  catQ: ReturnType<typeof useQuery<{ categories: any[] }>>;
  isVerified: boolean;
}) {
  const [imageUrl, setImageUrl] = useState("");
  const cats = catQ.data?.categories || [];

  const addImage = (url: string) => {
    const u = url.trim();
    if (!u) return;
    if (form.images.includes(u)) return;
    if (form.images.length >= 4) {
      toast.error("Maximum 4 images");
      return;
    }
    set("images", [...form.images, u]);
    setImageUrl("");
  };
  const removeImage = (url: string) =>
    set(
      "images",
      form.images.filter((i) => i !== url)
    );

  return (
    <Panel title="Food details" subtitle="Tell customers what you're rescuing">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-forest">Title *</Label>
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Veg Biryani surplus (serves 50)"
            className="h-11 rounded-xl border-forest/15 bg-card"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-forest">Description *</Label>
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            placeholder="Describe what's included, freshness, portion sizes, etc."
            className="rounded-xl border-forest/15 bg-card"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-forest">Category</Label>
            {catQ.isLoading ? (
              <Skeleton className="h-11 w-full rounded-xl cibo-skeleton" />
            ) : (
              <Select
                value={form.categoryId || "NONE"}
                onValueChange={(v) => set("categoryId", v === "NONE" ? "" : v)}
              >
                <SelectTrigger className="h-11 rounded-xl border-forest/15 bg-card">
                  <SelectValue placeholder="Choose category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">— None —</SelectItem>
                  {cats.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-forest">Food type *</Label>
            <div className="flex flex-wrap gap-1.5">
              {FOOD_TYPES.map((t) => (
                <button
                  key={t.v}
                  type="button"
                  onClick={() => set("foodType", t.v)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition",
                    form.foodType === t.v
                      ? "border-forest bg-forest text-ivory"
                      : "border-forest/15 bg-card text-forest hover:border-gold"
                  )}
                >
                  <VegBadge type={t.v} className="scale-90" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-forest">Halal status</Label>
          {!isVerified && (
            <p className="rounded-lg bg-cream/60 p-2 text-[10px] font-semibold text-forest">
              ℹ️ Halal <span className="text-success">Verified</span> status is
              only available to verified providers. You can choose Declared or
              Unspecified.
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            <HalalChip
              v="VERIFIED"
              label="Verified"
              disabled={!isVerified}
              active={form.halalStatus === "VERIFIED"}
              onClick={() => isVerified && set("halalStatus", "VERIFIED")}
            />
            {HALAL_STATUSES.map((h) => (
              <HalalChip
                key={h.v}
                v={h.v}
                label={h.label}
                active={form.halalStatus === h.v}
                onClick={() => set("halalStatus", h.v)}
              />
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-forest">
            Images ({form.images.length}/4)
          </Label>
          <div className="flex gap-2">
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste image URL"
              className="h-11 rounded-xl border-forest/15 bg-card"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addImage(imageUrl);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => addImage(imageUrl)}
              disabled={!imageUrl.trim() || form.images.length >= 4}
              className="size-11 shrink-0"
              aria-label="Add image"
            >
              <ImagePlus className="size-4" />
            </Button>
          </div>
          {form.images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {form.images.map((u) => (
                <div
                  key={u}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-forest/10"
                >
                  <img
                    src={u}
                    alt=""
                    className="size-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/cibo-logo.svg";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(u)}
                    className="absolute right-1 top-1 grid size-6 place-items-center rounded-md bg-danger text-white opacity-0 transition group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground">
              Quick add:
            </span>
            {SAMPLE_IMAGES.slice(0, 4).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => {
                  if (form.images.length >= 4) {
                    toast.error("Maximum 4 images");
                    return;
                  }
                  if (!form.images.includes(u)) set("images", [...form.images, u]);
                }}
                className="size-8 overflow-hidden rounded-md border border-forest/10 transition hover:border-gold"
              >
                <img src={u} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Event toggle */}
        <div className="rounded-xl border border-forest/10 p-3">
          <label className="flex items-center gap-3">
            <Switch
              checked={form.isEvent}
              onCheckedChange={(v) => set("isEvent", v)}
            />
            <div>
              <p className="text-sm font-bold text-forest">Event surplus</p>
              <p className="text-[10px] text-muted-foreground">
                Toggle on if this is leftover food from a wedding, party, etc.
              </p>
            </div>
          </label>
          {form.isEvent && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-forest">Event type</Label>
                <Select
                  value={form.eventType}
                  onValueChange={(v) => set("eventType", v)}
                >
                  <SelectTrigger className="h-10 rounded-xl border-forest/15 bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-forest">Event name</Label>
                <Input
                  value={form.eventName}
                  onChange={(e) => set("eventName", e.target.value)}
                  placeholder="e.g. Priya & Arjun Wedding"
                  className="h-10 rounded-xl border-forest/15 bg-card"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

// ---------------- Step 2 ----------------
function Step2({
  form,
  set,
  qty,
  originalPrice,
  ciboPrice,
  pct,
  potentialRevenue,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  qty: number;
  originalPrice: number;
  ciboPrice: number;
  pct: number;
  potentialRevenue: number;
}) {
  return (
    <Panel title="Quantity & pricing" subtitle="Set how much food and at what discount">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-forest">Quantity *</Label>
            <Input
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              placeholder="e.g. 50"
              className="h-11 rounded-xl border-forest/15 bg-card"
            />
            <p className="text-[10px] text-muted-foreground">Meals / portions</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-forest">Original price *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.originalPrice}
                onChange={(e) => set("originalPrice", e.target.value)}
                placeholder="0"
                className="h-11 rounded-xl border-forest/15 bg-card pl-8"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">Original value</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-forest">CIBO price *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.ciboPrice}
                onChange={(e) => set("ciboPrice", e.target.value)}
                placeholder="0"
                className="h-11 rounded-xl border-forest/15 bg-card pl-8"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {ciboPrice > originalPrice && originalPrice > 0
                ? "Must be ≤ original price"
                : "Discounted rescue price"}
            </p>
          </div>
        </div>

        {/* Live calc card */}
        <div className="grid gap-3 rounded-2xl bg-forest p-4 text-ivory sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gold">Discount</p>
            <p className="mt-1 font-display text-3xl font-extrabold">{pct}%</p>
            {pct > 0 && <DiscountTag pct={pct} className="mt-1.5" />}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gold">Potential revenue</p>
            <p className="mt-1 font-display text-3xl font-extrabold">
              {fmtPrice(potentialRevenue)}
            </p>
            <p className="mt-0.5 text-[10px] text-ivory/70">
              {qty} × {fmtPrice(ciboPrice)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gold">Rescued meals</p>
            <p className="mt-1 font-display text-3xl font-extrabold">{qty}</p>
            <p className="mt-0.5 text-[10px] text-ivory/70">Estimated impact</p>
          </div>
        </div>

        <div className="rounded-xl bg-cream/40 p-3 text-[11px] text-forest">
          <p className="font-bold">Pricing tips</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">
            <li>Discounts of 50%+ attract the most rescues.</li>
            <li>Price per portion should cover your basic costs only — this is surplus.</li>
            <li>Lower prices help reduce food waste faster.</li>
          </ul>
        </div>
      </div>
    </Panel>
  );
}

// ---------------- Step 3 ----------------
function Step3({
  form,
  set,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <Panel title="Food safety" subtitle="Mandatory declarations for customer safety">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-forest">Prep time</Label>
            <Input
              value={form.prepTime}
              onChange={(e) => set("prepTime", e.target.value)}
              placeholder="e.g. 2 hours ago"
              className="h-11 rounded-xl border-forest/15 bg-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-forest">Packing time</Label>
            <Input
              value={form.packingTime}
              onChange={(e) => set("packingTime", e.target.value)}
              placeholder="e.g. Packed 30m ago"
              className="h-11 rounded-xl border-forest/15 bg-card"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-forest">Storage info</Label>
            <Textarea
              value={form.storageInfo}
              onChange={(e) => set("storageInfo", e.target.value)}
              rows={2}
              placeholder="e.g. Stored in chiller at 4°C"
              className="rounded-xl border-forest/15 bg-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-forest">Packaging info</Label>
            <Textarea
              value={form.packagingInfo}
              onChange={(e) => set("packagingInfo", e.target.value)}
              rows={2}
              placeholder="e.g. Sealed food-grade containers"
              className="rounded-xl border-forest/15 bg-card"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-forest">Allergens (comma-separated)</Label>
          <Input
            value={form.allergens}
            onChange={(e) => set("allergens", e.target.value)}
            placeholder="e.g. Dairy, Nuts, Gluten"
            className="h-11 rounded-xl border-forest/15 bg-card"
          />
          {form.allergens.trim() && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {form.allergens
                .split(",")
                .map((a) => a.trim())
                .filter(Boolean)
                .map((a, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger"
                  >
                    {a}
                  </span>
                ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-forest">Special instructions</Label>
          <Textarea
            value={form.specialInstructions}
            onChange={(e) => set("specialInstructions", e.target.value)}
            rows={2}
            placeholder="e.g. Consume within 4 hours of pickup"
            className="rounded-xl border-forest/15 bg-card"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-forest">Handling declaration</Label>
          <Textarea
            value={form.handlingDeclaration}
            onChange={(e) => set("handlingDeclaration", e.target.value)}
            rows={3}
            placeholder="Describe how the food was handled, transported, and stored safely."
            className="rounded-xl border-forest/15 bg-card"
          />
        </div>

        <label
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
            form.safetyDeclaration
              ? "border-success bg-success/5"
              : "border-forest/15 bg-card hover:border-gold"
          )}
        >
          <Checkbox
            checked={form.safetyDeclaration}
            onCheckedChange={(v) => set("safetyDeclaration", v === true)}
            className="mt-0.5"
          />
          <div className="text-xs">
            <p className="font-bold text-forest">Safety declaration *</p>
            <p className="mt-0.5 text-muted-foreground">
              I confirm this food is safe for consumption, was prepared and
              stored hygienically, and all information provided is accurate. I
              understand CIBO may take action if this declaration is false.
            </p>
          </div>
        </label>
      </div>
    </Panel>
  );
}

// ---------------- Step 4 ----------------
function Step4({
  form,
  set,
  effectiveAddress,
  effectiveCity,
  showsDelivery,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  effectiveAddress: string;
  effectiveCity: string;
  showsDelivery: boolean;
}) {
  return (
    <Panel title="Pickup & delivery" subtitle="When and where customers collect">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-forest">Pickup start *</Label>
            <Input
              type="datetime-local"
              value={form.pickupStart}
              onChange={(e) => set("pickupStart", e.target.value)}
              className="h-11 rounded-xl border-forest/15 bg-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-forest">Pickup deadline *</Label>
            <Input
              type="datetime-local"
              value={form.pickupDeadline}
              onChange={(e) => set("pickupDeadline", e.target.value)}
              className="h-11 rounded-xl border-forest/15 bg-card"
            />
            {form.pickupStart &&
              form.pickupDeadline &&
              new Date(form.pickupDeadline) <= new Date(form.pickupStart) && (
                <p className="text-[10px] font-semibold text-danger">
                  Deadline must be after start
                </p>
              )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr,180px]">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-forest">Address line *</Label>
            <Input
              value={effectiveAddress}
              onChange={(e) => set("addressLine", e.target.value)}
              placeholder="Street, landmark"
              className="h-11 rounded-xl border-forest/15 bg-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-forest">City *</Label>
            <Input
              value={effectiveCity}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Tirunelveli"
              className="h-11 rounded-xl border-forest/15 bg-card"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-forest">Fulfillment</Label>
          <RadioGroup
            value={form.fulfillment}
            onValueChange={(v) => set("fulfillment", v as Fulfillment)}
            className="grid gap-2 sm:grid-cols-3"
          >
            <FulfillmentOption
              value="PICKUP"
              title="Pickup"
              desc="Customer collects"
              active={form.fulfillment === "PICKUP"}
            />
            <FulfillmentOption
              value="DELIVERY"
              title="Delivery"
              desc="You deliver"
              active={form.fulfillment === "DELIVERY"}
            />
            <FulfillmentOption
              value="BOTH"
              title="Both"
              desc="Either option"
              active={form.fulfillment === "BOTH"}
            />
          </RadioGroup>
        </div>

        {showsDelivery && (
          <div className="space-y-1.5 rounded-xl bg-cream/40 p-3">
            <Label className="text-xs font-bold text-forest">Delivery fee (₹)</Label>
            <Input
              type="number"
              min={0}
              value={form.deliveryFee}
              onChange={(e) => set("deliveryFee", e.target.value)}
              placeholder="0"
              className="h-11 rounded-xl border-forest/15 bg-card"
            />
            <p className="text-[10px] text-muted-foreground">
              Customer pays this fee on top of order total.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl bg-cream/40 p-3 text-[11px] text-forest">
          <Calendar className="size-3.5 shrink-0 text-orange" />
          <p>
            Pick a realistic pickup window. The listing will auto-expire at the
            deadline — short windows mean fresher food and faster rescues.
          </p>
        </div>
      </div>
    </Panel>
  );
}

// ---------------- Step 5 ----------------
function Step5({
  form,
  pct,
  qty,
}: {
  form: FormState;
  pct: number;
  qty: number;
}) {
  return (
    <Panel title="Preview & publish" subtitle="Review your listing before it goes live">
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-xl bg-success/10 p-3 text-xs font-semibold text-success">
          <Check className="size-4" /> Ready to publish. Review the details
          below and tap Publish.
        </div>

        <div className="space-y-3 rounded-2xl border border-forest/10 bg-card p-4">
          <PreviewSection title="Food details" icon={<Tag className="size-3.5" />}>
            <div className="space-y-1 text-xs">
              <p className="font-bold text-forest">{form.title || "Untitled"}</p>
              <p className="text-muted-foreground">{form.description}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <VegBadge type={form.foodType} />
                {form.halalStatus === "VERIFIED" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-forest px-2 py-0.5 text-[9px] font-bold uppercase text-gold">
                    Halal Verified
                  </span>
                )}
                {form.isEvent && <RescueBadge />}
              </div>
              {form.isEvent && form.eventName && (
                <p className="pt-1 text-[11px] text-muted-foreground">
                  Event: {form.eventType} — {form.eventName}
                </p>
              )}
            </div>
          </PreviewSection>

          <PreviewSection title="Quantity & pricing" icon={<Package className="size-3.5" />}>
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <Stat label="Quantity" value={`${qty}`} />
              <Stat label="Original" value={fmtPrice(Number(form.originalPrice) || 0)} />
              <Stat label="CIBO" value={fmtPrice(Number(form.ciboPrice) || 0)} />
              <Stat label="Discount" value={`${pct}%`} />
            </div>
          </PreviewSection>

          <PreviewSection title="Safety" icon={<ShieldCheck className="size-3.5" />}>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><span className="font-semibold text-forest">Prep:</span> {form.prepTime || "—"}</p>
              <p><span className="font-semibold text-forest">Storage:</span> {form.storageInfo || "—"}</p>
              <p><span className="font-semibold text-forest">Allergens:</span> {form.allergens || "None declared"}</p>
              <p className="inline-flex items-center gap-1 pt-1 font-semibold text-success">
                <Check className="size-3" /> Safety declaration accepted
              </p>
            </div>
          </PreviewSection>

          <PreviewSection title="Pickup" icon={<MapPin className="size-3.5" />}>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="font-semibold text-forest">
                {form.addressLine || "—"}, {form.city || "—"}
              </p>
              <p>
                Window: {form.pickupStart ? shortTime(form.pickupStart) : "—"} –{" "}
                {form.pickupDeadline ? shortTime(form.pickupDeadline) : "—"}
              </p>
              <p>Fulfillment: {form.fulfillment}</p>
              {(form.fulfillment === "DELIVERY" || form.fulfillment === "BOTH") && (
                <p>Delivery fee: {fmtPrice(Number(form.deliveryFee) || 0)}</p>
              )}
            </div>
          </PreviewSection>
        </div>
      </div>
    </Panel>
  );
}

// ---------------- Live preview component ----------------
function ListingPreview({
  form,
  pct,
  qty,
  ciboPrice,
  originalPrice,
}: {
  form: FormState;
  pct: number;
  qty: number;
  ciboPrice: number;
  originalPrice: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-forest/10 bg-card">
      <div className="relative aspect-[4/3] bg-cream/40">
        {form.images[0] ? (
          <img
            src={form.images[0]}
            alt=""
            className="size-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/cibo-logo.svg";
            }}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ChefHat className="size-8" />
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1.5">
          <VegBadge type={form.foodType} />
          {pct > 0 && <DiscountTag pct={pct} />}
        </div>
        {form.isEvent && (
          <div className="absolute right-2 top-2">
            <RescueBadge />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-display text-sm font-bold text-forest line-clamp-1">
          {form.title || "Untitled listing"}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">
          {form.description || "Add a description..."}
        </p>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground line-through">
              {fmtPrice(originalPrice)}
            </p>
            <p className="font-display text-base font-extrabold text-forest">
              {fmtPrice(ciboPrice)}
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground">{qty} left</p>
        </div>
      </div>
    </div>
  );
}

// ---------------- helpers ----------------
function HalalChip({
  v,
  label,
  active,
  disabled,
  onClick,
}: {
  v: string;
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg border px-2.5 py-1.5 text-xs font-bold transition",
        active
          ? "border-forest bg-forest text-ivory"
          : "border-forest/15 bg-card text-forest hover:border-gold",
        disabled && "cursor-not-allowed opacity-50 hover:border-forest/15"
      )}
      title={v === "VERIFIED" && disabled ? "Verification required" : undefined}
    >
      {label}
    </button>
  );
}

function FulfillmentOption({
  value,
  title,
  desc,
  active,
}: {
  value: string;
  title: string;
  desc: string;
  active: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-xl border p-3 transition",
        active ? "border-forest bg-cream/50" : "border-forest/10 hover:bg-cream/30"
      )}
    >
      <RadioGroupItem value={value} />
      <div>
        <p className="text-xs font-bold text-forest">{title}</p>
        <p className="text-[10px] text-muted-foreground">{desc}</p>
      </div>
    </label>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold text-forest">{value}</span>
    </div>
  );
}

function PreviewSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-cream/30 p-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-forest">
        {icon} {title}
      </p>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-cream/40 p-2">
      <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-xs font-extrabold text-forest">{value}</p>
    </div>
  );
}

function shortTime(d: string): string {
  try {
    const date = new Date(d);
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return d;
  }
}
