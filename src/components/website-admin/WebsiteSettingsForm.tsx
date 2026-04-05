import Link from "next/link";
import { Save } from "lucide-react";
import type { WebsiteSettings } from "@/lib/api/website";
import styles from "./WebsiteSettingsForm.module.css";

type Props = {
  initialData: WebsiteSettings | null;
  action: (formData: FormData) => Promise<void>;
};

export function WebsiteSettingsForm({ initialData, action }: Props) {
  return (
    <form action={action} className={styles.container}>
      <header className={styles.header}>
        <h1>Website Settings</h1>
        <p>Edit hero content, CTA labels, and global website contact info.</p>
      </header>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="site_name">Site Name *</label>
          <input id="site_name" name="site_name" defaultValue={initialData?.site_name ?? "Lakhey Labs"} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="studio_location">Studio Location</label>
          <input id="studio_location" name="studio_location" defaultValue={initialData?.studio_location ?? ""} />
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="hero_title">Hero Title *</label>
          <input id="hero_title" name="hero_title" defaultValue={initialData?.hero_title ?? ""} required />
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="hero_subtitle">Hero Subtitle</label>
          <textarea id="hero_subtitle" name="hero_subtitle" rows={3} defaultValue={initialData?.hero_subtitle ?? ""} />
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="hero_tagline">Hero Tagline</label>
          <input id="hero_tagline" name="hero_tagline" defaultValue={initialData?.hero_tagline ?? ""} />
        </div>

        <div className={styles.field}>
          <label htmlFor="hero_cta_primary_label">Primary CTA Label</label>
          <input id="hero_cta_primary_label" name="hero_cta_primary_label" defaultValue={initialData?.hero_cta_primary_label ?? "Visit Store"} />
        </div>
        <div className={styles.field}>
          <label htmlFor="hero_cta_primary_href">Primary CTA Href</label>
          <input id="hero_cta_primary_href" name="hero_cta_primary_href" defaultValue={initialData?.hero_cta_primary_href ?? "/products"} />
        </div>
        <div className={styles.field}>
          <label htmlFor="hero_cta_secondary_label">Secondary CTA Label</label>
          <input id="hero_cta_secondary_label" name="hero_cta_secondary_label" defaultValue={initialData?.hero_cta_secondary_label ?? "Start Custom Project"} />
        </div>
        <div className={styles.field}>
          <label htmlFor="hero_cta_secondary_href">Secondary CTA Href</label>
          <input id="hero_cta_secondary_href" name="hero_cta_secondary_href" defaultValue={initialData?.hero_cta_secondary_href ?? "/studio"} />
        </div>

        <div className={styles.field}>
          <label htmlFor="contact_email">Contact Email</label>
          <input id="contact_email" name="contact_email" defaultValue={initialData?.contact_email ?? ""} />
        </div>
        <div className={styles.field}>
          <label htmlFor="contact_phone">Contact Phone</label>
          <input id="contact_phone" name="contact_phone" defaultValue={initialData?.contact_phone ?? ""} />
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <label className={styles.checkbox}>
            <input type="checkbox" name="is_store_enabled" defaultChecked={initialData?.is_store_enabled ?? true} />
            Store enabled on website
          </label>
        </div>
      </div>

      <footer className={styles.actions}>
        <Link href="/admin/website" className={styles.secondaryBtn}>Back</Link>
        <button type="submit" className={styles.primaryBtn}>
          <Save size={16} />
          <span>Save Settings</span>
        </button>
      </footer>
    </form>
  );
}

