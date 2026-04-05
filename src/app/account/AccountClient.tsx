"use client";

import { useState, useTransition } from "react";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import {
  loginCustomerAction,
  logoutCustomerAction,
  signupCustomerAction,
} from "@/lib/api/customerAuth";
import styles from "./page.module.css";

type Props = {
  nextPath: string;
  user: { name?: string; email: string } | null;
};

export function AccountClient({ nextPath, user }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    startTransition(async () => {
      const result = await loginCustomerAction({ email, password, nextPath });
      if (result?.error) setError(result.error);
    });
  }

  function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;

    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;
    const address = (form.elements.namedItem("address") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    startTransition(async () => {
      const result = await signupCustomerAction({ name, email, phone, address, password, nextPath });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <WebsiteNav />
        <div className={styles.header}>
          <p className={styles.kicker}>Lakhey Labs Account</p>
          <h1>Login or create account to place orders</h1>
          <p>
            Customer orders require an account so we can keep your delivery details, order history, and contact updates
            in sync with our production dashboard.
          </p>
        </div>

        {user ? (
          <div className={styles.loggedInBox}>
            <h2>You are logged in</h2>
            <p>
              <strong>{user.name || "Customer"}</strong>
              <span>{user.email}</span>
            </p>
            <div className={styles.loggedInActions}>
              <a href={nextPath} className={styles.primaryBtn}>Continue to Order</a>
              <a href="/track" className={styles.secondaryBtn}>Track Order</a>
              <form action={logoutCustomerAction}>
                <button className={styles.secondaryBtn} type="submit">Logout</button>
              </form>
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            <form className={styles.card} onSubmit={handleLogin}>
              <h2>Login</h2>
              <label>
                Email
                <input name="email" type="email" required />
              </label>
              <label>
                Password
                <input name="password" type="password" required />
              </label>
              <button type="submit" className={styles.primaryBtn} disabled={isPending}>
                {isPending ? "Please wait..." : "Login"}
              </button>
            </form>

            <form className={styles.card} onSubmit={handleSignup}>
              <h2>Sign up</h2>
              <label>
                Full Name
                <input name="name" required />
              </label>
              <label>
                Email
                <input name="email" type="email" required />
              </label>
              <label>
                Phone
                <input name="phone" required />
              </label>
              <label>
                Address
                <input name="address" required />
              </label>
              <label>
                Password (min 8 chars)
                <input name="password" type="password" minLength={8} required />
              </label>
              <button type="submit" className={styles.primaryBtn} disabled={isPending}>
                {isPending ? "Please wait..." : "Create account"}
              </button>
            </form>
          </div>
        )}

        {error ? <p className={styles.error}>{error}</p> : null}
        <WebsiteFooter />
      </section>
    </main>
  );
}
