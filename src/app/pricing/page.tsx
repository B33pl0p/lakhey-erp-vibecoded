import { getBusinessConfig } from "@/lib/api/businessConfig";
import { getFilePreviewUrl } from "@/lib/api/storage";
import { PricingTool } from "@/components/pricing/PricingTool";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const config = await getBusinessConfig();
  const logoUrl = config.logo_id
    ? await getFilePreviewUrl(config.logo_id, 200, 200)
    : null;

  let initialRates: Record<string, number> | undefined;
  if (config.pricing_rates) {
    try { initialRates = JSON.parse(config.pricing_rates); } catch { /* ignore */ }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Price Sheet</h1>
        <p className={styles.subtitle}>
          Configure your rates and build a branded price sheet PDF.
        </p>
      </div>

      <PricingTool
        business={{
          businessName: config.company_name || "Lakhey Labs",
          tagline:      config.tagline,
          address:      config.address,
          phone:        config.phone,
          email:        config.email,
          logoUrl,
          panNumber:    config.pan_number,
          vatNumber:    config.vat_number,
        }}
        initialRates={initialRates}
      />
    </div>
  );
}
