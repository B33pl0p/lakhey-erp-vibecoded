# PrintFlow ERP — Notes Till Now

## Stack
- **Frontend:** Next.js 16 (App Router), TypeScript, CSS Modules
- **Backend:** Appwrite (collections + storage bucket)
- **Server Actions:** `node-appwrite` with admin API key
- **Currency:** Nepalese Rupees via `src/lib/utils/currency.ts` → `formatCurrency()`

---

## ✅ Implemented

### Infrastructure
- Appwrite client (`src/lib/appwrite/client.ts`) — browser singleton
- Appwrite admin client (`src/lib/appwrite/server.ts`) — server-only, API key auth
- Config with env vars (`src/lib/appwrite/config.ts`)
- Global layout: Sidebar + Topbar + ToastProvider
- Sidebar nav: Dashboard, Orders, Customers, Products, Inventory, Invoices, Settings
- Topbar: page title, dark/light theme toggle (localStorage), New Order CTA
- Toast notification system (success / error / warning / info, 4s auto-dismiss)
- ConfirmDialog component
- Loader, Badge UI components
- Currency utility (`formatCurrency`) — outputs `Rs 1,500.00`

### Homepage (`/`)
- Live Appwrite connection status indicator
- Inventory item count and product count from DB
- Hero landing with feature cards

### Inventory (`/inventory`)
- List all items — search by name/supplier, filter by category
- Low stock row highlighting (red) when `stock_qty <= low_stock_threshold`
- Image thumbnails via Appwrite Storage
- Create new item (`/inventory/new`)
- Edit item (`/inventory/[id]/edit`)
- Delete item with ConfirmDialog
- Server Actions: `getInventoryItems`, `getInventoryItem`, `createInventoryItem`, `updateInventoryItem`, `adjustStock`, `deleteInventoryItem`
- All numeric fields coerced to float before Appwrite write (fixes "must be valid float" error)

### Customers (`/customers`)
- List all customers — search by name, email, or phone
- Create new customer (`/customers/new`) — name (required), email, phone, address, notes
- Edit customer (`/customers/[id]/edit`)
- Delete customer with ConfirmDialog
- Customer detail page (`/customers/[id]`) — contact info card, notes card, order history placeholder
- Server Actions: `getCustomers`, `getCustomer`, `createCustomer`, `updateCustomer`, `deleteCustomer`

### Products (`/products`)
- List all products — search by name, filter by category
- Active/Inactive toggle directly from list
- Margin % calculated and displayed per row
- Product image thumbnails
- Create new product (`/products/new`) — with image upload + STL/3MF file upload
- Edit product (`/products/[id]/edit`)
- Delete product with ConfirmDialog
- **Product detail page** (`/products/[id]`)
  - Product photo, pricing summary, dimensions, STL download link
  - **BOM Editor** (Bill of Materials):
    - List all materials with: base inventory cost, optional override cost, effective cost, line total, weight
    - Add material — searchable dropdown of inventory items + quantity + cost override field
    - Edit BOM line inline — quantity and cost override editable
    - Remove BOM line with ConfirmDialog
    - Auto-syncs `making_cost` on the product after every BOM change
    - Live summary: Material Cost, Labor Cost, Making Cost, Selling Price, Margin %, Total Weight
  - Cost override logic: `unit_cost_override = null` → uses live inventory price; set a value → overrides for this product only
- Server Actions: `getProducts`, `getProduct`, `createProduct`, `updateProduct`, `toggleProductActive`, `deleteProduct`, `syncProductMakingCost`
- BOM Actions: `getBomForProduct`, `addBomLine`, `updateBomLine`, `removeBomLine`

### Storage
- `uploadFile` — uploads image/file to Appwrite bucket, returns `file_id`
- `deleteFile`
- `getFilePreviewUrl` — generates preview URL with optional width/height

---

### Orders (`/orders`)
- List all orders — search by title/customer, filter by status
- Inline status change dropdown per row (pending → printing → done → delivered → cancelled)
- Overdue deadline highlighting (red)
- Create new order (`/orders/new`):
  - **Catalog order**: pick product → auto-fills title + unit price (overridable), quantity, deadline, delivery address
  - **Custom order**: title, filament type/color/weight, price per gram (auto-calculates unit price), dimensions (X/Y/Z mm), multi-color, assembly, single vs multi-part, custom material notes, custom notes, reference image upload, 3MF/STL file upload
  - Delivery address pre-fills from customer's saved address (editable)
  - total_price auto-calculated as unit_price × quantity
- Edit order (`/orders/[id]/edit`) — all fields editable
- Order detail page (`/orders/[id]`) — pricing summary, customer card with link, product card (catalog), print spec card (custom), attachments (download 3MF, view image), "Generate Invoice" button
- Delete order with ConfirmDialog
- Server Actions: `getOrders`, `getOrder`, `getOrdersByCustomer`, `createOrder`, `updateOrder`, `updateOrderStatus`, `deleteOrder`
- New Appwrite attributes added to `orders` collection: `image_id`, `filament_price_per_gram`, `filament_weight_grams`, `delivery_address`, `filament_type`, `filament_color`, `is_multicolor`, `is_assembled`, `is_single_part`, `print_x_mm`, `print_y_mm`, `print_z_mm`

## ❌ Not Yet Implemented

### Invoices (`/invoices`)
- List with filter by status
- Create invoice — links to order, auto-fills customer + amount, due date, notes, auto-generates invoice number (`INV-YYYY-XXX`)
- Edit invoice
- Invoice detail with payments section:
  - Add payment (amount, method, date, notes)
  - Total paid / remaining balance
  - Auto-status to "paid" when balance hits zero
- Delete invoice

### Dashboard (`/`) — full version
- Stats cards: total orders, pending orders, total revenue (paid invoices), low stock count
- Recent orders table (last 5)
- Recent customers list (last 5)
- Low stock items list

### Settings (`/settings`)
- Business profile: name, email, phone, address, logo upload
- Theme toggle (currently in Topbar only)
- Stored in localStorage

---

## Appwrite Collections (all exist)
| Collection | Status |
|---|---|
| `inventory_items` | ✅ In use |
| `products` | ✅ In use |
| `product_materials` | ✅ In use — needs `unit_cost_override` float attribute added |
| `customers` | ✅ In use |
| `orders` | ✅ In use |
| `invoices` | Schema exists, not wired up |
| `payments` | Schema exists, not wired up |

> **Action required:** Add `unit_cost_override` (Float, optional) to the `product_materials` collection in Appwrite console.
