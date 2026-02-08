# G-Matrix App: Complete Design Summary
## Template for Niche Product Communities

---

## App Overview

**G-Matrix** is a social product discovery platform that combines:
- Community-driven product ratings & reviews
- Location-based product finding
- Gamification to encourage contributions
- Multi-dimensional rating system (Safety, Taste, Price)

**Core Value Proposition**: Find safe, tasty, affordable gluten-free products near you, verified by the community.

---

## Screen Architecture

### 1. Main Feed (Home Screen)
**Purpose**: Primary discovery interface

**Components**:
- **Header**: "Live Feed" title + filter icon
- **Filter Chips**: All | Recently Added | Updated | Nearby | Trending
- **Mini Map**: Embedded map showing nearby products (clickable → Full Map)
- **Product Grid**: 2-column scrollable grid
- **Bottom Nav**: Home | Map | Add | Profile

**Product Card Elements**:
- Safety dots (3 indicators: safety, taste, price)
- Product image
- Product name
- Distance from user
- Star rating
- Badge (if applicable: Holy Grail, New, Trending)

---

### 2. Product Detail Screen
**Purpose**: Comprehensive product information & community interaction

**Components**:
- **Hero**: Large product image
- **Header**: Product name + badges (Holy Grail, Certified GF)
- **Rating Bars**: Safety % | Taste % | Price %
- **Available Nearby**: Full-width interactive map + store list
- **Community Reviews**: User avatars + comments
- **Quick Vote**: Clean | Sketchy | Wrecked buttons
- **CTA**: "Add Your Review" button

**Interactions**:
- Tap map → Full Map view focused on this product
- Tap store → Store detail with directions
- Tap review → Expand full review

---

### 3. Full Map View
**Purpose**: Geographic product exploration

**Components**:
- **Search Bar**: "Search for gluten-free products..."
- **Full Map**: Product pins across area
- **Bottom Sheet**: "Products Near You" with horizontal scroll
- **Filter Chips**: Distance | Safety | Price | Recently Added
- **Floating Action Button**: Filter toggle

**Interactions**:
- Tap pin → Product preview card
- Swipe bottom sheet → Expand/collapse
- Tap product card → Product detail

---

### 4. Profile / Gamification Screen
**Purpose**: User achievements, contributions, community standing

**Components**:
- **User Header**: Avatar, username, level, progress bar
- **Stats Row**: Points | Day Streak | Products Added
- **Earned Badges**: Grid of achievement badges
  - First Review (gold)
  - Safety Scout (green)
  - Streak Master (fire)
  - Location Hunter (map)
- **Contributions Feed**: Chronological list of user actions with points
- **Leaderboard Preview**: Top 3 users
- **CTA**: "Share Your Profile"

**Gamification Mechanics**:
| Action | Points |
|--------|--------|
| Add new product | +50 pts |
| Add product with location | +75 pts |
| Update price | +10 pts |
| Add new location to existing product | +25 pts |
| Write review | +20 pts |
| Daily check-in | +5 pts |
| 7-day streak bonus | +50 pts |

---

### 5. Add Product Flow
**Purpose**: Onboard new products to the database

**Step 1: Scan**
- Camera viewfinder with barcode frame
- "Enter Manually" option
- Recent scans list
- Tips section

**Step 2: Product Details**
- Auto-filled info from barcode
- Photo upload
- Category selection
- Initial rating

**Step 3: Location (Optional)**
- "Where did you find this?"
- Store search or add new
- Price at this location
- Submit → Earn points

---

## Additional Features to Consider

### 1. Smart Notifications
- "Product you reviewed is now available closer!"
- "New GF bakery opened near you"
- "Your streak is about to break—check in!"
- "Price drop alert: Cookies you wanted"

### 2. Community Challenges
- "Add 5 products this week → Earn Explorer Badge"
- "Review 3 products → Unlock early access"
- Monthly leaderboards with prizes

### 3. Price Tracking
- Historical price charts per product
- "Best time to buy" predictions
- Price drop alerts

### 4. Dietary Profiles
- User sets: Celiac, Gluten-sensitive, Preference
- Products filtered by profile
- Safety ratings weighted by profile

