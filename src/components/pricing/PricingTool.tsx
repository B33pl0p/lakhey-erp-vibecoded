"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Save } from "lucide-react";
import { savePricingRates } from "@/lib/api/businessConfig";
import styles from "./PricingTool.module.css";

export interface BusinessInfo {
  businessName: string;
  tagline?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string | null;
  panNumber?: string;
  vatNumber?: string;
}

interface PricingToolProps {
  business: BusinessInfo;
  initialRates?: Record<string, number>;
}

// ── All rate items ────────────────────────────────────────────────────────────
const RATE_ITEMS = [
  { id: "pla",          label: "PLA Filament",          unit: "gram",  group: "filament" },
  { id: "petg",         label: "PETG Filament",         unit: "gram",  group: "filament" },
  { id: "abs",          label: "ABS Filament",          unit: "gram",  group: "filament" },
  { id: "asa",          label: "ASA Filament",          unit: "gram",  group: "filament" },
  { id: "resin",        label: "Resin",                 unit: "gram",  group: "filament" },
  { id: "machineRate",  label: "Machine / Print Time",  unit: "hour",  group: "services" },
  { id: "sandingRate",  label: "Sanding",               unit: "piece", group: "services" },
  { id: "primerRate",   label: "Primer Coat",           unit: "piece", group: "services" },
  { id: "supportRate",  label: "Support Removal",       unit: "piece", group: "services" },
  { id: "paintingRate", label: "Painting / Finishing",  unit: "piece", group: "services" },
] as const;

const RATE_DEFAULTS: Record<string, number> = {
  pla: 5.0, petg: 7.0, abs: 6.5, asa: 8.0, resin: 9.0,
  machineRate: 75, sandingRate: 250, primerRate: 150,
  supportRate: 120, paintingRate: 400,
};

