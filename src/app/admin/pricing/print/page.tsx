"use client";

import Image from "next/image";
import styles from "./page.module.css";

interface RateItem {
  id: string;
  label: string;
  rate: number;
  unit: string;
  note?: string;
}

interface PrintData {
  date: string;
  rateItems: RateItem[];
  businessName: string;
  tagline?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string | null;
  panNumber?: string;
  vatNumber?: string;
}

function fmtRate(rate: number) {
  return "Rs\u00a0" + rate.toLocaleString("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PricingPrintPage() {
  let data: PrintData | null = null;
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem("pricing_print_data");
      if (raw) data = JSON.parse(raw) as PrintData;
    } catch {
      // ignore invalid payload
    }
  }

  if (!data) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
        <p>
          No data found. Please go back to{" "}
          <a href="/admin/pricing">Pricing</a> and click &quot;Generate PDF&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.printPage}>

      {/* Screen-only controls */}
      <div className={styles.screenControls}>
        <button className={styles.printBtn} onClick={() => window.print()}>
          🖨 Print / Save PDF
        </button>
        <a href="/admin/pricing" className={styles.backLink}>← Back</a>
      </div>

      {/* Rate card sheet */}
      <div className={styles.sheet}>

        {/* Header */}
        <div className={styles.sheetHeader}>
          <div className={styles.businessInfo}>
            {data.logoUrl && (
              <Image
                src={data.logoUrl}
                alt="Logo"
                width={72} height={72}
                className={styles.logo}
                unoptimized
              />
            )}
            <div>
              <h1 className={styles.businessName}>{data.businessName}</h1>
              {data.tagline && <p className={styles.detail}>{data.tagline}</p>}
              {data.address && <p className={styles.detail}>{data.address}</p>}
              {data.phone   && <p className={styles.detail}>{data.phone}</p>}
              {data.email   && <p className={styles.detail}>{data.email}</p>}
              {data.panNumber && <p className={styles.detail}><strong>PAN:</strong> {data.panNumber}</p>}
              {data.vatNumber && <p className={styles.detail}><strong>VAT No:</strong> {data.vatNumber}</p>}
            </div>
          </div>

          <div className={styles.docMeta}>
            <p className={styles.docType}>PRICE LIST</p>
            <p className={styles.docDate}>{data.date}</p>
          </div>
        </div>

        <hr className={styles.divider} />

        {/* Rate table */}
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thService}>Service / Material</th>
              <th className={styles.thRate}>Rate</th>
              <th className={styles.thUnit}>Per</th>
              <th className={styles.thNote}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {data.rateItems.map((item) => (
              <tr key={item.id}>
                <td className={styles.tdService}>{item.label}</td>
                <td className={styles.tdRate}>{fmtRate(item.rate)}</td>
                <td className={styles.tdUnit}>{item.unit}</td>
                <td className={styles.tdNote}>{item.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.footer}>
          <p>If print exceeds one hour , additional charges of rs 75 per hour will apply.</p>
        </div>
      </div>
    </div>
  );
}
