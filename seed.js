// scripts/seed.js
// Run with: node scripts/seed.js

import { Client, Databases, ID } from "node-appwrite";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });

const APPWRITE_ENDPOINT  = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY   = process.env.APPWRITE_API_KEY;
const DATABASE_ID        = process.env.APPWRITE_DATABASE_ID;

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const db = new Databases(client);

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function createCollection(name, attributes) {
  console.log(`Creating collection: ${name}...`);
  const collection = await db.createCollection(DATABASE_ID, ID.unique(), name);
  const collectionId = collection.$id;

  for (const attr of attributes) {
    await createAttribute(collectionId, attr);
    await delay(300);
  }

  console.log(`✅ ${name} created (${collectionId})`);
  return collectionId;
}

async function createAttribute(collectionId, attr) {
  switch (attr.type) {
    case "string":
      await db.createStringAttribute(
        DATABASE_ID, collectionId, attr.key,
        attr.size || 255, attr.required || false,
        attr.required ? undefined : (attr.default ?? null)
      );
      break;
    case "float":
      await db.createFloatAttribute(
        DATABASE_ID, collectionId, attr.key,
        attr.required || false,
        attr.min ?? null, attr.max ?? null,
        attr.required ? undefined : (attr.default ?? null)
      );
      break;
    case "integer":
      await db.createIntegerAttribute(
        DATABASE_ID, collectionId, attr.key,
        attr.required || false,
        attr.min ?? null, attr.max ?? null,
        attr.required ? undefined : (attr.default ?? null)
      );
      break;
    case "boolean":
      await db.createBooleanAttribute(
        DATABASE_ID, collectionId, attr.key,
        attr.required || false,
        attr.required ? undefined : (attr.default ?? null)
      );
      break;
    case "datetime":
      await db.createDatetimeAttribute(
        DATABASE_ID, collectionId, attr.key,
        attr.required || false,
        attr.required ? undefined : (attr.default ?? null)
      );
      break;
    case "enum":
      await db.createEnumAttribute(
        DATABASE_ID, collectionId, attr.key,
        attr.elements, attr.required || false,
        attr.required ? undefined : (attr.default ?? null)
      );
      break;
  }
}

// ─── COLLECTIONS ─────────────────────────────────────────────────────────────

async function createCustomers() {
  return await createCollection("customers", [
    { key: "name",    type: "string",  required: true },
    { key: "email",   type: "string",  required: false },
    { key: "phone",   type: "string",  required: false },
    { key: "address", type: "string",  size: 1000, required: false },
    { key: "notes",   type: "string",  size: 1000, required: false },
  ]);
}

async function createInventoryItems() {
  return await createCollection("inventory_items", [
    { key: "name",                  type: "string",  required: true },
    { key: "category",              type: "enum",    required: true,
      elements: ["filament", "resin", "electronics", "wire", "hardware", "packaging", "other"] },
    { key: "unit",                  type: "enum",    required: true,
      elements: ["grams", "meters", "pieces", "liters"] },
    { key: "unit_cost",             type: "float",   required: true },
    { key: "stock_qty",             type: "float",   required: true },
    { key: "low_stock_threshold",   type: "float",   required: false, default: 0 },
    { key: "supplier",              type: "string",  required: false },
    { key: "supplier_sku",          type: "string",  required: false },
    { key: "weight_per_unit_grams", type: "float",   required: false, default: 0 },
    { key: "length_mm",             type: "float",   required: false },
    { key: "width_mm",              type: "float",   required: false },
    { key: "height_mm",             type: "float",   required: false },
    { key: "notes",                 type: "string",  size: 1000, required: false },
  ]);
}

