import { getCustomer } from "@/lib/api/customers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Mail, Phone, MapPin, FileText } from "lucide-react";
import styles from "./page.module.css";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;

  let customer;
  try {
    customer = await getCustomer(id);
  } catch {
    notFound();
  }

  const createdDate = new Date(customer.$createdAt).toLocaleDateString("en-NP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/admin/customers" className={styles.backBtn}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1>{customer.name}</h1>
            <p className={styles.subtitle}>Customer since {createdDate}</p>
          </div>
        </div>
        <Link href={`/admin/customers/${id}/edit`} className={styles.editBtn}>
          <Edit2 size={16} />
          <span>Edit</span>
        </Link>
      </header>

      <div className={styles.grid}>
        {/* Contact Info Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Contact Information</h2>
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <Mail size={16} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>
                  {customer.email ? (
                    <a href={`mailto:${customer.email}`} className={styles.link}>
                      {customer.email}
                    </a>
                  ) : (
                    <span className={styles.muted}>Not provided</span>
                  )}
                </span>
              </div>
            </div>
            <div className={styles.infoRow}>
              <Phone size={16} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Phone</span>
                <span className={styles.infoValue}>
                  {customer.phone ? (
                    <a href={`tel:${customer.phone}`} className={styles.link}>
                      {customer.phone}
                    </a>
                  ) : (
                    <span className={styles.muted}>Not provided</span>
                  )}
                </span>
              </div>
            </div>
            <div className={styles.infoRow}>
              <MapPin size={16} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Address</span>
                <span className={styles.infoValue}>
                  {customer.address || <span className={styles.muted}>Not provided</span>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            <FileText size={16} />
            Notes
          </h2>
          {customer.notes ? (
            <p className={styles.notes}>{customer.notes}</p>
          ) : (
            <p className={styles.muted}>No notes added.</p>
          )}
        </div>
      </div>

      {/* Orders placeholder — will be wired up when orders are implemented */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Order History</h2>
        <p className={styles.muted}>Order history will appear here once orders are implemented.</p>
      </div>
    </div>
  );
}