### 5. Social Features
- Follow power users
- Share products to social media
- Create "lists" (e.g., "Best GF Pastries")

### 6. Store Profiles
- Store pages with all GF products
- Store safety ratings
- User-submitted store photos

### 7. Offline Mode
- Download product data for area
- Add products offline, sync later
- Essential for traveling

---

## Template Architecture for Niche Communities

G-Matrix is designed as a **reusable template** for any niche product community.

### Core Framework (Unchanged)
1. Product discovery feed
2. Map-based location finding
3. Multi-dimensional rating system
4. Community reviews
5. Gamification engine
6. Search & filter
7. User profiles

### Configurable Elements

| Element | Gluten-Free Example | Other Niche Examples |
|---------|--------------------|---------------------|
| **App Name** | G-Matrix | V-Matrix (Vegan), K-Matrix (Keto) |
| **Primary Color** | Sage Green (#7CB342) | Orange (Vegan), Purple (Keto) |
| **Category Term** | "Gluten-Free" | "Vegan", "Organic", "Keto" |
| **Rating Dimensions** | Safety, Taste, Price | Ethics, Taste, Price (Vegan) |
| **Badge Names** | Holy Grail, Russian Roulette | Plant Power, Animal Tested |
| **Certification** | Certified GF | Certified Vegan, USDA Organic |
| **Safety Concept** | Cross-contamination risk | Animal ingredients, Chemicals |

### Niche Examples

#### Vegan Matrix (V-Matrix)
- **Dimensions**: Ethics, Taste, Price, Sustainability
- **Badges**: Plant Power, Cruelty-Free, Hidden Animal
- **Certifications**: Certified Vegan, Leaping Bunny

#### Organic Matrix (O-Matrix)
- **Dimensions**: Purity, Taste, Price, Local
- **Badges**: 100% Organic, Clean Fifteen, Dirty Dozen
- **Certifications**: USDA Organic, Non-GMO

#### Keto Matrix (K-Matrix)
- **Dimensions**: Net Carbs, Taste, Price, Satiety
- **Badges**: Zero Carb, Keto King, Hidden Sugar
- **Certifications**: Keto Certified

---

## Technical Considerations

### Database Schema (Simplified)

```
Products
- id, name, brand, category, barcode, image_url
- safety_score, taste_score, price_score
- created_at, updated_at

Locations
- id, product_id, store_name, lat, lng, price
- added_by_user_id, created_at

Reviews
- id, product_id, user_id, rating, comment
- safety_vote, taste_vote, created_at

Users
- id, username, email, avatar_url
- total_points, current_streak, level
- created_at

Badges
- id, name, description, icon_url, points_required

User_Badges
- user_id, badge_id, earned_at

Contributions
- id, user_id, action_type, product_id
- points_earned, created_at
```

### APIs Needed
- Barcode lookup (Open Food Facts)
- Maps (Google Maps / Mapbox)
- Image storage (Cloudinary / S3)
- Push notifications (Firebase)

---

## Success Metrics

### Engagement
- DAU/MAU ratio
- Average session duration
- Products viewed per session
- Reviews per user

### Growth
- New products added per day
- New locations added per day
- User acquisition rate
- Viral coefficient (shares)

### Quality
- Average rating accuracy
- Reported incorrect data rate
- User retention (7d, 30d, 90d)
- NPS score

---

## Monetization Options

1. **Freemium**: Premium features (offline mode, advanced filters)
2. **Affiliate**: Product links to retailers
3. **Sponsored**: Featured product placements
4. **Store Subscriptions**: Stores pay to manage their profiles
5. **Data Insights**: Anonymized trend reports to manufacturers

---

## Next Steps

1. **MVP Scope**: Main feed, product detail, basic map, add product, simple gamification
2. **Beta Testing**: 100-500 users in one city
3. **Iterate**: Based on usage data and feedback
4. **Expand**: More cities, then other niches
5. **Scale**: Template system for rapid niche deployment

---

*Design System, UI Mockups, and this document form the complete design package for G-Matrix and its template variants.*
