# Lakhey Labs ERP — Notes Till Now

## Stack
- **Frontend:** Next.js 16 (App Router), TypeScript, CSS Modules
- **Backend:** Appwrite (collections + storage bucket)
- **Server Actions:** `"use server"` directive, `node-appwrite` admin client
- **Currency:** Nepalese Rupees via `src/lib/utils/currency.ts` → `formatCurrency()` → `Rs 1,500.00`

> **Critical constraint:** `"use server"` files may ONLY export async functions — no plain objects, constants, or non-function values. This caused a runtime error when `DEFAULT_CONFIG` was exported from `businessConfig.ts`.

---

## ✅ Fully Implemented

### Infrastructure
- Appwrite browser client (`src/lib/appwrite/client.ts`)
- Appwrite admin server client (`src/lib/appwrite/server.ts`) — API key auth
- Config with env vars (`src/lib/appwrite/config.ts`) — all collection IDs from `.env.local`
- Global layout: Sidebar + Topbar + ToastProvider
- Sidebar nav: Dashboard, Orders, Customers, Products, Inventory, Invoices, Settings
- Topbar: page title auto-derived from route, dark/light theme toggle (localStorage), New Order CTA
- Toast notification system (success / error / warning / info, 4s auto-dismiss)
- `ConfirmDialog` — uses `isOpen` prop (not `open`); `onConfirm` must be sync, wrap async as `() => { void fn(); }`
- `Loader`, `Badge` UI components
- Print styles in `globals.css`: `@page { margin: 0mm }` removes browser header/footer; `aside` and `header` hidden via `@media print`

### Dashboard (`/`)
- **4 stat cards:** Total Orders, Revenue (paid invoices sum), Total Customers, Low Stock count
- **Recent Orders** (last 5) — title, customer name (looked up), status badge, total price
- **Recent Invoices** (last 5) — invoice number, customer name, status badge, amount
- **Low Stock Alert panel** — appears only when items are at/below threshold; clickable cards link to inventory edit
- **Empty state** — shown when no orders and no customers exist
- All data fetched in one `getDashboardData()` call with parallel `Promise.all` across orders, invoices, inventory, customers
- Respects global `low_stock_threshold` from `business_config` as fallback when per-item threshold not set
- `src/lib/api/dashboard.ts`

### Inventory (`/inventory`)
- List — search by name/supplier, filter by category, low stock row highlighting
- Image thumbnails via Appwrite Storage
- Create, Edit, Delete (with ConfirmDialog)
- `adjustStock` action
- Server Actions: `getInventoryItems`, `getInventoryItem`, `createInventoryItem`, `updateInventoryItem`, `adjustStock`, `deleteInventoryItem`
- All numeric fields coerced to float before Appwrite write

### Customers (`/customers`)
- List — search by name, email, phone
- Create, Edit, Delete
- Customer detail page — contact card, notes card, order history
- Server Actions: `getCustomers`, `getCustomer`, `createCustomer`, `updateCustomer`, `deleteCustomer`

### Products (`/products`)
- List — search by name, filter by category, active/inactive toggle, margin % display
- Product image thumbnails
- Create, Edit, Delete — image upload + STL/3MF file upload
- **Product detail** — photo, pricing, dimensions, STL download
- **BOM Editor:**
  - List materials with base cost, override cost, effective cost, line total, weight
  - Add/Edit/Remove BOM lines; cost override = `null` uses live inventory price
  - Auto-syncs `making_cost` on product after every BOM change
  - Live summary: Material Cost, Labor Cost, Making Cost, Selling Price, Margin %, Total Weight
- Server Actions: `getProducts`, `getProduct`, `createProduct`, `updateProduct`, `toggleProductActive`, `deleteProduct`, `syncProductMakingCost`
- BOM Actions: `getBomForProduct`, `addBomLine`, `updateBomLine`, `removeBomLine`

### Storage
- `uploadFile`, `deleteFile`, `getFilePreviewUrl` (with optional width/height)

### Orders (`/orders`)
- List — search by title/customer, filter by status, overdue deadline highlighting
- Inline status change dropdown per row
- **Create** (`/orders/new`):
  - **Catalog order:** pick product → auto-fills title + unit price, quantity, deadline, delivery address (pre-filled from customer)
  - **Custom order:** filament type/color/weight, price per gram (auto-calculates unit price), dimensions (X/Y/Z mm), multi-color, assembly, single/multi-part, image + 3MF upload
  - `total_price = unit_price × quantity` auto-calculated
- Edit, Delete
- **Order detail** — pricing, customer card, product/print spec card, file attachments, "Generate Invoice" button → navigates to `/invoices/new?order_id=...`
- Server Actions: `getOrders`, `getOrder`, `getOrdersByCustomer`, `createOrder`, `updateOrder`, `updateOrderStatus`, `deleteOrder`

### Invoices (`/invoices`)
- List — search by invoice number/customer, filter by status (draft / sent / paid / partially_paid)
- Delete with ConfirmDialog
- **Create** (`/invoices/new`):
  - `order_id` query param pre-selects order and auto-fills customer + amount
  - Invoice number auto-generated: `PREFIX-YEAR-SEQ` (e.g. `INV-2026-001`)
  - Prefix and fiscal year from business config
