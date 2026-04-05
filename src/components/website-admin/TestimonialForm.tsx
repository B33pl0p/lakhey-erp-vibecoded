import Link from "next/link";
import { Save } from "lucide-react";
import type { WebsiteTestimonial } from "@/lib/api/website";
import styles from "./TestimonialForm.module.css";

type Props = {
  mode: "create" | "edit";
  initialData?: WebsiteTestimonial;
  action: (formData: FormData) => Promise<void>;
  cancelHref: string;
};

export function TestimonialForm({ mode, initialData, action, cancelHref }: Props) {
  return (
    <form action={action} className={styles.container}>
      <header className={styles.header}>
        <h1>{mode === "create" ? "New Testimonial" : "Edit Testimonial"}</h1>
        <p>This content is shown on the client-facing website.</p>
      </header>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="name">Name *</label>
          <input id="name" name="name" defaultValue={initialData?.name ?? ""} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="role">Role</label>
          <input id="role" name="role" defaultValue={initialData?.role ?? ""} />
        </div>
        <div className={styles.field}>
          <label htmlFor="company">Company</label>
          <input id="company" name="company" defaultValue={initialData?.company ?? ""} />
        </div>
        <div className={styles.field}>
          <label htmlFor="rating">Rating (1-5)</label>
          <select id="rating" name="rating" defaultValue={String(initialData?.rating ?? 5)}>
            <option value="5">5</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="sort_order">Sort Order</label>
          <input id="sort_order" name="sort_order" type="number" defaultValue={initialData?.sort_order ?? 100} />
        </div>
        <div className={styles.field}>
          <label htmlFor="image_id">Image File ID (optional)</label>
          <input id="image_id" name="image_id" defaultValue={initialData?.image_id ?? ""} />
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="quote">Quote *</label>
          <textarea id="quote" name="quote" rows={5} defaultValue={initialData?.quote ?? ""} required />
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

