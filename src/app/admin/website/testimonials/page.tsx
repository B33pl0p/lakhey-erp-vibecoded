import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  deleteWebsiteTestimonial,
  getWebsiteTestimonials,
  setWebsiteTestimonialActive,
} from "@/lib/api/website";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

async function deleteAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;
  await deleteWebsiteTestimonial(id);
}

async function toggleActiveAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  const next = String(formData.get("next") || "false") === "true";
  if (!id) return;
  await setWebsiteTestimonialActive(id, next);
}

export default async function WebsiteTestimonialsPage() {
  const testimonials = await getWebsiteTestimonials();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Website Testimonials</h1>
          <p>Manage testimonials shown on the client-facing website.</p>
        </div>
        <div className={styles.actions}>
          <Link href="/admin/website" className={styles.secondaryBtn}>Back</Link>
          <Link href="/admin/website/testimonials/new" className={styles.primaryBtn}>
            <Plus size={16} />
            <span>New Testimonial</span>
          </Link>
        </div>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role / Company</th>
              <th>Quote</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Sort</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {testimonials.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>No testimonials yet.</td>
              </tr>
            ) : (
              testimonials.map((t) => (
                <tr key={t.$id}>
                  <td>{t.name}</td>
                  <td>{[t.role, t.company].filter(Boolean).join(" · ") || "—"}</td>
                  <td className={styles.quote}>{t.quote}</td>
                  <td>{t.rating ?? 5}</td>
                  <td>
                    <span className={`${styles.badge} ${t.is_active ? styles.active : styles.inactive}`}>
                      {t.is_active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td>{t.sort_order}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <Link href={`/admin/website/testimonials/${t.$id}/edit`} className={styles.iconBtn} title="Edit">
                        <Pencil size={14} />
                      </Link>
                      <form action={toggleActiveAction}>
                        <input type="hidden" name="id" value={t.$id} />
                        <input type="hidden" name="next" value={(!t.is_active).toString()} />
                        <button type="submit" className={styles.iconBtn} title={t.is_active ? "Hide" : "Show"}>
                          {t.is_active ? "Hide" : "Show"}
                        </button>
                      </form>
                      <form action={deleteAction}>
                        <input type="hidden" name="id" value={t.$id} />
                        <button type="submit" className={`${styles.iconBtn} ${styles.danger}`} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

