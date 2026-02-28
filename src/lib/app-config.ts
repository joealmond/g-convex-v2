/**
 * Central Niche Configuration
 * 
 * This file contains ALL niche-specific terms, labels, and presets.
 * To adapt this app for a different niche (vegan, keto, organic, etc.),
 * edit this file and the locale files in src/locales/*.json.
 * 
 * Components should never hardcode niche-specific strings — they read from this config.
 */

export const appConfig = {
  //////////////////////////////////////////////////////////////////////////////
  // BASIC IDENTITY
  //////////////////////////////////////////////////////////////////////////////
  
  appName: "G-Matrix",
  
  /** What type of products does this app rate? (e.g., "gluten-free products", "vegan foods", "keto snacks") */
  categoryTerm: "gluten-free products",
  
  tagline: "Community-rated celiac-safe products",
  
  //////////////////////////////////////////////////////////////////////////////
  // DIMENSIONS (Voting Axes)
  //////////////////////////////////////////////////////////////////////////////
  
  dimensions: {
    /** Primary axis (Y-axis on chart) — typically safety/quality/compliance */
    axis1: {
      key: "safety",
      label: "Safety",
      question: "How safe is it?", // Used in voting UI
      presets: [
        { value: 90, label: "Clean", emoji: "✅", description: "Completely safe, no concerns" },
        { value: 50, label: "Sketchy", emoji: "⚠️", description: "Some concerns, use caution" },
        { value: 10, label: "Wrecked", emoji: "🚫", description: "Unsafe, avoid" },
      ],
    },
    
    /** Secondary axis (X-axis on chart) — typically taste/enjoyment */
    axis2: {
      key: "taste",
      label: "Taste",
      question: "How does it taste?",
      presets: [
        { value: 90, label: "Yass!", emoji: "😋", description: "Delicious" },
        { value: 50, label: "Meh", emoji: "😐", description: "Acceptable" },
        { value: 10, label: "Pass", emoji: "🤢", description: "Terrible" },
      ],
    },
    
    /** Tertiary axis (price) — always 5 levels */
    axis3: {
      key: "price",
      label: "Price",
      question: "How expensive is it?",
      presets: [
        { value: 20, label: "Budget", emoji: "$", description: "Very affordable" },
        { value: 40, label: "Fair", emoji: "$$", description: "Reasonable" },
        { value: 60, label: "Moderate", emoji: "$$$", description: "A bit pricey" },
        { value: 80, label: "Premium", emoji: "$$$$", description: "Expensive" },
        { value: 100, label: "Luxury", emoji: "$$$$$", description: "Very expensive" },
      ],
    },
  },
  
  //////////////////////////////////////////////////////////////////////////////
  // QUADRANTS (Safety vs Taste chart zones)
  //////////////////////////////////////////////////////////////////////////////
  
  quadrants: {
    topRight: {
      id: "holyGrail",
      label: "Holy Grail",
      emoji: "🏆",
      color: "#27AE60", // Green (Safety High)
      description: "Safe and delicious — the ideal",
    },
    topLeft: {
      id: "survivor",
      label: "Survivor Food",
      emoji: "🛡️",
      color: "#F1C40F", // Gold/Yellow (Safety Mid)
      description: "Safe but mediocre taste",
    },
    bottomLeft: {
      id: "bin",
      label: "The Bin",
      emoji: "🗑️",
      color: "#E74C3C", // Red (Safety Low)
      description: "Unsafe and bad taste — avoid",
    },
    bottomRight: {
      id: "roulette",
      label: "Russian Roulette",
      emoji: "⚠️",
      color: "#E67E22", // Orange (Risky)
      description: "Tasty but safety concerns",
    },
  },
  
  //////////////////////////////////////////////////////////////////////////////
  // VALUE LENS (Optional: Price vs Taste chart mode)
  //////////////////////////////////////////////////////////////////////////////
  
  valueLens: {
    axis1Label: "Price", // Y-axis in value mode
    axis2Label: "Taste", // X-axis in value mode
    quadrants: {
      topRight: {
        id: "ripOff",
        label: "Rip-Off",
        emoji: "💸",
        color: "#E74C3C", // Red
        description: "Expensive and mediocre",
      },
      topLeft: {
        id: "cheapFiller",
        label: "Cheap Filler",
        emoji: "🗑️",
        color: "#95A5A6", // Gray
        description: "Cheap and tasteless",
      },
      bottomLeft: {
        id: "theSteal",
        label: "The Steal",
        emoji: "💰",
        color: "#27AE60", // Green
        description: "Affordable and delicious",
      },
      bottomRight: {
        id: "treat",
        label: "Treat",
        emoji: "🎁",
        color: "#9B59B6", // Purple
        description: "Worth the splurge",
      },
    },
  },
  
  //////////////////////////////////////////////////////////////////////////////
  // RATING LABELS (Score thresholds)
  //////////////////////////////////////////////////////////////////////////////
  
  ratingLabels: [
    { min: 80, label: "Excellent", color: "#27AE60" },
    { min: 60, label: "Good", color: "#7CB342" },
    { min: 40, label: "Fair", color: "#F39C12" },
    { min: 0, label: "Poor", color: "#E74C3C" },
  ],
  
  //////////////////////////////////////////////////////////////////////////////
  // NICHE-SPECIFIC CONCEPTS
  //////////////////////////////////////////////////////////////////////////////
  
  /** What ingredient/property is risky in this niche? (e.g., "gluten", "animal products", "sugar") */
  riskConcept: "gluten",
  
  /** What certification/verification is relevant? (e.g., "celiac-safe", "vegan-certified", "organic") */
  certificationName: "celiac-safe",
  
  //////////////////////////////////////////////////////////////////////////////
  // ALLERGENS (Boolean avoidance list)
  //////////////////////////////////////////////////////////////////////////////
  
  /**
   * Allergen catalog — users toggle which ones they avoid.
   * Products declare which allergens they contain.
   * Matching is a simple set intersection: if product.allergens ∩ user.avoidedAllergens ≠ ∅ → warn/hide.
   *
   * Based on EU Annex II (14 mandatory allergens) and FDA Big 9.
   * Starting minimal for gluten-free niche; extend by adding entries here.
   */
  allergens: [
    {
      id: "gluten",
      label: "Gluten",
      emoji: "🌾",
      description: "Cereals containing gluten (wheat, rye, barley, oats)",
    },
    {
      id: "milk",
      label: "Milk & Dairy",
      emoji: "🥛",
      description: "Milk and products thereof, including lactose",
    },
    {
      id: "soy",
      label: "Soy",
      emoji: "🫘",
      description: "Soybeans and products thereof",
    },
    {
      id: "nuts",
      label: "Nuts",
      emoji: "🥜",
      description: "Tree nuts and peanuts",
    },
    {
      id: "eggs",
      label: "Eggs",
      emoji: "🥚",
      description: "Eggs and products thereof",
    },
  ],
  
  //////////////////////////////////////////////////////////////////////////////
  // STORE DEFAULTS (per locale)
  //////////////////////////////////////////////////////////////////////////////
  
  storeDefaults: {
    hu: [
      "Aldi",
      "Lidl",
      "Tesco",
      "Spar",
      "Auchan",
      "Penny Market",
      "CBA",
      "Coop",
      "Interspar",
      "Rossmann",
      "DM",
      "Biobolt",
    ],
    en: [
      "Tesco",
      "Sainsbury's",
      "Asda",
      "Morrisons",
      "Waitrose",
      "Aldi",
      "Lidl",
      "Co-op",
      "Iceland",
      "M&S",
      "Whole Foods",
    ],
  },
  
  //////////////////////////////////////////////////////////////////////////////
  // GAMIFICATION LEVELS
  //////////////////////////////////////////////////////////////////////////////
  
  levels: [
    { min: 0, max: 249, title: "Bronze Scout", color: "#CD7F32" },
    { min: 250, max: 499, title: "Silver Scout", color: "#C0C0C0" },
    { min: 500, max: 999, title: "Gold Scout", color: "#FFD700" },
    { min: 1000, max: Infinity, title: "Elite Scout", color: "#9B59B6" },
  ],
  
  //////////////////////////////////////////////////////////////////////////////
  // DESIGN TOKENS (for JS access; CSS custom properties in globals.css)
  //////////////////////////////////////////////////////////////////////////////
  
  colors: {
    primary: "#7CB342", // Sage Green
    primaryDark: "#558B2F", // Forest Green
    primaryLight: "#AED581", // Light Sage
    background: "#FAF8F5", // Cream
    surface: "#FFFFFF", // White
    text: "#2D3436", // Charcoal
    textSecondary: "#636E72", // Gray
    border: "#B2BEC3", // Light Gray
    
    // Semantic colors
    safetyHigh: "#27AE60", // Green (≥60)
    safetyMid: "#F39C12", // Amber (40-59)
    safetyLow: "#E74C3C", // Red (<40)
    gold: "#F1C40F", // Achievement color
    
    // Dark mode
    backgroundDark: "#0F172A", // Deep Navy
    surfaceDark: "#1E293B", // Slate
  },
} as const;

