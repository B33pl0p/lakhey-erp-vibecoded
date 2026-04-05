"use client";

import styles from "./page.module.css";

export default function PrintButton() {
  return (
    <button className={styles.printBtn} onClick={() => window.print()}>
      🖨 Print / Save PDF
    </button>
  );
}
