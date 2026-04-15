# Banalata Restaurant & Hub 🥘👑

A premium, highly interactive web application for **Banalata Bengali Desi Dhaba**, designed for engagement, customer loyalty, and automated SEO.

## 🚀 Professional Features
- **Signature Community Gallery**: User-contributed photo gallery with automatic client-side WebP optimization (<1MB) and admin moderation.
- **Automated Gallery SEO**: Content-driven metadata generation using customer photo descriptions to boost local search rankings.
- **Gamified Loyalty System**: A 5-level Tic-Tac-Toe engine (with balanced AI difficulty) where users win redeemable coupons.
- **Admin Command Center**: Centralized dashboard for menu management, coupon tracking, and gallery moderation.
- **Mobile-First Experience**: 100% responsive design with smooth animations and touch-optimized navigation.

## 🛠️ Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database / Auth / Storage**: Supabase
- **Styling**: Vanilla Tailwind CSS 4
- **Image Processing**: HTML5 Canvas (Client-side WebP conversion)

## 🔐 Security & User Management
### Admin Access
Admin access is centrally managed via a **Whitelist system** to ensure maximum security without hardcoding secrets.
- **File**: `lib/admins.js`
- To add a new admin (e.g., the owner), simply add their email to the `ADMIN_EMAILS` array.

### Database Schema
All SQL migrations and schema definitions are documented locally in the `supabase/migrations/` folder for version control and easy recovery.

## 📖 Feature Guides
### Menu Management
Admims can add, edit, or delete dishes in real-time. Categories can be dynamically expanded using the "Custom Category" feature.

### Gallery Moderation
1. Guests upload photos via the **"Upload Your Moment"** portal.
2. Photos are optimized locally to save bandwidth and storage.
3. Admins review submissions in the **Gallery Moderation** tab.
4. Once approved, photos appear on the public site with their SEO-rich captions.

## 💻 Development
To run the project locally:
```bash
npm install
npm run dev
```

---
*Made with ❤️ for Banalata Bengali Desi Dhaba*
