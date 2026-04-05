import { getFinanceData } from "@/lib/api/finance";
import { formatCurrency } from "@/lib/utils/currency";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, AlertTriangle, CreditCard,
  Users, Clock, ArrowRight, Wallet,
} from "lucide-react";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank",
  online: "Online",
  other: "Other",
};

export default async function FinancePage() {
  const data = await getFinanceData();
  const { summary, receivables, overdueInvoices, monthlyFlow, recentPayments } = data;

  // For monthly cash flow bar chart — find max for scaling
  const maxMonthVal = Math.max(
    ...monthlyFlow.map(m => Math.max(m.revenue, m.expenses)),
    1
  );

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Finance Tracker</h1>
          <p className={styles.pageSubtitle}>
            Collected · Outstanding · Cash flow · Receivables
          </p>
        </div>
        <Link href="/admin/invoices/new" className={styles.primaryBtn}>
          + New Invoice
        </Link>
      </div>

      {/* ── Summary Cards ────────────────────────────────────────────── */}
      <div className={styles.summaryGrid}>
        <div className={`${styles.card} ${styles.cardBlue}`}>
          <div className={styles.cardIcon}><Wallet size={20} /></div>
          <div className={styles.cardBody}>
            <p className={styles.cardLabel}>Total Invoiced</p>
            <p className={styles.cardValue}>{formatCurrency(summary.totalInvoiced)}</p>
          </div>
        </div>

        <div className={`${styles.card} ${styles.cardGreen}`}>
          <div className={styles.cardIcon}><TrendingUp size={20} /></div>
          <div className={styles.cardBody}>
            <p className={styles.cardLabel}>Collected</p>
            <p className={styles.cardValue}>{formatCurrency(summary.totalCollected)}</p>
          </div>
        </div>

        <div className={`${styles.card} ${styles.cardAmber}`}>
          <div className={styles.cardIcon}><Clock size={20} /></div>
          <div className={styles.cardBody}>
            <p className={styles.cardLabel}>Outstanding</p>
            <p className={styles.cardValue}>{formatCurrency(summary.totalOutstanding)}</p>
          </div>
        </div>

        <div className={`${styles.card} ${styles.cardRed}`}>
          <div className={styles.cardIcon}><TrendingDown size={20} /></div>
          <div className={styles.cardBody}>
            <p className={styles.cardLabel}>Total Expenses</p>
            <p className={styles.cardValue}>{formatCurrency(summary.totalExpenses)}</p>
          </div>
        </div>

        <div className={`${styles.card} ${summary.netProfit >= 0 ? styles.cardGreenDark : styles.cardRed}`}>
          <div className={styles.cardIcon}><CreditCard size={20} /></div>
          <div className={styles.cardBody}>
            <p className={styles.cardLabel}>Net Profit</p>
            <p className={styles.cardValue}>{formatCurrency(summary.netProfit)}</p>
            <p className={styles.cardNote}>Collected − Expenses</p>
          </div>
        </div>
      </div>

      {/* ── Receivables ──────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <Users size={18} />
            <h2>Customer Receivables</h2>
          </div>
          <span className={styles.sectionBadge}>{receivables.length} customers with open balance</span>
        </div>

        {receivables.length === 0 ? (
          <div className={styles.emptyState}>
            <p>🎉 No outstanding balances — all customers are settled!</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th className={styles.center}>Open Invoices</th>
                  <th className={styles.right}>Invoiced</th>
                  <th className={styles.right}>Advance Paid</th>
                  <th className={styles.right}>Balance Due</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {receivables.map(r => (
                  <tr key={r.customerId} className={r.isOverdue ? styles.rowOverdue : ""}>
                    <td>
                      <Link href={`/admin/customers/${r.customerId}`} className={styles.customerLink}>
                        {r.customerName}
                      </Link>
                      {r.phone && <span className={styles.phoneHint}>{r.phone}</span>}
                    </td>
                    <td className={styles.center}>{r.openInvoices}</td>
                    <td className={styles.right}>{formatCurrency(r.totalInvoiced)}</td>
                    <td className={styles.right}>
                      {r.totalPaid > 0
                        ? <span className={styles.paidAmount}>{formatCurrency(r.totalPaid)}</span>
                        : <span className={styles.muted}>—</span>}
                    </td>
                    <td className={styles.right}>
                      <strong className={styles.balanceDue}>{formatCurrency(r.balance)}</strong>
                    </td>
                    <td>
                      {r.isOverdue ? (
                        <span className={styles.badgeOverdue}>
                          <AlertTriangle size={12} /> Overdue
                        </span>
                      ) : r.totalPaid > 0 ? (
                        <span className={styles.badgePartial}>Partial</span>
                      ) : (
                        <span className={styles.badgePending}>Pending</span>
                      )}
                    </td>
                    <td>
                      <Link href={`/admin/invoices?customer=${r.customerId}`} className={styles.viewLink}>
                        View <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Two-column: Overdue + Recent Payments ────────────────────── */}
      <div className={styles.twoCol}>

        {/* Overdue Invoices */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <AlertTriangle size={18} className={styles.iconRed} />
              <h2>Overdue Invoices</h2>
            </div>
            {overdueInvoices.length > 0 && (
              <span className={styles.sectionBadgeRed}>{overdueInvoices.length}</span>
            )}
          </div>

          {overdueInvoices.length === 0 ? (
            <div className={styles.emptyState}><p>No overdue invoices ✓</p></div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th className={styles.right}>Balance</th>
                    <th className={styles.right}>Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueInvoices.map(inv => (
                    <tr key={inv.invoiceId}>
                      <td>
                        <Link href={`/admin/invoices/${inv.invoiceId}`} className={styles.invLink}>
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td>{inv.customerName}</td>
                      <td className={styles.right}>
                        <strong>{formatCurrency(inv.balance)}</strong>
                      </td>
                      <td className={styles.right}>
                        <span className={styles.daysBadge}>{inv.daysOverdue}d</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent Payments */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <CreditCard size={18} />
              <h2>Recent Payments</h2>
            </div>
          </div>

          {recentPayments.length === 0 ? (
            <div className={styles.emptyState}><p>No payments recorded yet</p></div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Invoice</th>
                    <th>Method</th>
                    <th className={styles.right}>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map(p => (
                    <tr key={p.paymentId}>
                      <td>{p.customerName}</td>
                      <td>
                        <span className={styles.invNumber}>{p.invoiceNumber}</span>
                      </td>
                      <td>
                        <span className={styles.methodBadge}>{METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}</span>
                      </td>
                      <td className={styles.right}>
                        <span className={styles.paidAmount}>{formatCurrency(p.amountPaid)}</span>
                      </td>
                      <td className={styles.muted}>{p.paymentDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ── Monthly Cash Flow ────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <TrendingUp size={18} />
            <h2>Monthly Cash Flow</h2>
          </div>
          <span className={styles.sectionBadge}>Last 12 months</span>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Month</th>
                <th className={styles.right}>Revenue In</th>
                <th className={styles.right}>Expenses Out</th>
                <th className={styles.right}>Net</th>
                <th style={{ width: "35%" }}>Visual</th>
              </tr>
            </thead>
            <tbody>
              {[...monthlyFlow].reverse().map(m => (
                <tr key={m.key}>
                  <td className={styles.monthLabel}>{m.label}</td>
                  <td className={styles.right}>
                    <span className={styles.revenueText}>{formatCurrency(m.revenue)}</span>
                  </td>
                  <td className={styles.right}>
                    <span className={styles.expenseText}>{formatCurrency(m.expenses)}</span>
                  </td>
                  <td className={styles.right}>
                    <span className={m.net >= 0 ? styles.netPositive : styles.netNegative}>
                      {m.net >= 0 ? "+" : ""}{formatCurrency(m.net)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.barRow}>
                      {m.revenue > 0 && (
                        <div
                          className={styles.barRevenue}
                          style={{ width: `${(m.revenue / maxMonthVal) * 100}%` }}
                          title={`Revenue: ${formatCurrency(m.revenue)}`}
                        />
                      )}
                      {m.expenses > 0 && (
                        <div
                          className={styles.barExpense}
                          style={{ width: `${(m.expenses / maxMonthVal) * 100}%` }}
                          title={`Expenses: ${formatCurrency(m.expenses)}`}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.legend}>
          <span><span className={styles.dotRevenue} /> Revenue collected</span>
          <span><span className={styles.dotExpense} /> Expenses</span>
        </div>
      </section>
    </div>
  );
}
