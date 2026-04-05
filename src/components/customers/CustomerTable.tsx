"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Customer } from "@/lib/api/customers";
import { deleteCustomer } from "@/lib/api/customers";
import { useToast } from "@/components/ui/ToastContext";
import { Edit2, Trash2, Search, User } from "lucide-react";
import Link from "next/link";
import styles from "./CustomerTable.module.css";
import { ConfirmDialog } from "../ui/ConfirmDialog";

export function CustomerTable({ initialCustomers }: { initialCustomers: Customer[] }) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteCustomer(deletingId);
      setCustomers(prev => prev.filter(c => c.$id !== deletingId));
      toast("Customer deleted successfully", "success");
      router.refresh();
    } catch {
      toast("Error deleting customer", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th className={styles.actionsCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyState}>
                  <div className={styles.emptyContent}>
                    <User size={40} />
                    <p>No customers found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(customer => (
                <tr key={customer.$id}>
                  <td>
                    <Link href={`/admin/customers/${customer.$id}`} className={styles.nameLink}>
                      {customer.name}
                    </Link>
                  </td>
                  <td className={styles.muted}>{customer.email || "—"}</td>
                  <td className={styles.muted}>{customer.phone || "—"}</td>
                  <td className={styles.muted}>{customer.address || "—"}</td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actions}>
                      <Link href={`/admin/customers/${customer.$id}/edit`} className={styles.editBtn} title="Edit">
                        <Edit2 size={16} />
                      </Link>
                      <button
                        className={styles.deleteBtn}
                        title="Delete"
                        onClick={() => setDeletingId(customer.$id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
