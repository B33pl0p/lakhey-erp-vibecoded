import { AccountClient } from "./AccountClient";
import { getCustomerSessionUser } from "@/lib/api/customerAuth";

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function AccountPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const user = await getCustomerSessionUser();

  return <AccountClient nextPath={next || "/order"} user={user} />;
}