async function createProducts() {
  return await createCollection("products", [
    { key: "name",          type: "string",  required: true },
    { key: "category",      type: "enum",    required: true,
      elements: ["lamp", "print", "enclosure", "decor", "other"] },
    { key: "description",   type: "string",  size: 2000, required: false },
    { key: "labor_cost",    type: "float",   required: false, default: 0 },
    { key: "making_cost",   type: "float",   required: false, default: 0 },
    { key: "selling_price", type: "float",   required: true },
    { key: "height_mm",     type: "float",   required: false },
    { key: "width_mm",      type: "float",   required: false },
    { key: "depth_mm",      type: "float",   required: false },
    { key: "image_id",      type: "string",  required: false },
    { key: "file_id",       type: "string",  required: false },
    { key: "is_active",     type: "boolean", required: false, default: true },
  ]);
}

async function createProductMaterials() {
  return await createCollection("product_materials", [
    { key: "product_id",          type: "string", required: true },
    { key: "inventory_item_id",   type: "string", required: true },
    { key: "quantity",            type: "float",  required: true },
    { key: "unit_cost_override",  type: "float",  required: false }, // null = use inventory unit_cost
    { key: "notes",               type: "string", required: false },
  ]);
}

async function createOrders() {
  return await createCollection("orders", [
    { key: "customer_id",     type: "string",  required: true },
    { key: "is_product",      type: "boolean", required: true },
    { key: "product_id",      type: "string",  required: false },
    { key: "title",           type: "string",  required: true },
    { key: "status",          type: "enum",    required: true,
      elements: ["pending", "printing", "done", "delivered", "cancelled"] },
    { key: "quantity",        type: "integer", required: true },
    { key: "unit_price",      type: "float",   required: true },
    { key: "total_price",     type: "float",   required: true },
    { key: "custom_material", type: "string",  required: false },
    { key: "custom_notes",    type: "string",  size: 2000, required: false },
    { key: "deadline",        type: "datetime",required: false },
    { key: "file_id",         type: "string",  required: false },
  ]);
}

async function createInvoices() {
  return await createCollection("invoices", [
    { key: "customer_id",    type: "string",   required: true },
    { key: "order_id",       type: "string",   required: true },
    { key: "invoice_number", type: "string",   required: true },
    { key: "amount",         type: "float",    required: true },
    { key: "status",         type: "enum",     required: true,
      elements: ["draft", "sent", "paid", "partially_paid"] },
    { key: "due_date",       type: "datetime", required: false },
    { key: "notes",          type: "string",   size: 1000, required: false },
  ]);
}

async function createPayments() {
  return await createCollection("payments", [
    { key: "invoice_id",     type: "string",   required: true },
    { key: "customer_id",    type: "string",   required: true },
    { key: "amount_paid",    type: "float",    required: true },
    { key: "payment_method", type: "enum",     required: true,
      elements: ["cash", "card", "bank_transfer", "online", "other"] },
    { key: "payment_date",   type: "datetime", required: false },
    { key: "notes",          type: "string",   required: false },
  ]);
}

// ─── SAMPLE DATA ─────────────────────────────────────────────────────────────

