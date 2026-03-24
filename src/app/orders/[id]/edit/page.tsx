import { getOrder } from "@/lib/api/orders";
import { getCustomers } from "@/lib/api/customers";
import { getProducts } from "@/lib/api/products";
import { OrderForm } from "@/components/orders/OrderForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditOrderPage({ params }: Props) {
  const { id } = await params;

  let order;
  try {
    order = await getOrder(id);
  } catch {
    notFound();
  }

  const [customers, products] = await Promise.all([getCustomers(), getProducts()]);

  return <OrderForm initialData={order} customers={customers} products={products} />;
}
