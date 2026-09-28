// CIBO seed script — run with: bun run prisma/seed.ts
import { db } from "../src/lib/db";
import crypto from "crypto";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

const IMG = {
  vegmeals: [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/1fee195eafac.jpeg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/e334e0e385e7.jpg",
  ],
  parotta: [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/faf0d685bebb.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/9d4660ba37a8.jpg",
  ],
  idli: [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/0a85fbeccda1.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/03275d09acd8.jpg",
  ],
  dosa: [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/b1f04e2f25a4.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d9aa095fc491.jpg",
  ],
  pizza: [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/c6bb4e766362.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/2312d4ed2dbe.jpg",
  ],
  bakery: [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/7e886c530ee7.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/65c176c66787.jpg",
  ],
  sweets: [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/ec56de117c10.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/6f2cf7f26db0.jpeg",
  ],
  friedrice: [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/b724d12f5767.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/5ed15047ac3f.jpg",
  ],
  wedding: [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d876eaa5ca98.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d852df3e55cf.jpg",
  ],
  dessert: [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/1d1f40ea2920.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/f967ab3464e9.jpg",
  ],
  snacks: [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/5feae958da9b.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/f640d15fdcd0.jpeg",
  ],
  paneer: [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/584de07b0399.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/126a76f6352a.jpg",
  ],
};

const CITIES = {
  Tirunelveli: { lat: 8.7139, lng: 77.7567 },
  Nagercoil: { lat: 8.168, lng: 77.4324 },
  Madurai: { lat: 9.9252, lng: 78.1198 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
};

function offset(base: number, km: number) {
  // ~1 deg lat ≈ 111 km
  const d = km / 111;
  return base + (Math.random() - 0.5) * 2 * d;
}

function now() {
  return new Date();
}
function inMinutes(m: number) {
  return new Date(Date.now() + m * 60_000);
}
function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3_600_000);
}
function daysAgo(d: number) {
  return new Date(Date.now() - d * 86_400_000);
}

