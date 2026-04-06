"use client";

import { FormEvent, useState, useTransition } from "react";
import { submitStudioInquiry } from "@/lib/api/customers";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import styles from "./page.module.css";

export default function StudioPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inquiryAs, setInquiryAs] = useState("Business");
  const [projectDescription, setProjectDescription] = useState("");
  const [materialPreference, setMaterialPreference] = useState("");
  const [fileLink, setFileLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await submitStudioInquiry({
        name,
        email,
        inquiryAs,
        materialPreference,
        projectDescription,
        fileLink,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess("Your inquiry was submitted successfully. Our team can now review it from the admin panel.");
      setName("");
      setEmail("");
      setInquiryAs("Business");
      setProjectDescription("");
      setMaterialPreference("");
      setFileLink("");
    });
  }

  return (
    <main className={styles.page}>
      <div className={styles.bgImage} />
      <div className={styles.bgLayer} />
      <WebsiteNav />

      <section className={styles.hero}>
        <p className={styles.kicker}>Start a Project</p>
        <h1>Custom 3D Printing</h1>
        <p>
          Share your idea and what you need. We help choose the right material, give a clear quote, and deliver prints
          that match your use.
        </p>
      </section>

      <section className={styles.section}>
        <h2>How It Works</h2>
        <div className={styles.timeline}>
          <article>
            <span>1</span>
            <h3>Share Your Vision</h3>
            <p>Describe your concept, intended use, size requirements, and timeline expectations.</p>
          </article>
          <article>
            <span>2</span>
            <h3>Review & Quote</h3>
            <p>We review your request, suggest materials, and send a clear quote with timeline.</p>
          </article>
          <article>
            <span>3</span>
            <h3>Print & Deliver</h3>
            <p>After approval, we print, finish, quality-check, and deliver to your location.</p>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Project Inquiry</h2>
        <p className={styles.sectionText}>
          Paste a link to your files (Google Drive, Dropbox, Thingiverse, etc.) or leave it blank and email files later.
        </p>
        <form className={styles.form} onSubmit={onSubmit}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            I am inquiring as
            <select value={inquiryAs} onChange={(e) => setInquiryAs(e.target.value)}>
              <option>Business</option>
              <option>Individual</option>
            </select>
          </label>
          <label>
            Material Preference
            <input
              placeholder="PLA, PETG, Resin, or let us recommend"
              value={materialPreference}
              onChange={(e) => setMaterialPreference(e.target.value)}
            />
          </label>
          <label className={styles.full}>
            Project Description
            <textarea
              rows={6}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              required
            />
          </label>
          <label className={styles.full}>
            Paste a link to your 3D files (Google Drive, Dropbox, etc.) or leave blank to email them later
            <input
              placeholder="https://..."
              value={fileLink}
              onChange={(e) => setFileLink(e.target.value)}
            />
          </label>
          <button type="submit" disabled={isPending}>
            {isPending ? "Sending..." : "Send Project Request"}
          </button>
        </form>
        {error ? <p className={styles.error}>{error}</p> : null}
        {success ? <p className={styles.success}>{success}</p> : null}
      </section>
      <WebsiteFooter />
    </main>
  );
}
