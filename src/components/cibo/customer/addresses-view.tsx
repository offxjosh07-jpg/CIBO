"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useApp } from "@/lib/store";
import { useAuth } from "@/components/providers";
import { addrApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState, PageShell } from "./shared";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  MapPin,
  Plus,
  Trash2,
  Home,
  Briefcase,
  Star,
  LogIn,
} from "lucide-react";
import type { Address } from "@/lib/types";
import { useState } from "react";

export function AddressesView() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => addrApi.list(),
    enabled: !!user,
  });

  const remove = useMutation({
    mutationFn: (id: string) => addrApi.del(id),
    onSuccess: () => {
      toast.success("Address deleted");
      qc.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: () => toast.error("Could not delete address"),
  });

  if (!user) {
    return (
      <PageShell>
        <EmptyState
          title="Log in to manage addresses"
          description="Save your home, work, or other addresses for faster delivery checkout."
          actionLabel="Log in"
          onAction={() => useApp.getState().setAuthView("login")}
          icon={<LogIn className="size-5" />}
        />
      </PageShell>
    );
  }

  const addresses = data?.addresses || [];

  return (
    <PageShell className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest sm:text-3xl">
            Saved addresses
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {addresses.length} address{addresses.length === 1 ? "" : "es"}
          </p>
        </div>
        <AddAddressDialog />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState
          title="No saved addresses"
          description="Add an address to enable faster delivery checkout."
          icon={<MapPin className="size-5" />}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <AddressCard
              key={a.id}
              address={a}
              onDelete={() => remove.mutate(a.id)}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}

function AddressCard({
  address,
  onDelete,
}: {
  address: Address;
  onDelete: () => void;
}) {
  const labelIcon = address.label.toLowerCase().includes("work")
    ? Briefcase
    : address.label.toLowerCase().includes("home")
    ? Home
    : MapPin;
  const Icon = labelIcon;
  return (
    <div className="relative rounded-2xl border border-forest/8 bg-card p-5 cibo-shadow">
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-cream text-forest">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-display text-sm font-bold text-forest">
              {address.label}
            </p>
            {address.isDefault && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gold">
                <Star className="size-2.5" /> Default
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-forest">{address.line1}</p>
          {address.line2 && (
            <p className="text-sm text-forest">{address.line2}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {address.city}
            {address.state ? `, ${address.state}` : ""}
            {address.pincode ? ` — ${address.pincode}` : ""}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="shrink-0 text-muted-foreground transition hover:text-danger"
          aria-label={`Delete ${address.label} address`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      {/* Map placeholder */}
      <div className="mt-3 aspect-[16/5] overflow-hidden rounded-xl bg-cream/40 grid place-items-center">
        <div className="text-center text-[10px] text-muted-foreground">
          <MapPin className="mx-auto size-4 text-gold" />
          <p className="mt-1">
            {address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}
          </p>
        </div>
      </div>
    </div>
  );
}

function AddAddressDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("Home");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState(useApp.getState().city);
  const [pincode, setPincode] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const mut = useMutation({
    mutationFn: () =>
      addrApi.create({
        label,
        line1,
        line2: line2 || undefined,
        city,
        state: "Tamil Nadu",
        pincode,
        latitude: useApp.getState().lat,
        longitude: useApp.getState().lng,
        isDefault,
      }),
    onSuccess: () => {
      toast.success("Address added");
      setOpen(false);
      setLine1("");
      setLine2("");
      setPincode("");
      qc.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: () => toast.error("Could not save address"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="rescue" size="sm">
          <Plus className="size-3.5" /> Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add new address</DialogTitle>
          <DialogDescription>
            Save an address for faster delivery checkout.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Label</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Home, Work…"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Pincode</Label>
              <Input
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                inputMode="numeric"
                placeholder="6 digits"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Address line 1</Label>
            <Input
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="Door no, street"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Address line 2 (optional)</Label>
            <Input
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder="Landmark, area"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">City</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="size-4 accent-forest"
            />
            Set as default
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="rescue"
            disabled={!line1.trim() || mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? "Saving…" : "Save address"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
