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
      color: "#27AE60", // Green
      description: "Safe and delicious — the ideal",
    },
    topLeft: {
      id: "survivor",
      label: "Survivor",
      emoji: "🛡️",
      color: "#3498DB", // Blue
      description: "Safe but mediocre taste",
    },
    bottomLeft: {
      id: "bin",
      label: "Bin",
      emoji: "🗑️",
      color: "#95A5A6", // Gray
      description: "Unsafe and bad taste — avoid",
    },
    bottomRight: {
      id: "risky",
      label: "Risky",
      emoji: "⚠️",
      color: "#E67E22", // Orange
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
  // DIETARY RESTRICTIONS (Multi-condition profiles)
  //////////////////////////////////////////////////////////////////////////////
  
  /**
   * Dietary restrictions with severity-based thresholds
   * Each restriction has 5 thresholds (1=mild, 5=severe) mapping to minimum safety scores
   */
  dietaryRestrictions: [
    {
      id: "celiac",
      label: "Celiac Disease",
      emoji: "🌾",
      description: "Severe gluten intolerance requiring strict avoidance",
      thresholds: [40, 50, 60, 70, 80], // Severity 1-5
    },
    {
      id: "gluten-sensitive",
      label: "Gluten Sensitive",
      emoji: "🍞",
      description: "Non-celiac gluten sensitivity",
      thresholds: [20, 35, 50, 65, 75], // Severity 1-5
    },
    {
      id: "lactose",
      label: "Lactose Intolerant",
      emoji: "🥛",
      description: "Difficulty digesting dairy products",
      thresholds: [30, 45, 60, 75, 85], // Severity 1-5
    },
    {
      id: "soy",
      label: "Soy Allergy",
      emoji: "🫘",
      description: "Allergic reaction to soy products",
      thresholds: [40, 55, 65, 75, 85], // Severity 1-5
    },
    {
      id: "nut",
      label: "Nut Allergy",
      emoji: "🥜",
      description: "Allergic reaction to nuts",
      thresholds: [50, 60, 70, 80, 90], // Severity 1-5 (high stakes)
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
  return appConfig.levels[appConfig.levels.length - 1];
}

/** Get store defaults for current locale (with fallback) */
export function getStoreDefaults(locale: string = "en"): readonly string[] {
  const localeKey = locale.split("-")[0] as keyof typeof appConfig.storeDefaults;
  return appConfig.storeDefaults[localeKey] || appConfig.storeDefaults.en;
}
