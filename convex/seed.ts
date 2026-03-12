import { internalMutation } from './lib/customFunctions'
/**
 * Seed script to populate initial gluten-free products for demo/testing
 * Run with: npx convex run seed:seedProducts
 */

;

export const seedProducts = internalMutation({
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

/**
 * Seed deterministic fixtures for end-to-end testing.
 * Run with: npx convex run seed:seedE2eFixtures
 */
export const seedE2eFixtures = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const baseLat = 47.4746
    const baseLng = 18.8236

    const testUsers = [
      {
        userId: 'e2e-user-gluten',
        avoidedAllergens: ['gluten'],
        points: 120,
        badges: [],
        streak: 2,
        totalVotes: 3,
        role: 'user' as const,
      },
      {
        userId: 'e2e-user-lactos',
        avoidedAllergens: ['milk'],
        points: 80,
        badges: [],
        streak: 1,
        totalVotes: 2,
        role: 'user' as const,
      },
      {
        userId: 'e2e-user-soymax',
        avoidedAllergens: ['soy'],
        points: 70,
        badges: [],
        streak: 1,
        totalVotes: 2,
        role: 'user' as const,
      },
      {
        userId: 'e2e-user-nutmix',
        avoidedAllergens: ['nuts'],
        points: 60,
        badges: [],
        streak: 1,
        totalVotes: 1,
        role: 'user' as const,
      },
      {
        userId: 'e2e-user-omegga',
        avoidedAllergens: ['eggs'],
        points: 50,
        badges: [],
        streak: 1,
        totalVotes: 1,
        role: 'user' as const,
      },
    ]

    for (const user of testUsers) {
      const existingProfile = await ctx.db
        .query('profiles')
        .withIndex('by_user', (q) => q.eq('userId', user.userId))
        .first()

      if (existingProfile) {
        await ctx.db.patch(existingProfile._id, {
          points: user.points,
          badges: user.badges,
          streak: user.streak,
          totalVotes: user.totalVotes,
          role: user.role,
        })
      } else {
        await ctx.db.insert('profiles', {
          userId: user.userId,
          points: user.points,
          badges: user.badges,
          streak: user.streak,
          totalVotes: user.totalVotes,
          role: user.role,
          lastVoteDate: undefined,
          gpsVotes: 0,
          newProductVotes: 0,
          storesTagged: [],
          longestStreak: user.streak,
          votesToday: 0,
        })
      }

      const existingDietaryProfile = await ctx.db
        .query('dietaryProfiles')
        .withIndex('by_user', (q) => q.eq('userId', user.userId))
        .first()

      if (existingDietaryProfile) {
        await ctx.db.patch(existingDietaryProfile._id, {
          avoidedAllergens: user.avoidedAllergens,
          conditions: undefined,
          updatedAt: now,
        })
      } else {
        await ctx.db.insert('dietaryProfiles', {
          userId: user.userId,
          avoidedAllergens: user.avoidedAllergens,
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    const fixtures = [
      {
        name: 'E2E Filter Gluten Bread',
        brand: 'E2E Bakery',
        category: 'Bread',
        allergens: ['gluten'],
        freeFrom: ['milk', 'soy', 'nuts', 'eggs'],
        averageSafety: 18,
        averageTaste: 62,
        createdBy: 'e2e-user-gluten',
      },
      {
        name: 'E2E Filter Milk Yogurt',
        brand: 'E2E Dairy',
        category: 'Dairy',
        allergens: ['milk'],
        freeFrom: ['gluten', 'soy', 'nuts', 'eggs'],
        averageSafety: 74,
        averageTaste: 71,
        createdBy: 'e2e-user-lactos',
      },
      {
        name: 'E2E Filter Soy Snack',
        brand: 'E2E Snacks',
        category: 'Snack',
        allergens: ['soy'],
        freeFrom: ['gluten', 'milk', 'nuts', 'eggs'],
        averageSafety: 76,
        averageTaste: 67,
        createdBy: 'e2e-user-soymax',
      },
      {
        name: 'E2E Filter Nut Bar',
        brand: 'E2E Snacks',
        category: 'Snack',
        allergens: ['nuts'],
        freeFrom: ['gluten', 'milk', 'soy', 'eggs'],
        averageSafety: 65,
        averageTaste: 72,
        createdBy: 'e2e-user-nutmix',
      },
      {
        name: 'E2E Filter Egg Pasta',
        brand: 'E2E Kitchen',
        category: 'Pasta',
        allergens: ['eggs'],
        freeFrom: ['gluten', 'milk', 'soy', 'nuts'],
        averageSafety: 69,
        averageTaste: 75,
        createdBy: 'e2e-user-omegga',
      },
      {
        name: 'E2E Filter Safe Chips',
        brand: 'E2E Snacks',
        category: 'Snack',
        allergens: [],
        freeFrom: ['gluten', 'milk', 'soy', 'nuts', 'eggs'],
        averageSafety: 91,
        averageTaste: 79,
        createdBy: 'e2e-user-lactos',
      },
    ]

    const ids: string[] = []
    for (let index = 0; index < fixtures.length; index += 1) {
      const fixture = fixtures[index]!
      const existingProduct = await ctx.db
        .query('products')
        .withIndex('by_name', (q) => q.eq('name', fixture.name))
        .first()

      const patch = {
        brand: fixture.brand,
        category: fixture.category,
        allergens: fixture.allergens,
        freeFrom: fixture.freeFrom,
        averageSafety: fixture.averageSafety,
        averageTaste: fixture.averageTaste,
        avgPrice: 3,
        voteCount: 1,
        registeredVotes: 1,
        anonymousVotes: 0,
        createdBy: fixture.createdBy,
        createdAt: now + index,
        lastUpdated: now + index,
        stores: [
          {
            name: 'E2E Test Store',
            lastSeenAt: now,
            price: 3,
            geoPoint: {
              lat: baseLat + index * 0.002,
              lng: baseLng + index * 0.002,
            },
          },
        ],
      }

      if (existingProduct) {
        await ctx.db.patch(existingProduct._id, patch)
        ids.push(existingProduct._id)
      } else {
        const id = await ctx.db.insert('products', {
          name: fixture.name,
          ...patch,
          dataSource: 'community',
        })
        ids.push(id)
      }
    }

    return {
      message: 'Seeded E2E fixtures',
      productCount: ids.length,
      profileCount: testUsers.length,
      dietaryProfileCount: testUsers.length,
      productIds: ids,
      users: testUsers.map((user) => ({
        userId: user.userId,
        avoidedAllergens: user.avoidedAllergens,
      })),
      products: fixtures.map((fixture) => ({
        name: fixture.name,
        createdBy: fixture.createdBy,
        allergens: fixture.allergens,
      })),
    }
  },
})
