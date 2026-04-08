"use server";

import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/appwrite/server";
import { verifyAdminSessionMarker } from "@/lib/auth/adminSession";

export async function ensureAdminSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("appwrite-session")?.value || "";
  const adminMarker = cookieStore.get("admin-session")?.value || "";

  if (!session || !adminMarker) {
    throw new Error("Unauthorized");
  }

  const isValidMarker = await verifyAdminSessionMarker(session, adminMarker);
  if (!isValidMarker) {
    throw new Error("Unauthorized");
  }

  const { account } = await createSessionClient();
  return await account.get();
}
