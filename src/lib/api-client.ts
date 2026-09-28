"use client";

import type {
  User,
  FoodListing,
  FoodCategory,
  Order,
  ProviderProfile,
  Favorite,
  NotificationItem,
  Complaint,
  Address,
  Review,
} from "./types";

class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function req<T>(
  url: string,
  opts: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(opts.headers as any) },
    credentials: "include",
    ...opts,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(data?.error || "Request failed", res.status, data?.code);
  }
  return data as T;
}

export const api = {
  get: <T>(u: string) => req<T>(u),
  post: <T>(u: string, body?: unknown) =>
    req<T>(u, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(u: string, body?: unknown) =>
    req<T>(u, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(u: string) => req<T>(u, { method: "DELETE" }),
};

// ---- Auth ----
export const authApi = {
  me: () => api.get<{ user: User | null }>("/api/auth/me"),
  login: (email: string, password: string) =>
    api.post<{ user: User }>("/api/auth/login", { email, password }),
  signup: (data: { name: string; email: string; password: string; phone?: string; role: "CUSTOMER" | "PROVIDER" }) =>
    api.post<{ user: User }>("/api/auth/signup", data),
  logout: () => api.post<{ ok: true }>("/api/auth/logout"),
  providerSignup: (data: Record<string, unknown>) =>
    api.post<{ user: User; providerId: string }>("/api/auth/provider-signup", data),
};

// ---- Categories ----
export const catApi = {
  list: () => api.get<{ categories: FoodCategory[] }>("/api/categories"),
};

// ---- Listings ----
export interface ListingsQuery {
  city?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  q?: string;
  foodType?: string;
  halal?: string;
  category?: string;
  isEvent?: boolean;
  sort?: string;
  maxPrice?: number;
  minDiscount?: number;
  page?: number;
  limit?: number;
  status?: string;
  providerId?: string;
}

export const listingApi = {
  list: (q: ListingsQuery = {}) => {
    const p = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
    });
    return api.get<{ listings: FoodListing[]; total: number }>(`/api/listings?${p.toString()}`);
  },
  get: (id: string, lat?: number, lng?: number) => {
    const p = new URLSearchParams();
    if (lat != null) p.set("lat", String(lat));
    if (lng != null) p.set("lng", String(lng));
    const q = p.toString();
    return api.get<{ listing: FoodListing }>(`/api/listings/${id}${q ? `?${q}` : ""}`);
  },
  create: (data: Record<string, unknown>) => api.post<{ listing: FoodListing }>("/api/provider/listings", data),
  update: (id: string, data: Record<string, unknown>) => api.patch<{ listing: FoodListing }>(`/api/provider/listings/${id}`, data),
  mine: () => api.get<{ listings: FoodListing[] }>("/api/provider/listings"),
  del: (id: string) => api.del<{ ok: true }>(`/api/provider/listings/${id}`),
  safety: (id: string) => api.get<{ report: any }>(`/api/listings/${id}/safety`),
};

// ---- Orders ----
export const orderApi = {
  create: (data: { items: { listingId: string; quantity: number }[]; fulfillmentType: "PICKUP" | "DELIVERY"; paymentMethod: string; addressId?: string; notes?: string }) =>
    api.post<{ order: Order }>("/api/orders", data),
  mine: () => api.get<{ orders: Order[] }>("/api/orders"),
  get: (id: string) => api.get<{ order: Order }>(`/api/orders/${id}`),
  cancel: (id: string, reason: string) => api.patch<{ order: Order }>(`/api/orders/${id}/cancel`, { reason }),
  verifyOtp: (id: string, otp: string) => api.patch<{ order: Order }>(`/api/orders/${id}/verify-otp`, { otp }),
  providerOrders: () => api.get<{ orders: Order[] }>("/api/provider/orders"),
  updateStatus: (id: string, status: string) => api.patch<{ order: Order }>(`/api/provider/orders/${id}/status`, { status }),
  stats: () => api.get<{ stats: { totalOrders: number; completedOrders: number; totalSpent: number; totalSaved: number; mealsRescued: number; co2AvoidedKg: number; avgOrderValue: number; topProviders: any[] } }>("/api/orders/stats"),
};

// ---- Provider ----
export const providerApi = {
  me: () => api.get<{ provider: ProviderProfile; documents: any[] }>("/api/provider/me"),
  update: (data: Record<string, unknown>) => api.patch<{ provider: ProviderProfile }>("/api/provider/me", data),
  analytics: () => api.get<{ analytics: any }>("/api/provider/analytics"),
};

// ---- Favorites ----
export const favApi = {
  list: () => api.get<{ favorites: (Favorite & { listing?: FoodListing })[] }>("/api/favorites"),
  toggle: (listingId: string) => api.post<{ fav: boolean }>("/api/favorites", { listingId }),
};

// ---- Addresses ----
export const addrApi = {
  list: () => api.get<{ addresses: Address[] }>("/api/addresses"),
  create: (data: Partial<Address>) => api.post<{ address: Address }>("/api/addresses", data),
  del: (id: string) => api.del<{ ok: true }>(`/api/addresses/${id}`),
};

// ---- Notifications ----
export const notifApi = {
  list: () => api.get<{ notifications: NotificationItem[] }>("/api/notifications"),
  markAllRead: () => api.post<{ ok: true }>("/api/notifications/read"),
};

// ---- Complaints ----
export const complaintApi = {
  create: (data: { orderId?: string; providerId?: string; listingId?: string; type: string; description: string }) =>
    api.post<{ complaint: Complaint }>("/api/complaints", data),
  mine: () => api.get<{ complaints: Complaint[] }>("/api/complaints"),
};

// ---- Reviews ----
export const reviewApi = {
  create: (data: { orderId: string; rating: number; comment?: string }) =>
    api.post<{ review: Review }>("/api/reviews", data),
  list: (providerId: string, limit = 10) =>
    api.get<{ reviews: any[]; summary: { average: number; count: number; distribution: Record<number, number> } }>(
      `/api/reviews?providerId=${providerId}&limit=${limit}`
    ),
};

// ---- Admin ----
export const adminApi = {
  overview: () => api.get<{ overview: any }>("/api/admin/overview"),
  users: () => api.get<{ users: (User & { provider?: ProviderProfile })[] }>("/api/admin/users"),
  providers: () => api.get<{ providers: (ProviderProfile & { user: User })[] }>("/api/admin/providers"),
  listings: () => api.get<{ listings: (FoodListing & { provider: ProviderProfile })[] }>("/api/admin/listings"),
  orders: () => api.get<{ orders: (Order & { customer: User; provider: ProviderProfile })[] }>("/api/admin/orders"),
  complaints: () => api.get<{ complaints: any[] }>("/api/admin/complaints"),
  verifyProvider: (id: string, status: string) => api.patch<{ provider: ProviderProfile }>(`/api/admin/providers/${id}/verify`, { status }),
  suspendUser: (id: string, suspended: boolean) => api.patch<{ user: User }>(`/api/admin/users/${id}/suspend`, { suspended }),
  takedownListing: (id: string) => api.patch<{ listing: FoodListing }>(`/api/admin/listings/${id}/takedown`),
  resolveComplaint: (id: string, status: string, resolution: string) =>
    api.patch<{ complaint: any }>(`/api/admin/complaints/${id}`, { status, resolution }),
  settings: () => api.get<{ settings: Record<string, string> }>("/api/admin/settings"),
  setSetting: (key: string, value: string) => api.post<{ ok: true }>("/api/admin/settings", { key, value }),
};

export { ApiError };