async function seedSampleData(ids) {
  console.log("\nSeeding sample data...");

  const customer = await db.createDocument(DATABASE_ID, ids.customers, ID.unique(), {
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    address: "123 Main St, City",
    notes: "Regular customer",
  });

  const bulb = await db.createDocument(DATABASE_ID, ids.inventoryItems, ID.unique(), {
    name: "LED Bulb E27",
    category: "electronics",
    unit: "pieces",
    unit_cost: 1.20,
    stock_qty: 50,
    low_stock_threshold: 10,
    supplier: "ElectroSupply Co.",
    weight_per_unit_grams: 80,
  });

  const holder = await db.createDocument(DATABASE_ID, ids.inventoryItems, ID.unique(), {
    name: "E27 Bulb Holder",
    category: "hardware",
    unit: "pieces",
    unit_cost: 0.50,
    stock_qty: 50,
    low_stock_threshold: 10,
    weight_per_unit_grams: 45,
  });

  const switch_ = await db.createDocument(DATABASE_ID, ids.inventoryItems, ID.unique(), {
    name: "2-Pin Switch",
    category: "electronics",
    unit: "pieces",
    unit_cost: 0.30,
    stock_qty: 100,
    low_stock_threshold: 20,
    weight_per_unit_grams: 20,
  });

  const wire = await db.createDocument(DATABASE_ID, ids.inventoryItems, ID.unique(), {
    name: "2-Core Wire",
    category: "wire",
    unit: "meters",
    unit_cost: 0.30,
    stock_qty: 200,
    low_stock_threshold: 20,
    weight_per_unit_grams: 40,
  });

  const pla = await db.createDocument(DATABASE_ID, ids.inventoryItems, ID.unique(), {
    name: "PLA Black",
    category: "filament",
    unit: "grams",
    unit_cost: 0.004,
    stock_qty: 5000,
    low_stock_threshold: 500,
    weight_per_unit_grams: 1,
  });

  const product = await db.createDocument(DATABASE_ID, ids.products, ID.unique(), {
    name: "Honeycomb Lamp",
    category: "lamp",
    description: "3D printed honeycomb pattern lamp with E27 bulb",
    labor_cost: 4.00,
    making_cost: 9.77,
    selling_price: 25.00,
    height_mm: 300,
    width_mm: 150,
    depth_mm: 150,
    is_active: true,
  });

  await db.createDocument(DATABASE_ID, ids.productMaterials, ID.unique(), {
    product_id: product.$id,
    inventory_item_id: bulb.$id,
    quantity: 1,
    notes: "Standard E27 LED",
  });
  await db.createDocument(DATABASE_ID, ids.productMaterials, ID.unique(), {
    product_id: product.$id,
    inventory_item_id: holder.$id,
    quantity: 1,
  });
  await db.createDocument(DATABASE_ID, ids.productMaterials, ID.unique(), {
    product_id: product.$id,
    inventory_item_id: switch_.$id,
    quantity: 1,
  });
  await db.createDocument(DATABASE_ID, ids.productMaterials, ID.unique(), {
    product_id: product.$id,
    inventory_item_id: wire.$id,
    quantity: 1.5,
    notes: "Cut to 1.5m before assembly",
  });
  await db.createDocument(DATABASE_ID, ids.productMaterials, ID.unique(), {
    product_id: product.$id,
    inventory_item_id: pla.$id,
    quantity: 80,
    notes: "80g for shade",
  });

  const order = await db.createDocument(DATABASE_ID, ids.orders, ID.unique(), {
    customer_id: customer.$id,
    is_product: true,
    product_id: product.$id,
    title: "Honeycomb Lamp",
    status: "pending",
    quantity: 2,
    unit_price: 25.00,
    total_price: 50.00,
  });

  const invoice = await db.createDocument(DATABASE_ID, ids.invoices, ID.unique(), {
    customer_id: customer.$id,
    order_id: order.$id,
    invoice_number: "INV-2024-001",
    amount: 50.00,
    status: "sent",
    notes: "Due on delivery",
  });

  await db.createDocument(DATABASE_ID, ids.payments, ID.unique(), {
    invoice_id: invoice.$id,
    customer_id: customer.$id,
    amount_paid: 25.00,
    payment_method: "cash",
    notes: "50% deposit",
  });

  console.log("✅ Sample data seeded!");
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Starting database seed...\n");

  try {
    const ids = {};

    ids.customers        = await createCustomers();        await delay(500);
    ids.inventoryItems   = await createInventoryItems();   await delay(500);
    ids.products         = await createProducts();         await delay(500);
    ids.productMaterials = await createProductMaterials(); await delay(500);
    ids.orders           = await createOrders();           await delay(500);
    ids.invoices         = await createInvoices();         await delay(500);
    ids.payments         = await createPayments();         await delay(500);

    await seedSampleData(ids);

    console.log("\n🎉 All done! Your database is ready.");
    console.log("\nCollection IDs (save these!):");
    console.log(JSON.stringify(ids, null, 2));

  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

main();