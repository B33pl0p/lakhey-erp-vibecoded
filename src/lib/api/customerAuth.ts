"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

export async function getCustomerSessionUser(): Promise<{
  name?: string;
  email: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const marker = cookieStore.get("customer-session")?.value;
    if (marker !== "1") return null;

    const { account } = await createSessionClient();
    const user = await account.get();

    return {
      name: user.name,
      email: user.email,
    };
  } catch {
    return null;
  }
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

export async function trackWebsiteOrderAction(input: {
  orderId: string;
  email: string;
}): Promise<{ error?: string; order?: WebsiteTrackedOrder }> {
  const orderId = input.orderId.trim();
  const email = input.email.trim().toLowerCase();

  if (!orderId || !email) {
    return { error: "Please provide order ID and email." };
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
    if (!customerEmail || customerEmail !== email) {
      return { error: "Order not found for this email." };
    }

    return {
      order: {
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
      },
    };
  } catch {
    return { error: "Order not found. Please check the order ID and email." };
  }
}
