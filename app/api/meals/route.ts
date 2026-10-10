
import { db } from '@/src/db/client';

export const dynamic = 'force-dynamic';

const accentByCategory: Record<string, string> = {
  Bowls: 'sage',
  Sandwiches: 'coral',
  Vegetarian: 'mint',
  Breakfast: 'gold',
};

const dietaryLabels: Record<string, string> = {
  VEGETARIAN: 'Vegetarian',
  VEGAN: 'Vegan',
  GLUTEN_FREE: 'Gluten-free',
  DAIRY_FREE: 'Dairy-free',
  HALAL: 'Halal',
  KOSHER: 'Kosher',
};

export async function GET() {
  try {
    const menuItems = await db.menuItem.findMany({
      where: {
        isAvailable: true,
        archivedAt: null,
        store: {
          status: 'PUBLISHED',
        },
      },
      include: {
        store: {
          select: {
            name: true,
            campus: true,
            currency: true,
            pickupAvailable: true,
            deliveryAvailable: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    const meals = menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      store: item.store.name,
      neighborhood: item.store.campus,
      category: item.category,
      price: item.priceMinor / 100,
      studentPrice:
        (item.studentPriceMinor ?? item.priceMinor) / 100,
      currency: item.store.currency,
      available: 'Available now',
      fulfillment: [
        ...(item.store.pickupAvailable ? ['Pickup'] : []),
        ...(item.store.deliveryAvailable ? ['Delivery'] : []),
      ],
      dietary: item.dietaryTags.map(
        (tag) => dietaryLabels[tag] ?? tag,
      ),
      description: item.description,
      accent: accentByCategory[item.category] ?? 'sage',
    }));

    return Response.json({ meals });
  } catch (error) {
    console.error('Failed to fetch published meals:', error);

    return Response.json(
      { error: 'Unable to load meals right now.' },
      { status: 500 },
    );
  }
}
