"use client";

import { Providers, AuthProvider, useAuth } from "@/components/providers";
import { useApp } from "@/lib/store";
import { LandingSurface } from "@/components/cibo/landing/landing-surface";
import { AuthSurface } from "@/components/cibo/auth-surface";
import { CustomerApp } from "@/components/cibo/customer/customer-app";
import { ProviderApp } from "@/components/cibo/provider/provider-app";
import { AdminApp } from "@/components/cibo/admin/admin-app";
import { useEffect } from "react";

function Router() {
  const surface = useApp((s) => s.surface);
  const { user } = useAuth();

  // Guard: provider/admin surfaces require auth + role. If not allowed, fall back.
  useEffect(() => {
    if (surface === "provider" && user && user.role !== "PROVIDER" && user.role !== "ADMIN") {
      useApp.getState().go("landing");
    }
    if (surface === "admin" && user && user.role !== "ADMIN" && user.role !== "SUPPORT") {
      useApp.getState().go("landing");
    }
  }, [surface, user]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {surface === "landing" && <LandingSurface />}
      {surface === "auth" && <AuthSurface />}
      {surface === "customer" && <CustomerApp />}
      {surface === "provider" && <ProviderApp />}
      {surface === "admin" && <AdminApp />}
    </div>
  );
}

export default function Home() {
  return (
    <Providers>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </Providers>
  );
}
