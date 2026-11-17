# DHANAK 2K27 — Ember from Ashes

Official web application for **Dhanak 2027**, the Annual Cultural Festival of the **Indian Institute of Space Science and Technology (IIST)**, Valiamala, Thiruvananthapuram, Kerala.

> Built upon the [Conscientia 2K27](https://github.com/kurmananda/conscientia) codebase by Kurmananda.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) & React 19
- **Styling & Animation:** Tailwind CSS v4, Framer Motion, GSAP, Three.js (`@react-three/fiber`, `@react-three/drei`), custom GLSL particle shaders
- **Database & Auth:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **Email & Notifications:** Nodemailer (`nodemailer`) for custom DHANAK-branded verification and password-reset OTP emails
- **Payments:** Razorpay Standard Checkout (`razorpay`) with HMAC-SHA256 server-side verification & webhook reconciliation
- **Icons & Utilities:** Lucide React, QRCode, jsQR, SheetJS (`xlsx`)

---

## Core Features & Routes

- **Public Fest Experience:** Home (`/`) featuring the IIST emblem, theme branding (*Ember from Ashes*), and featured event spotlight; About (`/about`), Events (`/events`, `/events/[id]`), Workshops (`/workshop`, `/workshop/[id]`, `/online-workshops`), Pronites (`/pronites`), Merch (`/merch`), Accommodation (`/accommodation`), Sponsors (`/sponsors`), Contact Us (`/contact-us`)
- **Authentication & Account Recovery (`/login`, `/api/auth`):**
  - Email/password sign-up with mail-domain MX verification, OTP verification, and direct confirmation links
  - Forgot Password OTP reset flow (email OTP + new password confirmation)
  - Google Sign-In / OAuth support (`GoogleSignInButton`)
  - Mandatory profile completion (`ProfileCompletionModal`) prior to registration or checkout
- **Registration, Teams & Checkout:**
  - Persistent cart (`/cart`) and Razorpay Standard Checkout (`/payment`, `/payment-success`, `/payment-failure`)
  - Team roster builder (`TeamRosterBuilder`) with pre-checkout validation and post-payment teammate management via `/api/team` and Supabase `event_teams`
  - Individual QR-coded fest passes (`DHN-...`) and profile dashboard (`/profile`)
  - Certificate verification (`/certificate/verify`)
- **Admin Dashboard:** Event/workshop capacity, ticket management, team roster edits (`/api/admin/team`), check-in scanner, and logs (`/admin`)
- **Legal & Policy Pages:** `/terms-and-conditions`, `/privacy-policy`, `/refund-policy`, `/shipping-and-delivery`

---

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

1. Import **`Yuvraj2412/DHANAK2K27`** in Vercel (Framework Preset: **Next.js**, default `next build`).
2. Add the following **Environment Variables** in **Vercel → Project Settings → Environment Variables**:

   | Variable | Required | Purpose |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_KEY` | Yes | Supabase anon / public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side Supabase service role key |
   | `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Yes | Public Razorpay Key ID for Checkout UI |
   | `RAZORPAY_KEY_ID` | Yes | Server Razorpay Key ID |
   | `RAZORPAY_KEY_SECRET` | Yes | Server Razorpay Secret (order creation & HMAC verification) |
   | `RAZORPAY_WEBHOOK_SECRET` | Optional | Razorpay webhook signature verification |
   | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Optional | Google OAuth Client ID for Google Sign-In |
   | `GOOGLE_CLIENT_ID` | Optional | Server-side Google ID token verification |
   | `SMTP_USER` | Optional | SMTP / Gmail sender address for DHANAK verification & password-reset OTP emails |
   | `SMTP_PASS` | Optional | SMTP / Gmail 16-character App Password |
   | `SMTP_FROM_NAME` | Optional | Display name shown on outgoing DHANAK emails (e.g., `DHANAK 2027 · IIST`) |

3. In **Supabase → Authentication → URL Configuration**, add your production Vercel domain (`https://<your-app>.vercel.app/**`) to **Redirect URLs** and **Site URL** (and enable **Google** under **Authentication → Providers** if using Supabase Google OAuth).

---

## Configuration Notes

- **Brand & Navigation Config:** Centralized in `src/lib/festConfig.js`.
- **Events & Assets:** Event catalog and tile photography live in `src/lib/dhanakEvents.js` and `public/assets/events/`.
- **Workshops & Combos:** 8 official online workshops configured in `src/lib/dhanakWorkshops.js` with brochures in `public/brochures/`. Combo discounts (Space Combo, UAV Combo, Rover Combo, and 2-workshop Basic Combo) are computed in `src/lib/workshopCombos.js` and applied across cart, checkout, and Razorpay order generation.
- **Event Registration Toggle:** Individual event pages currently gated with `"Announcing Later"` can be unlocked or re-locked reversibly via `UNLOCKED_EVENT_IDS` in `src/app/events/[id]/page.jsx`.
