import { getBusinessConfig } from "@/lib/api/businessConfig";
import { getFilePreviewUrl } from "@/lib/api/storage";
import { SettingsForm } from "./SettingsForm";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const config = await getBusinessConfig();

  const logoUrl = config.logo_id
    ? await getFilePreviewUrl(config.logo_id, 200, 200)
    : null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Settings</h1>
        <p>Business configuration, invoice defaults, and appearance.</p>
      </header>

      <SettingsForm initialConfig={config} initialLogoUrl={logoUrl} />
    </div>
  );
}