export function PricingTool({ business, initialRates }: PricingToolProps) {

  // ── Rates ──────────────────────────────────────────────────────────────────
  const [rates, setRates] = useState<Record<string, number>>({
    ...RATE_DEFAULTS,
    ...(initialRates ?? {}),
  });
  const [showRates, setShowRates] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [savedMsg, setSavedMsg]   = useState("");

  const handleSaveRates = async () => {
    setSaving(true);
    try {
      await savePricingRates(rates);
      setSavedMsg("Saved ✓");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (e) {
      console.error(e);
      setSavedMsg("Error saving");
      setTimeout(() => setSavedMsg(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  // ── Selection ─────────────────────────────────────────────────────────────
  // By default include everything
  const [included, setIncluded] = useState<Record<string, boolean>>(
    Object.fromEntries(RATE_ITEMS.map(r => [r.id, true]))
  );

  const toggle = (id: string) =>
    setIncluded(s => ({ ...s, [id]: !s[id] }));

  const toggleAll = (val: boolean) =>
    setIncluded(Object.fromEntries(RATE_ITEMS.map(r => [r.id, val])));

  // ── Generate PDF ──────────────────────────────────────────────────────────
  const generatePdf = () => {
    const selected = RATE_ITEMS
      .filter(r => included[r.id])
      .map(r => {
        const rate = rates[r.id] ?? 0;
        let note: string | undefined = undefined;
        if (r.id === "machineRate") {
          note = `FDM: first 1 hr free, then Rs\u00a0${rate}/hr · Resin: Rs\u00a0${rate}/hr charged from the start`;
        }
        return { id: r.id, label: r.label, rate, unit: r.unit, note };
      });

    const data = {
      date: new Date().toLocaleDateString("en-NP", { year: "numeric", month: "long", day: "numeric" }),
      rateItems: selected,
      ...business,
    };
    sessionStorage.setItem("pricing_print_data", JSON.stringify(data));
    window.open("/pricing/print", "_blank");
  };

  const anySelected = RATE_ITEMS.some(r => included[r.id]);

  const filamentItems = RATE_ITEMS.filter(r => r.group === "filament");
  const serviceItems  = RATE_ITEMS.filter(r => r.group === "services");

  return (
    <div className={styles.tool}>

      {/* ── Rate Configuration ── */}
      <div className={styles.card}>
        <button className={styles.sectionToggle} onClick={() => setShowRates(v => !v)}>
          <span className={styles.sectionTitleRow}>
            <span className={styles.sectionTitle}>⚙ Rate Configuration</span>
            <span className={styles.sectionHint}>Saved to your business config</span>
          </span>
          {showRates ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showRates && (
          <div className={styles.ratesBody}>
            <div className={styles.ratesGrid}>
              <div className={styles.ratesGroup}>
                <h4 className={styles.ratesGroupTitle}>Filament (Rs / gram)</h4>
                {filamentItems.map(item => (
                  <div key={item.id} className={styles.rateRow}>
                    <label>{item.label}</label>
                    <input
                      type="number" min="0" step="0.5"
                      className={styles.rateInput}
                      value={rates[item.id] ?? ""}
                      onChange={e => setRates(r => ({ ...r, [item.id]: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                ))}
              </div>

              <div className={styles.ratesGroup}>
                <h4 className={styles.ratesGroupTitle}>Machine &amp; Services</h4>
                {serviceItems.map(item => (
                  <div key={item.id} className={styles.rateRow}>
                    <label>{item.label} <span className={styles.rateUnit}>(Rs/{item.unit})</span></label>
                    <input
                      type="number" min="0" step="1"
                      className={styles.rateInput}
                      value={rates[item.id] ?? ""}
                      onChange={e => setRates(r => ({ ...r, [item.id]: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                ))}
                <p className={styles.ratesHint}>FDM: first 1 hr is free — charged per hr after that · Resin: charged per hr from the start</p>
              </div>
            </div>

            <button
              className={styles.saveRatesBtn}
              onClick={handleSaveRates}
              disabled={saving}
            >
              <Save size={14} />
              {savedMsg || (saving ? "Saving…" : "Save Rates")}
            </button>
          </div>
        )}
      </div>

      {/* ── Rate selection / PDF builder ── */}
      <div className={styles.card}>
        <div className={styles.cardTitleRow}>
          <h2 className={styles.cardTitle}>
            <FileText size={16} /> Generate Rate Card PDF
          </h2>
          <div className={styles.selectAllRow}>
            <button className={styles.selectAllBtn} onClick={() => toggleAll(true)}>All</button>
            <button className={styles.selectAllBtn} onClick={() => toggleAll(false)}>None</button>
          </div>
        </div>
        <p className={styles.hint}>Select which services to include in the PDF, then generate.</p>

        <div className={styles.rateCardGrid}>
          {/* Filament */}
          <div className={styles.rateCardGroup}>
            <h4 className={styles.rateCardGroupTitle}>Filament</h4>
            {filamentItems.map(item => (
              <label
                key={item.id}
                className={`${styles.rateCardRow} ${!included[item.id] ? styles.rcExcluded : ""}`}
              >
                <input
                  type="checkbox"
                  className={styles.chk}
                  checked={included[item.id]}
                  onChange={() => toggle(item.id)}
                />
                <span className={styles.rcLabel}>{item.label}</span>
                <span className={styles.rcRate}>
                  Rs {(rates[item.id] ?? 0).toLocaleString("en-NP")} / {item.unit}
                </span>
              </label>
            ))}
          </div>

          {/* Services */}
          <div className={styles.rateCardGroup}>
            <h4 className={styles.rateCardGroupTitle}>Services</h4>
            {serviceItems.map(item => (
              <label
                key={item.id}
                className={`${styles.rateCardRow} ${!included[item.id] ? styles.rcExcluded : ""}`}
              >
                <input
                  type="checkbox"
                  className={styles.chk}
                  checked={included[item.id]}
                  onChange={() => toggle(item.id)}
                />
                <span className={styles.rcLabel}>{item.label}</span>
                <span className={styles.rcRate}>
                  Rs {(rates[item.id] ?? 0).toLocaleString("en-NP")} / {item.unit}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── Action ── */}
      <div className={styles.actions}>
        <button
          className={styles.pdfBtn}
          onClick={generatePdf}
          disabled={!anySelected}
        >
          <FileText size={15} /> Generate PDF
        </button>
      </div>

    </div>
  );
}
