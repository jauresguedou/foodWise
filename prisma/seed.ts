import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const stores = [
  {
    slug: "juniper-grain",
    name: "Juniper & Grain",
    neighborhood: "North Campus",
    item: {
      id: "harvest-bowl",
      name: "Harvest grain bowl",
      category: "Bowls",
      description: "Roasted squash, farro, greens, pepitas, and lemon tahini.",
      priceMinor: 1250,
      studentPriceMinor: 895,
    },
  },
  {
    slug: "daily-table",
    name: "The Daily Table",
    neighborhood: "Library District",
    item: {
      id: "sunrise-breakfast",
      name: "Sunrise breakfast wrap",
      category: "Breakfast",
      description: "Eggs, cheddar, black beans, roasted salsa, and avocado crema.",
      priceMinor: 975,
      studentPriceMinor: 650,
    },
  },
  {
    slug: "lantern-kitchen",
    name: "Lantern Kitchen",
    neighborhood: "East Village",
    item: {
      id: "spicy-chicken",
      name: "Spicy chicken banh mi",
      category: "Sandwiches",
      description: "Lemongrass chicken, pickled vegetables, cucumber, and chili mayo.",
      priceMinor: 1125,
      studentPriceMinor: 799,
    },
  },
  {
    slug: "olive-rye",
    name: "Olive & Rye",
    neighborhood: "West End",
    item: {
      id: "green-pasta",
      name: "Green goddess pasta",
      category: "Vegetarian",
      description: "Basil pesto, broccoli, peas, parmesan, and toasted breadcrumbs.",
      priceMinor: 1300,
      studentPriceMinor: 850,
    },
  },
];

async function main(): Promise<void> {
  const vendor = await prisma.user.upsert({
    where: { email: "seed-vendor@foodwise.invalid" },
    update: {},
    create: {
      email: "seed-vendor@foodwise.invalid",
      name: "FoodWise Seed Vendor",
      passwordHash: await hash(randomBytes(32).toString("hex"), 12),
      role: "VENDOR",
    },
  });

  for (const entry of stores) {
    const store = await prisma.store.upsert({
      where: { slug: entry.slug },
      update: {
        name: entry.name,
        neighborhood: entry.neighborhood,
        status: "PUBLISHED",
        pickupAvailable: true,
      },
      create: {
        ownerId: vendor.id,
        name: entry.name,
        slug: entry.slug,
        description: `Pickup meals from ${entry.name}.`,
        neighborhood: entry.neighborhood,
        currency: "USD",
        status: "PUBLISHED",
      },
    });
    await prisma.menuItem.upsert({
      where: { id: entry.item.id },
      update: { ...entry.item, storeId: store.id, isAvailable: true, archivedAt: null },
      create: { ...entry.item, storeId: store.id },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed.", error instanceof Error ? error.message : "Unknown error");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());