import { getDashboardData } from "@/lib/api/dashboard";
import { formatCurrency } from "@/lib/utils/currency";
import Link from "next/link";
import {
  ShoppingCart, Users, TrendingUp, AlertTriangle,
  Clock, CheckCircle, Package, FileText, UserPlus,
} from "lucide-react";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:     "#f59e0b",
  in_progress: "#3b82f6",
  completed:   "#10b981",
  cancelled:   "#ef4444",
  on_hold:     "#8b5cf6",
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft:           "#6b7280",
  sent:            "#2563eb",
  paid:            "#059669",
  partially_paid:  "#d97706",
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  const today = new Date().toLocaleDateString("en-NP", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className={styles.dashboard}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageDate}>{today}</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/orders/new" className={styles.primaryBtn}>
            <ShoppingCart size={16} /> New Order
          </Link>
          <Link href="/invoices/new" className={styles.secondaryBtn}>
            <FileText size={16} /> New Invoice
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#3b82f620", color: "#3b82f6" }}>
            <ShoppingCart size={22} />
          </div>
          <div>
            <p className={styles.statLabel}>Total Orders</p>
            <p className={styles.statValue}>{data.totalOrders}</p>
            <p className={styles.statSub}>
              <span style={{ color: "#f59e0b" }}>{data.pendingOrders} pending</span>
              {" · "}
              <span style={{ color: "#3b82f6" }}>{data.inProgressOrders} in progress</span>
            </p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#10b98120", color: "#10b981" }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <p className={styles.statLabel}>Revenue (Paid)</p>
            <p className={styles.statValue}>{formatCurrency(data.totalRevenue)}</p>
            <p className={styles.statSub}>
              <span style={{ color: "#d97706" }}>{formatCurrency(data.unpaidRevenue)} outstanding</span>
            </p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#8b5cf620", color: "#8b5cf6" }}>
            <Users size={22} />
          </div>
          <div>
            <p className={styles.statLabel}>Customers</p>
            <p className={styles.statValue}>{data.totalCustomers}</p>
            <p className={styles.statSub}>Total registered</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: data.lowStockItems.length > 0 ? "#ef444420" : "#10b98120",
                     color:   data.lowStockItems.length > 0 ? "#ef4444"   : "#10b981" }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className={styles.statLabel}>Low Stock</p>
            <p className={styles.statValue}>{data.lowStockItems.length}</p>
            <p className={styles.statSub}>
              {data.lowStockItems.length > 0
                ? <span style={{ color: "#ef4444" }}>Items need restocking</span>
                : <span style={{ color: "#10b981" }}>All stocked up</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Main two-column section */}
      <div className={styles.mainGrid}>

        {/* Recent Orders */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}><Clock size={16} /> Recent Orders</h2>
            <Link href="/orders" className={styles.viewAllLink}>View all →</Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className={styles.emptyState}>No orders yet.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th className={styles.right}>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map(order => (
                  <tr key={order.$id}>
                    <td>
                      <Link href={`/orders/${order.$id}`} className={styles.tableLink}>
                        {order.title}
                      </Link>
                    </td>
                    <td className={styles.muted}>{order.customer_name}</td>
                    <td>
                      <span className={styles.badge} style={{
                        background: `${ORDER_STATUS_COLORS[order.status] ?? "#6b7280"}20`,
                        color: ORDER_STATUS_COLORS[order.status] ?? "#6b7280",
                      }}>
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className={styles.right}>{formatCurrency(order.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Invoices */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}><FileText size={16} /> Recent Invoices</h2>
            <Link href="/invoices" className={styles.viewAllLink}>View all →</Link>
          </div>
          {data.recentInvoices.length === 0 ? (
            <p className={styles.emptyState}>No invoices yet.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th className={styles.right}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recentInvoices.map(inv => (
                  <tr key={inv.$id}>
                    <td>
                      <Link href={`/invoices/${inv.$id}`} className={styles.tableLink}>
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className={styles.muted}>{inv.customer_name}</td>
                    <td>
                      <span className={styles.badge} style={{
                        background: `${INVOICE_STATUS_COLORS[inv.status] ?? "#6b7280"}20`,
                        color: INVOICE_STATUS_COLORS[inv.status] ?? "#6b7280",
                      }}>
                        {inv.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className={styles.right}>{formatCurrency(inv.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Customers */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}><UserPlus size={16} /> Recent Customers</h2>
          <Link href="/customers" className={styles.viewAllLink}>View all →</Link>
        </div>
        {data.recentCustomers.length === 0 ? (
          <p className={styles.emptyState}>No customers yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th className={styles.right}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.recentCustomers.map(c => (
                <tr key={c.$id}>
                  <td>
                    <Link href={`/customers/${c.$id}`} className={styles.tableLink}>
                      {c.name}
                    </Link>
                  </td>
                  <td className={styles.muted}>{c.email || "—"}</td>
                  <td className={styles.muted}>{c.phone || "—"}</td>
                  <td className={`${styles.right} ${styles.muted}`}>
                    {new Date(c.$createdAt).toLocaleDateString("en-NP", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Low Stock panel — only shown if there are low stock items */}
      {data.lowStockItems.length > 0 && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle} style={{ color: "#ef4444" }}>
              <AlertTriangle size={16} /> Low Stock Alert
            </h2>
            <Link href="/inventory" className={styles.viewAllLink}>Manage inventory →</Link>
          </div>
          <div className={styles.lowStockGrid}>
            {data.lowStockItems.map(item => (
              <Link href={`/inventory/${item.$id}/edit`} key={item.$id} className={styles.lowStockCard}>
                <div className={styles.lowStockLeft}>
                  <Package size={16} style={{ color: "#ef4444", flexShrink: 0 }} />
                  <div>
                    <p className={styles.lowStockName}>{item.name}</p>
                    <p className={styles.lowStockCategory}>{item.category}</p>
                  </div>
                </div>
                <div className={styles.lowStockRight}>
                  <span className={styles.lowStockQty}>{item.stock_qty} {item.unit}</span>
                  <span className={styles.lowStockThreshold}>min {item.low_stock_threshold}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state if no data at all */}
      {data.totalOrders === 0 && data.totalCustomers === 0 && (
        <div className={styles.emptyDashboard}>
          <CheckCircle size={48} style={{ color: "#10b981", marginBottom: "1rem" }} />
          <h2>All set up!</h2>
          <p>Start by adding a customer and creating your first order.</p>
          <div className={styles.emptyActions}>
            <Link href="/customers/new" className={styles.primaryBtn}>Add Customer</Link>
            <Link href="/orders/new" className={styles.secondaryBtn}>Create Order</Link>
          </div>
        </div>
      )}
    </div>
  );
}

