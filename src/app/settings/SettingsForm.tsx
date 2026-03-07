"use client";

import { useState, useEffect } from "react";
import { saveBusinessConfig, type BusinessConfig } from "@/lib/api/businessConfig";
import { uploadFile, deleteFile } from "@/lib/api/storage";
import { useToast } from "@/components/ui/ToastContext";
import { Building2, FileText, Palette, Upload, X, Sun, Moon, Settings2, Download } from "lucide-react";
import { getOrdersForExport, getCustomersForExport, getInvoicesForExport } from "@/lib/api/exports";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./SettingsForm.module.css";

interface SettingsFormProps {
  initialConfig: BusinessConfig;
  initialLogoUrl: string | null;
}

type Section = "business" | "invoice" | "operations" | "export" | "appearance";

export function SettingsForm({ initialConfig, initialLogoUrl }: SettingsFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>("business");
  const [isSaving, setIsSaving] = useState(false);
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [logoUploading, setLogoUploading] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const [form, setForm] = useState({
    // Business Profile
    company_name: initialConfig.company_name || "",
    tagline: initialConfig.tagline || "",
    email: initialConfig.email || "",
    phone: initialConfig.phone || "",
    address: initialConfig.address || "",
    website: initialConfig.website || "",
    pan_number: initialConfig.pan_number || "",
    vat_number: initialConfig.vat_number || "",
    company_reg_number: initialConfig.company_reg_number || "",
    // Invoice Defaults
    invoice_prefix: initialConfig.invoice_prefix || "INV",
    invoice_default_notes: initialConfig.invoice_default_notes || "",
    invoice_payment_terms: initialConfig.invoice_payment_terms || "",
    vat_enabled: initialConfig.vat_enabled ?? false,
    vat_rate: initialConfig.vat_rate?.toString() || "13",
    // Operational defaults
    low_stock_threshold: initialConfig.low_stock_threshold?.toString() || "5",
    default_order_deadline_days: initialConfig.default_order_deadline_days?.toString() || "7",
    fiscal_year_type: initialConfig.fiscal_year_type || "calendar",
    // logo_id tracked separately
    logo_id: initialConfig.logo_id || "",
  });

  // Sync theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    if (saved) setTheme(saved);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const oldLogoId = form.logo_id;
      const newFileId = await uploadFile(fd);
      setForm(prev => ({ ...prev, logo_id: newFileId }));
      setLogoUrl(URL.createObjectURL(file));
      // Delete old logo if exists
      if (oldLogoId) {
        await deleteFile(oldLogoId).catch(() => null);
      }
      toast("Logo uploaded", "success");
    } catch {
      toast("Error uploading logo", "error");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!form.logo_id) return;
    try {
      await deleteFile(form.logo_id);
      setForm(prev => ({ ...prev, logo_id: "" }));
      setLogoUrl(null);
      toast("Logo removed", "success");
    } catch {
      toast("Error removing logo", "error");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveBusinessConfig({
        company_name: form.company_name || "PrintFlow Studio",
        tagline: form.tagline || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        website: form.website || undefined,
        logo_id: form.logo_id || undefined,
        pan_number: form.pan_number || undefined,
        vat_number: form.vat_number || undefined,
        company_reg_number: form.company_reg_number || undefined,
        invoice_prefix: form.invoice_prefix || "INV",
        invoice_default_notes: form.invoice_default_notes || undefined,
        invoice_payment_terms: form.invoice_payment_terms || undefined,
        vat_enabled: form.vat_enabled,
        vat_rate: Number(form.vat_rate) || 13,
        low_stock_threshold: Number(form.low_stock_threshold) || 5,
        default_order_deadline_days: Number(form.default_order_deadline_days) || 7,
        fiscal_year_type: form.fiscal_year_type as 'calendar' | 'nepali',
      });
      toast("Settings saved", "success");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast("Error saving settings", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
    toast(`Switched to ${newTheme} mode`, "info");
  };

  const downloadCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) { toast("No data to export", "info"); return; }
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(h => {
        const val = row[h] ?? '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (type: 'orders' | 'customers' | 'invoices') => {
    setExportingType(type);
    try {
      const date = new Date().toISOString().slice(0, 10);
      if (type === 'orders') {
        const data = await getOrdersForExport();
        downloadCSV(data as Record<string, unknown>[], `orders_${date}.csv`);
      } else if (type === 'customers') {
        const data = await getCustomersForExport();
        downloadCSV(data as Record<string, unknown>[], `customers_${date}.csv`);
      } else {
        const data = await getInvoicesForExport();
        downloadCSV(data as Record<string, unknown>[], `invoices_${date}.csv`);
      }
      toast(`${type.charAt(0).toUpperCase() + type.slice(1)} exported`, "success");
    } catch {
      toast(`Failed to export ${type}`, "error");
    } finally {
      setExportingType(null);
    }
  };

  const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "business", label: "Business Profile", icon: <Building2 size={16} /> },
    { id: "invoice", label: "Invoice Defaults", icon: <FileText size={16} /> },
    { id: "operations", label: "Operations", icon: <Settings2 size={16} /> },
    { id: "export", label: "Data Export", icon: <Download size={16} /> },
    { id: "appearance", label: "Appearance", icon: <Palette size={16} /> },
  ];

  return (
    <div className={styles.wrapper}>
      {/* Sidebar tabs */}
      <nav className={styles.tabs}>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            className={`${styles.tab} ${activeSection === s.id ? styles.activeTab : ""}`}
            onClick={() => setActiveSection(s.id)}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className={styles.content}>

        {/* ── Business Profile ── */}
        {activeSection === "business" && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Business Profile</h2>
            <p className={styles.sectionDesc}>
              This information appears on your printed invoices and bills.
            </p>

            {/* Logo */}
            <div className={styles.logoArea}>
              {logoUrl ? (
                <div className={styles.logoPreview}>
                  <Image src={logoUrl} alt="Logo" width={100} height={100} className={styles.logoImg} unoptimized />
                  <button className={styles.removeLogoBtn} onClick={handleRemoveLogo} title="Remove logo">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className={styles.logoPlaceholder}>
                  <Building2 size={32} style={{ opacity: 0.3 }} />
                  <span>No logo</span>
                </div>
              )}
              <label className={styles.uploadBtn}>
                <Upload size={14} />
                {logoUploading ? "Uploading..." : "Upload Logo"}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleLogoUpload}
                  disabled={logoUploading}
                />
              </label>
            </div>

            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Company Name *</label>
                <input name="company_name" value={form.company_name} onChange={handleChange} placeholder="PrintFlow Studio" />
              </div>
              <div className={styles.field}>
                <label>Tagline</label>
                <input name="tagline" value={form.tagline} onChange={handleChange} placeholder="3D Printing Services" />
              </div>
              <div className={styles.field}>
                <label>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="hello@company.com" />
              </div>
              <div className={styles.field}>
                <label>Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+977 98XXXXXXXX" />
              </div>
            </div>

            <div className={styles.field}>
              <label>Address</label>
              <textarea name="address" value={form.address} onChange={handleChange} rows={2} placeholder="Kathmandu, Nepal" />
            </div>

            <div className={styles.field}>
              <label>Website</label>
              <input name="website" value={form.website} onChange={handleChange} placeholder="https://yoursite.com" />
            </div>

            <hr className={styles.fieldDivider} />
            <p className={styles.groupLabel}>Nepal Tax / Registration</p>

            <div className={styles.grid3}>
              <div className={styles.field}>
                <label>PAN Number</label>
                <input name="pan_number" value={form.pan_number} onChange={handleChange} placeholder="e.g. 123456789" />
              </div>
              <div className={styles.field}>
                <label>VAT Reg. Number</label>
                <input name="vat_number" value={form.vat_number} onChange={handleChange} placeholder="If VAT registered" />
              </div>
              <div className={styles.field}>
                <label>Company Reg. No.</label>
                <input name="company_reg_number" value={form.company_reg_number} onChange={handleChange} placeholder="OCR number" />
              </div>
            </div>
          </div>
        )}

        {/* ── Invoice Defaults ── */}
        {activeSection === "invoice" && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Invoice Defaults</h2>
            <p className={styles.sectionDesc}>
              These values pre-fill when creating a new invoice.
            </p>

            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Invoice Prefix</label>
                <input name="invoice_prefix" value={form.invoice_prefix} onChange={handleChange} placeholder="INV" />
                <span className={styles.hint}>Generated numbers: {form.invoice_prefix || "INV"}-2026-001</span>
              </div>
              <div className={styles.field}>
                <label>Default Payment Terms</label>
                <input name="invoice_payment_terms" value={form.invoice_payment_terms} onChange={handleChange} placeholder="Due on delivery" />
              </div>
            </div>

            <div className={styles.field}>
              <label>Default Invoice Notes</label>
              <textarea
                name="invoice_default_notes"
                value={form.invoice_default_notes}
                onChange={handleChange}
                rows={3}
                placeholder="e.g. Bank details, thank you message..."
              />
            </div>

            <hr className={styles.fieldDivider} />
            <p className={styles.groupLabel}>VAT Settings</p>

            <div className={styles.toggleRow}>
              <div>
                <p className={styles.toggleLabel}>Enable VAT on invoices</p>
                <p className={styles.toggleDesc}>Adds a VAT line to the printed bill. Only enable if your business is VAT registered.</p>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  name="vat_enabled"
                  checked={form.vat_enabled}
                  onChange={handleChange}
                />
                <span className={styles.switchSlider} />
              </label>
            </div>

            {form.vat_enabled && (
              <div className={styles.field} style={{ maxWidth: 200 }}>
                <label>VAT Rate (%)</label>
                <input
                  name="vat_rate"
                  type="number"
                  value={form.vat_rate}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="13"
                />
              </div>
            )}
          </div>
        )}

        {/* ── Operations ── */}
        {activeSection === "operations" && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Operations</h2>
            <p className={styles.sectionDesc}>
              Default values used across orders and inventory.
            </p>

            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Low Stock Threshold</label>
                <input
                  name="low_stock_threshold"
                  type="number"
                  value={form.low_stock_threshold}
                  onChange={handleChange}
                  min="0"
                  placeholder="5"
                />
                <span className={styles.hint}>Items at or below this quantity are flagged as low stock.</span>
              </div>
              <div className={styles.field}>
                <label>Default Order Deadline (days)</label>
                <input
                  name="default_order_deadline_days"
                  type="number"
                  value={form.default_order_deadline_days}
                  onChange={handleChange}
                  min="0"
                  placeholder="7"
                />
                <span className={styles.hint}>Auto-fills deadline when creating a new order.</span>
              </div>
            </div>

            <hr className={styles.fieldDivider} />
            <p className={styles.groupLabel}>Fiscal Year</p>

            <div className={styles.field}>
              <label>Fiscal Year Type</label>
              <select name="fiscal_year_type" value={form.fiscal_year_type} onChange={handleChange}>
                <option value="calendar">Calendar Year (Jan 1 – Dec 31)</option>
                <option value="nepali">Nepal Fiscal Year (Shrawan – Ashadh, ~Jul 16)</option>
              </select>
              <span className={styles.hint}>
                Controls when the invoice sequence number resets.&nbsp;
                {form.fiscal_year_type === 'nepali'
                  ? 'Invoice numbers use the FY start year (e.g. INV-2025-001 for FY 2025/26).'
                  : 'Invoice numbers reset every January 1.'}
              </span>
            </div>
          </div>
        )}

        {/* ── Data Export ── */}
        {activeSection === "export" && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Data Export</h2>
            <p className={styles.sectionDesc}>
              Download your data as CSV files — compatible with Excel and accounting software.
            </p>

            <div className={styles.exportGrid}>
              <div className={styles.exportCard}>
                <div className={styles.exportCardInfo}>
                  <h3>Orders</h3>
                  <p>All orders with status, pricing, quantities, and deadlines.</p>
                </div>
                <button
                  className={styles.exportBtn}
                  onClick={() => { void handleExport('orders'); }}
                  disabled={exportingType !== null}
                >
                  <Download size={15} />
                  {exportingType === 'orders' ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>

              <div className={styles.exportCard}>
                <div className={styles.exportCardInfo}>
                  <h3>Customers</h3>
                  <p>All customer records including contact details.</p>
                </div>
                <button
                  className={styles.exportBtn}
                  onClick={() => { void handleExport('customers'); }}
                  disabled={exportingType !== null}
                >
                  <Download size={15} />
                  {exportingType === 'customers' ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>

              <div className={styles.exportCard}>
                <div className={styles.exportCardInfo}>
                  <h3>Invoices</h3>
                  <p>All invoices with amounts, statuses, and due dates.</p>
                </div>
                <button
                  className={styles.exportBtn}
                  onClick={() => { void handleExport('invoices'); }}
                  disabled={exportingType !== null}
                >
                  <Download size={15} />
                  {exportingType === 'invoices' ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Appearance ── */}
        {activeSection === "appearance" && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Appearance</h2>
            <p className={styles.sectionDesc}>Customize the look of the application.</p>

            <div className={styles.toggleRow}>
              <div>
                <p className={styles.toggleLabel}>Theme</p>
                <p className={styles.toggleDesc}>
                  Currently: <strong>{theme === "dark" ? "Dark Mode" : "Light Mode"}</strong>
                </p>
              </div>
              <button className={styles.themeToggleBtn} onClick={toggleTheme}>
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                Switch to {theme === "dark" ? "Light" : "Dark"}
              </button>
            </div>
          </div>
        )}

        {/* Save button — not shown for appearance (saves instantly) or export (no config) */}
        {activeSection !== "appearance" && activeSection !== "export" && (
          <div className={styles.saveBar}>
            <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
