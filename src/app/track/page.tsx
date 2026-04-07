import { getCustomerSessionUser, getCustomerWebsiteOrders } from "@/lib/api/customerAuth";
import { TrackPageClient } from "./TrackPageClient";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ order?: string }>;
}

export default async function TrackOrderPage({ searchParams }: Props) {
  const { order } = await searchParams;
  const user = await getCustomerSessionUser();
  const orders = user ? await getCustomerWebsiteOrders() : [];

  return (
    <TrackPageClient
      user={user}
      initialOrderId={order || ""}
      initialEmail={user?.email || ""}
      initialOrders={orders}
    />
  );
}
