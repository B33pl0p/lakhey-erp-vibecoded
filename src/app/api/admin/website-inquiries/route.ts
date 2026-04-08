import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite/server";
import { appwriteConfig } from "@/lib/appwrite/config";
import { ensureAdminSession } from "@/lib/api/adminAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { databases } = await createAdminClient();
    const res = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.websiteInquiries,
      [Query.orderDesc("$createdAt"), Query.limit(200)]
    );
    const inquiries = JSON.parse(JSON.stringify(res.documents));
    return NextResponse.json({ inquiries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load inquiries";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";

  if (!id || !status) {
    return NextResponse.json({ error: "Missing inquiry id or status" }, { status: 400 });
  }

  try {
    const { databases } = await createAdminClient();
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.websiteInquiries,
      id,
      { status }
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update inquiry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";

  if (!id) {
    return NextResponse.json({ error: "Missing inquiry id" }, { status: 400 });
  }

  try {
    const { databases } = await createAdminClient();
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.websiteInquiries,
      id
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete inquiry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
