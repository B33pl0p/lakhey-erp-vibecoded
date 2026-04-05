import styles from "./WebsiteFooter.module.css";

type WebsiteFooterProps = {
  className?: string;
};

export function WebsiteFooter({ className }: WebsiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <div className={`${styles.wrap} ${className || ""}`.trim()}>
      <footer className={styles.footer}>
        <p className={styles.copy}>
          Lakhey Labs
          <span>© {year} All rights reserved.</span>
        </p>
      </footer>
    </div>
  );
}
