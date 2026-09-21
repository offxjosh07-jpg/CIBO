"use client";

import { useApp } from "@/lib/store";
import { useAuth } from "@/components/providers";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { orderApi, reviewApi, complaintApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { FoodImage, EmptyState, PageShell, StarInput, StatusPill } from "./shared";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Store,
  MapPin,
  Clock,
  Phone,
  Truck,
  Star,
  XCircle,
  LifeBuoy,
  AlertTriangle,
  Package,
  ChefHat,
  ShoppingBag,
} from "lucide-react";
import { fmtPrice, fmtTime, timeAgo } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { Order, OrderStatus } from "@/lib/types";

const STEPS: { status: OrderStatus; label: string; desc: string; icon: typeof Store }[] =
  [
    {
      status: "PLACED",
      label: "Order placed",
      desc: "We've sent the rescue request to the provider.",
      icon: ShoppingBag,
    },
    {
      status: "CONFIRMED",
      label: "Provider confirmed",
      desc: "The provider has accepted your order.",
      icon: Store,
    },
    {
      status: "READY",
      label: "Food being packed",
      desc: "Your rescue is being prepared for pickup.",
      icon: ChefHat,
    },
    {
      status: "PICKED_UP",
      label: "Ready for pickup",
      desc: "Show your OTP at the counter to collect.",
      icon: Package,
    },
    {
      status: "COMPLETED",
      label: "Completed",
      desc: "Rescue complete. Thank you for saving food!",
      icon: Check,
    },
  ];

const STATUS_ORDER: Record<OrderStatus, number> = {
  PLACED: 0,
  CONFIRMED: 1,
  READY: 2,
  PICKED_UP: 3,
  COMPLETED: 4,
  CANCELLED: -1,
  REFUNDED: -1,
};

