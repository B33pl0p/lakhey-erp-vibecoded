import { getOrders } from "@/lib/api/orders";
import { getCustomers } from "@/lib/api/customers";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ order_id?: string }>;
}

export default async function NewInvoicePage({ searchParams }: Props) {
  const { order_id } = await searchParams;
  const [orders, customers] = await Promise.all([getOrders(), getCustomers()]);

  return (
    <InvoiceForm
      orders={orders}
      customers={customers}
      preselectedOrderId={order_id}
    />
  );
}
