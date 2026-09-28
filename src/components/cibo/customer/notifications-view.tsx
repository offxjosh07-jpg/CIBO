"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/lib/store";
import { useAuth } from "@/components/providers";
import { notifApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { EmptyState, PageShell } from "./shared";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  Store,
  Star,
  AlertTriangle,
  Truck,
  Heart,
  LogIn,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/lib/types";

const ICON_BY_TYPE: Record<string, typeof Bell> = {
  ORDER_PLACED: ShoppingBag,
  ORDER_CONFIRMED: Store,
  ORDER_READY: Store,
  ORDER_COMPLETED: CheckCheck,
  ORDER_CANCELLED: AlertTriangle,
  PROVIDER_VERIFIED: Store,
  REVIEW_REQUEST: Star,
  LISTING_RESCUED: Heart,
  DELIVERY_UPDATE: Truck,
  DEFAULT: Bell,
};

export function NotificationsView() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notifApi.list(),
    enabled: !!user,
  });

  const markAll = useMutation({
    mutationFn: () => notifApi.markAllRead(),
    onSuccess: () => {
      toast.success("All marked as read");
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "header"] });
    },
  });

  if (!user) {
    return (
      <PageShell>
        <EmptyState
          title="Log in to view notifications"
          description="Order updates, provider confirmations, and rescue alerts will appear here."
          actionLabel="Log in"
          onAction={() => useApp.getState().setAuthView("login")}
          icon={<LogIn className="size-5" />}
        />
      </PageShell>
    );
  }

  const notifications = data?.notifications || [];
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <PageShell className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {notifications.length} total · {unread} unread
          </p>
        </div>
        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            <CheckCheck className="size-3.5" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="Order updates, alerts, and rescue confirmations will show up here."
          icon={<Bell className="size-5" />}
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationRow key={n.id} n={n} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

function NotificationRow({ n }: { n: NotificationItem }) {
  const Icon = ICON_BY_TYPE[n.type] || ICON_BY_TYPE.DEFAULT;
  const orderId =
    (n.data?.orderId as string | undefined) ||
    (n.data?.orderId as { id?: string } | undefined)?.id;
  return (
    <button
      onClick={() => {
        if (orderId) useApp.getState().openOrder(orderId);
      }}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition",
        n.read
          ? "border-forest/8 bg-card"
          : "border-gold/30 bg-cream/40"
      )}
    >
      <div
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          n.read
            ? "bg-cream text-forest"
            : "bg-forest text-ivory"
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-forest">{n.title}</p>
          {!n.read && (
            <span className="grid size-2 place-items-center rounded-full bg-orange" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {timeAgo(n.createdAt)}
        </p>
      </div>
    </button>
  );
}
