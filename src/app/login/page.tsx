"use client";

import { useState, useTransition } from "react";
import { loginAction } from "@/lib/api/auth";
import styles from "./page.module.css";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    startTransition(async () => {
      const result = await loginAction(email, password);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>LL</div>
          <span className={styles.logoText}>Lakhey Labs</span>
        </div>
        <h1 className={styles.heading}>Sign in to ERP</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={styles.input}
              placeholder="you@lakhey.com"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={styles.input}
              placeholder="••••••••"
            />
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={isPending}>
            {isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
