import styles from "./Badge.module.css";

type BadgeStatus = 
  // Orders
  | "pending" 
  | "printing" 
  | "done" 
  | "delivered" 
  | "cancelled"
  // Invoices (draft/sent overlap with colors, implemented explicitly)
  | "draft"
  | "sent"
  | "paid"
  | "partially_paid";

interface BadgeProps {
  status: BadgeStatus | string;
  label?: string; // Optional custom label, defaults to capitalized status
}

export function Badge({ status, label }: BadgeProps) {
  const normalizedStatus = status.toLowerCase() as BadgeStatus;
  
  const displayLabel = label || normalizedStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  let statusClass = styles.default;
  
  switch(normalizedStatus) {
    case "pending":
    case "partially_paid":
      statusClass = styles.yellow;
      break;
    case "printing":
    case "sent":
      statusClass = styles.blue;
      break;
    case "done":
    case "paid":
    case "accepted":
      statusClass = styles.green;
      break;
    case "cancelled":
    case "rejected":
      statusClass = styles.red;
      break;
    case "delivered":
    case "draft":
      statusClass = styles.gray;
      break;
    case "expired":
      statusClass = styles.yellow;
      break;
  }

  return (
    <span className={`${styles.badge} ${statusClass}`}>
      {displayLabel}
    </span>
  );
}
