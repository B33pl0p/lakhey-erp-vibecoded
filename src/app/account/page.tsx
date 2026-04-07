import { AccountClient } from "./AccountClient";
import { getCustomerAccountSnapshot } from "@/lib/api/customerAuth";

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function AccountPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const { user, orders } = await getCustomerAccountSnapshot();

  return <AccountClient nextPath={next || "/order"} user={user} orders={orders} />;
}
