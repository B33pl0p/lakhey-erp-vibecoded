import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  deleteWebsiteClient,
  getWebsiteClients,
  setWebsiteClientActive,
} from "@/lib/api/website";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

async function deleteAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;
  await deleteWebsiteClient(id);
}

async function toggleActiveAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  const next = String(formData.get("next") || "false") === "true";
  if (!id) return;
  await setWebsiteClientActive(id, next);
}

export default async function WebsiteClientsPage() {
  const clients = await getWebsiteClients();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Website Clients</h1>
          <p>Manage client names and logos for the website trust section.</p>
        </div>
        <div className={styles.actions}>
          <Link href="/admin/website" className={styles.secondaryBtn}>Back</Link>
          <Link href="/admin/website/clients/new" className={styles.primaryBtn}>
            <Plus size={16} />
            <span>New Client</span>
          </Link>
        </div>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Website</th>
              <th>Logo File ID</th>
              <th>Status</th>
              <th>Sort</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.empty}>No clients yet.</td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr key={c.$id}>
                  <td>{c.name}</td>
                  <td>{c.website_url || "—"}</td>
                  <td>{c.logo_image_id || "—"}</td>
                  <td>
                    <span className={`${styles.badge} ${c.is_active ? styles.active : styles.inactive}`}>
                      {c.is_active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td>{c.sort_order}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <Link href={`/admin/website/clients/${c.$id}/edit`} className={styles.iconBtn} title="Edit">
                        <Pencil size={14} />
                      </Link>
                      <form action={toggleActiveAction}>
                        <input type="hidden" name="id" value={c.$id} />
                        <input type="hidden" name="next" value={(!c.is_active).toString()} />
                        <button type="submit" className={styles.iconBtn} title={c.is_active ? "Hide" : "Show"}>
                          {c.is_active ? "Hide" : "Show"}
                        </button>
                      </form>
                      <form action={deleteAction}>
                        <input type="hidden" name="id" value={c.$id} />
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

