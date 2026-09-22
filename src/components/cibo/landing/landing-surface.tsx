"use client";

import { useApp, useCart } from "@/lib/store";
import { useAuth } from "@/components/providers";
import { CiboLogo, CiboMark } from "../logo";
import { Button } from "@/components/ui/button";
import {
  Search,
  MapPin,
  ArrowRight,
  Leaf,
  ShieldCheck,
  Clock,
  Users,
  Store,
  Heart,
  ShoppingBag,
  Sparkles,
  Utensils,
  Truck,
  Star,
  ChevronRight,
  Menu,
  X,
  Quote,
} from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const CITIES = ["Tirunelveli", "Nagercoil", "Madurai", "Chennai"];

export function LandingSurface() {
  const go = useApp((s) => s.go);
  const setCustomer = useApp((s) => s.setCustomer);
  const setAuthView = useApp((s) => s.setAuthView);
  const setLocation = useApp((s) => s.setLocation);
  const city = useApp((s) => s.city);
  const { user } = useAuth();
  const [mobileNav, setMobileNav] = useState(false);

  const enterApp = () => {
    if (user) {
      if (user.role === "ADMIN" || user.role === "SUPPORT") go("admin");
      else if (user.role === "PROVIDER") go("provider");
      else setCustomer("home");
    } else {
      setCustomer("home");
    }
  };

  return (
    <div className="flex flex-col">
      <LandingNav onEnter={enterApp} onAuth={() => setAuthView("login")} mobileNav={mobileNav} setMobileNav={setMobileNav} city={city} setLocation={setLocation} />
      <LandingHero onFind={enterApp} onPartner={() => setAuthView("providerSignup")} city={city} />
      <Marquee />
      <HowItWorks />
      <WhyCibo />
      <FoodRescuePreview onExplore={enterApp} />
      <ForCustomers onFind={enterApp} />
      <ForPartners onPartner={() => setAuthView("providerSignup")} />
      <EventRescue onExplore={enterApp} />
      <FoodSafety />
      <Impact />
      <Testimonials />
      <FAQ />
      <CTA onFind={enterApp} onPartner={() => setAuthView("providerSignup")} />
      <LandingFooter onAuth={() => setAuthView("login")} />
    </div>
  );
}

