# 3D Printer ERP

An ERP and public storefront for a 3D printing business, built with Next.js, Appwrite, and TypeScript. The app powers the Lakhey Labs customer-facing website, product ordering flow, custom project inquiries, and an authenticated admin dashboard for day-to-day operations.

## Features

- Public website with homepage content, product listing, product detail pages, cart, checkout, order tracking, account page, and custom project inquiry form.
- Admin dashboard with summaries for orders, revenue, receivables, customers, low stock, and fiscal-period profit/loss.
- ERP modules for customers, products, bill of materials, inventory, orders, invoices, payments, quotations, expenses, finance, job tasks, pricing, and business settings.
- Website content management for testimonials, clients, homepage sections, global site settings, and inbound inquiries.
- Appwrite-backed authentication, database records, and file storage.
- Customer sessions for storefront ordering and separate admin-session protection for `/admin`.
- Invoice and quotation print views.
- SMTP email support for order confirmation emails.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Appwrite / node-appwrite
- CSS Modules
- lucide-react icons
- Nodemailer
- ESLint

## Project Structure

```text
src/app/                  Next.js routes and pages
src/app/admin/            Authenticated ERP/admin screens
src/app/api/              Route handlers for sessions, notifications, inquiries
src/components/           Reusable UI and business components
src/components/website/   Public website components
src/lib/api/              Server actions and Appwrite data access modules
src/lib/appwrite/         Appwrite config and server/client factories
src/lib/auth/             Admin session signing helpers
src/lib/cart/             Client cart state
src/lib/email/            SMTP mailer and email templates
src/lib/products/         Product category constants
scripts/                  Appwrite setup/maintenance scripts
public/                   Static assets
```

## Requirements

- Node.js 20 or newer
- npm
- Appwrite project with Database, Storage, and Auth enabled
- SMTP account for email sending, if order emails are needed

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Add the Appwrite and SMTP variables listed below, then run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

The app reads Appwrite configuration from environment variables. Public variables are used by browser-rendered image/file URLs, while the API key must remain server-only.

```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=
NEXT_PUBLIC_APPWRITE_PROJECT_ID=
NEXT_PUBLIC_APPWRITE_DATABASE_ID=
APPWRITE_DATABASE_ID=
APPWRITE_API_KEY=
NEXT_PUBLIC_APPWRITE_BUCKET_ID=

NEXT_PUBLIC_COLLECTION_CUSTOMERS=
NEXT_PUBLIC_COLLECTION_INVENTORY_ITEMS=
NEXT_PUBLIC_COLLECTION_PRODUCTS=
NEXT_PUBLIC_COLLECTION_PRODUCT_MATERIALS=
NEXT_PUBLIC_COLLECTION_ORDERS=
NEXT_PUBLIC_COLLECTION_INVOICES=
NEXT_PUBLIC_COLLECTION_PAYMENTS=
NEXT_PUBLIC_COLLECTION_QUOTATIONS=
NEXT_PUBLIC_COLLECTION_EXPENSES=
NEXT_PUBLIC_COLLECTION_JOB_TASKS=

# Optional overrides; defaults are shown in code when omitted.
NEXT_PUBLIC_COLLECTION_BUSINESS_CONFIG=business_config
NEXT_PUBLIC_COLLECTION_WEBSITE_SETTINGS=website_settings
NEXT_PUBLIC_COLLECTION_WEBSITE_TESTIMONIALS=website_testimonials
NEXT_PUBLIC_COLLECTION_WEBSITE_CLIENTS=website_clients
NEXT_PUBLIC_COLLECTION_WEBSITE_SECTIONS=website_sections
NEXT_PUBLIC_COLLECTION_WEBSITE_FAQ=website_faq
NEXT_PUBLIC_COLLECTION_WEBSITE_INQUIRIES=website_inquiries

# Optional but recommended. Falls back to APPWRITE_API_KEY if omitted.
ADMIN_SESSION_SIGNING_KEY=

# SMTP email sending
SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Lakhey Labs <hello@example.com>"
```

## Appwrite Setup

The application expects these core collections:

- `customers`
- `inventory_items`
- `products`
- `product_materials`
- `orders`
- `invoices`
- `payments`
- `quotations`
- `expenses`
- `job_tasks`
- `business_config`
- `website_settings`
- `website_testimonials`
- `website_clients`
- `website_sections`
- `website_faq`
- `website_inquiries`

There is a root-level `seed.js` script that creates the original core collections and sample records:

```bash
node seed.js
```

After core Appwrite setup, initialize website CMS collections and seed default homepage content:

```bash
npm run setup:website
```

If product category enum values need to be added in Appwrite:

```bash
npm run categories:sync -- custom-category another-category
```

## Available Scripts

```bash
npm run dev              # Start local development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run setup:website    # Ensure and seed website CMS collections
npm run categories:sync  # Add values to the products.category enum
```

## Important Routes

Public website:

- `/` - homepage
- `/products` - product catalog
- `/products/[id]` - product detail
- `/cart` - cart
- `/order` - checkout/order placement
- `/account` - customer account/orders
- `/track` - order tracking
- `/studio` - custom project inquiry form
- `/login` - admin login

Admin ERP:

- `/admin` - dashboard
- `/admin/orders`
- `/admin/customers`
- `/admin/products`
- `/admin/inventory`
- `/admin/invoices`
- `/admin/quotations`
- `/admin/expenses`
- `/admin/finance`
- `/admin/tasks`
- `/admin/pricing`
- `/admin/website`
- `/admin/settings`

## Authentication Notes

Admin pages are protected by `src/middleware.ts`. A valid admin login sets both:

- `appwrite-session`
- `admin-session`

Customer storefront sessions also use `appwrite-session`, but are marked separately with `customer-session`. Logging in as one role clears the other role marker.

## Data Access Pattern

Most business operations live in `src/lib/api/*` as server actions or server-only Appwrite access helpers. UI pages call these functions directly from server components or pass data into client components for forms and interactions.

Key modules include:

- `customers.ts`
- `products.ts`
- `inventory.ts`
- `orders.ts`
- `invoices.ts`
- `payments.ts`
- `quotations.ts`
- `expenses.ts`
- `finance.ts`
- `jobTasks.ts`
- `website.ts`
- `websiteInquiries.ts`
- `customerAuth.ts`

## Deployment

The app can be deployed anywhere that supports Next.js. For production:

1. Set all required Appwrite environment variables.
2. Set `APPWRITE_API_KEY` only as a server-side secret.
3. Configure the Appwrite project platform/domain for the production URL.
4. Ensure the Storage bucket permissions match the intended file preview/download behavior.
5. Configure SMTP variables if email sending is enabled.
6. Run:

```bash
npm run build
npm run start
```

## Development Notes

- The app uses the `@/*` TypeScript path alias for `src/*`.
- Server Actions accept uploads up to `10mb` through `next.config.ts`.
- Currency formatting is centralized in `src/lib/utils/currency.ts`.
- Business settings such as invoice prefix, quotation prefix, VAT, fiscal year mode, and pricing rates are stored in the singleton `business_config` document with ID `main`.
