import { getQuotation } from "@/lib/api/quotations";
import { getCustomers } from "@/lib/api/customers";
import { getBusinessConfig } from "@/lib/api/businessConfig";
import { QuoteForm } from "@/components/quotations/QuoteForm";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditQuotationPage({ params }: Props) {
  const { id } = await params;

  let quote;
  try {
    quote = await getQuotation(id);
  } catch {
    notFound();
  }

  const [customers, config] = await Promise.all([
    getCustomers(),
    getBusinessConfig(),
  ]);

  return (
    <QuoteForm
      initialData={quote}
      customers={customers}
      vatRate={config.vat_rate ?? 13}
      vatEnabled={config.vat_enabled}
    />
  );
}
