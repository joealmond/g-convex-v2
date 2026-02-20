import { publicMutation } from './lib/customFunctions'
/**
 * Seed script to populate initial gluten-free products for demo/testing
 * Run with: npx convex run seed:seedProducts
 */

;

export const seedProducts = publicMutation({
  args: {},
  handler: async (ctx) => {
    // Check if products already exist
    const existingProducts = await ctx.db.query("products").collect();
    if (existingProducts.length > 0) {
      return { message: "Products already exist, skipping seed", count: existingProducts.length };
    }

    const products = [
      // Holy Grail quadrant (safe + tasty)
      {
        name: "Schär Ciabatta",
        brand: "Schär",
        category: "Bread",
        averageSafety: 85,
        averageTaste: 80,
        voteCount: 0,
        registeredVotes: 0,
        anonymousVotes: 0,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      },
      {
        name: "Genius Soft White Bread",
        brand: "Genius",
        category: "Bread",
        averageSafety: 90,
        averageTaste: 75,
        voteCount: 0,
        registeredVotes: 0,
        anonymousVotes: 0,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      },
      {
        name: "Barilla Gluten Free Pasta",
        brand: "Barilla",
        category: "Pasta",
        averageSafety: 88,
        averageTaste: 85,
        voteCount: 0,
        registeredVotes: 0,
        anonymousVotes: 0,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      },

      // Survivor Food quadrant (safe but not tasty)
      {
        name: "Generic Rice Crackers",
        brand: "Store Brand",
        category: "Snacks",
        averageSafety: 80,
        averageTaste: 35,
        voteCount: 0,
        registeredVotes: 0,
        anonymousVotes: 0,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      },
      {
        name: "Plain Rice Cakes",
        brand: "Quaker",
        category: "Snacks",
        averageSafety: 92,
        averageTaste: 25,
        voteCount: 0,
        registeredVotes: 0,
        anonymousVotes: 0,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      },

      // Russian Roulette quadrant (tasty but risky)
      {
        name: "Restaurant Pizza (GF)",
        brand: "Various",
        category: "Pizza",
        averageSafety: 35,
        averageTaste: 85,
        voteCount: 0,
        registeredVotes: 0,
        anonymousVotes: 0,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      },
      {
        name: "Oat Cookies (labeled GF)",
        brand: "Store Brand",
        category: "Cookies",
        averageSafety: 40,
        averageTaste: 75,
        voteCount: 0,
        registeredVotes: 0,
        anonymousVotes: 0,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      },

      // The Bin quadrant (avoid at all costs)
      {
        name: "Cheap GF Bread Mix",
        brand: "Budget Brand",
        category: "Bread",
        averageSafety: 30,
        averageTaste: 20,
        voteCount: 0,
        registeredVotes: 0,
        anonymousVotes: 0,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      },
      {
        name: "Store Brand GF Cookies",
        brand: "Generic",
        category: "Cookies",
        averageSafety: 25,
        averageTaste: 30,
        voteCount: 0,
        registeredVotes: 0,
        anonymousVotes: 0,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      },

      // Middle range products
      {
        name: "Udi's Sandwich Bread",
        brand: "Udi's",
        category: "Bread",
        averageSafety: 70,
        averageTaste: 60,
        voteCount: 0,
        registeredVotes: 0,
        anonymousVotes: 0,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      },
      {
        name: "Banza Chickpea Pasta",
        brand: "Banza",
        category: "Pasta",
        averageSafety: 82,
        averageTaste: 65,
        voteCount: 0,
        registeredVotes: 0,
        anonymousVotes: 0,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      },
      {
        name: "Canyon Bakehouse Mountain White",
        brand: "Canyon Bakehouse",
        category: "Bread",
        averageSafety: 85,
        averageTaste: 72,
        voteCount: 0,
        registeredVotes: 0,
        anonymousVotes: 0,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      },
    ];

    const insertedIds = [];
    for (const product of products) {
      const id = await ctx.db.insert("products", product);
      insertedIds.push(id);
    }

    return {
      message: "Successfully seeded products",
      count: insertedIds.length,
      ids: insertedIds,
    };
  },
});