export function OrderTrackingView() {
  const id = useApp((s) => s.activeOrderId);
  const setCustomer = useApp((s) => s.setCustomer);
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => orderApi.get(id!),
    enabled: !!id,
    refetchInterval: 15_000,
  });

  if (isLoading) return <TrackingSkeleton onBack={() => setCustomer("orders")} />;
  if (isError || !data?.order)
    return (
      <PageShell>
        <Button
          variant="ghost"
          size="sm"
          className="mb-3"
          onClick={() => setCustomer("orders")}
        >
          <ArrowLeft className="size-4" /> Back to orders
        </Button>
        <EmptyState
          title="Order not found"
          description="This order may have been removed."
          actionLabel="View all orders"
          onAction={() => setCustomer("orders")}
          icon={<AlertTriangle className="size-5" />}
        />
      </PageShell>
    );

  const order = data.order;
  const currentStep = STATUS_ORDER[order.status] ?? 0;
  const cancelled = order.status === "CANCELLED";
  const completed = order.status === "COMPLETED";
  const canCancel = order.status === "PLACED" || order.status === "CONFIRMED";

  return (
    <PageShell className="space-y-5">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit"
        onClick={() => setCustomer("orders")}
      >
        <ArrowLeft className="size-4" /> Back to orders
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-forest sm:text-3xl">
          {order.orderNumber}
        </h1>
        <StatusPill status={order.status} />
        <span className="text-xs text-muted-foreground">
          Placed {timeAgo(order.createdAt)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stepper + OTP */}
        <div className="space-y-4 lg:col-span-2">
          {/* OTP card */}
          {!cancelled && (
            <div className="relative overflow-hidden rounded-3xl bg-forest p-6 text-ivory">
              <div className="absolute inset-0 cibo-grain opacity-30" />
              <div className="absolute -right-10 -top-10 size-40 rounded-full bg-gold/20 blur-3xl" />
              <div className="relative">
                <p className="text-xs font-bold uppercase tracking-wider text-gold">
                  {order.fulfillmentType === "DELIVERY"
                    ? "Delivery confirmation"
                    : "Show this OTP at pickup"}
                </p>
                <p className="mt-2 font-display text-5xl font-extrabold tracking-[0.35em] text-ivory">
                  {order.pickupOtp || "----"}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ivory/80">
                  <span className="inline-flex items-center gap-1">
                    <Store className="size-3 text-gold" />
                    {order.provider?.businessName || "Provider"}
                  </span>
                  {order.pickupStart && order.pickupDeadline && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3 text-gold" />
                      {fmtTime(order.pickupStart)} – {fmtTime(order.pickupDeadline)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stepper */}
          <section className="rounded-2xl border border-forest/8 bg-card p-5 cibo-shadow">
            <h3 className="mb-4 font-display text-base font-bold text-forest">
              {cancelled ? "Order cancelled" : "Order progress"}
            </h3>
            {cancelled ? (
              <div className="flex items-center gap-3 rounded-xl bg-danger/10 p-4 text-danger">
                <XCircle className="size-5" />
                <div>
                  <p className="text-sm font-bold">
                    This order was cancelled
                  </p>
                  {order.cancelledReason && (
                    <p className="text-xs text-danger/80">
                      Reason: {order.cancelledReason}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <ol className="space-y-4">
                {STEPS.map((step, i) => {
                  const stepIdx = STATUS_ORDER[step.status];
                  const isDone = stepIdx < currentStep;
                  const isActive = stepIdx === currentStep;
                  const Icon = step.icon;
                  return (
                    <li key={step.status} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "grid size-9 place-items-center rounded-full border-2 transition",
                            isDone
                              ? "border-success bg-success text-white"
                              : isActive
                              ? "border-orange bg-orange text-white"
                              : "border-forest/15 bg-card text-muted-foreground"
                          )}
                        >
                          {isDone ? (
                            <Check className="size-4" />
                          ) : (
                            <Icon className="size-4" />
                          )}
                        </div>
                        {i < STEPS.length - 1 && (
                          <div
                            className={cn(
                              "my-1 w-0.5 flex-1",
                              isDone ? "bg-success" : "bg-forest/10"
                            )}
                            style={{ minHeight: 18 }}
                          />
                        )}
                      </div>
                      <div className="pb-2">
                        <p
                          className={cn(
                            "text-sm font-bold",
                            isActive
                              ? "text-orange"
                              : isDone
                              ? "text-forest"
                              : "text-muted-foreground"
                          )}
                        >
                          {step.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {step.desc}
                        </p>
                        {isActive && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-orange">
                            <span className="relative flex size-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-75" />
                              <span className="relative inline-flex size-1.5 rounded-full bg-orange" />
                            </span>
                            In progress
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {order.fulfillmentType === "DELIVERY" && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-cream/40 p-3 text-xs text-forest">
                <Truck className="size-4 text-orange" />
                <span>
                  Delivery to {order.deliveryAddress || "your address"}. The
                  rider will confirm on arrival.
                </span>
              </div>
            )}
          </section>

          {/* Items */}
          <section className="rounded-2xl border border-forest/8 bg-card p-5 cibo-shadow">
            <h3 className="mb-3 font-display text-base font-bold text-forest">
              Items in this order
            </h3>
            <div className="space-y-3">
              {order.items.map((it) => (
                <div key={it.id} className="flex items-center gap-3">
                  <div className="size-14 shrink-0 overflow-hidden rounded-lg border border-forest/10">
                    <FoodImage src={it.image} alt={it.title} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-forest">
                      {it.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {it.quantity} × {fmtPrice(it.price)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-forest">
                    {fmtPrice(it.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-forest/8 pt-3 text-sm">
              <Row label="Subtotal" value={fmtPrice(order.subtotal)} />
              <Row label="Platform fee" value={fmtPrice(order.platformFee)} />
              <Row
                label="Delivery fee"
                value={
                  order.deliveryFee === 0 ? "Free" : fmtPrice(order.deliveryFee)
                }
              />
              <div className="flex items-center justify-between pt-1">
                <span className="font-display font-bold text-forest">Total</span>
                <span className="font-display text-lg font-extrabold text-forest">
                  {fmtPrice(order.total)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Paid via {order.paymentMethod} · {order.paymentStatus}
              </p>
            </div>
          </section>
        </div>

        {/* Side: provider, actions */}
        <aside className="space-y-4">
          {/* Provider */}
          <section className="rounded-2xl border border-forest/8 bg-card p-5 cibo-shadow">
            <h3 className="mb-3 font-display text-base font-bold text-forest">
              Provider
            </h3>
            {order.provider && (
              <div className="space-y-2">
                <p className="font-display text-sm font-bold text-forest">
                  {order.provider.businessName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.provider.businessType} · {order.provider.city}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Star className="size-3 fill-gold text-gold" />
                  {order.provider.rating.toFixed(1)} (
                  {order.provider.totalRatings} reviews)
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="size-3 text-gold" />
                  {order.provider.phone}
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 size-3 text-gold" />
                  {order.provider.addressLine}, {order.provider.city}
                </div>
              </div>
            )}
          </section>

          {/* Pickup info */}
          <section className="rounded-2xl border border-forest/8 bg-card p-5 cibo-shadow">
            <h3 className="mb-3 font-display text-base font-bold text-forest">
              {order.fulfillmentType === "DELIVERY"
                ? "Delivery details"
                : "Pickup details"}
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground">When</span>
                <p className="font-medium text-forest">
                  {order.pickupStart && order.pickupDeadline
                    ? `${fmtTime(order.pickupStart)} – ${fmtTime(order.pickupDeadline)}`
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Where</span>
                <p className="font-medium text-forest">
                  {order.provider?.addressLine || order.deliveryAddress}
                </p>
              </div>
              {order.notes && (
                <div>
                  <span className="text-muted-foreground">Your notes</span>
                  <p className="font-medium text-forest">{order.notes}</p>
                </div>
              )}
            </div>
          </section>

          {/* Actions */}
          <div className="space-y-2">
            {canCancel && (
              <CancelDialog
                orderId={order.id}
                onCancelled={() => {
                  qc.invalidateQueries({ queryKey: ["order", id] });
                  qc.invalidateQueries({ queryKey: ["orders"] });
                }}
              />
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setCustomer("help")}
            >
              <LifeBuoy className="size-3.5" /> Need help?
            </Button>
            <ComplaintDialog
              orderId={order.id}
              providerId={order.providerId}
            />
          </div>

          {/* Review */}
          {completed && !order.review && <ReviewCard orderId={order.id} />}
          {completed && order.review && (
            <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-success">
                Your review
              </p>
              <div className="mt-1 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "size-3",
                      i < order.review!.rating
                        ? "fill-gold text-gold"
                        : "text-muted-foreground/40"
                    )}
                  />
                ))}
              </div>
              {order.review.comment && (
                <p className="mt-1 text-xs text-forest">
                  "{order.review.comment}"
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </PageShell>
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

function CancelDialog({
  orderId,
  onCancelled,
}: {
  orderId: string;
  onCancelled: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => orderApi.cancel(orderId, reason || "Changed mind"),
    onSuccess: () => {
      toast.success("Order cancelled");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["orders"] });
      onCancelled();
    },
    onError: (e: any) =>
      toast.error("Could not cancel", { description: e?.message }),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="sm"
        className="w-full text-danger"
        onClick={() => setOpen(true)}
      >
        <XCircle className="size-3.5" /> Cancel order
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this order?</DialogTitle>
          <DialogDescription>
            Cancelling will release the reserved food back to the provider.
            Refunds are processed automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label className="text-xs">Reason (optional)</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Tell us why you're cancelling…"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Keep order
          </Button>
          <Button
            variant="destructive"
            disabled={mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? "Cancelling…" : "Confirm cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ComplaintDialog({
  orderId,
  providerId,
}: {
  orderId: string;
  providerId: string;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("FOOD_QUALITY");
  const [desc, setDesc] = useState("");
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () =>
      complaintApi.create({
        orderId,
        providerId,
        type,
        description: desc,
      }),
    onSuccess: () => {
      toast.success("Complaint filed. We'll investigate.");
      setOpen(false);
      setDesc("");
      qc.invalidateQueries({ queryKey: ["complaints"] });
    },
    onError: () => toast.error("Could not submit complaint"),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <AlertTriangle className="size-3.5" /> File a complaint
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>File a complaint</DialogTitle>
          <DialogDescription>
            Tell us what went wrong with this order.
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
                <SelectItem value="PROVIDER">Provider behavior</SelectItem>
                <SelectItem value="REFUND">Refund request</SelectItem>
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
              placeholder="What happened?"
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
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewCard({ orderId }: { orderId: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => reviewApi.create({ orderId, rating, comment: comment.trim() || undefined }),
    onSuccess: () => {
      toast.success("Thanks for your review!");
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: () => toast.error("Could not submit review"),
  });
  return (
    <section className="rounded-2xl border border-gold/30 bg-cream/40 p-5">
      <h3 className="font-display text-base font-bold text-forest">
        Rate your rescue
      </h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Help your provider and other rescuers.
      </p>
      <div className="mt-3">
        <StarInput value={rating} onChange={setRating} />
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Share your experience…"
        className="mt-3"
      />
      <Button
        variant="rescue"
        size="sm"
        className="mt-2 w-full"
        disabled={mut.isPending}
        onClick={() => mut.mutate()}
      >
        Submit review
      </Button>
    </section>
  );
}

function TrackingSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <PageShell className="space-y-5">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" /> Back
      </Button>
      <Skeleton className="h-8 w-1/2 rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-3xl lg:col-span-2" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </PageShell>
  );
}
