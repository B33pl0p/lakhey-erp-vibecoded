"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";
import {
  WEBSITE_INQUIRY_STATUSES,
  type WebsiteInquiry,
} from "@/lib/api/websiteInquiries";
import styles from "./page.module.css";

export function WebsiteInquiriesClient() {
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<WebsiteInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/website-inquiries", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load inquiries");
        setInquiries(data.inquiries || []);
      } catch (error) {
        toast(error instanceof Error ? error.message : "Failed to load inquiries", "error");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [toast]);

  const handleStatusChange = (id: string, status: string) => {
    setInquiries((prev) => prev.map((inquiry) => (
      inquiry.$id === id ? { ...inquiry, status } : inquiry
    )));
  };

  const saveStatus = async (id: string, status: string) => {
    setSavingId(id);
    try {
      const res = await fetch("/api/admin/website-inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update inquiry");
      toast("Inquiry status updated", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to update inquiry", "error");
    } finally {
      setSavingId(null);
    }
  };

  const deleteInquiry = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/website-inquiries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete inquiry");
      setInquiries((prev) => prev.filter((inquiry) => inquiry.$id !== id));
      toast("Inquiry deleted", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to delete inquiry", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Website Inquiries</h1>
          <p>Manage leads submitted from the customer-facing website.</p>
        </div>
        <div className={styles.actions}>
          <Link href="/admin/website" className={styles.secondaryBtn}>Back</Link>
        </div>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Lead</th>
              <th>Type</th>
              <th>Material</th>
              <th>Project</th>
              <th>File Link</th>
              <th>Status</th>
              <th>Received</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && inquiries.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.empty}>No website inquiries yet.</td>
              </tr>
            ) : null}
            {isLoading ? (
              <tr>
                <td colSpan={8} className={styles.empty}>Loading inquiries...</td>
              </tr>
            ) : null}
            {inquiries.map((inquiry) => (
              <tr key={inquiry.$id}>
                <td>
                  <div className={styles.leadCell}>
                    <strong>{inquiry.name}</strong>
                    <span>{inquiry.email}</span>
                    <span>{inquiry.inquiry_as || "—"}</span>
                  </div>
                </td>
                <td className={styles.capitalize}>{inquiry.inquiry_type}</td>
                <td>{inquiry.material_preference || "—"}</td>
                <td className={styles.project}>{inquiry.project_description}</td>
                <td>
                  {inquiry.file_link ? (
                    <a href={inquiry.file_link} target="_blank" rel="noreferrer" className={styles.link}>
                      Open Link
                    </a>
                  ) : "—"}
                </td>
                <td>
                  <div className={styles.statusForm}>
                    <select
                      value={inquiry.status}
                      onChange={(event) => handleStatusChange(inquiry.$id, event.target.value)}
                      className={styles.statusSelect}
                    >
                      {WEBSITE_INQUIRY_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => void saveStatus(inquiry.$id, inquiry.status)}
                      disabled={savingId === inquiry.$id}
                    >
                      {savingId === inquiry.$id ? "..." : "Save"}
                    </button>
                  </div>
                </td>
                <td>{new Date(inquiry.$createdAt).toLocaleDateString("en-NP", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}</td>
                <td>
                  <div className={styles.rowActions}>
                    {inquiry.customer_id ? (
                      <Link href={`/admin/customers/${inquiry.customer_id}`} className={styles.iconBtn}>
                        Customer
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.danger}`}
                      title="Delete"
                      onClick={() => void deleteInquiry(inquiry.$id)}
                      disabled={deletingId === inquiry.$id}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
