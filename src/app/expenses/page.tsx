import { getExpenses, getExpenseSummary } from "@/lib/api/expenses";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import Link from "next/link";
import { Plus } from "lucide-react";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const [expenses, summary] = await Promise.all([
    getExpenses(),
    getExpenseSummary(),
  ]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Expense Tracker</h1>
          <p>Record and analyse your business operating costs.</p>
        </div>
        <Link href="/expenses/new" className={styles.primaryAction}>
          <Plus size={18} />
          <span>Add Expense</span>
        </Link>
      </header>

      <div className={styles.tableCard}>
        <ExpenseTable initialExpenses={expenses} summary={summary} />
      </div>
    </div>
  );
}