// ---------------- Nav ----------------
function LandingNav({
  onEnter,
  onAuth,
  mobileNav,
  setMobileNav,
  city,
  setLocation,
}: {
  onEnter: () => void;
  onAuth: () => void;
  mobileNav: boolean;
  setMobileNav: (v: boolean) => void;
  city: string;
  setLocation: (c: string, lat: number, lng: number) => void;
}) {
  const links = [
    { label: "How it works", href: "#how" },
    { label: "For Partners", href: "#partners" },
    { label: "Event Rescue", href: "#events" },
    { label: "Food Safety", href: "#safety" },
    { label: "Impact", href: "#impact" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-forest/8 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button onClick={onEnter} className="flex items-center gap-2.5">
          <CiboLogo size={36} />
        </button>
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-forest/80 transition hover:bg-cream hover:text-forest"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LocationPill city={city} setLocation={setLocation} />
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={onEnter}>
            Find Food
          </Button>
          <Button variant="rescue" size="sm" onClick={onAuth}>
            Log in
          </Button>
          <button
            className="grid size-10 place-items-center rounded-xl text-forest lg:hidden"
            onClick={() => setMobileNav(!mobileNav)}
            aria-label="Menu"
          >
            {mobileNav ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {mobileNav && (
        <div className="border-t border-forest/8 bg-card px-4 py-3 lg:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileNav(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-forest/80 hover:bg-cream"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

function LocationPill({
  city,
  setLocation,
}: {
  city: string;
  setLocation: (c: string, lat: number, lng: number) => void;
}) {
  const coords: Record<string, [number, number]> = {
    Tirunelveli: [8.7139, 77.7567],
    Nagercoil: [8.168, 77.4324],
    Madurai: [9.9252, 78.1198],
    Chennai: [13.0827, 80.2707],
  };
  return (
    <div className="hidden items-center gap-1.5 rounded-full border border-forest/10 bg-card px-3 py-1.5 text-xs font-semibold text-forest md:flex">
      <MapPin className="size-3.5 text-orange" />
      <select
        value={city}
        onChange={(e) =>
          setLocation(e.target.value, coords[e.target.value][0], coords[e.target.value][1])
        }
        className="bg-transparent font-semibold outline-none cursor-pointer"
      >
        {CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------- Hero ----------------
function LandingHero({ onFind, onPartner, city }: { onFind: () => void; onPartner: () => void; city: string }) {
  // Mouse parallax for the mascot
  const sectionRef = useRef<HTMLElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 18 });
  const sy = useSpring(my, { stiffness: 120, damping: 18 });
  const mascotX = useTransform(sx, [-0.5, 0.5], [-12, 12]);
  const mascotY = useTransform(sy, [-0.5, 0.5], [-12, 12]);
  const card1X = useTransform(sx, [-0.5, 0.5], [-20, 20]);
  const card1Y = useTransform(sy, [-0.5, 0.5], [-16, 16]);
  const card2X = useTransform(sx, [-0.5, 0.5], [18, -18]);
  const card2Y = useTransform(sy, [-0.5, 0.5], [14, -14]);

  const onMouseMove = (e: React.MouseEvent) => {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <section ref={sectionRef} onMouseMove={onMouseMove} className="relative overflow-hidden">
      <div className="absolute inset-0 cibo-hero-glow" />
      <div className="absolute inset-0 cibo-grain opacity-60" />
      {/* Decorative floating food emojis */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute left-[8%] top-[20%] text-3xl opacity-20 animate-float" style={{ animationDelay: "0s" }}>🍽️</span>
        <span className="absolute right-[12%] top-[15%] text-2xl opacity-20 animate-float" style={{ animationDelay: "1s" }}>🥘</span>
        <span className="absolute left-[15%] bottom-[15%] text-2xl opacity-15 animate-float" style={{ animationDelay: "2s" }}>🍛</span>
        <span className="absolute right-[8%] bottom-[20%] text-3xl opacity-20 animate-float" style={{ animationDelay: "1.5s" }}>🥗</span>
      </div>
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-cream px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-orange">
              <Sparkles className="size-3.5" /> Hyperlocal Food Rescue
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] text-forest sm:text-5xl lg:text-6xl">
              Good food deserves
              <br />
              <span className="relative inline-block">
                another chance.
                <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 200 10" preserveAspectRatio="none">
                  <path d="M2 7 Q 50 1 100 5 T 198 4" stroke="#E48F24" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-forest/70 sm:text-lg">
              Discover safe surplus meals from nearby events, restaurants and food businesses —
              at prices that make sense. Available near <span className="font-semibold text-forest">{city}</span>.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button variant="rescue" size="xl" onClick={onFind} className="group">
                Find Food
                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" size="xl" onClick={onPartner}>
                Become a Food Partner
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-forest/60">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-success" /> Verified providers</span>
              <span className="inline-flex items-center gap-1.5"><Leaf className="size-4 text-success" /> Food safety checked</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="size-4 text-orange" /> Real-time rescue</span>
            </div>
          </motion.div>
        </div>

        {/* Hero visual: mascot + floating cards with parallax */}
        <div className="relative flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ x: mascotX, y: mascotY }}
            className="relative"
          >
            <div className="absolute inset-0 -z-10 rounded-full bg-gold/30 blur-3xl" />
            <img
              src="/cibo-logo.svg"
              alt="CIBO mascot"
              className="animate-float w-64 rounded-[2.5rem] sm:w-80"
            />
            {/* Floating price card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              style={{ x: card1X, y: card1Y }}
              className="absolute -left-6 top-10 hidden rounded-2xl border border-forest/8 bg-card p-3 cibo-shadow sm:block"
            >
              <div className="flex items-center gap-2">
                <div className="grid size-9 place-items-center rounded-xl bg-orange/15">
                  <Utensils className="size-4 text-orange" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Chicken Biryani</p>
                  <p className="text-sm font-bold text-forest">₹60 <span className="text-[10px] font-normal text-muted-foreground line-through">₹150</span></p>
                </div>
              </div>
            </motion.div>
            {/* Floating rescue card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
              style={{ x: card2X, y: card2Y }}
              className="absolute -right-4 bottom-8 hidden rounded-2xl border border-forest/8 bg-card p-3 cibo-shadow sm:block"
            >
              <div className="flex items-center gap-2">
                <div className="grid size-9 place-items-center rounded-xl bg-success/15">
                  <Leaf className="size-4 text-success" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Meals rescued</p>
                  <p className="text-sm font-bold text-forest">1,284 this week</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ---------------- Marquee ----------------
function Marquee() {
  const items = [
    "Wedding surplus",
    "Canteen extras",
    "Bakery end-of-day",
    "Corporate event food",
    "Restaurant over-prep",
    "Function leftovers",
    "Cloud kitchen surplus",
    "Birthday party extras",
  ];
  return (
    <div className="border-y border-forest/8 bg-forest py-3 text-ivory overflow-hidden">
      <div className="flex w-max animate-marquee gap-8 px-4">
        {[...items, ...items].map((it, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-sm font-medium tracking-wide">
            <span className="size-1.5 rounded-full bg-gold" /> {it}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------- How it works ----------------
function HowItWorks() {
  const steps = [
    { n: "01", title: "Discover", desc: "Find safe surplus food listed near you in real time.", icon: Search },
    { n: "02", title: "Reserve", desc: "Choose quantity, pay securely and lock your rescue.", icon: ShoppingBag },
    { n: "03", title: "Rescue", desc: "Pickup or receive the food before the deadline.", icon: Heart },
  ];
  return (
    <section id="how" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <SectionHeading
        eyebrow="How CIBO works"
        title="Rescue good food in three simple steps"
        subtitle="No waste. No drama. Just good food finding people who'll enjoy it."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group relative overflow-hidden rounded-3xl border border-forest/8 bg-card p-7 cibo-shadow transition hover:-translate-y-1 hover:cibo-shadow-lg"
          >
            <div className="absolute -right-4 -top-4 font-display text-7xl font-extrabold text-cream">
              {s.n}
            </div>
            <div className="relative">
              <div className="grid size-12 place-items-center rounded-2xl bg-orange/15 text-orange">
                <s.icon className="size-6" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-forest">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-forest/70">{s.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="absolute -right-2 top-1/2 hidden size-6 -translate-y-1/2 text-gold md:block" />
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ---------------- Why CIBO ----------------
function WhyCibo() {
  const points = [
    { icon: Leaf, title: "Reduce food waste", desc: "Every rescued meal is a meal kept out of landfill.", color: "bg-success/15 text-success" },
    { icon: ShieldCheck, title: "Verified & safe", desc: "Only registered food businesses can list. Safety declarations required.", color: "bg-orange/15 text-orange" },
    { icon: Sparkles, title: "Real-time rescue", desc: "Listings expire automatically when the pickup window closes.", color: "bg-gold/15 text-gold" },
    { icon: Heart, title: "Fair prices", desc: "Reference prices shown honestly. You see the real discount.", color: "bg-olive/15 text-olive" },
  ];
  return (
    <section className="bg-cream/50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why CIBO"
          title="Built for trust, designed for rescue"
          subtitle="CIBO is not another delivery app. It's a new category — hyperlocal food rescue."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-3xl border border-forest/8 bg-card p-6 cibo-shadow"
            >
              <div className={cn("grid size-12 place-items-center rounded-2xl", p.color)}>
                <p.icon className="size-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-forest">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-forest/70">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- Food rescue preview ----------------
function FoodRescuePreview({ onExplore }: { onExplore: () => void }) {
  const samples = [
    { name: "Chicken Biryani", prov: "Anbu Caterers", price: 60, orig: 180, qty: "32 left", dist: "1.2 km", img: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d876eaa5ca98.jpg" },
    { name: "Veg Meals", prov: "Royal Feast", price: 49, orig: 130, qty: "40 left", dist: "1.8 km", img: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/e334e0e385e7.jpg" },
    { name: "Bakery Combo", prov: "Crust & Co", price: 99, orig: 240, qty: "9 left", dist: "0.8 km", img: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/7e886c530ee7.jpg" },
  ];
  return (
    <section id="rescue" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Live near you"
          title="Food rescue happening right now"
          subtitle="A glimpse of surplus meals available nearby."
          align="left"
        />
        <Button variant="outline" onClick={onExplore} className="group">
          Explore all <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </Button>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {samples.map((s, i) => {
          const pct = Math.round(((s.orig - s.price) / s.orig) * 100);
          return (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group cursor-pointer overflow-hidden rounded-3xl border border-forest/8 bg-card cibo-shadow transition hover:-translate-y-1 hover:cibo-shadow-lg"
              onClick={onExplore}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={s.img} alt={s.name} className="size-full object-cover transition group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/55 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-orange px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                  Food Rescue
                </span>
                <span className="absolute bottom-3 left-3 rounded-full bg-forest px-2 py-0.5 text-[11px] font-extrabold text-gold">
                  {pct}% OFF
                </span>
              </div>
              <div className="p-4">
                <p className="text-[11px] font-medium text-muted-foreground">{s.prov}</p>
                <h3 className="font-display text-base font-bold text-forest">{s.name}</h3>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="size-3 text-gold" /> {s.dist}</span>
                  <span>{s.qty}</span>
                </div>
                <div className="mt-3 flex items-end justify-between border-t border-forest/8 pt-3">
                  <div>
                    <span className="font-display text-xl font-extrabold text-forest">₹{s.price}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground line-through">₹{s.orig}</span>
                  </div>
                  <Button size="sm" variant="rescue">Rescue</Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------- For customers ----------------
function ForCustomers({ onFind }: { onFind: () => void }) {
  const feats = [
    "Search by food, category, distance or dietary preference",
    "Filter to show only Halal verified food",
    "See real preparation, packing & pickup times",
    "Pay via UPI, card, net banking or wallet",
    "Track your rescue with pickup OTP",
    "Save your favourite providers and meals",
  ];
  return (
    <section className="bg-forest py-16 text-ivory lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-forest-deep/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gold">
            <Users className="size-3.5" /> For Customers
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
            Eat well. Pay less. Rescue food.
          </h2>
          <p className="mt-3 max-w-md text-ivory/70">
            Students, families, workers — anyone nearby can discover safe surplus meals at honest,
            discounted prices.
          </p>
          <ul className="mt-6 space-y-3">
            {feats.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-ivory/90">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gold/20 text-gold">
                  <Leaf className="size-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <Button variant="gold" size="lg" className="mt-7" onClick={onFind}>
            Start rescuing <ArrowRight className="size-4" />
          </Button>
        </div>
        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl bg-forest-deep/40 p-5 backdrop-blur">
              <span className="font-display text-3xl font-extrabold text-gold">60%</span>
              <p className="mt-1 text-xs text-ivory/70">average discount on rescued meals</p>
            </div>
            <div className="mt-8 rounded-3xl bg-forest-deep/40 p-5 backdrop-blur">
              <span className="font-display text-3xl font-extrabold text-gold">1.2 km</span>
              <p className="mt-1 text-xs text-ivory/70">median pickup distance</p>
            </div>
            <div className="rounded-3xl bg-forest-deep/40 p-5 backdrop-blur">
              <span className="font-display text-3xl font-extrabold text-gold">OTP</span>
              <p className="mt-1 text-xs text-ivory/70">verified pickup, every time</p>
            </div>
            <div className="mt-8 rounded-3xl bg-forest-deep/40 p-5 backdrop-blur">
              <span className="font-display text-3xl font-extrabold text-gold">4.6★</span>
              <p className="mt-1 text-xs text-ivory/70">average provider rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------- For partners ----------------
function ForPartners({ onPartner }: { onPartner: () => void }) {
  const benefits = [
    { icon: Store, title: "Earn extra revenue", desc: "Monetise surplus food that would otherwise go to waste." },
    { icon: Leaf, title: "Reduce waste", desc: "Track and shrink your food waste, sustainability made visible." },
    { icon: Users, title: "Reach new customers", desc: "Get discovered by hungry people nearby." },
    { icon: Sparkles, title: "Build your record", desc: "Meals rescued, waste avoided, ratings — all tracked." },
  ];
  return (
    <section id="partners" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="overflow-hidden rounded-[2rem] border border-forest/10 bg-gradient-to-br from-cream to-ivory p-8 lg:p-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-orange/40 bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-orange">
              <Store className="size-3.5" /> For Food Partners
            </span>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-forest sm:text-4xl">
              Turn surplus into value.
            </h2>
            <p className="mt-3 max-w-md text-forest/70">
              Wedding caterers, restaurants, bakeries, hotels, cloud kitchens, canteens and event
              organisers — list your safe surplus food and let the community rescue it.
            </p>
            <Button variant="rescue" size="lg" className="mt-7" onClick={onPartner}>
              Become a CIBO Partner <ArrowRight className="size-4" />
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-2xl border border-forest/8 bg-card p-5">
                <div className="grid size-10 place-items-center rounded-xl bg-orange/15 text-orange">
                  <b.icon className="size-5" />
                </div>
                <h3 className="mt-3 font-display text-sm font-bold text-forest">{b.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-forest/70">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------- Event rescue ----------------
function EventRescue({ onExplore }: { onExplore: () => void }) {
  const events = [
    { type: "Wedding", emoji: "💍", desc: "Reception surplus, packed fresh" },
    { type: "Birthday", emoji: "🎂", desc: "Party snack boxes & cake extras" },
    { type: "College Event", emoji: "🎓", desc: "Canteen & fest over-prep" },
    { type: "Corporate", emoji: "🏢", desc: "Event dinner & meeting surplus" },
    { type: "Function", emoji: "🎉", desc: "Family function catering extras" },
    { type: "Catering", emoji: "🍲", desc: "Bulk order cancellations" },
  ];
  const flow = ["Prepare", "Surplus", "Pack", "List", "Rescue"];
  return (
    <section id="events" className="bg-cream/50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Event Rescue"
          title="Big event. Extra food. Someone nearby is hungry."
          subtitle="CIBO's flagship feature — rescue surplus food from events before it becomes waste."
        />
        {/* flow */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {flow.map((f, i) => (
            <div key={f} className="flex items-center gap-2 sm:gap-3">
              <div className="rounded-2xl border border-forest/10 bg-card px-4 py-2.5 text-sm font-bold text-forest cibo-shadow">
                {f}
              </div>
              {i < flow.length - 1 && <ArrowRight className="size-4 text-gold" />}
            </div>
          ))}
        </div>
        {/* event types */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e, i) => (
            <motion.div
              key={e.type}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="group flex items-center gap-4 rounded-3xl border border-forest/8 bg-card p-5 cibo-shadow transition hover:-translate-y-0.5 hover:cibo-shadow-lg"
            >
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-cream text-3xl">
                {e.emoji}
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-forest">{e.type}</h3>
                <p className="text-xs text-forest/70">{e.desc}</p>
              </div>
              <ChevronRight className="ml-auto size-4 text-gold opacity-0 transition group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button variant="default" size="lg" onClick={onExplore}>
            Browse event rescues <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

// ---------------- Food safety ----------------
function FoodSafety() {
  const points = [
    { icon: ShieldCheck, title: "Verified providers only", desc: "Business registration & food licence required to publish." },
    { icon: Clock, title: "Auto expiry", desc: "Listings expire the moment the pickup window closes. No expired food is purchasable." },
    { icon: Leaf, title: "Safety declarations", desc: "Preparation, packing, storage, allergens and handling — disclosed on every listing." },
    { icon: Sparkles, title: "Halal transparency", desc: "Verified, declared or not specified — clearly labelled, never fabricated." },
  ];
  return (
    <section id="safety" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-success">
            <ShieldCheck className="size-3.5" /> Food Safety
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-forest sm:text-4xl">
            Safety is not a disclaimer. It's the product.
          </h2>
          <p className="mt-3 max-w-md text-forest/70">
            Every CIBO listing carries a structured food safety section. We don't hide behind small
            print.
          </p>
          <div className="mt-8 space-y-4">
            {points.map((p) => (
              <div key={p.title} className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
                  <p.icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-forest">{p.title}</h3>
                  <p className="text-sm text-forest/70">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="rounded-3xl border border-forest/10 bg-card p-6 cibo-shadow-lg">
            <div className="flex items-center gap-2 border-b border-forest/8 pb-4">
              <ShieldCheck className="size-5 text-success" />
              <h3 className="font-display text-base font-bold text-forest">Food Safety Information</h3>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Preparation", "Freshly prepared, same day"],
                ["Packing time", "10–15 minutes"],
                ["Storage", "Hot held above 65°C"],
                ["Packaging", "Sealed food-grade container"],
                ["Allergens", "Dairy, Gluten"],
                ["Halal status", "Verified"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-semibold text-forest">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2.5 text-xs font-semibold text-success">
              <ShieldCheck className="size-4" /> Provider has signed the food safety declaration
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------- Impact ----------------
function Impact() {
  const stats = [
    { value: "12,480", label: "Meals rescued", icon: Heart },
    { value: "186", label: "Food providers", icon: Store },
    { value: "4", label: "Active cities", icon: MapPin },
    { value: "₹6.2L", label: "Customer savings", icon: Sparkles },
    { value: "2,140 kg", label: "Food waste avoided", icon: Leaf },
    { value: "4.6★", label: "Avg provider rating", icon: Star },
  ];
  return (
    <section id="impact" className="bg-forest py-16 text-ivory lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-forest-deep/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gold">
            <Sparkles className="size-3.5" /> Impact
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
            Every rescue adds up.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-ivory/70 text-sm">
            Demo figures shown for illustration. Real numbers grow with every meal you rescue.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-3xl border border-ivory/10 bg-forest-deep/40 p-6 backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="font-display text-4xl font-extrabold text-gold">{s.value}</span>
                <s.icon className="size-6 text-ivory/40" />
              </div>
              <p className="mt-2 text-sm text-ivory/70">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- Testimonials ----------------
function Testimonials() {
  const items = [
    { name: "Aarav, Student", text: "I get dinner for ₹40 every evening. The biryani is from real wedding caterers — it's genuinely good food.", role: "Hostel resident, Tirunelveli" },
    { name: "Priya, Caterer", text: "After a 600-plate wedding we used to throw away 40 portions. Now CIBO turns that into revenue and goodwill.", role: "Royal Feast Events" },
    { name: "Mohan, Cloud Kitchen", text: "Cancelled orders used to hurt. Now I list them on CIBO and they're gone in minutes.", role: "Ganga Cloud Kitchen" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <SectionHeading eyebrow="Stories" title="Loved by rescuers & partners" />
      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {items.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="rounded-3xl border border-forest/8 bg-card p-7 cibo-shadow"
          >
            <Quote className="size-8 text-gold/40" />
            <p className="mt-3 text-sm leading-relaxed text-forest/80">"{t.text}"</p>
            <div className="mt-5 flex items-center gap-3 border-t border-forest/8 pt-4">
              <div className="grid size-10 place-items-center rounded-full bg-cream font-bold text-forest">
                {t.name[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-forest">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ---------------- FAQ ----------------
function FAQ() {
  const faqs = [
    { q: "Is the food safe to eat?", a: "Only registered food businesses can list. Every listing carries a food safety section with preparation, packing, storage and allergen info. Listings auto-expire when the pickup window closes." },
    { q: "What does 'Halal Verified' mean?", a: "It means the provider's halal claim has been verified by CIBO admin against their documentation. 'Halal Declared' means the provider states it but it isn't verified. We never fabricate verification." },
    { q: "How is the discount calculated?", a: "Providers enter a reference (original) price and a CIBO price. The discount is shown honestly. CIBO does not manipulate reference prices." },
    { q: "Is delivery available?", a: "CIBO is pickup-first because surplus food is time-sensitive. Some providers also offer delivery — it's shown on each listing." },
    { q: "What happens if a listing expires?", a: "It's automatically marked expired and can no longer be ordered. Customers can't purchase expired food." },
    { q: "How do providers get paid?", a: "Provider earnings = order subtotal minus platform commission (default 10%) minus any fees. Earnings are shown in the provider dashboard." },
  ];
  return (
    <section id="faq" className="bg-cream/50 py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => (
            <details key={i} className="group rounded-2xl border border-forest/8 bg-card p-5 cibo-shadow">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-base font-bold text-forest marker:content-none">
                {f.q}
                <ChevronRight className="size-5 shrink-0 text-gold transition group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-forest/70">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- CTA ----------------
function CTA({ onFind, onPartner }: { onFind: () => void; onPartner: () => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-forest px-6 py-14 text-center text-ivory lg:px-16 lg:py-20">
        <div className="absolute inset-0 cibo-grain opacity-30" />
        <div className="absolute -right-10 -top-10 size-64 rounded-full bg-orange/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 size-64 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative">
          <CiboMark size={64} className="mx-auto" />
          <h2 className="mt-6 font-display text-3xl font-extrabold sm:text-5xl">
            Good food. Brighter tomorrow.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ivory/70">
            Join the rescue movement. Find food near you or turn your surplus into value today.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button variant="rescue" size="xl" onClick={onFind}>
              Find Food <ArrowRight className="size-4" />
            </Button>
            <Button variant="gold" size="xl" onClick={onPartner}>
              Become a Partner
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------- Footer ----------------
function LandingFooter({ onAuth }: { onAuth: () => void }) {
  return (
    <footer className="border-t border-forest/8 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <CiboLogo size={44} />
            <p className="mt-4 max-w-xs text-sm text-forest/70">
              Hyperlocal surplus-food rescue marketplace. Good food deserves another chance.
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-gold">
              Rescue · Share · Reduce
            </p>
          </div>
          <FooterCol title="Platform" links={["How it works", "Event Rescue", "Food Safety", "Impact"]} />
          <FooterCol title="For Partners" links={["Become a Partner", "Provider Dashboard", "Verification", "Analytics"]} />
          <FooterCol title="Company" links={["About", "Careers", "Blog", "Contact"]} />
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-forest/8 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} CIBO. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button onClick={onAuth} className="hover:text-forest">Log in</button>
            <span>Terms</span>
            <span>Privacy</span>
            <span>Food Safety Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="font-display text-sm font-bold text-forest">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l}>
            <span className="cursor-pointer text-sm text-forest/70 transition hover:text-forest">{l}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------- Section heading ----------------
function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn(align === "center" ? "text-center" : "text-left")}>
      <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-cream px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-orange">
        <span className="size-1.5 rounded-full bg-orange" /> {eyebrow}
      </span>
      <h2 className="mt-4 font-display text-3xl font-extrabold text-forest sm:text-4xl">{title}</h2>
      {subtitle && (
        <p className={cn("mt-3 max-w-2xl text-forest/70", align === "center" && "mx-auto")}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
