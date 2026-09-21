"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Percent, IndianRupee, Mail, Phone, Wrench } from "lucide-react";
import { PageShell, PageHeader, Panel } from "./shared";

const DEFAULTS: Record<string, string> = {
  commissionPct: "10",
  platformFlatFee: "5",
  defaultDeliveryFee: "25",
  supportEmail: "support@cibo.app",
  supportPhone: "+91 90000 12345",
  maintenanceMode: "false",
};

export function SettingsView() {
  const q = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => adminApi.settings(),
  });

  // Compute the "initial" form values from server data, falling back to defaults.
  // We re-mount the inner SettingsForm via `key` whenever the underlying
  // settings object reference changes — this avoids any setState-in-effect.
  const settings = q.data?.settings;
  const initial: Record<string, string> = { ...DEFAULTS };
  if (settings) {
    for (const k of Object.keys(DEFAULTS)) {
      if (settings[k] != null) initial[k] = settings[k];
    }
  }
  // Use a stable key string so remounts happen only when values actually change.
  const key = Object.values(initial).join("|");

  return (
    <PageShell className="space-y-5">
      <PageHeader
        title="Settings"
        subtitle="Platform-wide configuration for commission, fees, and support."
      />
      {q.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl cibo-skeleton" />
          <Skeleton className="h-48 w-full rounded-2xl cibo-skeleton" />
        </div>
      ) : (
        <SettingsForm key={key} initial={initial} raw={settings || {}} />
      )}
    </PageShell>
  );
}

function SettingsForm({
  initial,
  raw,
}: {
  initial: Record<string, string>;
  raw: Record<string, string>;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<Record<string, string>>(initial);
  const [commissionPreset, setCommissionPreset] = useState<string>(
    ["5", "10", "15"].includes(initial.commissionPct) ? initial.commissionPct : "custom"
  );
  const [maintenance, setMaintenance] = useState(initial.maintenanceMode === "true");

  const saveMut = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminApi.setSetting(key, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (e: any) =>
      toast({
        title: "Save failed",
        description: e?.message || "Please try again.",
        variant: "destructive",
      }),
  });

  const update = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const saveOne = (key: string) => {
    saveMut.mutate(
      { key, value: form[key] },
      {
        onSuccess: () =>
          toast({
            title: "Setting saved",
            description: `${key} = ${form[key]}`,
          }),
      }
    );
  };

  const saveAll = () => {
    const entries = Object.entries(form);
    let i = 0;
    const saveNext = () => {
      if (i >= entries.length) {
        toast({
          title: "All settings saved",
          description: "Platform configuration updated.",
        });
        return;
      }
      const [key, value] = entries[i++];
      saveMut.mutate({ key, value }, { onSuccess: saveNext });
    };
    saveNext();
  };

  return (
    <>
      <div className="flex justify-end">
        <Button
          variant="rescue"
          size="sm"
          onClick={saveAll}
          disabled={saveMut.isPending}
        >
          <Save className="size-4" /> Save all
        </Button>
      </div>

      {/* Commission & fees */}
      <Panel
        title="Commission & fees"
        subtitle="Charges applied to every order placed on the platform"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Commission rate */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Percent className="size-3.5 text-gold" /> Commission rate
            </Label>
            <Select
              value={commissionPreset}
              onValueChange={(v) => {
                setCommissionPreset(v);
                if (v !== "custom") update("commissionPct", v);
              }}
            >
              <SelectTrigger className="w-full rounded-xl border-forest/15 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5%</SelectItem>
                <SelectItem value="10">10% (default)</SelectItem>
                <SelectItem value="15">15%</SelectItem>
                <SelectItem value="custom">Custom…</SelectItem>
              </SelectContent>
            </Select>
            {commissionPreset === "custom" && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  value={form.commissionPct}
                  onChange={(e) => update("commissionPct", e.target.value)}
                  className="rounded-xl border-forest/15 bg-card"
                />
                <span className="text-xs font-semibold text-muted-foreground">%</span>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">
              Currently <b className="text-forest">{form.commissionPct}%</b> of order subtotal.
            </p>
          </div>

          {/* Platform flat fee */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <IndianRupee className="size-3.5 text-gold" /> Platform flat fee (per order)
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">₹</span>
              <Input
                type="number"
                min={0}
                step={1}
                value={form.platformFlatFee}
                onChange={(e) => update("platformFlatFee", e.target.value)}
                className="rounded-xl border-forest/15 bg-card"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Flat fee added on top of every order.
            </p>
          </div>

          {/* Default delivery fee */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <IndianRupee className="size-3.5 text-gold" /> Default delivery fee
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">₹</span>
              <Input
                type="number"
                min={0}
                step={1}
                value={form.defaultDeliveryFee}
                onChange={(e) => update("defaultDeliveryFee", e.target.value)}
                className="rounded-xl border-forest/15 bg-card"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Used when provider doesn&apos;t override their own delivery fee.
            </p>
          </div>
        </div>
      </Panel>

      {/* Support contact */}
      <Panel
        title="Support contact"
        subtitle="Shown to customers and providers across the app"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Mail className="size-3.5 text-gold" /> Support email
            </Label>
            <Input
              type="email"
              value={form.supportEmail}
              onChange={(e) => update("supportEmail", e.target.value)}
              className="rounded-xl border-forest/15 bg-card"
              placeholder="support@cibo.app"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Phone className="size-3.5 text-gold" /> Support phone
            </Label>
            <Input
              type="tel"
              value={form.supportPhone}
              onChange={(e) => update("supportPhone", e.target.value)}
              className="rounded-xl border-forest/15 bg-card"
              placeholder="+91 90000 12345"
            />
          </div>
        </div>
      </Panel>

      {/* Maintenance mode */}
      <Panel
        title="Maintenance mode"
        subtitle="Take the platform offline for customers (mock)"
      >
        <div className="flex items-start gap-3">
          <div
            className={`grid size-10 shrink-0 place-items-center rounded-xl ${
              maintenance ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
            }`}
          >
            <Wrench className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-forest">
              {maintenance ? "Platform is in maintenance mode" : "Platform is live"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              When enabled, customers will see a maintenance banner and cannot place
              orders. Providers and admins retain access.
            </p>
          </div>
          <Switch
            checked={maintenance}
            onCheckedChange={(v) => {
              setMaintenance(v);
              update("maintenanceMode", v ? "true" : "false");
            }}
            aria-label="Toggle maintenance mode"
          />
        </div>
        {maintenance && (
          <div className="mt-3 rounded-xl border border-danger/20 bg-danger/5 p-3 text-xs text-danger">
            ⚠️ Maintenance mode is ON. New customer orders are blocked.
          </div>
        )}
      </Panel>

      {/* Raw values preview */}
      <Panel
        title="Current saved values"
        subtitle="The latest values stored on the server"
      >
        <div className="overflow-hidden rounded-xl border border-forest/8">
          <table className="w-full text-xs">
            <thead className="bg-cream/40">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Key
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(raw).map(([k, v]) => (
                <tr key={k} className="border-t border-forest/5">
                  <td className="px-3 py-2 font-mono text-[11px] font-bold text-forest">{k}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{v}</td>
                </tr>
              ))}
              {Object.keys(raw).length === 0 && (
                <tr>
                  <td colSpan={2} className="px-3 py-6 text-center text-muted-foreground">
                    No settings saved yet. Use the forms above to set values.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
