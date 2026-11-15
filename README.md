# DHANAK 2K27 — Embers from Ashes

Official web application for **Dhanak 2027**, the Annual Cultural Festival of the **Indian Institute of Space Science and Technology (IIST)**, Valiamala, Thiruvananthapuram, Kerala.

> Built upon the [Conscientia 2K27](https://github.com/kurmananda/conscientia) codebase by Kurmananda.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) & React 19
- **Styling & Animation:** Tailwind CSS v4, Framer Motion, GSAP, Three.js (`@react-three/fiber`, `@react-three/drei`), custom GLSL particle shaders
- **Database & Auth:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **Payments:** Razorpay Standard Checkout (`razorpay`) with HMAC-SHA256 server-side verification & webhook reconciliation
- **Icons & Utilities:** Lucide React, QRCode, jsQR, SheetJS (`xlsx`)

---

## Core Features & Routes

- **Public Fest Experience:** Home (`/`), About (`/about`), Events (`/events`, `/events/[id]`), Workshops (`/workshop`, `/workshop/[id]`, `/online-workshops`), Pronites (`/pronites`), Merch (`/merch`), Accommodation (`/accommodation`), Sponsors (`/sponsors`), Contact Us (`/contact-us`)
- **Registration, Teams & Checkout:**
  - Persistent cart (`/cart`) and Razorpay Standard Checkout (`/payment`, `/payment-success`, `/payment-failure`)
  - Team roster builder (`TeamRosterBuilder`) with pre-checkout validation and post-payment teammate management via `/api/team` and Supabase `event_teams`
  - Individual QR-coded fest passes and profile dashboard (`/profile`)
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

3. In **Supabase → Authentication → URL Configuration**, add your production Vercel domain (`https://<your-app>.vercel.app/**`) to **Redirect URLs** and **Site URL**.

---

## Configuration Notes

- **Brand & Navigation Config:** Centralized in `src/lib/festConfig.js`.
- **Event Registration Toggle:** Individual event pages currently gated with `"Announcing Later"` can be unlocked or re-locked reversibly via `UNLOCKED_EVENT_IDS` in `src/app/events/[id]/page.jsx`.
