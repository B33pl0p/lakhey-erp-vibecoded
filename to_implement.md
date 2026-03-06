FEATURES LIST — 3D Print Business Management System

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Total orders count card
- Pending orders count card
- Total revenue card (sum of all paid invoices)
- Low stock alerts count card
- Recent orders table (last 5) with status badge, customer, title, total price
- Recent customers list (last 5) with name, email, phone
- Low stock inventory items list with item name, current stock, threshold

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- List all orders in a table with columns: title, customer name, status badge,
  quantity, total price, deadline, created date
- Filter orders by status (pending, printing, done, delivered, cancelled)
- Search orders by title or customer name
- Create new order form:
  * Select existing customer via searchable dropdown
  * Toggle between "Catalog Product" and "Custom Job"
  * If Catalog Product: select product from dropdown, auto-fill title and unit_price
  * If Custom Job: manually enter title, custom_material, custom_notes, unit_price
  * Enter quantity — total_price auto-calculates as unit_price x quantity
  * Set deadline with date picker
  * Optional: upload a file (STL, image, reference)
- Edit existing order (all fields editable, status updatable)
- Order detail page:
  * Full order information display
  * Customer info with link to customer page
  * Status update button (quick status change)
  * If linked to product — show product name with link
  * Button to generate invoice from this order
- Delete order with confirmation dialog

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CUSTOMERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- List all customers in a table with columns: name, email, phone, total orders count
- Search customers by name, email, or phone
- Create new customer form: name, email, phone, address, notes
- Edit existing customer
- Customer detail page:
  * Full customer info
  * Complete order history table for that customer
  * Total spent (sum of their paid invoices)
- Delete customer with confirmation dialog

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- List all products in a table with columns: name, category, selling_price,
  making_cost, margin %, is_active toggle
- Filter products by category (lamp, print, enclosure, decor, other)
- Toggle product active/inactive directly from the list
- Create new product form:
  * name, category, description
  * labor_cost, selling_price
  * dimensions: height_mm, width_mm, depth_mm
  * upload product image
  * upload STL/3MF file
- Edit existing product
- Product detail page:
  * Full product info with image
  * BOM Editor (Bill of Materials):
    - List all materials: inventory item name, quantity, unit, unit cost, line total
    - Add material: searchable dropdown of inventory items + quantity input
    - Remove material with confirmation
    - Auto-calculated summary:
      * Total material cost (sum of all BOM lines)
      * Total weight in grams
      * Making cost (material cost + labor cost)
      * Margin % = ((selling_price - making_cost) / selling_price) x 100
- Delete product with confirmation dialog

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INVENTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- List all inventory items in a table with columns: name, category, stock_qty,
  unit, unit_cost, supplier
- Highlight rows in red/orange where stock_qty is below low_stock_threshold
- Filter by category (filament, resin, electronics, wire, hardware, packaging, other)
- Search by name or supplier
- Create new inventory item form:
  * name, category, unit
  * unit_cost, stock_qty, low_stock_threshold
  * supplier, supplier_sku
  * weight_per_unit_grams
  * dimensions: length_mm, width_mm, height_mm
  * notes
- Edit existing inventory item
- Adjust stock quantity (quick +/- stock update without full edit)
- Delete inventory item with confirmation dialog
  (warn if item is used in any product BOM)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INVOICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- List all invoices in a table with columns: invoice_number, customer name,
  order title, amount, status badge, due_date
- Filter by status (draft, sent, paid, partially_paid)
- Search by invoice number or customer name
- Create invoice form:
  * Select order via searchable dropdown
  * Customer auto-fills from selected order
  * Amount auto-fills from order total_price
  * Set due_date
  * Add notes
  * Auto-generate invoice_number (format: INV-YYYY-XXX)
- Edit invoice (status, due_date, notes)
- Invoice detail page:
  * Full invoice information
  * Customer info with link
  * Linked order info with link
  * Payments section:
    - List all payments: amount_paid, payment_method, payment_date, notes
    - Total paid amount
    - Remaining balance (invoice amount - total paid)
    - Status auto-updates to "paid" when balance reaches zero
  * Add payment form:
    - amount_paid, payment_method (cash/card/bank_transfer/online/other)
    - payment_date, notes
- Delete invoice with confirmation dialog

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SETTINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Business profile: name, email, phone, address, logo upload
- Theme toggle: dark / light mode
- All settings stored in localStorage

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GLOBAL UI/UX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Sidebar navigation with icons for all sections
- Topbar with page title and quick action button (e.g. "New Order")
- Responsive layout (works on tablet and desktop)
- Dark theme by default
- Status badges with consistent colors:
  * Orders: pending=yellow, printing=blue, done=green, delivered=gray, cancelled=red
  * Invoices: draft=gray, sent=blue, paid=green, partially_paid=yellow
- Loading skeletons while data is fetching
- Toast notifications for all create / update / delete actions
- Empty state illustrations with helpful message when no data exists
- Confirmation dialogs before any delete action
- Form validation with inline error messages