import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, ok, err } from "@/lib/api";
import { generateOrderNumber, generateOtp } from "@/lib/auth";
import { readJsonArray, toPublicUser } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

const FULFILLMENT_TYPES = new Set(["PICKUP", "DELIVERY"]);
const PAYMENT_METHODS = new Set(["UPI", "CARD", "NETBANKING", "WALLET", "CASH"]);
const DEFAULT_FLAT_FEE = 5;
const DEFAULT_DELIVERY_FEE = 25;

async function getPlatformFeeFlat(): Promise<number> {
  const setting = await db.platformSetting.findUnique({
    where: { key: "platform_fee_flat" },
  });
  return setting ? Number(setting.value) : DEFAULT_FLAT_FEE;
}

// POST /api/orders { items, fulfillmentType, paymentMethod, addressId?, notes? } -> { order }
export async function POST(req: NextRequest) {
  const { user, response } = await requireRole("CUSTOMER");
  if (response) return response;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400, "BAD_BODY");
  }

  const items: any[] = Array.isArray(body.items) ? body.items : [];
  const fulfillmentType = String(body.fulfillmentType || "PICKUP").toUpperCase();
  const paymentMethod = String(body.paymentMethod || "UPI").toUpperCase();
  const addressId = body.addressId ? String(body.addressId) : null;
  const notes = body.notes ? String(body.notes) : null;

  if (items.length === 0) return err("No items in order", 400, "EMPTY_CART");
  if (!FULFILLMENT_TYPES.has(fulfillmentType))
    return err("Invalid fulfillmentType", 400, "BAD_FULFILLMENT");
  if (!PAYMENT_METHODS.has(paymentMethod))
    return err("Invalid paymentMethod", 400, "BAD_PAYMENT");

  // Normalize items.
  const normItems = items.map((it) => ({
    listingId: String(it.listingId || ""),
    quantity: Math.max(1, Math.floor(Number(it.quantity) || 0)),
  }));
  for (const it of normItems) {
    if (!it.listingId) return err("Each item needs a listingId", 400, "BAD_ITEM");
    if (it.quantity < 1) return err("Invalid quantity", 400, "BAD_QTY");
  }

  // For delivery, require an address.
  let deliveryAddress: Address | null = null;
  if (fulfillmentType === "DELIVERY") {
    if (!addressId) return err("Address required for delivery", 400, "NEED_ADDRESS");
    deliveryAddress = await db.address.findUnique({ where: { id: addressId } });
    if (!deliveryAddress || deliveryAddress.userId !== user!.id) {
      return err("Address not found", 404, "ADDRESS_NOT_FOUND");
    }
  }

  const flatFee = await getPlatformFeeFlat();
  const orderNumber = await generateOrderNumber();
  const pickupOtp = generateOtp();
  const paymentRef = `MOCK-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  try {
    const order = await db.$transaction(async (tx) => {
      // Lock-ish: re-read each listing inside the transaction.
      const lineItems: {
        listingId: string;
        title: string;
        image: string | null;
        price: number;
        quantity: number;
        providerId: string;
        pickupStart: Date;
        pickupDeadline: Date;
        deliveryFee: number;
      }[] = [];

      let subtotal = 0;
      let combinedDeliveryFee = 0;
      let providerId = "";

      for (const it of normItems) {
        const listing = await tx.foodListing.findUnique({
          where: { id: it.listingId },
        });
        if (!listing) throw new Error(`Listing ${it.listingId} not found`);
        if (listing.status !== "ACTIVE") {
          throw new Error(`Listing ${listing.title} is no longer available`);
        }
        if (listing.pickupDeadline <= new Date()) {
          throw new Error(`Listing ${listing.title} has expired`);
        }
        if (listing.quantity < it.quantity) {
          throw new Error(
            `Insufficient stock for ${listing.title} (requested ${it.quantity}, available ${listing.quantity})`
          );
        }

        // Decrement quantity.
        const newQty = listing.quantity - it.quantity;
        const newStatus = newQty === 0 ? "SOLD_OUT" : listing.status;
        await tx.foodListing.update({
          where: { id: listing.id },
          data: {
            quantity: newQty,
            status: newStatus,
            rescues: { increment: it.quantity },
          },
        });

        const linePrice = listing.ciboPrice * it.quantity;
        subtotal += linePrice;

        // Per-listing deliveryFee for DELIVERY orders (use the larger of listing.deliveryFee or 0).
        if (fulfillmentType === "DELIVERY") {
          combinedDeliveryFee = Math.max(
            combinedDeliveryFee,
            listing.deliveryFee || 0
          );
        }

        const images = readJsonArray(listing.images);
        providerId = listing.providerId;

        lineItems.push({
          listingId: listing.id,
          title: listing.title,
          image: images[0] || null,
          price: listing.ciboPrice,
          quantity: it.quantity,
          providerId: listing.providerId,
          pickupStart: listing.pickupStart,
          pickupDeadline: listing.pickupDeadline,
          deliveryFee: listing.deliveryFee,
        });
      }

      if (!providerId) throw new Error("No provider for items");

      const platformFee = flatFee;
      const deliveryFee =
        fulfillmentType === "PICKUP"
          ? 0
          : combinedDeliveryFee || DEFAULT_DELIVERY_FEE;
      const tax = 0;
      const discount = 0;
      const total = subtotal + platformFee + deliveryFee + tax - discount;

      // Pickup window from the earliest-deadline listing's window.
      const earliestStart = lineItems.reduce(
        (min, li) => (li.pickupStart < min ? li.pickupStart : min),
        lineItems[0].pickupStart
      );
      const earliestDeadline = lineItems.reduce(
        (min, li) => (li.pickupDeadline < min ? li.pickupDeadline : min),
        lineItems[0].pickupDeadline
      );

      const created = await tx.order.create({
        data: {
          orderNumber,
          customerId: user!.id,
          providerId,
          status: "PLACED",
          subtotal,
          platformFee,
          deliveryFee,
          tax,
          discount,
          total,
          paymentMethod,
          paymentStatus: "PAID",
          paymentRef,
          fulfillmentType,
          pickupOtp,
          pickupStart: earliestStart,
          pickupDeadline: earliestDeadline,
          deliveryAddress: deliveryAddress
            ? `${deliveryAddress.line1}${
                deliveryAddress.line2 ? ", " + deliveryAddress.line2 : ""
              }, ${deliveryAddress.city}, ${deliveryAddress.pincode || ""}`
            : null,
          deliveryLat: deliveryAddress?.latitude || null,
          deliveryLng: deliveryAddress?.longitude || null,
          notes,
        },
      });

      // Snapshot OrderItems.
      for (const li of lineItems) {
        await tx.orderItem.create({
          data: {
            orderId: created.id,
            listingId: li.listingId,
            title: li.title,
            image: li.image,
            price: li.price,
            quantity: li.quantity,
            providerId: li.providerId,
            orderIdSnapshot: created.orderNumber,
          },
        });
      }

      // Payment record (mock gateway always succeeds).
      await tx.payment.create({
        data: {
          orderId: created.id,
          amount: total,
          method: paymentMethod,
          status: "PAID",
          txnId: paymentRef,
          gateway: "MOCK",
        },
      });

      // Provider totals
      const totalQty = lineItems.reduce((s, li) => s + li.quantity, 0);
      await tx.providerProfile.update({
        where: { id: providerId },
        data: {
          totalOrders: { increment: 1 },
          totalRevenue: { increment: total },
          mealsRescued: { increment: totalQty },
          wasteAvoidedKg: { increment: totalQty * 0.4 },
        },
      });

      // Customer profile totals
      await tx.customerProfile.update({
        where: { userId: user!.id },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: total },
          mealsRescued: { increment: totalQty },
        },
      });

      // Notifications
      await tx.notification.create({
        data: {
          userId: user!.id,
          type: "ORDER_CONFIRMED",
          title: "Order confirmed",
          body: `Your order ${orderNumber} has been placed. Show OTP ${pickupOtp} at pickup.`,
          data: JSON.stringify({ orderId: created.id, pickupOtp }),
        },
      });
      const provider = await tx.providerProfile.findUnique({
        where: { id: providerId },
        select: { userId: true },
      });
      if (provider) {
        await tx.notification.create({
          data: {
            userId: provider.userId,
            type: "ORDER_CONFIRMED",
            title: "New order received",
            body: `Order ${orderNumber} has been placed. Confirm and prepare.`,
            data: JSON.stringify({ orderId: created.id }),
          },
        });
      }

      return created;
    });

    const full = await db.order.findUnique({
      where: { id: order.id },
      include: { items: true, provider: true, customer: true },
    });

    return ok(
      {
        order: {
          ...full,
          customer: full?.customer ? toPublicUser(full.customer) : undefined,
        },
      },
      201
    );
  } catch (e: any) {
    const msg = e?.message || "Order creation failed";
    const isInput =
      /not found|no longer available|expired|Insufficient stock|No provider/.test(msg);
    return err(msg, isInput ? 400 : 500, isInput ? "ORDER_FAILED" : "INTERNAL");
  }
}

// GET /api/orders -> { orders } (current user's orders)
export async function GET() {
  const { user, response } = await requireRole("CUSTOMER");
  if (response) return response;

  const orders = await db.order.findMany({
    where: { customerId: user!.id },
    include: { items: true, provider: true },
    orderBy: { createdAt: "desc" },
  });

  return ok({ orders });
}

type Address = {
  id: string;
  userId: string;
  line1: string;
  line2?: string | null;
  city: string;
  pincode?: string | null;
  latitude: number;
  longitude: number;
};
