# G-Matrix Design System
## A Template for Niche Product Communities

---

## Color Palette

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| Sage Green | `#7CB342` | Primary actions, safe indicators, badges |
| Forest Green | `#558B2F` | Hover states, emphasis |
| Light Sage | `#AED581` | Backgrounds, secondary elements |

### Neutral Colors
| Name | Hex | Usage |
|------|-----|-------|
| Cream | `#FAF8F5` | Main background |
| Warm White | `#FFFFFF` | Cards, surfaces |
| Charcoal | `#2D3436` | Primary text |
| Gray | `#636E72` | Secondary text |
| Light Gray | `#B2BEC3` | Borders, dividers |

### Semantic Colors
| Name | Hex | Usage |
|------|-----|-------|
| Safety Green | `#27AE60` | High safety rating |
| Caution Amber | `#F39C12` | Medium safety, risky treats |
| Danger Red | `#E74C3C` | Low safety, avoid |
| Gold | `#F1C40F` | Achievements, points |
| Teal | `#16A085` | Safe but meh zone |

### Dark Mode (Optional)
| Name | Hex | Usage |
|------|-----|-------|
| Deep Navy | `#0F172A` | Background |
| Slate | `#1E293B` | Cards |
| Soft Amber | `#FBBF24` | Accents |

---

## Typography

### Font Family
- **Primary**: Inter (Google Fonts)
- **Fallback**: system-ui, -apple-system, sans-serif

### Type Scale
| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 28px | 700 | Screen titles |
| H2 | 22px | 600 | Section headers |
| H3 | 18px | 600 | Card titles |
| Body | 16px | 400 | Primary content |
| Small | 14px | 400 | Secondary content |
| Caption | 12px | 500 | Labels, badges |

---

## Components

### Product Card
- White background
- 16px border radius
- Soft shadow: `0 2px 8px rgba(0,0,0,0.08)`
- Safety dots row at top (3 dots: safety, taste, price)
- Product image (square, 120px)
- Product name (H3)
- Rating badges
- Distance indicator

### Safety Dots
- 8px circles in a row
- Green: 80-100 score
- Yellow: 50-79 score
- Red: 0-49 score
- Gray: no data

### Filter Chips
- Pill shape (24px radius)
- Inactive: white bg, gray border
- Active: sage green bg, white text
- Horizontal scroll container

### Rating Bars
- 8px height
- Rounded ends
- Filled portion in sage green
- Background in light gray

### Buttons
- **Primary**: Sage green bg, white text, 12px 24px padding
- **Secondary**: White bg, sage green border, sage text
- **Ghost**: Transparent, sage text
- Border radius: 12px

### Badges
- **Holy Grail**: Gold bg, dark text, trophy icon
- **Certified**: Sage border, checkmark icon
- **New**: Amber bg, sparkles icon
- **Trending**: Red bg, fire icon

---

## Layout Grid

### Mobile (Base)
- 16px side margins
- 12px gap between cards
- 2-column grid for products
- Full-width sections

### Tablet
- 24px side margins
- 3-column grid for products

### Desktop
- Max width: 1200px, centered
- 4-column grid for products
- Sidebar for filters

---

## Iconography

### Icon Set
- Phosphor Icons (consistent, rounded style)
- Size: 20px default, 24px for navigation
- Stroke width: 1.5px

### Key Icons
- Home, MapPin, Search, Scan, Plus
- Shield (safety), Star (taste), Tag (price)
- Trophy, Flame, Medal (gamification)
- Heart, Share, Flag (actions)

---

## Animation Principles

### Micro-interactions
- Button press: scale 0.97
- Card hover: translateY(-2px), shadow increase
- Filter chip: background color transition 200ms
- Rating bars: width animation on load

### Page Transitions
- Slide from right for detail pages
- Fade for modal overlays
- Spring animation for bottom sheets

---

## Accessibility

### Contrast Ratios
- Text on cream: 4.5:1 minimum
- Interactive elements: 3:1 minimum
- Focus states: 2px outline, offset 2px

### Touch Targets
- Minimum 44x44px for buttons
- 8px spacing between touch targets

---

## Niche Template Architecture

### Configurable Elements
1. **Brand Colors**: Primary, secondary, semantic
2. **Category Name**: "Gluten-Free" → customizable
3. **Rating Dimensions**: Safety/Taste/Price → configurable
4. **Badge Names**: Holy Grail, etc. → customizable
5. **Certification Types**: Certified GF → niche-specific

### Core Modules (Always Present)
- Product discovery feed
- Map integration
- User ratings & reviews
- Gamification system
- Search & filter
- User profiles

### Optional Modules
- Barcode scanning
- Price tracking
- Location offers
- Social sharing
- Community challenges
