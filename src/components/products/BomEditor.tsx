"use client";

import { useState } from "react";
import type { BomLine } from "@/lib/api/productMaterials";
import type { InventoryItem } from "@/lib/api/inventory";
import {
  addBomLine,
  updateBomLine,
  removeBomLine,
} from "@/lib/api/productMaterials";
import { syncProductMakingCost } from "@/lib/api/products";
import { useToast } from "@/components/ui/ToastContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatCurrency } from "@/lib/utils/currency";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import styles from "./BomEditor.module.css";

interface BomEditorProps {
  productId: string;
  laborCost: number;
  sellingPrice: number;
  initialBom: BomLine[];
  allInventoryItems: InventoryItem[];
}

interface AddForm {
  inventory_item_id: string;
  quantity: string;
  unit_cost_override: string;
  notes: string;
}

interface EditState {
  lineId: string;
  quantity: string;
  unit_cost_override: string;
  notes: string;
}

/** Compute summary figures from a set of BOM lines + labor cost */
function computeSummary(bom: BomLine[], laborCost: number) {
  const materialCost = bom.reduce((s, l) => s + l.line_total, 0);
  const totalWeightGrams = bom.reduce((s, l) => s + l.line_weight_grams, 0);
  const makingCost = materialCost + laborCost;
  return { materialCost, totalWeightGrams, makingCost };
}

