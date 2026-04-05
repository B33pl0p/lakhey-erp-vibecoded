import Link from "next/link";
import { Save } from "lucide-react";
import type { WebsiteClient } from "@/lib/api/website";
import styles from "./ClientForm.module.css";

type Props = {
  mode: "create" | "edit";
  initialData?: WebsiteClient;
  action: (formData: FormData) => Promise<void>;
  cancelHref: string;
};

export function ClientForm({ mode, initialData, action, cancelHref }: Props) {
  return (
    <form action={action} className={styles.container}>
      <header className={styles.header}>
        <h1>{mode === "create" ? "New Client" : "Edit Client"}</h1>
        <p>Manage logos and names shown in client-trust sections.</p>
      </header>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="name">Name *</label>
          <input id="name" name="name" defaultValue={initialData?.name ?? ""} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="sort_order">Sort Order</label>
          <input id="sort_order" name="sort_order" type="number" defaultValue={initialData?.sort_order ?? 100} />
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="website_url">Website URL (optional)</label>
          <input id="website_url" name="website_url" defaultValue={initialData?.website_url ?? ""} />
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="logo_image_id">Logo Image File ID (optional)</label>
          <input id="logo_image_id" name="logo_image_id" defaultValue={initialData?.logo_image_id ?? ""} />
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <label className={styles.checkbox}>
            <input type="checkbox" name="is_active" defaultChecked={initialData?.is_active ?? true} />
            Active on website
          </label>
        </div>
      </div>

      <footer className={styles.actions}>
        <Link href={cancelHref} className={styles.secondaryBtn}>Cancel</Link>
        <button type="submit" className={styles.primaryBtn}>
          <Save size={16} />
          <span>{mode === "create" ? "Create" : "Save Changes"}</span>
        </button>
      </footer>
    </form>
  );
}