async function main() {
  console.log("🌱 Seeding CIBO...");

  // Clean
  await db.session.deleteMany();
  await db.notification.deleteMany();
  await db.review.deleteMany();
  await db.complaint.deleteMany();
  await db.foodSafetyReport.deleteMany();
  await db.payment.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.favorite.deleteMany();
  await db.address.deleteMany();
  await db.foodListing.deleteMany();
  await db.providerDocument.deleteMany();
  await db.providerProfile.deleteMany();
  await db.customerProfile.deleteMany();
  await db.foodCategory.deleteMany();
  await db.platformSetting.deleteMany();
  await db.adminAction.deleteMany();
  await db.user.deleteMany();

  // Platform settings
  await db.platformSetting.createMany({
    data: [
      { key: "commission_rate", value: "0.1" },
      { key: "platform_fee_flat", value: "5" },
      { key: "default_delivery_fee", value: "25" },
      { key: "support_email", value: "support@cibo.app" },
      { key: "support_phone", value: "+91 90000 12345" },
    ],
  });

  // Categories
  const cats = [
    { name: "Meals", slug: "meals", emoji: "🍛", foodType: "BOTH" },
    { name: "Biryani", slug: "biryani", emoji: "🍗", foodType: "NON_VEG" },
    { name: "Fast Food", slug: "fast-food", emoji: "🍕", foodType: "BOTH" },
    { name: "Bakery", slug: "bakery", emoji: "🥐", foodType: "VEG" },
    { name: "Desserts", slug: "desserts", emoji: "🍰", foodType: "VEG" },
    { name: "Veg", slug: "veg", emoji: "🥗", foodType: "VEG" },
    { name: "Non-Veg", slug: "non-veg", emoji: "🥘", foodType: "NON_VEG" },
    { name: "Event Food", slug: "event-food", emoji: "🎉", foodType: "BOTH" },
    { name: "Snacks", slug: "snacks", emoji: "☕", foodType: "BOTH" },
    { name: "Best Deals", slug: "best-deals", emoji: "🏷️", foodType: "BOTH" },
  ];
  const categoryMap: Record<string, { id: string }> = {};
  for (const c of cats) {
    const cat = await db.foodCategory.create({ data: { ...c, sortOrder: cats.indexOf(c) } });
    categoryMap[c.slug] = { id: cat.id };
  }

  // Admin
  const admin = await db.user.create({
    data: {
      email: "admin@cibo.app",
      name: "CIBO Admin",
      phone: "9000012345",
      passwordHash: hashPassword("admin123"),
      role: "ADMIN",
    },
  });

  // Support
  await db.user.create({
    data: {
      email: "support@cibo.app",
      name: "CIBO Support",
      phone: "9000012346",
      passwordHash: hashPassword("support123"),
      role: "SUPPORT",
    },
  });

  // Providers
  const providersData = [
    {
      businessName: "Anbu Caterers",
      ownerName: "Anbu Selvan",
      businessType: "WEDDING_CATERER",
      phone: "9000010001",
      email: "anbu@cibo.app",
      addressLine: "12 Palayamkottai Road",
      city: "Tirunelveli",
      state: "Tamil Nadu",
      pincode: "627002",
      bio: "Three generations of wedding catering. Famous for Seeraga Samba biryani.",
      licenseNumber: "FSSAI-12345678901234",
      lat: 8.7139,
      lng: 77.7567,
      verified: true,
    },
    {
      businessName: "Spice Route Restaurant",
      ownerName: "Karthik Raja",
      businessType: "RESTAURANT",
      phone: "9000010002",
      email: "spice@cibo.app",
      addressLine: "45 Court Road",
      city: "Madurai",
      state: "Tamil Nadu",
      pincode: "625001",
      bio: "Multi-cuisine family restaurant serving since 2008.",
      licenseNumber: "FSSAI-22345678901234",
      lat: 9.9252,
      lng: 78.1198,
      verified: true,
    },
    {
      businessName: "Crust & Co Bakery",
      ownerName: "Divya Lakshmi",
      businessType: "BAKERY",
      phone: "9000010003",
      email: "crust@cibo.app",
      addressLine: "8 Cape Road",
      city: "Nagercoil",
      state: "Tamil Nadu",
      pincode: "629001",
      bio: "Artisan breads, fresh pastries baked daily at 4 AM.",
      licenseNumber: "FSSAI-32345678901234",
      lat: 8.168,
      lng: 77.4324,
      verified: true,
    },
    {
      businessName: "Ganga Cloud Kitchen",
      ownerName: "Mohan Das",
      businessType: "CLOUD_KITCHEN",
      phone: "9000010004",
      email: "ganga@cibo.app",
      addressLine: "3rd Floor, T Nagar",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600017",
      bio: "Cloud kitchen specializing in Indo-Chinese and South Indian combos.",
      licenseNumber: "FSSAI-42345678901234",
      lat: 13.0827,
      lng: 80.2707,
      verified: true,
    },
    {
      businessName: "Vel Tech Canteen",
      ownerName: "Suresh Kumar",
      businessType: "CANTEEN",
      phone: "9000010005",
      email: "veltech@cibo.app",
      addressLine: "College Campus, Ambai Road",
      city: "Tirunelveli",
      state: "Tamil Nadu",
      pincode: "627008",
      bio: "College canteen serving 2000+ students daily.",
      licenseNumber: "FSSAI-52345678901234",
      lat: 8.736,
      lng: 77.734,
      verified: true,
    },
    {
      businessName: "Royal Feast Events",
      ownerName: "Priya Nair",
      businessType: "EVENT_ORGANIZER",
      phone: "9000010006",
      email: "royalfeast@cibo.app",
      addressLine: "Vannarpettai Main Road",
      city: "Tirunelveli",
      state: "Tamil Nadu",
      pincode: "627003",
      bio: "Premium event catering for weddings, corporate & college events.",
      licenseNumber: "FSSAI-62345678901234",
      lat: 8.698,
      lng: 77.745,
      verified: true,
    },
  ];

  const providerUsers = [];
  for (const p of providersData) {
    const u = await db.user.create({
      data: {
        email: p.email,
        name: p.ownerName,
        phone: p.phone,
        passwordHash: hashPassword("provider123"),
        role: "PROVIDER",
      },
    });
    const prof = await db.providerProfile.create({
      data: {
        userId: u.id,
        businessName: p.businessName,
        ownerName: p.ownerName,
        businessType: p.businessType,
        phone: p.phone,
        email: p.email,
        addressLine: p.addressLine,
        city: p.city,
        state: p.state,
        pincode: p.pincode,
        latitude: p.lat,
        longitude: p.lng,
        verificationStatus: p.verified ? "VERIFIED" : "PENDING",
        licenseNumber: p.licenseNumber,
        licenseType: "FSSAI",
        bio: p.bio,
        rating: 4.2 + Math.random() * 0.7,
        totalRatings: 12 + Math.floor(Math.random() * 80),
        totalOrders: 30 + Math.floor(Math.random() * 120),
        totalRevenue: 8000 + Math.random() * 40000,
        mealsRescued: 40 + Math.floor(Math.random() * 300),
        wasteAvoidedKg: 20 + Math.random() * 150,
        fulfillment: "BOTH",
        deliveryFee: 25,
        bankName: "HDFC Bank",
        bankAccount: "XXXXXX" + Math.floor(1000 + Math.random() * 9000),
        bankIfsc: "HDFC0001234",
        upiId: p.businessName.toLowerCase().replace(/[^a-z]/g, "") + "@okhdfc",
      },
    });
    providerUsers.push({ user: u, profile: prof, city: p.city, lat: p.lat, lng: p.lng });

    // document
    await db.providerDocument.create({
      data: {
        providerId: prof.id,
        type: "FSSAI",
        url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400",
        status: p.verified ? "VERIFIED" : "PENDING",
      },
    });
  }

  // Customers
  const customersData = [
    { name: "Aarav Sharma", email: "aarav@cibo.app", phone: "9000020001", city: "Tirunelveli" },
    { name: "Meena Krishnan", email: "meena@cibo.app", phone: "9000020002", city: "Madurai" },
    { name: "Rahul Verma", email: "rahul@cibo.app", phone: "9000020003", city: "Chennai" },
    { name: "Sara Thomas", email: "sara@cibo.app", phone: "9000020004", city: "Nagercoil" },
  ];
  const customerUsers = [];
  for (const c of customersData) {
    const u = await db.user.create({
      data: {
        email: c.email,
        name: c.name,
        phone: c.phone,
        passwordHash: hashPassword("customer123"),
        role: "CUSTOMER",
      },
    });
    const coord = CITIES[c.city as keyof typeof CITIES];
    const prof = await db.customerProfile.create({
      data: {
        userId: u.id,
        dietaryPreference: "NON_VEGETARIAN",
        halalPreference: "INCLUDE_NON_HALAL",
        totalOrders: Math.floor(Math.random() * 8),
        totalSpent: Math.random() * 2000,
        mealsRescued: Math.floor(Math.random() * 8),
      },
    });
    await db.address.create({
      data: {
        userId: u.id,
        label: "Home",
        line1: "12 " + c.name.split(" ")[0] + " Street",
        city: c.city,
        state: "Tamil Nadu",
        pincode: "627001",
        latitude: coord.lat,
        longitude: coord.lng,
        isDefault: true,
      },
    });
    customerUsers.push({ user: u, profile: prof, city: c.city, lat: coord.lat, lng: coord.lng });
  }

  // Listings
  type ListingSeed = {
    providerIdx: number;
    title: string;
    description: string;
    images: string[];
    foodType: string;
    halalStatus: string;
    qty: number;
    original: number;
    cibo: number;
    category: string;
    pickupInMin: [number, number]; // start offset, deadline offset (minutes from now)
    isEvent?: boolean;
    eventType?: string;
    eventName?: string;
    allergens?: string[];
    storage?: string;
    packaging?: string;
    instructions?: string;
    fulfillment?: string;
    status?: string;
    createdHoursAgo?: number;
  };

  const listings: ListingSeed[] = [
    // Anbu Caterers
    {
      providerIdx: 0,
      title: "Wedding Chicken Biryani (Seeraga Samba)",
      description:
        "Authentic Tirunelveli-style wedding biryani cooked in clay pots with seeraga samba rice, country chicken, and a secret masala. Prepared for a 600-plate wedding, surplus 45 portions available.",
      images: [IMG.wedding[0], IMG.parotta[0]],
      foodType: "NON_VEG",
      halalStatus: "VERIFIED",
      qty: 32,
      original: 180,
      cibo: 70,
      category: "biryani",
      pickupInMin: [-30, 1680],
      isEvent: true,
      eventType: "WEDDING",
      eventName: "Karthik & Divya Wedding Reception",
      allergens: ["Dairy", "Gluten"],
      storage: "Hot held above 65°C in insulated carriers",
      packaging: "Food-grade foil sealed meals",
      instructions: "Please bring your own bag. Best consumed within 90 minutes of pickup.",
      fulfillment: "BOTH",
    },
    {
      providerIdx: 0,
      title: "Veg Meals (Banana Leaf Full)",
      description:
        "Complete South Indian meals with rice, 3 kuzhambu, 2 poriyal, appalam, payasam, curd & pickle. Wedding surplus.",
      images: IMG.vegmeals,
      foodType: "VEG",
      halalStatus: "UNSPECIFIED",
      qty: 25,
      original: 120,
      cibo: 50,
      category: "meals",
      pickupInMin: [-20, 1560],
      isEvent: true,
      eventType: "WEDDING",
      eventName: "Karthik & Divya Wedding Reception",
      allergens: ["Dairy"],
      storage: "Hot held, served fresh",
      packaging: "Eco areca leaf plates + sealed cover",
      instructions: "Veg-only kitchen. Pure veg preparation.",
      fulfillment: "BOTH",
    },
    // Spice Route
    {
      providerIdx: 1,
      title: "Chicken 65 Parotta Combo",
      description: "4 layered parotta with spicy Chicken 65 and salna. Restaurant closing-time surplus.",
      images: IMG.parotta,
      foodType: "NON_VEG",
      halalStatus: "VERIFIED",
      qty: 18,
      original: 160,
      cibo: 65,
      category: "non-veg",
      pickupInMin: [-10, 1440],
      allergens: ["Gluten", "Dairy"],
      storage: "Hot held in warmer",
      packaging: "Foam-sealed meal box",
      fulfillment: "BOTH",
    },
    {
      providerIdx: 1,
      title: "Paneer Butter Masala with Naan",
      description: "Creamy paneer butter masala with 2 butter naan. Restaurant surplus.",
      images: IMG.paneer,
      foodType: "VEG",
      halalStatus: "UNSPECIFIED",
      qty: 12,
      original: 200,
      cibo: 85,
      category: "veg",
      pickupInMin: [-15, 1520],
      allergens: ["Dairy", "Gluten"],
      storage: "Hot held",
      packaging: "Sealed containers",
      fulfillment: "BOTH",
    },
    // Crust & Co Bakery
    {
      providerIdx: 2,
      title: "Assorted Bakery Combo (6 pcs)",
      description: "End-of-day bakery combo: 2 croissants, 2 puffs, 2 muffins. Baked fresh this morning.",
      images: IMG.bakery,
      foodType: "VEG",
      halalStatus: "UNSPECIFIED",
      qty: 9,
      original: 240,
      cibo: 99,
      category: "bakery",
      pickupInMin: [-5, 1920],
      allergens: ["Gluten", "Dairy", "Egg"],
      storage: "Room temperature, consume same day",
      packaging: "Paper bakery box",
      instructions: "Best eaten warm. Reheats well.",
      fulfillment: "PICKUP",
    },
    {
      providerIdx: 2,
      title: "Chocolate Truffle Cake Slice (4)",
      description: "4 generous slices of Belgian chocolate truffle cake. From a cancelled bulk order.",
      images: IMG.dessert,
      foodType: "VEG",
      halalStatus: "UNSPECIFIED",
      qty: 8,
      original: 320,
      cibo: 140,
      category: "desserts",
      pickupInMin: [-30, 2160],
      allergens: ["Dairy", "Gluten"],
      storage: "Refrigerated, keep below 4°C",
      packaging: "Sealed cake slices",
      fulfillment: "BOTH",
    },
    // Ganga Cloud Kitchen
    {
      providerIdx: 3,
      title: "Veg Fried Rice + Gobi Manchurian",
      description: "Large portion veg fried rice with crispy gobi manchurian. Cloud kitchen over-prep.",
      images: IMG.friedrice,
      foodType: "VEG",
      halalStatus: "UNSPECIFIED",
      qty: 22,
      original: 140,
      cibo: 55,
      category: "fast-food",
      pickupInMin: [-5, 1680],
      allergens: ["Soy", "Gluten"],
      storage: "Hot held",
      packaging: "Sealed meal box",
      fulfillment: "BOTH",
    },
    {
      providerIdx: 3,
      title: "Margherita Pizza (Full 10 inch)",
      description: "Fresh wood-fired style margherita pizza. Cancelled delivery order.",
      images: IMG.pizza,
      foodType: "VEG",
      halalStatus: "UNSPECIFIED",
      qty: 5,
      original: 280,
      cibo: 110,
      category: "fast-food",
      pickupInMin: [-20, 1320],
      allergens: ["Gluten", "Dairy"],
      storage: "Hot held, reheat recommended",
      packaging: "Pizza box",
      fulfillment: "PICKUP",
    },
    // Vel Tech Canteen
    {
      providerIdx: 4,
      title: "Idli Sambar Plate (6 pcs)",
      description: "Fresh steamed idlis with sambar and 2 chutneys. Canteen breakfast surplus.",
      images: IMG.idli,
      foodType: "VEG",
      halalStatus: "UNSPECIFIED",
      qty: 30,
      original: 60,
      cibo: 25,
      category: "snacks",
      pickupInMin: [-40, 1360],
      allergens: [],
      storage: "Hot held in idli warmer",
      packaging: "Eco plate + cover",
      fulfillment: "PICKUP",
    },
    {
      providerIdx: 4,
      title: "Masala Dosa (2 pcs)",
      description: "Crispy masala dosa with potato filling, sambar & chutney. Canteen surplus.",
      images: IMG.dosa,
      foodType: "VEG",
      halalStatus: "UNSPECIFIED",
      qty: 14,
      original: 90,
      cibo: 40,
      category: "snacks",
      pickupInMin: [-10, 1280],
      allergens: ["Gluten"],
      storage: "Hot held",
      packaging: "Wrapped in banana leaf + foil",
      fulfillment: "PICKUP",
    },
    // Royal Feast Events
    {
      providerIdx: 5,
      title: "Corporate Event Veg Meals Box",
      description: "Complete veg meals box from a 400-pax corporate event. Rice, sambar, rasam, poriyal, curd, sweet.",
      images: [IMG.vegmeals[1]],
      foodType: "VEG",
      halalStatus: "UNSPECIFIED",
      qty: 40,
      original: 130,
      cibo: 49,
      category: "event-food",
      pickupInMin: [-25, 1760],
      isEvent: true,
      eventType: "CORPORATE",
      eventName: "TechFest 2026 Corporate Dinner",
      allergens: ["Dairy"],
      storage: "Hot held in insulated carriers",
      packaging: "Sealed meal box",
      instructions: "Veg-only kitchen. Pure veg.",
      fulfillment: "BOTH",
    },
    {
      providerIdx: 5,
      title: "Birthday Party Snack Box (Samosa + Sweet)",
      description: "Snack box with 4 samosas + 2 pieces gulab jamun from a kids birthday party surplus.",
      images: [IMG.snacks[0], IMG.sweets[0]],
      foodType: "VEG",
      halalStatus: "UNSPECIFIED",
      qty: 20,
      original: 110,
      cibo: 39,
      category: "event-food",
      pickupInMin: [-15, 1600],
      isEvent: true,
      eventType: "BIRTHDAY",
      eventName: "Aarav's 7th Birthday",
      allergens: ["Gluten", "Dairy"],
      storage: "Room temperature, consume within 4 hours",
      packaging: "Party snack box",
      fulfillment: "PICKUP",
    },
    // Already-expired (to demonstrate expiry)
    {
      providerIdx: 0,
      title: "Mutton Biryani (Event Surplus - Expired)",
      description: "Listing auto-expired as pickup deadline passed.",
      images: [IMG.wedding[1]],
      foodType: "NON_VEG",
      halalStatus: "VERIFIED",
      qty: 0,
      original: 220,
      cibo: 80,
      category: "biryani",
      pickupInMin: [-180, -60],
      isEvent: true,
      eventType: "WEDDING",
      eventName: "Past Reception",
      status: "EXPIRED",
      createdHoursAgo: 6,
    },
    // Sold out
    {
      providerIdx: 1,
      title: "Chicken Fried Rice (Sold Out)",
      description: "All portions rescued. Thank you community!",
      images: [IMG.friedrice[1]],
      foodType: "NON_VEG",
      halalStatus: "DECLARED",
      qty: 0,
      original: 150,
      cibo: 60,
      category: "non-veg",
      pickupInMin: [-30, 1600],
      status: "SOLD_OUT",
    },
  ];

  const createdListings = [];
  for (const l of listings) {
    const p = providerUsers[l.providerIdx];
    const pickupStart = inMinutes(l.pickupInMin[0]);
    const pickupDeadline = inMinutes(l.pickupInMin[1]);
    const status =
      l.status ||
      (pickupDeadline < now() ? "EXPIRED" : l.qty === 0 ? "SOLD_OUT" : "ACTIVE");
    const listing = await db.foodListing.create({
      data: {
        providerId: p.profile.id,
        categoryId: categoryMap[l.category]?.id ?? null,
        title: l.title,
        description: l.description,
        images: JSON.stringify(l.images),
        foodType: l.foodType,
        halalStatus: l.halalStatus,
        quantity: l.qty,
        initialQuantity: l.qty,
        originalPrice: l.original,
        ciboPrice: l.cibo,
        prepTime: "Freshly prepared",
        packingTime: "10-15 min",
        pickupStart,
        pickupDeadline,
        addressLine: p.profile.addressLine,
        city: p.profile.city,
        latitude: offset(p.profile.latitude, 2),
        longitude: offset(p.profile.longitude, 2),
        distanceKm: Math.round(Math.random() * 40) / 10,
        allergens: JSON.stringify(l.allergens || []),
        storageInfo: l.storage || null,
        packagingInfo: l.packaging || null,
        specialInstructions: l.instructions || null,
        isEvent: !!l.isEvent,
        eventType: l.eventType || null,
        eventName: l.eventName || null,
        fulfillment: l.fulfillment || "PICKUP",
        deliveryFee: l.fulfillment === "PICKUP" ? 0 : 25,
        status,
        views: 20 + Math.floor(Math.random() * 200),
        rescues: Math.floor(Math.random() * 15),
        rating: 4 + Math.random(),
        createdAt: l.createdHoursAgo ? hoursAgo(l.createdHoursAgo) : hoursAgo(Math.random() * 6),
      },
    });
    // safety report
    await db.foodSafetyReport.create({
      data: {
        listingId: listing.id,
        providerId: p.profile.id,
        prepTime: "Freshly prepared same day",
        packingTime: "10-15 min",
        storageInfo: l.storage || "Hot held above 65°C until pickup",
        packagingStatus: "Sealed food-grade packaging",
        handlingDeclaration: "Food handled with gloves and sanitized utensils.",
        allergenInfo: (l.allergens || []).join(", ") || "None declared",
        safetyDeclaration: true,
      },
    });
    createdListings.push({ listing, provider: p });
  }

  // Demo orders for customer 0
  const c0 = customerUsers[0];
  const activeListings = createdListings.filter((c) => c.listing.status === "ACTIVE");
  for (let i = 0; i < 3; i++) {
    const cl = activeListings[i % activeListings.length];
    if (!cl) break;
    const qty = 1 + (i % 3);
    const subtotal = cl.listing.ciboPrice * qty;
    const platformFee = 5;
    const deliveryFee = i === 0 ? 0 : 25;
    const total = subtotal + platformFee + deliveryFee;
    const status = i === 0 ? "READY" : i === 1 ? "CONFIRMED" : "COMPLETED";
    const order = await db.order.create({
      data: {
        orderNumber: `CIBO-${new Date().getFullYear()}-${String(120 + i).padStart(6, "0")}`,
        customerId: c0.user.id,
        providerId: cl.provider.profile.id,
        status,
        subtotal,
        platformFee,
        deliveryFee,
        tax: 0,
        discount: cl.listing.originalPrice * qty - subtotal,
        total,
        paymentMethod: i === 0 ? "UPI" : i === 1 ? "WALLET" : "CARD",
        paymentStatus: "PAID",
        paymentRef: "MOCK-" + Math.random().toString(36).slice(2, 10).toUpperCase(),
        fulfillmentType: i === 0 ? "PICKUP" : i === 1 ? "DELIVERY" : "PICKUP",
        pickupOtp: String(1000 + Math.floor(Math.random() * 9000)),
        pickupStart: cl.listing.pickupStart,
        pickupDeadline: cl.listing.pickupDeadline,
        deliveryAddress: i === 1 ? "12 Aarav Street, Tirunelveli" : null,
        notes: "Please pack extra chutney",
        completedAt: status === "COMPLETED" ? hoursAgo(2) : null,
        createdAt: hoursAgo(i * 5 + 1),
        items: {
          create: {
            listingId: cl.listing.id,
            title: cl.listing.title,
            image: JSON.parse(cl.listing.images)[0],
            price: cl.listing.ciboPrice,
            quantity: qty,
            providerId: cl.provider.profile.id,
            orderIdSnapshot: "snapshot",
          },
        },
      },
    });
    await db.payment.create({
      data: {
        orderId: order.id,
        amount: total,
        method: order.paymentMethod,
        status: "PAID",
        txnId: order.paymentRef!,
        gateway: "MOCK",
      },
    });
    if (status === "COMPLETED") {
      await db.review.create({
        data: {
          userId: c0.user.id,
          providerId: cl.provider.profile.id,
          orderId: order.id,
          rating: 4 + (i % 2),
          comment: "Great food, rescued on time. Will use CIBO again!",
        },
      });
    }
    // notifications
    await db.notification.create({
      data: {
        userId: c0.user.id,
        type: "ORDER_CONFIRMED",
        title: "Order confirmed",
        body: `${cl.provider.profile.businessName} confirmed your order ${order.orderNumber}.`,
        data: JSON.stringify({ orderId: order.id }),
      },
    });
  }

  // Historical orders across last 7 days for charts (spread across providers & customers)
  const statuses7d = ["COMPLETED", "COMPLETED", "COMPLETED", "CANCELLED", "COMPLETED", "COMPLETED", "COMPLETED"];
  const payMethods = ["UPI", "CARD", "WALLET", "UPI", "NETBANKING", "UPI", "CARD"];
  for (let day = 6; day >= 0; day--) {
    const ordersToday = 1 + Math.floor(Math.random() * 4); // 1-4 orders per day
    for (let j = 0; j < ordersToday; j++) {
      const cl = createdListings[Math.floor(Math.random() * Math.min(createdListings.length - 2, activeListings.length))];
      if (!cl || cl.listing.status !== "ACTIVE") continue;
      const cust = customerUsers[Math.floor(Math.random() * customerUsers.length)];
      const qty = 1 + Math.floor(Math.random() * 3);
      const subtotal = cl.listing.ciboPrice * qty;
      const platformFee = 5;
      const deliveryFee = Math.random() > 0.5 ? 25 : 0;
      const total = subtotal + platformFee + deliveryFee;
      const st = statuses7d[Math.floor(Math.random() * statuses7d.length)];
      const hrAgo = day * 24 + Math.floor(Math.random() * 20) + 2;
      try {
        const ho = await db.order.create({
          data: {
            orderNumber: `CIBO-${new Date().getFullYear()}-${String(200 + day * 10 + j).padStart(6, "0")}`,
            customerId: cust.user.id,
            providerId: cl.provider.profile.id,
            status: st,
            subtotal,
            platformFee,
            deliveryFee,
            tax: 0,
            discount: cl.listing.originalPrice * qty - subtotal,
            total,
            paymentMethod: payMethods[Math.floor(Math.random() * payMethods.length)],
            paymentStatus: st === "CANCELLED" ? "REFUNDED" : "PAID",
            paymentRef: "MOCK-" + Math.random().toString(36).slice(2, 10).toUpperCase(),
            fulfillmentType: deliveryFee > 0 ? "DELIVERY" : "PICKUP",
            pickupOtp: String(1000 + Math.floor(Math.random() * 9000)),
            pickupStart: cl.listing.pickupStart,
            pickupDeadline: cl.listing.pickupDeadline,
            deliveryAddress: deliveryFee > 0 ? `${cust.user.name.split(" ")[0]} St, ${cust.city}` : null,
            completedAt: st === "COMPLETED" ? hoursAgo(hrAgo) : null,
            createdAt: hoursAgo(hrAgo),
            items: {
              create: {
                listingId: cl.listing.id,
                title: cl.listing.title,
                image: JSON.parse(cl.listing.images)[0],
                price: cl.listing.ciboPrice,
                quantity: qty,
                providerId: cl.provider.profile.id,
                orderIdSnapshot: "snapshot",
              },
            },
          },
        });
        await db.payment.create({
          data: {
            orderId: ho.id,
            amount: total,
            method: ho.paymentMethod,
            status: ho.paymentStatus,
            txnId: ho.paymentRef!,
            gateway: "MOCK",
          },
        });
        if (st === "COMPLETED" && Math.random() > 0.4) {
          await db.review.create({
            data: {
              userId: cust.user.id,
              providerId: cl.provider.profile.id,
              orderId: ho.id,
              rating: 3 + Math.floor(Math.random() * 3),
              comment: ["Great rescue, tasty food!", "Picked up on time, good value.", "Loved it, will order again.", "Food was fresh and hot."][Math.floor(Math.random() * 4)],
            },
          });
        }
      } catch (e) { /* skip duplicate orderNumber */ }
    }
  }

  // A complaint
  await db.complaint.create({
    data: {
      userId: c0.user.id,
      providerId: providerUsers[1].profile.id,
      type: "FOOD_QUALITY",
      description: "The biryani seemed slightly cold at pickup. Otherwise fine.",
      status: "INVESTIGATING",
      evidence: JSON.stringify([]),
    },
  });

  // Notifications for customers — nearby food
  for (const cu of customerUsers) {
    await db.notification.create({
      data: {
        userId: cu.user.id,
        type: "NEARBY_FOOD",
        title: "Food rescue near you",
        body: "3 new surplus meals listed within 2 km of your location.",
        data: JSON.stringify({}),
      },
    });
  }

  console.log("✅ Seed complete");
  console.log("Admin:    admin@cibo.app / admin123");
  console.log("Provider: anbu@cibo.app / provider123");
  console.log("Customer: aarav@cibo.app / customer123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