//////////////////////////////////////////////////////////////////////////////
// HELPER FUNCTIONS
//////////////////////////////////////////////////////////////////////////////

/** Get rating label for a given score */
export function getRatingLabel(score: number): { label: string; color: string } {
  for (const rating of appConfig.ratingLabels) {
    if (score >= rating.min) {
      return { label: rating.label, color: rating.color };
    }
  }
  // Fallback to lowest rating (array is never empty)
  const fallback = appConfig.ratingLabels[appConfig.ratingLabels.length - 1]!;
  return { label: fallback.label, color: fallback.color };
}

/** Get user's current level based on points */
export function getUserLevel(points: number) {
  for (const level of appConfig.levels) {
    if (points >= level.min && points <= level.max) {
      return level;
    }
  }
  return appConfig.levels[appConfig.levels.length - 1]!;
}

/** Get store defaults for current locale (with fallback) */
export function getStoreDefaults(locale: string = "en"): readonly string[] {
  const localeKey = locale.split("-")[0] as keyof typeof appConfig.storeDefaults;
  return appConfig.storeDefaults[localeKey] || appConfig.storeDefaults.en;
}

/**
 * Centralized color palette for charts and maps.
 * Use these instead of hardcoding hex values in chart components.
 */
export const chartColors = {
  primary: "#7CB342",       // Sage Green
  primaryDark: "#558B2F",   // Forest Green (hover/stroke)
  safetyHigh: "#27AE60",    // Green — scores ≥ 60
  safetyMid: "#F39C12",     // Amber — scores 40-59
  safetyLow: "#E74C3C",     // Red — scores < 40
  gold: "#F1C40F",          // Points, badges, impersonated votes
  anonymous: "#95A5A6",     // Gray — anonymous votes
  userDot: "#3B82F6",       // Blue — user location dot
  axisLabel: "#666666",     // Axis tick labels
  gridStroke: "#E0E0E0",    // Chart grid lines
  white: "#FFFFFF",         // Borders, text on colored bg
} as const;
