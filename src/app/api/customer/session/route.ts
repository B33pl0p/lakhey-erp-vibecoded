import { NextResponse } from "next/server";
import { getCustomerSessionUser } from "@/lib/api/customerAuth";

export async function GET() {
  const user = await getCustomerSessionUser();
  return NextResponse.json({ user });
}
