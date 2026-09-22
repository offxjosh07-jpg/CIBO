"use client";

import { useApp, useCart } from "@/lib/store";
import { useAuth } from "@/components/providers";
import { useQuery, useMutation } from "@tanstack/react-query";
import { addrApi, orderApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FoodImage, PageShell } from "./shared";
import { Confetti } from "../confetti";
import { toast } from "sonner";
import {
  CreditCard,
  Wallet,
  Building2,
  Smartphone,
  Store,
  Truck,
  CheckCircle2,
  MapPin,
  Plus,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { fmtPrice } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { Order } from "@/lib/types";

const PLATFORM_FEE = 5;
const PAYMENTS = [
  { id: "UPI", label: "UPI", desc: "GPay, PhonePe, Paytm", icon: Smartphone },
  { id: "CARD", label: "Card", desc: "Credit / Debit", icon: CreditCard },
  { id: "NETBANKING", label: "Net Banking", desc: "All banks", icon: Building2 },
  { id: "WALLET", label: "Wallet", desc: "Paytm, Mobikwik", icon: Wallet },
];

export function CheckoutView() {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clear = useCart((s) => s.clear);
  const setCustomer = useApp((s) => s.setCustomer);
  const openOrder = useApp((s) => s.openOrder);
  const { user } = useAuth();

  const [contactName, setContactName] = useState(user?.name || "");
  const [contactPhone, setContactPhone] = useState(user?.phone || "");
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [payment, setPayment] = useState("UPI");
  const [addressId, setAddressId] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const { data: addrData } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => addrApi.list(),
    enabled: !!user,
  });
  const addresses = addrData?.addresses || [];

  // determine if delivery is even possible from items
  const anyDelivery = items.some(
    (i) => i.fulfillment === "DELIVERY" || i.fulfillment === "BOTH"
  );
  const anyPickup = items.some(
    (i) => i.fulfillment === "PICKUP" || i.fulfillment === "BOTH"
  );

  // Derive the effective fulfillment without an effect: if the user-selected
  // mode is impossible given cart contents, fall back to the only possible one.
  const effectiveFulfillment: "PICKUP" | "DELIVERY" =
    fulfillment === "DELIVERY" && !anyDelivery
      ? "PICKUP"
      : fulfillment === "PICKUP" && !anyPickup && anyDelivery
      ? "DELIVERY"
      : fulfillment;

  // Derive effective address (default to first/default address when none chosen)
  const effectiveAddressId =
    addressId ||
    (addresses.find((a) => a.isDefault) || addresses[0])?.id;

  const deliveryFee =
    effectiveFulfillment === "PICKUP" ? 0 : 30;
  const total = subtotal + PLATFORM_FEE + deliveryFee;

  const placeOrder = useMutation({
    mutationFn: () =>
      orderApi.create({
        items: items.map((i) => ({
          listingId: i.listingId,
          quantity: i.quantity,
        })),
        fulfillmentType: effectiveFulfillment,
        paymentMethod: payment,
        addressId:
          effectiveFulfillment === "DELIVERY" ? effectiveAddressId : undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: (r) => {
      clear();
      setConfirmedOrder(r.order);
      toast.success("Order placed!", {
        description: `Order ${r.order.orderNumber}`,
      });
      // After short delay, navigate to tracking
      setTimeout(() => {
        openOrder(r.order.id);
        setConfirmedOrder(null);
      }, 2400);
    },
    onError: (e: any) => {
      toast.error("Could not place order", {
        description: e?.message || "A listing may have sold out. Please refresh.",
      });
    },
  });

  if (items.length === 0 && !confirmedOrder) {
    return (
      <PageShell>
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Your cart is empty. Add some rescues first!
          </p>
          <Button
            variant="rescue"
            className="mt-3"
            onClick={() => setCustomer("explore")}
          >
            Browse rescues
          </Button>
        </div>
      </PageShell>
    );
  }

  if (confirmedOrder) {
    return <OrderSuccess order={confirmedOrder} />;
  }

  // Auth gate
  if (!user) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md py-12">
          <div className="rounded-3xl border border-forest/8 bg-card p-8 text-center cibo-shadow">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-cream text-forest">
              <Store className="size-7" />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold text-forest">
              Log in to continue
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You can browse rescues without an account, but checkout requires
              logging in.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button
                variant="rescue"
                size="lg"
                onClick={() => useApp.getState().setAuthView("login")}
              >
                Log in
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => useApp.getState().setAuthView("signup")}
              >
                Create an account
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCustomer("cart")}
              >
                <ArrowLeft className="size-4" /> Back to cart
              </Button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-5">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit"
        onClick={() => setCustomer("cart")}
      >
        <ArrowLeft className="size-4" /> Back to cart
      </Button>
      <h1 className="font-display text-2xl font-bold text-forest sm:text-3xl">
        Checkout
      </h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: forms */}
        <div className="space-y-4 lg:col-span-2">
          {/* Contact */}
          <Card title="Contact details">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Full name</Label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone number</Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  inputMode="tel"
                />
              </div>
            </div>
          </Card>

          {/* Fulfillment */}
          <Card title="Fulfillment">
            <RadioGroup
              value={effectiveFulfillment}
              onValueChange={(v) => setFulfillment(v as "PICKUP" | "DELIVERY")}
              className="grid gap-2 sm:grid-cols-2"
            >
              <FulfillmentOption
                value="PICKUP"
                title="Pickup"
                desc="Collect from provider · Free"
                icon={<Store className="size-4" />}
                disabled={!anyPickup}
                checked={effectiveFulfillment === "PICKUP"}
              />
              <FulfillmentOption
                value="DELIVERY"
                title="Delivery"
                desc={`To your address · ${fmtPrice(30)}`}
                icon={<Truck className="size-4" />}
                disabled={!anyDelivery}
                checked={effectiveFulfillment === "DELIVERY"}
              />
            </RadioGroup>

            {effectiveFulfillment === "PICKUP" && (
              <div className="mt-3 rounded-xl bg-cream/40 p-3 text-xs text-forest">
                <p className="font-semibold">Pickup at provider's location</p>
                <p className="text-muted-foreground">
                  Show your OTP at pickup. Bring your own bag — save a planet 🌍.
                </p>
              </div>
            )}

            {effectiveFulfillment === "DELIVERY" && (
              <div className="mt-3 space-y-3">
                {addresses.length === 0 ? (
                  <div className="rounded-xl border border-forest/10 p-3 text-center text-xs text-muted-foreground">
                    No saved addresses yet. Add one below.
                  </div>
                ) : (
                  <Select value={effectiveAddressId} onValueChange={setAddressId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose address" />
                    </SelectTrigger>
                    <SelectContent>
                      {addresses.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.label} — {a.line1}, {a.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddAddr((v) => !v)}
                >
                  <Plus className="size-3.5" /> Add new address
                </Button>
                <AnimatePresence>
                  {showAddAddr && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <AddressForm
                        onCreated={() => setShowAddAddr(false)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </Card>

          {/* Payment */}
          <Card title="Payment method">
            <RadioGroup
              value={payment}
              onValueChange={setPayment}
              className="grid gap-2 sm:grid-cols-2"
            >
              {PAYMENTS.map((p) => {
                const Icon = p.icon;
                const active = payment === p.id;
                const colorMap: Record<string, string> = {
                  UPI: "bg-orange/15 text-orange",
                  CARD: "bg-forest/10 text-forest",
                  NETBANKING: "bg-gold/15 text-gold",
                  WALLET: "bg-success/15 text-success",
                };
                return (
                  <label
                    key={p.id}
                    className={`group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border p-3.5 transition ${
                      active
                        ? "border-orange bg-orange/5 cibo-shadow"
                        : "border-forest/10 hover:border-gold/40 hover:bg-cream/30"
                    }`}
                  >
                    {active && (
                      <span className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-orange text-white">
                        <span className="size-1.5 rounded-full bg-white" />
                      </span>
                    )}
                    <RadioGroupItem value={p.id} className="sr-only" />
                    <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${colorMap[p.id] || "bg-cream text-forest"}`}>
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-forest">{p.label}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{p.desc}</p>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </Card>

          {/* Notes */}
          <Card title="Special instructions">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Allergies, packing preferences, etc. (optional)"
              rows={3}
            />
          </Card>
        </div>

        {/* Right: summary */}
        <aside>
          <div className="rounded-2xl border border-forest/8 bg-card p-5 cibo-shadow lg:sticky lg:top-20">
            <h3 className="font-display text-base font-bold text-forest">
              Order summary
            </h3>
            <div className="mt-3 max-h-48 space-y-2 overflow-y-auto scrollbar-cibo">
              {items.map((i) => (
                <div key={i.listingId} className="flex items-center gap-2">
                  <div className="size-10 shrink-0 overflow-hidden rounded-lg border border-forest/10">
                    <FoodImage src={i.image} alt={i.title} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-forest">
                      {i.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {i.quantity} × {fmtPrice(i.price)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-forest">
                    {fmtPrice(i.price * i.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-forest/8 pt-4 text-sm">
              <Row label="Subtotal" value={fmtPrice(subtotal)} />
              <Row label="Platform fee" value={fmtPrice(PLATFORM_FEE)} />
              <Row
                label="Delivery fee"
                value={deliveryFee === 0 ? "Free" : fmtPrice(deliveryFee)}
              />
              <div className="my-2 border-t border-forest/8" />
              <div className="flex items-center justify-between">
                <span className="font-display text-base font-bold text-forest">
                  Total
                </span>
                <span className="font-display text-xl font-extrabold text-forest">
                  {fmtPrice(total)}
                </span>
              </div>
            </div>
            <Button
              variant="rescue"
              size="lg"
              className="mt-4 w-full"
              disabled={
                placeOrder.isPending ||
                !contactName.trim() ||
                !contactPhone.trim() ||
                (effectiveFulfillment === "DELIVERY" && !effectiveAddressId)
              }
              onClick={() => placeOrder.mutate()}
            >
              {placeOrder.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Placing order…
                </>
              ) : (
                <>
                  Pay & Confirm · {fmtPrice(total)}
                </>
              )}
            </Button>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Demo checkout — no real payment is processed.
            </p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-forest/8 bg-card p-5 cibo-shadow">
      <h3 className="mb-3 font-display text-base font-bold text-forest">
        {title}
      </h3>
      {children}
    </section>
  );
}

function FulfillmentOption({
  value,
  title,
  desc,
  icon,
  disabled,
  checked,
}: {
  value: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  disabled?: boolean;
  checked: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : checked
          ? "border-forest bg-cream/50"
          : "border-forest/10 hover:bg-cream/30"
      }`}
    >
      <RadioGroupItem value={value} disabled={disabled} />
      <div className="grid size-8 place-items-center rounded-lg bg-forest text-ivory">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-forest">{title}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
    </label>
  );
}

function AddressForm({ onCreated }: { onCreated: () => void }) {
  const [label, setLabel] = useState("Home");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState(useApp.getState().city);
  const [pincode, setPincode] = useState("");
  const mut = useMutation({
    mutationFn: () =>
      addrApi.create({
        label,
        line1,
        city,
        state: "Tamil Nadu",
        pincode,
        latitude: useApp.getState().lat,
        longitude: useApp.getState().lng,
        isDefault: false,
      }),
    onSuccess: () => {
      toast.success("Address added");
      onCreated();
    },
    onError: () => toast.error("Could not save address"),
  });
  return (
    <div className="space-y-2 rounded-xl border border-forest/10 p-3">
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Label (Home, Work)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <Input
          placeholder="Pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value)}
          inputMode="numeric"
        />
      </div>
      <Input
        placeholder="Address line"
        value={line1}
        onChange={(e) => setLine1(e.target.value)}
      />
      <Input
        placeholder="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />
      <Button
        size="sm"
        className="w-full"
        disabled={!line1.trim() || mut.isPending}
        onClick={() => mut.mutate()}
      >
        Save address
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-forest">{value}</span>
    </div>
  );
}

function OrderSuccess({ order }: { order: Order }) {
  return (
    <PageShell>
      <div className="relative">
        <Confetti count={50} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mx-auto max-w-md py-10 text-center"
        >
          {/* Success check with pulse ring */}
          <div className="relative mx-auto w-fit">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="relative grid size-20 place-items-center rounded-full bg-success/15 text-success"
            >
              <CheckCircle2 className="size-10" />
              {/* Pulsing ring */}
              <motion.div
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                className="absolute inset-0 rounded-full bg-success/30"
              />
            </motion.div>
          </div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-4 font-display text-2xl font-bold text-forest"
          >
            Order placed! 🎉
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-1 text-sm text-muted-foreground"
          >
            Order number{" "}
            <span className="font-bold text-forest">{order.orderNumber}</span>
          </motion.p>

          {/* Impact badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success"
          >
            🌱 You just rescued {order.items.reduce((s, i) => s + i.quantity, 0)} meal{order.items.reduce((s, i) => s + i.quantity, 0) > 1 ? "s" : ""}!
          </motion.div>

          {/* OTP card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-6 overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-cream/60 to-ivory/40 p-6 cibo-shadow"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Show this OTP at pickup
            </p>
            <p className="mt-2 font-display text-5xl font-extrabold tracking-[0.4em] text-forest">
              {order.pickupOtp || "----"}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs text-forest">
              <MapPin className="size-3 text-orange" />
              {order.provider?.businessName || "Provider"}
            </div>
          </motion.div>

          <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Redirecting to order
            tracking…
          </p>
        </motion.div>
      </div>
    </PageShell>
  );
}