export function BomEditor({
  productId,
  laborCost,
  sellingPrice,
  initialBom,
  allInventoryItems,
}: BomEditorProps) {
  const { toast } = useToast();
  const [bom, setBom] = useState<BomLine[]>(initialBom);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);

  const [addForm, setAddForm] = useState<AddForm>({
    inventory_item_id: "",
    quantity: "1",
    unit_cost_override: "",
    notes: "",
  });
  const [addSearch, setAddSearch] = useState("");
  const [showAddRow, setShowAddRow] = useState(false);

  // Items not yet in BOM
  const availableItems = allInventoryItems.filter(
    inv => !bom.some(l => l.inventory_item_id === inv.$id)
  );
  const filteredAvailable = availableItems.filter(i =>
    i.name.toLowerCase().includes(addSearch.toLowerCase())
  );

  // Sync making_cost to product after every BOM mutation
  const syncMakingCost = async (newBom: BomLine[]) => {
    const { makingCost } = computeSummary(newBom, laborCost);
    await syncProductMakingCost(productId, makingCost);
  };

  // ── ADD ──────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!addForm.inventory_item_id || !addForm.quantity) {
      toast("Select an item and enter quantity", "warning");
      return;
    }
    setSaving(true);
    try {
      await addBomLine({
        product_id: productId,
        inventory_item_id: addForm.inventory_item_id,
        quantity: Number(addForm.quantity),
        unit_cost_override: addForm.unit_cost_override !== "" ? Number(addForm.unit_cost_override) : null,
        notes: addForm.notes || undefined,
      });

      // Build enriched line for local state
      const inv = allInventoryItems.find(i => i.$id === addForm.inventory_item_id)!;
      const qty = Number(addForm.quantity);
      const override = addForm.unit_cost_override !== "" ? Number(addForm.unit_cost_override) : null;
      const effective = override != null ? override : inv.unit_cost;
      const newLine: BomLine = {
        $id: `tmp-${Date.now()}`, // will refresh on next server render
        product_id: productId,
        inventory_item_id: inv.$id,
        quantity: qty,
        unit_cost_override: override,
        notes: addForm.notes || undefined,
        item_name: inv.name,
        item_unit: inv.unit,
        item_unit_cost: inv.unit_cost,
        item_weight_per_unit_grams: inv.weight_per_unit_grams ?? 0,
        effective_unit_cost: effective,
        line_total: qty * effective,
        line_weight_grams: qty * (inv.weight_per_unit_grams ?? 0),
      };
      const newBom = [...bom, newLine];
      setBom(newBom);
      await syncMakingCost(newBom);

      setAddForm({ inventory_item_id: "", quantity: "1", unit_cost_override: "", notes: "" });
      setAddSearch("");
      setShowAddRow(false);
      toast("Material added", "success");
    } catch {
      toast("Error adding material", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── EDIT SAVE ────────────────────────────────────────────────────────────
  const handleEditSave = async () => {
    if (!editState) return;
    setSaving(true);
    try {
      const override = editState.unit_cost_override !== "" ? Number(editState.unit_cost_override) : null;
      await updateBomLine(editState.lineId, productId, {
        quantity: Number(editState.quantity),
        unit_cost_override: override,
        notes: editState.notes || undefined,
      });

      const newBom = bom.map(l => {
        if (l.$id !== editState.lineId) return l;
        const qty = Number(editState.quantity);
        const effective = override != null ? override : l.item_unit_cost;
        return {
          ...l,
          quantity: qty,
          unit_cost_override: override,
          notes: editState.notes || undefined,
          effective_unit_cost: effective,
          line_total: qty * effective,
          line_weight_grams: qty * l.item_weight_per_unit_grams,
        };
      });
      setBom(newBom);
      await syncMakingCost(newBom);
      setEditState(null);
      toast("Line updated", "success");
    } catch {
      toast("Error updating line", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── REMOVE ───────────────────────────────────────────────────────────────
  const handleRemove = async () => {
    if (!removingId) return;
    setSaving(true);
    try {
      await removeBomLine(removingId, productId);
      const newBom = bom.filter(l => l.$id !== removingId);
      setBom(newBom);
      await syncMakingCost(newBom);
      setRemovingId(null);
      toast("Material removed", "success");
    } catch {
      toast("Error removing material", "error");
    } finally {
      setSaving(false);
    }
  };

  const { materialCost, totalWeightGrams, makingCost } = computeSummary(bom, laborCost);
  const marginPct = sellingPrice > 0
    ? ((sellingPrice - makingCost) / sellingPrice) * 100
    : 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.titleRow}>
        <h2>Bill of Materials</h2>
        <button
          className={styles.addBtn}
          onClick={() => setShowAddRow(v => !v)}
          disabled={saving}
        >
          <Plus size={16} />
          Add Material
        </button>
      </div>

      {/* Add material row */}
      {showAddRow && (
        <div className={styles.addRow}>
          <div className={styles.addField}>
            <label>Search inventory</label>
            <input
              type="text"
              placeholder="Type to filter..."
              value={addSearch}
              onChange={e => setAddSearch(e.target.value)}
            />
          </div>
          <div className={styles.addField}>
            <label>Item</label>
            <select
              value={addForm.inventory_item_id}
              onChange={e => {
                const id = e.target.value;
                const inv = allInventoryItems.find(i => i.$id === id);
                setAddForm(f => ({
                  ...f,
                  inventory_item_id: id,
                  unit_cost_override: "",
                }));
                // Auto-hint default cost
                if (inv) setAddSearch(inv.name);
              }}
            >
              <option value="">— select item —</option>
              {filteredAvailable.map(i => (
                <option key={i.$id} value={i.$id}>
                  {i.name} ({formatCurrency(i.unit_cost)} / {i.unit})
                </option>
              ))}
            </select>
          </div>
          <div className={styles.addField} style={{ maxWidth: "110px" }}>
            <label>Qty</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={addForm.quantity}
              onChange={e => setAddForm(f => ({ ...f, quantity: e.target.value }))}
            />
          </div>
          <div className={styles.addField} style={{ maxWidth: "130px" }}>
            <label>Cost Override (Rs)</label>
            <input
              type="number"
              step="0.001"
              min="0"
              placeholder={
                addForm.inventory_item_id
                  ? `Default: ${allInventoryItems.find(i => i.$id === addForm.inventory_item_id)?.unit_cost ?? ""}`
                  : "Optional"
              }
              value={addForm.unit_cost_override}
              onChange={e => setAddForm(f => ({ ...f, unit_cost_override: e.target.value }))}
            />
          </div>
          <div className={styles.addField}>
            <label>Notes</label>
            <input
              type="text"
              placeholder="Optional..."
              value={addForm.notes}
              onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className={styles.addActions}>
            <button className={styles.confirmBtn} onClick={handleAdd} disabled={saving}>
              <Check size={16} /> Add
            </button>
            <button className={styles.cancelBtn} onClick={() => setShowAddRow(false)}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* BOM table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Material</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Base Cost</th>
              <th>Override</th>
              <th>Effective Cost</th>
              <th>Line Total</th>
              <th>Weight (g)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bom.length === 0 && (
              <tr>
                <td colSpan={9} className={styles.empty}>
                  No materials yet. Click &quot;Add Material&quot; to build the BOM.
                </td>
              </tr>
            )}
            {bom.map(line => {
              const isEditing = editState?.lineId === line.$id;
              return (
                <tr key={line.$id}>
                  <td className={styles.itemName}>{line.item_name}</td>
                  {isEditing ? (
                    <>
                      <td>
                        <input
                          className={styles.inlineInput}
                          type="number"
                          step="0.01"
                          min="0"
                          value={editState.quantity}
                          onChange={e => setEditState(s => s && ({ ...s, quantity: e.target.value }))}
                        />
                      </td>
                      <td>{line.item_unit}</td>
                      <td>{formatCurrency(line.item_unit_cost)}</td>
                      <td>
                        <input
                          className={styles.inlineInput}
                          type="number"
                          step="0.001"
                          min="0"
                          placeholder="—"
                          value={editState.unit_cost_override}
                          onChange={e => setEditState(s => s && ({ ...s, unit_cost_override: e.target.value }))}
                        />
                      </td>
                      <td colSpan={2}>
                        <span className={styles.muted}>Save to recalculate</span>
                      </td>
                      <td>{line.line_weight_grams.toFixed(1)}</td>
                      <td className={styles.rowActions}>
                        <button className={styles.confirmBtn} onClick={handleEditSave} disabled={saving}>
                          <Check size={14} />
                        </button>
                        <button className={styles.cancelBtn} onClick={() => setEditState(null)}>
                          <X size={14} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{line.quantity}</td>
                      <td>{line.item_unit}</td>
                      <td>{formatCurrency(line.item_unit_cost)}</td>
                      <td>
                        {line.unit_cost_override != null
                          ? <span className={styles.overrideBadge}>{formatCurrency(line.unit_cost_override)}</span>
                          : <span className={styles.muted}>—</span>
                        }
                      </td>
                      <td>{formatCurrency(line.effective_unit_cost)}</td>
                      <td className={styles.lineTotal}>{formatCurrency(line.line_total)}</td>
                      <td>{line.line_weight_grams.toFixed(1)}</td>
                      <td className={styles.rowActions}>
                        <button
                          className={styles.editRowBtn}
                          onClick={() => setEditState({
                            lineId: line.$id,
                            quantity: String(line.quantity),
                            unit_cost_override: line.unit_cost_override != null ? String(line.unit_cost_override) : "",
                            notes: line.notes ?? "",
                          })}
                          title="Edit line"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className={styles.removeBtn}
                          onClick={() => setRemovingId(line.$id)}
                          title="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span>Material Cost</span>
          <strong>{formatCurrency(materialCost)}</strong>
        </div>
        <div className={styles.summaryItem}>
          <span>Labor Cost</span>
          <strong>{formatCurrency(laborCost)}</strong>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span>Making Cost</span>
          <strong>{formatCurrency(makingCost)}</strong>
        </div>
        <div className={styles.summaryItem}>
          <span>Selling Price</span>
          <strong>{formatCurrency(sellingPrice)}</strong>
        </div>
        <div className={`${styles.summaryItem} ${styles.marginItem}`}>
          <span>Margin</span>
          <strong className={marginPct < 20 ? styles.marginLow : styles.marginGood}>
            {marginPct.toFixed(1)}%
          </strong>
        </div>
        <div className={styles.summaryItem}>
          <span>Total Weight</span>
          <strong>{totalWeightGrams.toFixed(1)} g</strong>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!removingId}
        title="Remove Material?"
        message="Remove this material from the bill of materials? This cannot be undone."
        confirmLabel="Remove"
        onConfirm={handleRemove}
        onCancel={() => setRemovingId(null)}
      />
    </div>
  );
}
