import Link from "next/link";
import { Save } from "lucide-react";
import type { WebsiteSection } from "@/lib/api/website";
import styles from "./SectionForm.module.css";

type Props = {
  mode: "create" | "edit";
  initialData?: WebsiteSection;
  action: (formData: FormData) => Promise<void>;
  cancelHref: string;
};

export function SectionForm({ mode, initialData, action, cancelHref }: Props) {
  return (
    <form action={action} className={styles.container}>
      <header className={styles.header}>
        <h1>{mode === "create" ? "New Website Section" : "Edit Website Section"}</h1>
        <p>Manage homepage informational blocks and CTA links.</p>
      </header>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="section_key">Section Key *</label>
          <input id="section_key" name="section_key" defaultValue={initialData?.section_key ?? ""} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="sort_order">Sort Order</label>
          <input id="sort_order" name="sort_order" type="number" defaultValue={initialData?.sort_order ?? 100} />
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="title">Title *</label>
          <input id="title" name="title" defaultValue={initialData?.title ?? ""} required />
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="body">Body</label>
          <textarea id="body" name="body" rows={5} defaultValue={initialData?.body ?? ""} />
        </div>
        <div className={styles.field}>
          <label htmlFor="cta_label">CTA Label</label>
          <input id="cta_label" name="cta_label" defaultValue={initialData?.cta_label ?? ""} />
        </div>
        <div className={styles.field}>
          <label htmlFor="cta_href">CTA Href</label>
          <input id="cta_href" name="cta_href" defaultValue={initialData?.cta_href ?? ""} />
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="image_id">Image File ID (optional)</label>
          <input id="image_id" name="image_id" defaultValue={initialData?.image_id ?? ""} />
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

