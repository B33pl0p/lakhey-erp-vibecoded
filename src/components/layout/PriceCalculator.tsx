"use client";

import { useState, useCallback } from "react";
import { Calculator, X, ChevronDown, ChevronUp } from "lucide-react";
import styles from "./PriceCalculator.module.css";

function fmt(n: number) {
  return "Rs " + n.toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PriceCalculator() {
  const [open, setOpen] = useState(false);

  // Material
  const [weightG, setWeightG] = useState("");
  const [ratePerGram, setRatePerGram] = useState("5");

  // Time
  const [hours, setHours] = useState("");
  const [ratePerHour, setRatePerHour] = useState("75");
  const [freeHours, setFreeHours] = useState("1");

  // Design charges
  const [designEnabled, setDesignEnabled] = useState(false);
  const [designCharge, setDesignCharge] = useState("");

  // Post-processing
  const [postEnabled, setPostEnabled] = useState(false);
  const [postCharge, setPostCharge] = useState("");

  // Rush fee
  const [rushEnabled, setRushEnabled] = useState(false);
  const [rushPct, setRushPct] = useState("10");

  // Advanced section toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  const n = (v: string) => parseFloat(v) || 0;

  const materialCost   = n(weightG) * n(ratePerGram);
  const billableHours  = Math.max(0, n(hours) - n(freeHours));
  const timeCost       = billableHours * n(ratePerHour);
  const designCost     = designEnabled ? n(designCharge) : 0;
  const postCost       = postEnabled   ? n(postCharge)   : 0;
  const subtotal       = materialCost + timeCost + designCost + postCost;
  const rushAmount     = rushEnabled   ? (subtotal * n(rushPct)) / 100 : 0;
  const total          = subtotal + rushAmount;

  const reset = useCallback(() => {
    setWeightG(""); setRatePerGram("5"); setHours(""); setRatePerHour("75");
    setFreeHours("1"); setDesignEnabled(false); setDesignCharge("");
    setPostEnabled(false); setPostCharge(""); setRushEnabled(false); setRushPct("10");
  }, []);

  return (
    <>
      {/* Sidebar trigger button */}
      <button className={styles.trigger} onClick={() => setOpen(true)} title="Quick Price Calculator">
        <Calculator size={18} />
        <span>Price Calculator</span>
      </button>

      {/* Overlay */}
      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.panel} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>
                <Calculator size={16} />
                <span>Quick Price Calculator</span>
              </div>
              <div className={styles.headerActions}>
                <button className={styles.resetBtn} onClick={reset}>Reset</button>
                <button className={styles.closeBtn} onClick={() => setOpen(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className={styles.body}>
              {/* Material */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Filament / Material</h3>
                <div className={styles.row}>
                  <label className={styles.label}>Weight (grams)</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    placeholder="e.g. 120"
                    value={weightG}
                    onChange={e => setWeightG(e.target.value)}
                  />
                </div>
                <div className={styles.row}>
                  <label className={styles.label}>Price per gram (Rs)</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    step="0.5"
                    value={ratePerGram}
                    onChange={e => setRatePerGram(e.target.value)}
                  />
                </div>
                <div className={styles.lineResult}>
                  Material cost: <strong>{fmt(materialCost)}</strong>
                </div>
              </section>

              {/* Print time */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Print Time</h3>
                <div className={styles.row}>
                  <label className={styles.label}>Total print time (hours)</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="e.g. 3.5"
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                  />
                </div>
                <div className={styles.row}>
                  <label className={styles.label}>Free hours (first N hrs free)</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    step="0.5"
                    value={freeHours}
                    onChange={e => setFreeHours(e.target.value)}
                  />
                </div>
                <div className={styles.row}>
                  <label className={styles.label}>Rate after free hours (Rs/hr)</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    value={ratePerHour}
                    onChange={e => setRatePerHour(e.target.value)}
                  />
                </div>
                <div className={styles.lineResult}>
                  {n(hours) > 0 && (
                    <span className={styles.hint}>
                      Billable: {billableHours.toFixed(1)} hr{billableHours !== 1 ? "s" : ""}
                      {n(freeHours) > 0 && ` (first ${n(freeHours)} hr free)`}
                    </span>
                  )}
                  Time cost: <strong>{fmt(timeCost)}</strong>
                </div>
              </section>

              {/* Optional charges — advanced section */}
              <button className={styles.advancedToggle} onClick={() => setShowAdvanced(v => !v)}>
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Optional charges
              </button>

              {showAdvanced && (
                <>
                  {/* Design charges */}
                  <section className={styles.section}>
                    <div className={styles.checkRow}>
                      <input
                        type="checkbox"
                        id="designCheck"
                        checked={designEnabled}
                        onChange={e => setDesignEnabled(e.target.checked)}
                        className={styles.checkbox}
                      />
                      <label htmlFor="designCheck" className={styles.checkLabel}>Design / Modelling charges</label>
                    </div>
                    {designEnabled && (
                      <div className={styles.row}>
                        <label className={styles.label}>Charge (Rs)</label>
                        <input
                          className={styles.input}
                          type="number"
                          min="0"
                          placeholder="e.g. 500"
                          value={designCharge}
                          onChange={e => setDesignCharge(e.target.value)}
                        />
                      </div>
                    )}
                  </section>

                  {/* Post-processing */}
                  <section className={styles.section}>
                    <div className={styles.checkRow}>
                      <input
                        type="checkbox"
                        id="postCheck"
                        checked={postEnabled}
                        onChange={e => setPostEnabled(e.target.checked)}
                        className={styles.checkbox}
                      />
                      <label htmlFor="postCheck" className={styles.checkLabel}>Post-processing / Finishing</label>
                    </div>
                    {postEnabled && (
                      <>
                        <p className={styles.hint} style={{ marginBottom: "0.5rem" }}>Support removal, sanding, painting, assembly, etc.</p>
                        <div className={styles.row}>
                          <label className={styles.label}>Charge (Rs)</label>
                          <input
                            className={styles.input}
                            type="number"
                            min="0"
                            placeholder="e.g. 300"
                            value={postCharge}
                            onChange={e => setPostCharge(e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </section>

                  {/* Rush fee */}
                  <section className={styles.section}>
                    <div className={styles.checkRow}>
                      <input
                        type="checkbox"
                        id="rushCheck"
                        checked={rushEnabled}
                        onChange={e => setRushEnabled(e.target.checked)}
                        className={styles.checkbox}
                      />
                      <label htmlFor="rushCheck" className={styles.checkLabel}>Rush / Urgency fee (%)</label>
                    </div>
                    {rushEnabled && (
                      <div className={styles.row}>
                        <label className={styles.label}>Percentage (%)</label>
                        <input
                          className={styles.input}
                          type="number"
                          min="0"
                          max="100"
                          value={rushPct}
                          onChange={e => setRushPct(e.target.value)}
                        />
                      </div>
                    )}
                  </section>
                </>
              )}

              {/* Breakdown + total */}
              <div className={styles.breakdown}>
                <h3 className={styles.breakdownTitle}>Breakdown</h3>
                <div className={styles.breakdownRow}>
                  <span>Material</span>
                  <span>{fmt(materialCost)}</span>
                </div>
                <div className={styles.breakdownRow}>
                  <span>Print time</span>
                  <span>{fmt(timeCost)}</span>
                </div>
                {designEnabled && designCost > 0 && (
                  <div className={styles.breakdownRow}>
                    <span>Design</span>
                    <span>{fmt(designCost)}</span>
                  </div>
                )}
                {postEnabled && postCost > 0 && (
                  <div className={styles.breakdownRow}>
                    <span>Post-processing</span>
                    <span>{fmt(postCost)}</span>
                  </div>
                )}
                {rushEnabled && rushAmount > 0 && (
                  <div className={styles.breakdownRow}>
                    <span>Rush fee ({n(rushPct)}%)</span>
                    <span>{fmt(rushAmount)}</span>
                  </div>
                )}
                <div className={styles.totalRow}>
                  <span>Total</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
