import { getCustomer } from "@/lib/api/customers";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCustomerPage({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) notFound();

  let customer;
  try {
    customer = await getCustomer(id);
  } catch {
    notFound();
  }

  return <CustomerForm initialData={customer} />;
}
