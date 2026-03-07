import { getInvoice } from "@/lib/api/invoices";
import { getOrders } from "@/lib/api/orders";
import { getCustomers } from "@/lib/api/customers";
import { notFound } from "next/navigation";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: Props) {
  const { id } = await params;

  let invoice;
  try {
    invoice = await getInvoice(id);
  } catch {
    notFound();
  }

  const [orders, customers] = await Promise.all([getOrders(), getCustomers()]);

  return (
    <InvoiceForm
      initialData={invoice}
      orders={orders}
      customers={customers}
    />
  );
}
