"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { useAuth } from "@/components/providers";
import { authApi } from "@/lib/api-client";
import { CiboLogo } from "./logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Mail, Phone, User as UserIcon, Store, ShieldCheck, Leaf } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AuthView } from "@/lib/store";

const CITIES = ["Tirunelveli", "Nagercoil", "Madurai", "Chennai"];
const COORDS: Record<string, [number, number]> = {
  Tirunelveli: [8.7139, 77.7567],
  Nagercoil: [8.168, 77.4324],
  Madurai: [9.9252, 78.1198],
  Chennai: [13.0827, 80.2707],
};

export function AuthSurface() {
  const view = useApp((s) => s.authView);
  const setAuthView = useApp((s) => s.setAuthView);
  const go = useApp((s) => s.go);
  const setCustomer = useApp((s) => s.setCustomer);
  const setProvider = useApp((s) => s.setProvider);
  const setAdmin = useApp((s) => s.setAdmin);
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(false);

  const afterAuth = (role: string) => {
    refresh();
    if (role === "ADMIN" || role === "SUPPORT") setAdmin("overview");
    else if (role === "PROVIDER") setProvider("dashboard");
    else setCustomer("home");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-forest p-10 text-ivory lg:flex">
        <div className="absolute inset-0 cibo-grain opacity-30" />
        <div className="absolute -right-20 top-20 size-72 rounded-full bg-orange/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 size-72 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative">
          <button onClick={() => go("landing")} className="flex items-center gap-2 text-ivory/80 hover:text-ivory">
            <ArrowLeft className="size-4" /> Back to home
          </button>
        </div>
        <div className="relative">
          <CiboLogo size={64} showWordmark={false} />
          <h2 className="mt-6 font-display text-4xl font-extrabold leading-tight">
            Good food.
            <br />
            Brighter tomorrow.
          </h2>
          <p className="mt-4 max-w-sm text-ivory/70">
            Join India's hyperlocal food rescue community. Rescue good food at honest prices, or
            turn your surplus into value.
          </p>
          <div className="mt-8 space-y-3">
            {[
              { icon: ShieldCheck, t: "Verified providers & food safety declarations" },
              { icon: Leaf, t: "Real-time rescue with auto-expiry" },
              { icon: Store, t: "Built for caterers, restaurants & events" },
            ].map((f) => (
              <div key={f.t} className="flex items-center gap-3 text-sm text-ivory/90">
                <span className="grid size-8 place-items-center rounded-lg bg-ivory/10">
                  <f.icon className="size-4 text-gold" />
                </span>
                {f.t}
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-ivory/50">© {new Date().getFullYear()} CIBO · Rescue · Share · Reduce</div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center bg-background px-4 py-8 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <button onClick={() => go("landing")} className="flex items-center gap-2 text-sm text-forest/70">
              <ArrowLeft className="size-4" /> Home
            </button>
            <CiboLogo size={32} showWordmark={false} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {view === "login" && <LoginView loading={loading} setLoading={setLoading} onSuccess={afterAuth} switchView={setAuthView} />}
              {view === "signup" && <SignupView loading={loading} setLoading={setLoading} onSuccess={afterAuth} switchView={setAuthView} />}
              {view === "providerSignup" && <ProviderSignupView loading={loading} setLoading={setLoading} onSuccess={afterAuth} switchView={setAuthView} />}
              {view === "forgot" && <ForgotView switchView={setAuthView} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function DemoCreds() {
  return (
    <div className="mt-5 rounded-2xl border border-gold/30 bg-cream/60 p-3 text-xs">
      <p className="font-bold text-forest">Demo accounts</p>
      <div className="mt-1.5 grid gap-1 text-forest/70">
        <span>👤 Customer — aarav@cibo.app / customer123</span>
        <span>🏪 Provider — anbu@cibo.app / provider123</span>
        <span>🛡️ Admin — admin@cibo.app / admin123</span>
      </div>
    </div>
  );
}

function LoginView({
  loading,
  setLoading,
  onSuccess,
  switchView,
}: {
  loading: boolean;
  setLoading: (v: boolean) => void;
  onSuccess: (role: string) => void;
  switchView: (v: AuthView) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await authApi.login(email.trim(), password);
      toast.success(`Welcome back, ${r.user.name.split(" ")[0]}!`);
      onSuccess(r.user.role);
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold text-forest">Welcome back</h1>
      <p className="mt-1.5 text-sm text-forest/70">Log in to continue rescuing good food.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Email" icon={<Mail className="size-4" />}>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="h-12 rounded-xl border-forest/15 bg-card pl-10"
          />
        </Field>
        <Field label="Password" icon={<ShieldCheck className="size-4" />} >
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12 rounded-xl border-forest/15 bg-card pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-forest/50 hover:text-forest"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-forest/70">
            <input type="checkbox" className="accent-orange" /> Remember me
          </label>
          <button type="button" onClick={() => switchView("forgot")} className="font-semibold text-orange hover:underline">
            Forgot password?
          </button>
        </div>
        <Button type="submit" variant="rescue" size="lg" className="w-full" disabled={loading}>
          {loading ? "Logging in…" : "Log in"} <ArrowRight className="size-4" />
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-forest/70">
        New to CIBO?{" "}
        <button onClick={() => switchView("signup")} className="font-bold text-orange hover:underline">
          Create an account
        </button>
      </p>
      <DemoCreds />
    </div>
  );
}

function SignupView({
  loading,
  setLoading,
  onSuccess,
  switchView,
}: {
  loading: boolean;
  setLoading: (v: boolean) => void;
  onSuccess: (role: string) => void;
  switchView: (v: AuthView) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const r = await authApi.signup({ name, email: email.trim(), password, phone: phone || undefined, role: "CUSTOMER" });
      toast.success(`Welcome to CIBO, ${r.user.name.split(" ")[0]}!`);
      onSuccess(r.user.role);
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold text-forest">Create your account</h1>
      <p className="mt-1.5 text-sm text-forest/70">Start rescuing good food near you.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Full name" icon={<UserIcon className="size-4" />}>
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-12 rounded-xl border-forest/15 bg-card pl-10" />
        </Field>
        <Field label="Email" icon={<Mail className="size-4" />}>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="h-12 rounded-xl border-forest/15 bg-card pl-10" />
        </Field>
        <Field label="Phone (optional)" icon={<Phone className="size-4" />}>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="90000 00000" className="h-12 rounded-xl border-forest/15 bg-card pl-10" />
        </Field>
        <Field label="Password" icon={<ShieldCheck className="size-4" />}>
          <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="h-12 rounded-xl border-forest/15 bg-card pl-10" />
        </Field>
        <Button type="submit" variant="rescue" size="lg" className="w-full" disabled={loading}>
          {loading ? "Creating…" : "Create account"} <ArrowRight className="size-4" />
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-forest/70">
        Are you a food business?{" "}
        <button onClick={() => switchView("providerSignup")} className="font-bold text-orange hover:underline">
          Become a partner
        </button>
      </p>
      <p className="mt-2 text-center text-sm text-forest/70">
        Already have an account?{" "}
        <button onClick={() => switchView("login")} className="font-bold text-orange hover:underline">
          Log in
        </button>
      </p>
    </div>
  );
}

function ProviderSignupView({
  loading,
  setLoading,
  onSuccess,
  switchView,
}: {
  loading: boolean;
  setLoading: (v: boolean) => void;
  onSuccess: (role: string) => void;
  switchView: (v: AuthView) => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    businessName: "",
    ownerName: "",
    businessType: "RESTAURANT",
    addressLine: "",
    city: "Tirunelveli",
    state: "Tamil Nadu",
    pincode: "",
    licenseNumber: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const [lat, lng] = COORDS[form.city] || COORDS.Tirunelveli;
      const r = await authApi.providerSignup({ ...form, latitude: lat, longitude: lng });
      toast.success("Partner account created! Verification pending.");
      onSuccess(r.user.role);
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const businessTypes = [
    ["WEDDING_CATERER", "Wedding Caterer"],
    ["RESTAURANT", "Restaurant"],
    ["BAKERY", "Bakery"],
    ["HOTEL", "Hotel"],
    ["CLOUD_KITCHEN", "Cloud Kitchen"],
    ["CANTEEN", "Canteen"],
    ["EVENT_ORGANIZER", "Event Organizer"],
    ["OTHER", "Other"],
  ];

  return (
    <div>
      <button onClick={() => switchView("signup")} className="mb-3 flex items-center gap-1.5 text-sm text-forest/70 hover:text-forest">
        <ArrowLeft className="size-4" /> Back
      </button>
      <h1 className="font-display text-3xl font-extrabold text-forest">Become a CIBO Partner</h1>
      <p className="mt-1.5 text-sm text-forest/70">Turn your surplus food into value. Verification required to publish.</p>

      {/* steps */}
      <div className="mt-5 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div className={cn("grid size-7 place-items-center rounded-full text-xs font-bold", s <= step ? "bg-orange text-white" : "bg-muted text-muted-foreground")}>{s}</div>
            <div className={cn("h-1 flex-1 rounded-full", s < step ? "bg-orange" : "bg-muted")} />
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {step === 1 && (
          <>
            <Field label="Business name" icon={<Store className="size-4" />}>
              <Input required value={form.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="Anbu Caterers" className="h-12 rounded-xl border-forest/15 bg-card pl-10" />
            </Field>
            <Field label="Owner name" icon={<UserIcon className="size-4" />}>
              <Input required value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} placeholder="Owner full name" className="h-12 rounded-xl border-forest/15 bg-card pl-10" />
            </Field>
            <div>
              <Label className="text-forest">Business type</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {businessTypes.map(([v, l]) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => set("businessType", v)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition",
                      form.businessType === v ? "border-orange bg-orange/10 text-orange" : "border-forest/15 bg-card text-forest/70 hover:border-gold"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <Button type="button" variant="default" size="lg" className="w-full" onClick={() => setStep(2)}>
              Continue <ArrowRight className="size-4" />
            </Button>
          </>
        )}
        {step === 2 && (
          <>
            <Field label="Address line" icon={<Store className="size-4" />}>
              <Input required value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} placeholder="Street, landmark" className="h-12 rounded-xl border-forest/15 bg-card pl-10" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-forest">City</Label>
                <select value={form.city} onChange={(e) => set("city", e.target.value)} className="mt-1.5 h-12 w-full rounded-xl border border-forest/15 bg-card px-3 text-sm font-medium">
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-forest">Pincode</Label>
                <Input required value={form.pincode} onChange={(e) => set("pincode", e.target.value)} placeholder="627001" className="mt-1.5 h-12 rounded-xl border-forest/15 bg-card" />
              </div>
            </div>
            <Field label="Food licence number (FSSAI)" icon={<ShieldCheck className="size-4" />}>
              <Input value={form.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} placeholder="FSSAI-XXXXXXXXXXXXXX" className="h-12 rounded-xl border-forest/15 bg-card pl-10" />
            </Field>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button type="button" variant="default" size="lg" className="flex-1" onClick={() => setStep(3)}>Continue <ArrowRight className="size-4" /></Button>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <Field label="Your name" icon={<UserIcon className="size-4" />}>
              <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Contact person" className="h-12 rounded-xl border-forest/15 bg-card pl-10" />
            </Field>
            <Field label="Email" icon={<Mail className="size-4" />}>
              <Input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="business@email.com" className="h-12 rounded-xl border-forest/15 bg-card pl-10" />
            </Field>
            <Field label="Phone" icon={<Phone className="size-4" />}>
              <Input required value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="90000 00000" className="h-12 rounded-xl border-forest/15 bg-card pl-10" />
            </Field>
            <Field label="Password" icon={<ShieldCheck className="size-4" />}>
              <Input type="password" required value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Min 6 characters" className="h-12 rounded-xl border-forest/15 bg-card pl-10" />
            </Field>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(2)}>Back</Button>
              <Button type="submit" variant="rescue" size="lg" className="flex-1" disabled={loading}>
                {loading ? "Creating…" : "Submit"} <ArrowRight className="size-4" />
              </Button>
            </div>
            <p className="text-center text-xs text-forest/60">
              Your account will be created with verification status <span className="font-bold text-orange">PENDING</span>. You'll be able to publish listings once an admin verifies your business.
            </p>
          </>
        )}
      </form>
    </div>
  );
}

function ForgotView({ switchView }: { switchView: (v: AuthView) => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div>
      <button onClick={() => switchView("login")} className="mb-3 flex items-center gap-1.5 text-sm text-forest/70 hover:text-forest">
        <ArrowLeft className="size-4" /> Back to login
      </button>
      <h1 className="font-display text-3xl font-extrabold text-forest">Reset password</h1>
      <p className="mt-1.5 text-sm text-forest/70">Enter your email and we'll send a reset link.</p>
      {sent ? (
        <div className="mt-6 rounded-2xl border border-success/30 bg-success/10 p-5 text-sm text-success">
          If an account exists for {email}, a reset link has been sent.
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="mt-6 space-y-4">
          <Field label="Email" icon={<Mail className="size-4" />}>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="h-12 rounded-xl border-forest/15 bg-card pl-10" />
          </Field>
          <Button type="submit" variant="rescue" size="lg" className="w-full">Send reset link <ArrowRight className="size-4" /></Button>
        </form>
      )}
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-forest">{label}</Label>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-forest/40">{icon}</span>
        {children}
      </div>
    </div>
  );
}
