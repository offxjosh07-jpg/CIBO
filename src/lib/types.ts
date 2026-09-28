// Shared CIBO types

export type Role = "CUSTOMER" | "PROVIDER" | "ADMIN" | "SUPPORT";

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  name: string;
  role: Role;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

export type FoodType = "VEG" | "NON_VEG" | "EGG" | "VEGAN" | "JAIN";
export type HalalStatus = "VERIFIED" | "DECLARED" | "UNSPECIFIED";
export type ListingStatus = "DRAFT" | "ACTIVE" | "SOLD_OUT" | "EXPIRED" | "TAKEN_DOWN";
export type Fulfillment = "PICKUP" | "DELIVERY" | "BOTH";
export type VerificationStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED";

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "READY"
  | "PICKED_UP"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "FAILED";

export interface ProviderProfile {
  id: string;
  userId: string;
  businessName: string;
  ownerName: string;
  businessType: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  verificationStatus: VerificationStatus;
  licenseNumber?: string | null;
  rating: number;
  totalRatings: number;
  totalOrders: number;
  totalRevenue: number;
  mealsRescued: number;
  wasteAvoidedKg: number;
  fulfillment: string;
  deliveryFee: number;
  bio?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
}

export interface FoodCategory {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  foodType: string;
  sortOrder: number;
}

export interface FoodListing {
  id: string;
  providerId: string;
  categoryId?: string | null;
  title: string;
  description: string;
  images: string[];
  foodType: FoodType;
  halalStatus: HalalStatus;
  quantity: number;
  initialQuantity: number;
  originalPrice: number;
  ciboPrice: number;
  prepTime?: string | null;
  packingTime?: string | null;
  pickupStart: string;
  pickupDeadline: string;
  addressLine: string;
  city: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  allergens: string[];
  storageInfo?: string | null;
  packagingInfo?: string | null;
  specialInstructions?: string | null;
  isEvent: boolean;
  eventType?: string | null;
  eventName?: string | null;
  fulfillment: Fulfillment;
  deliveryFee: number;
  status: ListingStatus;
  views: number;
  rescues: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  provider?: ProviderProfile;
  category?: FoodCategory | null;
}

export interface OrderItem {
  id: string;
  listingId?: string | null;
  title: string;
  image?: string | null;
  price: number;
  quantity: number;
  providerId: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  providerId: string;
  status: OrderStatus;
  subtotal: number;
  platformFee: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  paymentRef?: string | null;
  fulfillmentType: "PICKUP" | "DELIVERY";
  pickupOtp?: string | null;
  pickupStart?: string | null;
  pickupDeadline?: string | null;
  deliveryAddress?: string | null;
  notes?: string | null;
  cancelledReason?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  items: OrderItem[];
  provider?: ProviderProfile;
  review?: Review | null;
}

export interface Review {
  id: string;
  userId: string;
  providerId: string;
  orderId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  listingId?: string | null;
  providerId?: string | null;
  type: "LISTING" | "PROVIDER" | "CATEGORY";
  createdAt: string;
  listing?: FoodListing;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface Complaint {
  id: string;
  userId: string;
  orderId?: string | null;
  providerId?: string | null;
  listingId?: string | null;
  type: string;
  description: string;
  evidence: string[];
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "REJECTED";
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  pincode?: string | null;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}
