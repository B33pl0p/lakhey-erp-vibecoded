import Link from "next/link";
import { MessageSquare, Building2, Blocks, Settings2, Inbox } from "lucide-react";
import styles from "./page.module.css";

const cards = [
  {
    title: "Testimonials",
    text: "Manage customer quotes shown on the public website.",
    href: "/admin/website/testimonials",
    icon: MessageSquare,
  },
  {
    title: "Clients",
    text: "Manage client names/logos for trust sections.",
    href: "/admin/website/clients",
    icon: Building2,
  },
  {
    title: "Sections",
    text: "Edit homepage information sections and ordering.",
    href: "/admin/website/sections",
    icon: Blocks,
  },
  {
    title: "Website Settings",
    text: "Edit hero title, CTAs, and global website info.",
    href: "/admin/website/settings",
    icon: Settings2,
  },
  {
    title: "Inquiries",
    text: "Review and manage website leads from the studio form.",
    href: "/admin/website/inquiries",
    icon: Inbox,
  },
];

export const dynamic = "force-dynamic";

export default function WebsiteAdminPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Website Content</h1>
        <p>Manage client-facing website content from admin.</p>
      </header>

      <section className={styles.grid}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href} className={styles.card}>
              <div className={styles.iconWrap}><Icon size={18} /></div>
              <h2>{card.title}</h2>
              <p>{card.text}</p>
              <span className={styles.open}>Open →</span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
