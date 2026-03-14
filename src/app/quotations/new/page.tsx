import { getCustomers } from "@/lib/api/customers";
import { getBusinessConfig } from "@/lib/api/businessConfig";
import { QuoteForm } from "@/components/quotations/QuoteForm";

export const dynamic = "force-dynamic";

export default async function NewQuotationPage() {
  const [customers, config] = await Promise.all([
    getCustomers(),
    getBusinessConfig(),
  ]);

  return (
    <QuoteForm
      customers={customers}
      vatRate={config.vat_rate ?? 13}
      vatEnabled={config.vat_enabled}
    />
  );
}
