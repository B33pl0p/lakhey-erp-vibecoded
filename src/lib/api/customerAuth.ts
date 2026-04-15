"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Account, Client, ID, Query } from "node-appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { createOrder } from "@/lib/api/orders";
import { getProduct } from "@/lib/api/products";

type CustomerAuthInput = {
  name?: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  nextPath?: string;
};

type WebsiteOrderInput = {
  productId: string;
  quantity: number;
  phone?: string;
  address: string;
  notes?: string;
};

type WebsiteCartOrderInput = {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  phone?: string;
  address: string;
  notes?: string;
};

export type WebsiteTrackedOrder = {
  orderId: string;
  title: string;
  status: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  deliveryAddress?: string;
  notes?: string;
};

export type WebsiteCustomerOrderSummary = {
  orderId: string;
  title: string;
  status: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
};

async function setCustomerSessionCookies(secret: string) {
  const cookieStore = await cookies();

  cookieStore.set("appwrite-session", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  cookieStore.set("customer-session", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  cookieStore.delete("admin-session");
}

async function getAccountFromSessionSecret(secret: string) {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setSession(secret);

  const account = new Account(client);
  return await account.get();
}

async function ensureCustomerRecord(data: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}) {
  const { databases } = await createAdminClient();

  const existingRes = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.customers,
    [Query.equal("email", data.email), Query.limit(1)]
  );

  const existing = existingRes.documents[0];
  if (existing) {
    const payload: Record<string, string> = {
      name: data.name || (existing.name as string),
    };

    if (data.phone) payload.phone = data.phone;
    if (data.address) payload.address = data.address;

    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.customers,
      existing.$id,
      payload
    );

    return existing.$id;
  }

  const created = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.customers,
    ID.unique(),
    {
      name: data.name,
      email: data.email,
      phone: data.phone || "",
      address: data.address || "",
    }
  );

  return created.$id;
}

async function getCustomerRecordByEmail(email: string) {
  const { databases } = await createAdminClient();
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.customers,
    [Query.equal("email", email), Query.limit(1)]
  );

  return response.documents[0] ?? null;
}

function toTrackedOrder(order: Record<string, unknown>): WebsiteTrackedOrder {
  return {
    orderId: String(order.$id),
    title: String(order.title || "Order"),
    status: String(order.status || "pending"),
    quantity: Number(order.quantity || 0),
    unitPrice: Number(order.unit_price || 0),
    totalPrice: Number(order.total_price || 0),
    createdAt: String(order.$createdAt),
    updatedAt: String(order.$updatedAt),
    deliveryAddress: String(order.delivery_address || ""),
    notes: String(order.custom_notes || ""),
  };
}

function toOrderSummary(order: WebsiteTrackedOrder): WebsiteCustomerOrderSummary {
  return {
    orderId: order.orderId,
    title: order.title,
    status: order.status,
    quantity: order.quantity,
    totalPrice: order.totalPrice,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export async function getCustomerSessionUser(): Promise<{
  name?: string;
  email: string;
  phone?: string;
  address?: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const marker = cookieStore.get("customer-session")?.value;
    if (marker !== "1") return null;

    const { account } = await createSessionClient();
    const user = await account.get();
    const customer = await getCustomerRecordByEmail(user.email);

    return {
      name: user.name,
      email: user.email,
      phone: customer?.phone ? String(customer.phone) : "",
      address: customer?.address ? String(customer.address) : "",
    };
  } catch {
    return null;
  }
}

export async function getCustomerWebsiteOrders(): Promise<WebsiteTrackedOrder[]> {
  const user = await getCustomerSessionUser();
  if (!user) return [];

  const customer = await getCustomerRecordByEmail(user.email);
  if (!customer?.$id) return [];

  const { databases } = await createAdminClient();
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.orders,
    [Query.equal("customer_id", String(customer.$id)), Query.orderDesc("$createdAt"), Query.limit(100)]
  );

  return response.documents.map((order) => toTrackedOrder(order as unknown as Record<string, unknown>));
}

export async function getCustomerAccountSnapshot(): Promise<{
  user: { name?: string; email: string } | null;
  orders: WebsiteCustomerOrderSummary[];
}> {
  const user = await getCustomerSessionUser();
  if (!user) {
    return { user: null, orders: [] };
  }

  const orders = await getCustomerWebsiteOrders();
  return {
    user,
    orders: orders.map(toOrderSummary),
  };
}