- Edit (`/invoices/[id]/edit`)
- **Invoice detail** (`/invoices/[id]`) — header with status badge, customer info, order info, amounts, payment panel
- **PaymentPanel** (client component on detail page):
  - Lists all payments with date, method, notes, amount
  - Shows balance summary bar (total due / paid / remaining)
  - Inline "Add Payment" form — validates `amount ≤ remaining`
  - Delete payment
  - After every add/delete: `syncInvoiceStatus()` auto-updates invoice status:
    - `totalPaid >= amount` → `paid`
    - `totalPaid > 0` → `partially_paid`
    - `totalPaid = 0` (was partially_paid) → `sent`
- **Print Bill** (`/invoices/[id]/print`):
  - Shows: logo (Appwrite storage), company name, tagline, address, phone, email, PAN, VAT number
  - Line items from linked order (qty, unit price, total)
  - Totals: Subtotal → VAT line (if enabled, Nepal 13%) → Grand Total → Amount Paid → Balance Due
  - Payment history table
  - Invoice notes (invoice-specific or config default)
  - "Print / Save PDF" button → `window.print()`
  - `@page { margin: 0mm }` removes browser title/URL/date header in PDF
  - Sidebar + topbar hidden via `@media print { aside, header { display: none } }`
- Server Actions: `getInvoices`, `getInvoice`, `getInvoicesByCustomer`, `createInvoice`, `updateInvoice`, `deleteInvoice`, `generateInvoiceNumber`
- Payment Actions: `getPaymentsByInvoice`, `addPayment`, `deletePayment`, `syncInvoiceStatus`

### Settings (`/settings`)
Stored in Appwrite `business_config` collection as a **singleton document** with fixed ID `"main"` (upsert pattern: try `getDocument` → update if exists, `createDocument` if not).

**5 tabs:**

| Tab | Fields |
|---|---|
| **Business Profile** | Company name, tagline, email, phone, address, website, logo (upload/remove via Appwrite Storage), PAN number, VAT registration number, Company registration number |
| **Invoice Defaults** | Invoice prefix (with live preview of generated number), payment terms, default notes, VAT enabled toggle, VAT rate (%) |
| **Operations** | Low stock threshold (global fallback for inventory), default order deadline (days), Fiscal Year Type (Calendar Jan–Dec or Nepal FY Shrawan–Ashadh ~Jul 16) |
| **Data Export** | Export Orders, Customers, Invoices as CSV (browser download, no server file) |
| **Appearance** | Dark/Light theme toggle (saves to localStorage) |

- Fiscal year affects `generateInvoiceNumber()`: Nepal FY → uses FY start year as label
- `src/lib/api/businessConfig.ts` — `getBusinessConfig()`, `saveBusinessConfig()`
- `src/lib/api/exports.ts` — `getOrdersForExport()`, `getCustomersForExport()`, `getInvoicesForExport()`

---

## Appwrite Collections

| Collection | Env Var | Status |
|---|---|---|
| `inventory_items` | `NEXT_PUBLIC_COLLECTION_INVENTORY_ITEMS` | ✅ |
| `products` | `NEXT_PUBLIC_COLLECTION_PRODUCTS` | ✅ |
| `product_materials` | `NEXT_PUBLIC_COLLECTION_PRODUCT_MATERIALS` | ✅ — needs `unit_cost_override` Float attribute |
| `customers` | `NEXT_PUBLIC_COLLECTION_CUSTOMERS` | ✅ |
| `orders` | `NEXT_PUBLIC_COLLECTION_ORDERS` | ✅ |
| `invoices` | `NEXT_PUBLIC_COLLECTION_INVOICES` | ✅ |
| `payments` | `NEXT_PUBLIC_COLLECTION_PAYMENTS` | ✅ |
| `business_config` | `NEXT_PUBLIC_COLLECTION_BUSINESS_CONFIG` | ✅ — see attribute list below |

### `business_config` collection attributes (all optional/not required)
| Attribute | Type |
|---|---|
| `company_name` | String (255) |
| `tagline` | String (255) |
| `email` | Email |
| `phone` | String (50) |
| `address` | String (1000) |
| `website` | URL |
| `logo_id` | String (36) |
| `pan_number` | String (50) |
| `vat_number` | String (50) |
| `company_reg_number` | String (100) |
| `vat_enabled` | Boolean |
| `vat_rate` | Integer (0–100) |
| `invoice_prefix` | String (20) |
| `invoice_default_notes` | String (2000) |
| `invoice_payment_terms` | String (500) |
| `low_stock_threshold` | Integer |
| `default_order_deadline_days` | Integer |
| `fiscal_year_type` | String (20) |

---

## Key Patterns & Gotchas

- **`"use server"` files:** Only export async functions. No plain objects/constants. `DEFAULT_CONFIG` in `businessConfig.ts` is intentionally unexported.
- **ConfirmDialog:** Always use `isOpen={...}` and `onConfirm={() => { void asyncFn(); }}` (sync wrapper).
- **CSS print isolation:** `@page { margin: 0mm }` in `globals.css` removes browser print headers. App chrome (`aside`, `header`) hidden globally. No `visibility: hidden` trick — just hide shell, let content flow naturally.
- **Invoice number format:** `PREFIX-YEAR-SEQ` e.g. `INV-2026-001`. Nepal FY: year = FY start year (so March 2026 → 2025 for FY 2025/26).
- **Business config singleton:** Always document ID `"main"`. `getBusinessConfig()` returns `DEFAULT_CONFIG` on 404 — never throws.
- **Appwrite float coercion:** All numeric form inputs must be `Number(val)` before writing or Appwrite throws "must be valid float".
- **Next.js Image + Appwrite:** Use `unoptimized` prop on `<Image>` for Appwrite storage URLs.

