import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  deleteWebsiteSection,
  getWebsiteSections,
  setWebsiteSectionActive,
} from "@/lib/api/website";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

async function deleteAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;
  await deleteWebsiteSection(id);
}

async function toggleActiveAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  const next = String(formData.get("next") || "false") === "true";
  if (!id) return;
  await setWebsiteSectionActive(id, next);
}

export default async function WebsiteSectionsPage() {
  const sections = await getWebsiteSections();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Website Sections</h1>
          <p>Manage informational website sections and their order.</p>
        </div>
        <div className={styles.actions}>
          <Link href="/admin/website" className={styles.secondaryBtn}>Back</Link>
          <Link href="/admin/website/sections/new" className={styles.primaryBtn}>
            <Plus size={16} />
            <span>New Section</span>
          </Link>
        </div>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Key</th>
              <th>Title</th>
              <th>CTA</th>
              <th>Status</th>
              <th>Sort</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sections.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.empty}>No sections yet.</td>
              </tr>
            ) : (
              sections.map((s) => (
                <tr key={s.$id}>
                  <td>{s.section_key}</td>
                  <td>{s.title}</td>
                  <td>{s.cta_label ? `${s.cta_label} (${s.cta_href || "—"})` : "—"}</td>
                  <td>
                    <span className={`${styles.badge} ${s.is_active ? styles.active : styles.inactive}`}>
                      {s.is_active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td>{s.sort_order}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <Link href={`/admin/website/sections/${s.$id}/edit`} className={styles.iconBtn} title="Edit">
                        <Pencil size={14} />
                      </Link>
                      <form action={toggleActiveAction}>
                        <input type="hidden" name="id" value={s.$id} />
                        <input type="hidden" name="next" value={(!s.is_active).toString()} />
                        <button type="submit" className={styles.iconBtn} title={s.is_active ? "Hide" : "Show"}>
                          {s.is_active ? "Hide" : "Show"}
                        </button>
                      </form>
                      <form action={deleteAction}>
                        <input type="hidden" name="id" value={s.$id} />
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