export async function signupCustomerAction(input: CustomerAuthInput): Promise<{ error?: string }> {
  const name = input.name?.trim() || "Customer";
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !password || password.length < 8) {
    return { error: "Please provide a valid email and a password of at least 8 characters." };
  }

  try {
    const { account } = await createAdminClient();

    await account.create(ID.unique(), email, password, name);
    const session = await account.createEmailPasswordSession(email, password);

    await setCustomerSessionCookies(session.secret);
    await ensureCustomerRecord({
      name,
      email,
      phone: input.phone?.trim(),
      address: input.address?.trim(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to create account";
    return { error: message };
  }

  redirect(input.nextPath || "/order");
}

export async function loginCustomerAction(input: {
  email: string;
  password: string;
  nextPath?: string;
}): Promise<{ error?: string }> {
  const email = input.email.trim().toLowerCase();

  try {
    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession(email, input.password);

    await setCustomerSessionCookies(session.secret);

    const user = await getAccountFromSessionSecret(session.secret);
    await ensureCustomerRecord({
      name: user.name || "Customer",
      email: user.email,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to login";
    return { error: message };
  }

  redirect(input.nextPath || "/order");
}

export async function logoutCustomerAction() {
  try {
    const { account } = await createSessionClient();
    await account.deleteSession("current");
  } catch {
    // Ignore; we'll still clear cookies
  }

  const cookieStore = await cookies();
  cookieStore.delete("appwrite-session");
  cookieStore.delete("customer-session");
  cookieStore.delete("admin-session");

  redirect("/");
}

export async function createWebsiteOrderAction(input: WebsiteOrderInput): Promise<{ error?: string; orderId?: string }> {
  const user = await getCustomerSessionUser();
  if (!user) {
    return { error: "Please login to place an order." };
  }

  const quantity = Number(input.quantity);
  if (!input.productId || Number.isNaN(quantity) || quantity <= 0) {
    return { error: "Please select a product and valid quantity." };
  }

  const product = await getProduct(input.productId);
  if (!product || !product.is_active) {
    return { error: "This product is not available right now." };
  }

  const customerId = await ensureCustomerRecord({
    name: user.name || "Customer",
    email: user.email,
    phone: input.phone?.trim(),
    address: input.address?.trim(),
  });

  const order = await createOrder({
    customer_id: customerId,
    is_product: true,
    product_id: product.$id,
    title: `${product.name} - Website Order`,
    status: "pending",
    quantity,
    unit_price: product.selling_price,
    total_price: product.selling_price * quantity,
    delivery_address: input.address.trim(),
    custom_notes: input.notes?.trim(),
  });

  return { orderId: order.$id };
}

export async function createWebsiteCartOrderAction(
  input: WebsiteCartOrderInput
): Promise<{ error?: string; orderIds?: string[] }> {
  const user = await getCustomerSessionUser();
  if (!user) {
    return { error: "Please login to place an order." };
  }

  const items = input.items
    .map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
    }))
    .filter((item) => item.productId && !Number.isNaN(item.quantity) && item.quantity > 0);

  if (items.length === 0) {
    return { error: "Your cart is empty." };
  }

  const customerId = await ensureCustomerRecord({
    name: user.name || "Customer",
    email: user.email,
    phone: input.phone?.trim(),
    address: input.address?.trim(),
  });

  const products = await Promise.all(items.map((item) => getProduct(item.productId)));
  const inactiveProduct = products.find((product) => !product?.is_active);

  if (inactiveProduct) {
    return { error: `${inactiveProduct.name} is not available right now.` };
  }

  const orderIds: string[] = [];

  for (const item of items) {
    const product = products.find((entry) => entry.$id === item.productId);
    if (!product) {
      return { error: "One of the cart products could not be loaded." };
    }

    const order = await createOrder({
      customer_id: customerId,
      is_product: true,
      product_id: product.$id,
      title: `${product.name} - Website Cart Order`,
      status: "pending",
      quantity: item.quantity,
      unit_price: product.selling_price,
      total_price: product.selling_price * item.quantity,
      delivery_address: input.address.trim(),
      custom_notes: input.notes?.trim(),
    });

    orderIds.push(order.$id);
  }

  return { orderIds };
}

export async function trackWebsiteOrderAction(input: {
  orderId: string;
  email?: string;
}): Promise<{ error?: string; order?: WebsiteTrackedOrder }> {
  const orderId = input.orderId.trim();
  const email = input.email?.trim().toLowerCase() || "";
  const sessionUser = await getCustomerSessionUser();

  if (!orderId) {
    return { error: "Please provide your order ID." };
  }

  try {
    const { databases } = await createAdminClient();

    const order = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.orders,
      orderId
    );

    const customer = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.customers,
      String(order.customer_id)
    );

    const customerEmail = String(customer.email || "").trim().toLowerCase();
    if (sessionUser?.email) {
      const sessionEmail = sessionUser.email.trim().toLowerCase();
      if (!customerEmail || customerEmail !== sessionEmail) {
        return { error: "That order does not belong to your account." };
      }
    } else if (!email || customerEmail !== email) {
      return { error: "Order not found for this email." };
    }

    return {
      order: toTrackedOrder(order as unknown as Record<string, unknown>),
    };
  } catch {
    return { error: sessionUser ? "Order not found in your account." : "Order not found. Please check the order ID and email." };
  }
}

export async function cancelWebsiteOrderAction(input: {
  orderId: string;
}): Promise<{ error?: string; order?: WebsiteTrackedOrder }> {
  const orderId = input.orderId.trim();
  const sessionUser = await getCustomerSessionUser();

  if (!sessionUser?.email) {
    return { error: "Please login to cancel an order." };
  }

  if (!orderId) {
    return { error: "Please provide your order ID." };
  }

  try {
    const { databases } = await createAdminClient();

    const order = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.orders,
      orderId
    );

    const customer = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.customers,
      String(order.customer_id)
    );

    const customerEmail = String(customer.email || "").trim().toLowerCase();
    const sessionEmail = sessionUser.email.trim().toLowerCase();

    if (!customerEmail || customerEmail !== sessionEmail) {
      return { error: "That order does not belong to your account." };
    }

    if (String(order.status) !== "pending") {
      return { error: "This order can no longer be cancelled because it is already being processed." };
    }

    const updated = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.orders,
      orderId,
      { status: "cancelled" }
    );

    revalidatePath("/account");
    revalidatePath("/track");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/finance");

    return {
      order: toTrackedOrder(updated as unknown as Record<string, unknown>),
    };
  } catch {
    return { error: "Could not cancel this order. Please refresh and try again." };
  }
}
