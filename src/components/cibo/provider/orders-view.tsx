"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Check,
  ChefHat,
  Package,
  Truck,
  Clock,
  MapPin,
  Phone,
  Loader2,
  KeyRound,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { cn, fmtPrice, fmtTime, fmtDate, timeAgo } from "@/lib/utils";
import { EmptyState, PageShell, Panel } from "./shared";
import type { Order, OrderStatus } from "@/lib/types";

export function OrdersView() {
  const [tab, setTab] = useState("new");
  const q = useQuery({
    queryKey: ["provider", "orders"],
    queryFn: () => orderApi.providerOrders(),
    refetchInterval: 30_000,
  });
  const orders = q.data?.orders || [];

  const newOrders = orders.filter((o) => o.status === "PLACED");
  const inProgress = orders.filter(
    (o) => o.status === "CONFIRMED" || o.status === "READY" || o.status === "PICKED_UP"
  );
  const completed = orders.filter((o) => o.status === "COMPLETED");
  const cancelled = orders.filter(
    (o) => o.status === "CANCELLED" || o.status === "REFUNDED"
  );

  return (
    <PageShell className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-forest sm:text-3xl">
          Orders
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Manage incoming rescues. Confirm → Ready → Verify OTP to complete.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4 rounded-2xl">
          <TabsTrigger value="new" className="rounded-xl">
            New
            {newOrders.length > 0 && (
              <span className="ml-1.5 grid size-4 place-items-center rounded-full bg-orange text-[9px] font-bold text-white">
                {newOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="progress" className="rounded-xl">
            In progress
            {inProgress.length > 0 && (
              <span className="ml-1.5 grid size-4 place-items-center rounded-full bg-gold text-[9px] font-bold text-forest-deep">
                {inProgress.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-xl">
            Completed
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="rounded-xl">
            Cancelled
          </TabsTrigger>
        </TabsList>

        {q.isLoading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl cibo-skeleton" />
            ))}
          </div>
        ) : (
          <>
            <TabsContent value="new" className="mt-4 space-y-3">
              {newOrders.length === 0 ? (
                <Panel>
                  <EmptyState
                    title="No new orders"
                    description="When customers place orders, they'll appear here for confirmation."
                    icon={<ShoppingBag className="size-5" />}
                  />
                </Panel>
              ) : (
                newOrders.map((o) => <OrderCard key={o.id} order={o} />)
              )}
            </TabsContent>
            <TabsContent value="progress" className="mt-4 space-y-3">
              {inProgress.length === 0 ? (
                <Panel>
                  <EmptyState
                    title="Nothing in progress"
                    description="Orders you've confirmed will show here until completed."
                    icon={<ChefHat className="size-5" />}
                  />
                </Panel>
              ) : (
                inProgress.map((o) => <OrderCard key={o.id} order={o} />)
              )}
            </TabsContent>
            <TabsContent value="completed" className="mt-4 space-y-3">
              {completed.length === 0 ? (
                <Panel>
                  <EmptyState
                    title="No completed orders"
                    description="Completed rescues will be listed here."
                    icon={<Check className="size-5" />}
                  />
                </Panel>
              ) : (
                completed.map((o) => <OrderCard key={o.id} order={o} />)
              )}
            </TabsContent>
            <TabsContent value="cancelled" className="mt-4 space-y-3">
              {cancelled.length === 0 ? (
                <Panel>
                  <EmptyState
                    title="No cancelled orders"
                    description="Cancelled or refunded orders will appear here."
                    icon={<XCircle className="size-5" />}
                  />
                </Panel>
              ) : (
                cancelled.map((o) => <OrderCard key={o.id} order={o} />)
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </PageShell>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, string> = {
    PLACED: "bg-cream text-forest",
    CONFIRMED: "bg-gold/20 text-gold",
    READY: "bg-orange/15 text-orange",
    PICKED_UP: "bg-olive/15 text-olive",
    COMPLETED: "bg-success/15 text-success",
    CANCELLED: "bg-danger/10 text-danger",
    REFUNDED: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        map[status]
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function OrderCard({ order }: { order: Order }) {
  const customer = (order as any).customer;
  const [otpOpen, setOtpOpen] = useState(false);
  const qc = useQueryClient();

  const statusMut = useMutation({
    mutationFn: (status: string) => orderApi.updateStatus(order.id, status),
    onSuccess: () => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["provider", "orders"] });
      qc.invalidateQueries({ queryKey: ["provider", "analytics"] });
    },
    onError: (e: any) => toast.error(e?.message || "Could not update order"),
  });

  return (
    <Panel bodyClassName="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-forest">
              #{order.orderNumber}
            </span>
            <StatusPill status={order.status} />
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {customer?.name || "Customer"} · {timeAgo(order.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-extrabold text-forest">
            {fmtPrice(order.total)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {order.paymentMethod} · {order.paymentStatus}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-xl bg-cream/30 p-3">
        <div className="space-y-1.5">
          {order.items.map((it) => (
            <div key={it.id} className="flex items-center gap-2 text-xs">
              <div className="size-8 shrink-0 overflow-hidden rounded-md border border-forest/10">
                <img
                  src={it.image || "/cibo-logo.svg"}
                  alt=""
                  className="size-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/cibo-logo.svg";
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-forest">{it.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {it.quantity} × {fmtPrice(it.price)}
                </p>
              </div>
              <span className="font-bold text-forest">
                {fmtPrice(it.price * it.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Fulfillment / pickup info */}
      <div className="grid gap-2 text-[11px] sm:grid-cols-2">
        <InfoRow
          icon={
            order.fulfillmentType === "DELIVERY" ? (
              <Truck className="size-3.5" />
            ) : (
              <Package className="size-3.5" />
            )
          }
          label="Fulfillment"
          value={order.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup"}
        />
        {order.pickupDeadline && (
          <InfoRow
            icon={<Clock className="size-3.5" />}
            label="Pickup window"
            value={`${order.pickupStart ? fmtTime(order.pickupStart) : "—"} – ${fmtTime(order.pickupDeadline)} · ${fmtDate(order.pickupDeadline)}`}
          />
        )}
        {customer?.phone && (
          <InfoRow
            icon={<Phone className="size-3.5" />}
            label="Customer phone"
            value={customer.phone}
          />
        )}
        {order.deliveryAddress && (
          <InfoRow
            icon={<MapPin className="size-3.5" />}
            label="Delivery address"
            value={order.deliveryAddress}
          />
        )}
      </div>

      {/* OTP display (for READY/PICKED_UP) */}
      {(order.status === "READY" || order.status === "PICKED_UP") && order.pickupOtp && (
        <div className="flex items-center justify-between rounded-xl bg-forest p-3 text-ivory">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gold">
              Customer OTP
            </p>
            <p className="font-display text-2xl font-extrabold tracking-[0.3em]">
              {order.pickupOtp}
            </p>
          </div>
          <KeyRound className="size-5 text-gold" />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {order.status === "PLACED" && (
          <Button
            variant="rescue"
            size="sm"
            disabled={statusMut.isPending}
            onClick={() => statusMut.mutate("CONFIRMED")}
          >
            {statusMut.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            Confirm order
          </Button>
        )}
        {order.status === "CONFIRMED" && (
          <Button
            variant="rescue"
            size="sm"
            disabled={statusMut.isPending}
            onClick={() => statusMut.mutate("READY")}
          >
            {statusMut.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ChefHat className="size-3.5" />
            )}
            Mark ready
          </Button>
        )}
        {(order.status === "READY" || order.status === "PICKED_UP") && (
          <Button
            variant="rescue"
            size="sm"
            onClick={() => setOtpOpen(true)}
          >
            <KeyRound className="size-3.5" /> Verify OTP & complete
          </Button>
        )}
        {(order.status === "PLACED" || order.status === "CONFIRMED") && (
          <Button
            variant="outline"
            size="sm"
            disabled={statusMut.isPending}
            onClick={() => {
              if (confirm("Cancel this order?")) {
                statusMut.mutate("CANCELLED");
              }
            }}
            className="text-danger hover:text-danger"
          >
            <XCircle className="size-3.5" /> Cancel
          </Button>
        )}
        {order.status === "COMPLETED" && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
            <Check className="size-3.5" /> Completed{" "}
            {order.completedAt ? timeAgo(order.completedAt) : ""}
          </div>
        )}
      </div>

      <OtpDialog
        open={otpOpen}
        onOpenChange={setOtpOpen}
        orderId={order.id}
      />
    </Panel>
  );
}

function OtpDialog({
  open,
  onOpenChange,
  orderId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  orderId: string;
}) {
  const qc = useQueryClient();
  const [otp, setOtp] = useState("");
  const mut = useMutation({
    mutationFn: () => orderApi.verifyOtp(orderId, otp),
    onSuccess: () => {
      toast.success("Order completed! 🎉");
      qc.invalidateQueries({ queryKey: ["provider", "orders"] });
      qc.invalidateQueries({ queryKey: ["provider", "analytics"] });
      setOtp("");
      onOpenChange(false);
    },
    onError: (e: any) => {
      toast.error(e?.message || "Invalid OTP");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify pickup OTP</DialogTitle>
          <DialogDescription>
            Ask the customer for their 4-digit OTP and enter it below to
            complete the order.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-col items-center gap-3 py-2">
            <InputOTP
              maxLength={4}
              value={otp}
              onChange={(v) => setOtp(v)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="size-12 text-lg" />
                <InputOTPSlot index={1} className="size-12 text-lg" />
                <InputOTPSlot index={2} className="size-12 text-lg" />
                <InputOTPSlot index={3} className="size-12 text-lg" />
              </InputOTPGroup>
            </InputOTP>
            <p className="text-[11px] text-muted-foreground">
              Tip: the OTP is shown on your order card after marking it ready.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="rescue"
            disabled={otp.length < 4 || mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Verify & complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-gold">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-xs font-semibold text-forest">{value}</p>
      </div>
    </div>
  );
}

