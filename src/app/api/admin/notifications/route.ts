import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite/server";
import { appwriteConfig } from "@/lib/appwrite/config";
import { ensureAdminSession } from "@/lib/api/adminAuth";

export async function GET() {
  try {
    await ensureAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { databases } = await createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [ordersRes, customersRes] = await Promise.all([
    databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.orders,
      [Query.greaterThan("$createdAt", since), Query.orderDesc("$createdAt"), Query.limit(8)]
    ),
    databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.customers,
      [Query.greaterThan("$createdAt", since), Query.orderDesc("$createdAt"), Query.limit(8)]
    ),
  ]);

  const notifications = [
    ...ordersRes.documents.map((o) => ({
      id: `order-${o.$id}`,
      type: "order" as const,
      title: String(o.title || "New order"),
      subtitle: String(o.status || "pending"),
      href: `/admin/orders/${o.$id}`,
      createdAt: String(o.$createdAt),
    })),
    ...customersRes.documents.map((c) => ({
      id: `customer-${c.$id}`,
      type: "customer" as const,
      title: String(c.name || "New customer"),
      subtitle: String(c.email || c.phone || ""),
      href: `/admin/customers/${c.$id}`,
      createdAt: String(c.$createdAt),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({
    total: notifications.length,
    newOrders: ordersRes.total,
    newCustomers: customersRes.total,
    notifications: notifications.slice(0, 10),
    generatedAt: new Date().toISOString(),
  });
}
