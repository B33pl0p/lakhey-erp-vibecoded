"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastContext";
import { createOrder, updateOrder, type Order, type FilamentType, type OrderStatus } from "@/lib/api/orders";
import type { Customer } from "@/lib/api/customers";
import type { Product } from "@/lib/api/products";
import { uploadFile } from "@/lib/api/storage";
import { ArrowLeft, Upload, X } from "lucide-react";
import Link from "next/link";
import styles from "./OrderForm.module.css";

interface OrderFormProps {
  initialData?: Order;
  customers: Customer[];
  products: Product[];
}

const FILAMENT_TYPES: FilamentType[] = ["PLA", "PETG", "ABS", "TPU", "ASA", "Resin", "Other"];
const ORDER_STATUSES: OrderStatus[] = ["pending", "printing", "done", "delivered", "cancelled"];

export function OrderForm({ initialData, customers, products }: OrderFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- Type toggle (UI only, not a submitted field) ---
  const [isProduct, setIsProduct] = useState<boolean>(initialData?.is_product ?? false);
  // --- Meta flag: whether user manually overrode unit price auto-calc ---
  const [unitPriceManual, setUnitPriceManual] = useState(false);

  // --- All form fields in one object ---
  const [form, setForm] = useState({
    // Core
    customerId:      initialData?.customer_id       || "",
    productId:       initialData?.product_id        || "",
    title:           initialData?.title             || "",
    status:          (initialData?.status           || "pending") as OrderStatus,
    quantity:        String(initialData?.quantity   || 1),
    unitPrice:       String(initialData?.unit_price || ""),
    deadline:        initialData?.deadline ? initialData.deadline.slice(0, 10) : "",
    deliveryAddress: initialData?.delivery_address  || "",
    // Custom job
    filamentType:   ((initialData?.filament_type as FilamentType) || "") as FilamentType | "",
    filamentColor:   initialData?.filament_color    || "",
    isMulticolor:    initialData?.is_multicolor     ?? false,
    isAssembled:     initialData?.is_assembled      ?? false,
    isSinglePart:    initialData?.is_single_part    ?? true,
    printX:          String(initialData?.print_x_mm               || ""),
    printY:          String(initialData?.print_y_mm               || ""),
    printZ:          String(initialData?.print_z_mm               || ""),
    filamentWeight:  String(initialData?.filament_weight_grams    || ""),
    filamentPpg:     String(initialData?.filament_price_per_gram  || ""),
    customMaterial:  initialData?.custom_material   || "",
    customNotes:     initialData?.custom_notes      || "",
    // Advance payment
    advancePaid:     String(initialData?.advance_paid ?? ""),
    advanceNotes:    initialData?.advance_notes     || "",
  });

  /** Single-field updater — keeps all other fields intact */
  const setField = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  // Destructure for reads — JSX value= bindings stay unchanged
  const {
    customerId, productId, title, status, quantity, unitPrice, deadline, deliveryAddress,
    filamentType, filamentColor, isMulticolor, isAssembled, isSinglePart,
    printX, printY, printZ, filamentWeight, filamentPpg, customMaterial, customNotes,
    advancePaid, advanceNotes,
  } = form;

  // --- Files (kept separate — File objects are not plain serialisable data) ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // --- Auto-fill delivery address from customer ---
  useEffect(() => {
    if (!customerId || initialData?.delivery_address) return;
    const customer = customers.find(c => c.$id === customerId);
    if (customer?.address) {
      setField("deliveryAddress", customer.address);
    }
  }, [customerId, customers, initialData?.delivery_address]);

  // --- Auto-fill title + unit_price from product (catalog) ---
  useEffect(() => {
    if (!isProduct || !productId) return;
    const product = products.find(p => p.$id === productId);
    if (product) {
      setField("title", product.name);
      if (!unitPriceManual) {
        setField("unitPrice", String(product.selling_price));
      }
    }
  }, [productId, isProduct, products, unitPriceManual]);

  // --- Auto-calculate unit_price from filament fields (custom) ---
  const calcFilamentUnitPrice = useCallback(() => {
    const w = parseFloat(filamentWeight);
    const p = parseFloat(filamentPpg);
    if (!isNaN(w) && !isNaN(p) && w > 0 && p > 0) {
      return String((w * p).toFixed(2));
    }
    return null;
  }, [filamentWeight, filamentPpg]);

  useEffect(() => {
    if (isProduct || unitPriceManual) return;
    const calc = calcFilamentUnitPrice();
    if (calc !== null) setField("unitPrice", calc);
  }, [filamentWeight, filamentPpg, isProduct, unitPriceManual, calcFilamentUnitPrice]);

  // --- Derived: total_price = unit_price × quantity (no state needed) ---
  const u = parseFloat(unitPrice);
  const q = parseFloat(quantity);
  const totalPrice = (!isNaN(u) && !isNaN(q) && u >= 0 && q > 0)
    ? (u * q).toFixed(2)
    : "";

  const handleUnitPriceChange = (v: string) => {
    setField("unitPrice", v);
    setUnitPriceManual(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 10 * 1024 * 1024) {
        toast("File too large — maximum size is 10 MB", "error");
        e.target.value = "";
        return;
      }
      setSelectedImage(f);
      setImagePreview(URL.createObjectURL(f));
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!customerId) e.customerId = "Select a customer";
    if (!title.trim()) e.title = "Title is required";
    if (!quantity || Number(quantity) < 1) e.quantity = "Quantity must be at least 1";
    if (!unitPrice || Number(unitPrice) < 0) e.unitPrice = "Enter a valid unit price";
    if (advancePaid && Number(advancePaid) < 0) e.advancePaid = "Advance cannot be negative";
    if (advancePaid && totalPrice && Number(advancePaid) > parseFloat(totalPrice))
      e.advancePaid = "Advance cannot exceed total price";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      let fileId = initialData?.file_id;
      let imageId = initialData?.image_id;

      if (selectedFile) {
        toast("Uploading file...", "info");
        const fd = new FormData();
        fd.append("file", selectedFile);
        fileId = await uploadFile(fd);
      }
      if (selectedImage) {
        toast("Uploading image...", "info");
        const fd = new FormData();
        fd.append("file", selectedImage);
        imageId = await uploadFile(fd);
      }

      const payload: Partial<Order> = {
        customer_id: customerId,
        is_product: isProduct,
        title: title.trim(),
        status,
        quantity: Number(quantity),
        unit_price: parseFloat(unitPrice),
        total_price: parseFloat(totalPrice),
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        delivery_address: deliveryAddress || undefined,
        file_id: fileId,
        image_id: imageId,
        advance_paid: advancePaid !== "" ? parseFloat(advancePaid) : undefined,
        advance_notes: advanceNotes || undefined,
      };

      if (isProduct) {
        payload.product_id = productId || undefined;
      } else {
        payload.filament_type = filamentType || undefined;
        payload.filament_color = filamentColor || undefined;
        payload.is_multicolor = isMulticolor;
        payload.is_assembled = isAssembled;
        payload.is_single_part = isSinglePart;
        payload.print_x_mm = printX ? parseFloat(printX) : undefined;
        payload.print_y_mm = printY ? parseFloat(printY) : undefined;
        payload.print_z_mm = printZ ? parseFloat(printZ) : undefined;
        payload.filament_weight_grams = filamentWeight ? parseFloat(filamentWeight) : undefined;
        payload.filament_price_per_gram = filamentPpg ? parseFloat(filamentPpg) : undefined;
        payload.custom_material = customMaterial || undefined;
        payload.custom_notes = customNotes || undefined;
      }

      if (initialData?.$id) {
        await updateOrder(initialData.$id, payload);
        toast("Order updated successfully", "success");
      } else {
        await createOrder(payload);
        toast("Order created successfully", "success");
      }

      router.refresh();
      router.push("/orders");
    } catch (err) {
      console.error(err);
      toast("Error saving order", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/orders" className={styles.backBtn}>
            <ArrowLeft size={18} />
          </Link>
          <h1>{initialData ? "Edit Order" : "New Order"}</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>

        {/* ── Type Toggle ── */}
        {!initialData && (
          <div className={styles.section}>
            <h2>Order Type</h2>
            <div className={styles.typeToggle}>
              <button
                type="button"
                className={`${styles.typeBtn} ${!isProduct ? styles.typeBtnActive : ""}`}
                onClick={() => setIsProduct(false)}
              >
                ✏️ Custom Job
              </button>
              <button
                type="button"
                className={`${styles.typeBtn} ${isProduct ? styles.typeBtnActive : ""}`}
                onClick={() => setIsProduct(true)}
              >
                📦 Catalog Product
              </button>
            </div>
          </div>
        )}

        {/* ── Customer + Status ── */}
        <div className={styles.section}>
          <h2>Customer</h2>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Customer *</label>
              <select
                value={customerId}
                onChange={e => setField("customerId", e.target.value)}
                className={errors.customerId ? styles.inputError : ""}
              >
                <option value="">— Select customer —</option>
                {customers.map(c => (
                  <option key={c.$id} value={c.$id}>{c.name}</option>
                ))}
              </select>
              {errors.customerId && <span className={styles.error}>{errors.customerId}</span>}
            </div>
            <div className={styles.field}>
              <label>Status</label>
              <select value={status} onChange={e => setField("status", e.target.value as OrderStatus)}>
                {ORDER_STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label>Delivery Address</label>
            <textarea
              rows={2}
              value={deliveryAddress}
              onChange={e => setField("deliveryAddress", e.target.value)}
              placeholder="Pre-filled from customer, or enter a different address"
            />
          </div>
        </div>

        {/* ── Catalog: Product select ── */}
        {isProduct && (
          <div className={styles.section}>
            <h2>Product</h2>
            <div className={styles.field}>
              <label>Select Product</label>
              <select value={productId} onChange={e => setField("productId", e.target.value)}>
                <option value="">— Select product —</option>
                {products.filter(p => p.is_active).map(p => (
                  <option key={p.$id} value={p.$id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ── Order Details ── */}
        <div className={styles.section}>
          <h2>Order Details</h2>
          <div className={styles.field}>
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setField("title", e.target.value)}
              placeholder={isProduct ? "Auto-filled from product" : "e.g. Custom Lamp for John"}
              className={errors.title ? styles.inputError : ""}
            />
            {errors.title && <span className={styles.error}>{errors.title}</span>}
          </div>

          <div className={styles.grid3}>
            <div className={styles.field}>
              <label>Quantity *</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setField("quantity", e.target.value)}
                className={errors.quantity ? styles.inputError : ""}
              />
              {errors.quantity && <span className={styles.error}>{errors.quantity}</span>}
            </div>
            <div className={styles.field}>
              <label>Unit Price (Rs) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={e => handleUnitPriceChange(e.target.value)}
                placeholder={isProduct ? "From product" : "Auto from filament"}
                className={errors.unitPrice ? styles.inputError : ""}
              />
              {errors.unitPrice && <span className={styles.error}>{errors.unitPrice}</span>}
            </div>
            <div className={styles.field}>
              <label>Total Price (Rs)</label>
              <input
                type="number"
                value={totalPrice}
                readOnly
                className={styles.readOnly}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={e => setField("deadline", e.target.value)}
            />
          </div>
        </div>

        {/* ── Custom Job Fields ── */}
        {!isProduct && (
          <>
            <div className={styles.section}>
              <h2>Filament &amp; Pricing</h2>
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label>Filament Type</label>
                  <select value={filamentType} onChange={e => setField("filamentType", e.target.value as FilamentType)}>
                    <option value="">— Select —</option>
                    {FILAMENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Filament Color</label>
                  <input
                    type="text"
                    value={filamentColor}
                    onChange={e => setField("filamentColor", e.target.value)}
                    placeholder="e.g. Matte Black"
                  />
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label>Filament Weight (grams)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={filamentWeight}
                    onChange={e => { setField("filamentWeight", e.target.value); setUnitPriceManual(false); }}
                    placeholder="e.g. 150"
                  />
                </div>
                <div className={styles.field}>
                  <label>Price per Gram (Rs)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={filamentPpg}
                    onChange={e => { setField("filamentPpg", e.target.value); setUnitPriceManual(false); }}
                    placeholder="e.g. 2.5"
                  />
                </div>
              </div>

              {filamentWeight && filamentPpg && (
                <p className={styles.calcHint}>
                  Filament cost: Rs {(parseFloat(filamentWeight || "0") * parseFloat(filamentPpg || "0")).toFixed(2)} → auto-sets unit price (override above)
                </p>
              )}

              <div className={styles.field}>
                <label>Custom Material Notes</label>
                <input
                  type="text"
                  value={customMaterial}
                    onChange={e => setField("customMaterial", e.target.value)}
                  placeholder="e.g. Wood-fill PLA, Carbon fibre"
                />
              </div>
            </div>

            <div className={styles.section}>
              <h2>Print Specifications</h2>
              <div className={styles.grid3}>
                <div className={styles.field}>
                  <label>Width X (mm)</label>
                  <input type="number" min="0" step="0.1" value={printX} onChange={e => setField("printX", e.target.value)} placeholder="X" />
                </div>
                <div className={styles.field}>
                  <label>Depth Y (mm)</label>
                  <input type="number" min="0" step="0.1" value={printY} onChange={e => setField("printY", e.target.value)} placeholder="Y" />
                </div>
                <div className={styles.field}>
                  <label>Height Z (mm)</label>
                  <input type="number" min="0" step="0.1" value={printZ} onChange={e => setField("printZ", e.target.value)} placeholder="Z" />
                </div>
              </div>

              <div className={styles.checkboxRow}>
                <label className={styles.checkLabel}>
                  <input type="checkbox" checked={isMulticolor} onChange={e => setField("isMulticolor", e.target.checked)} />
                  Multi-color print
                </label>
                <label className={styles.checkLabel}>
                  <input type="checkbox" checked={isAssembled} onChange={e => setField("isAssembled", e.target.checked)} />
                  Requires assembly
                </label>
                <label className={styles.checkLabel}>
                  <input type="checkbox" checked={isSinglePart} onChange={e => setField("isSinglePart", e.target.checked)} />
                  Single part (not multi-part job)
                </label>
              </div>

              <div className={styles.field}>
                <label>Custom Notes</label>
                <textarea
                  rows={3}
                  value={customNotes}
                  onChange={e => setField("customNotes", e.target.value)}
                  placeholder="Any specific instructions, infill %, supports, etc."
                />
              </div>
            </div>

            {/* Image upload for custom orders */}
            <div className={styles.section}>
              <h2>Reference Image</h2>
              <div className={styles.uploadBox}>
                {imagePreview ? (
                  <div className={styles.imagePreviewWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
                    <button
                      type="button"
                      className={styles.clearBtn}
                      onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                    >
                      <X size={14} /> Remove
                    </button>
                  </div>
                ) : (
                  <label className={styles.uploadLabel}>
                    <Upload size={24} />
                    <span>Upload reference image</span>
                    <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── File Upload (3MF / STL) ── for both types ── */}
        <div className={styles.section}>
          <h2>3MF / STL File</h2>
          <div className={styles.uploadBox}>
            {selectedFile ? (
              <div className={styles.fileSelected}>
                <span>{selectedFile.name}</span>
                <button type="button" className={styles.clearBtn} onClick={() => setSelectedFile(null)}>
                  <X size={14} /> Remove
                </button>
              </div>
            ) : initialData?.file_id ? (
              <div className={styles.fileSelected}>
                <span>Existing file attached</span>
                <button type="button" className={styles.clearBtn} onClick={() => setSelectedFile(null)}>Replace</button>
              </div>
            ) : (
              <label className={styles.uploadLabel}>
                <Upload size={24} />
                <span>Upload 3MF, STL, or other file</span>
                <input
                  type="file"
                  accept=".3mf,.stl,.obj,.step,.stp"
                  hidden
                  onChange={e => {
                    const f = e.target.files?.[0] || null;
                    if (f && f.size > 10 * 1024 * 1024) {
                      toast("File too large — maximum size is 10 MB", "error");
                      e.target.value = "";
                      return;
                    }
                    setSelectedFile(f);
                  }}
                />
              </label>
            )}
          </div>
        </div>

        {/* ── Advance Payment ── */}
        <div className={styles.section}>
          <h2>Advance Payment</h2>
          <p className={styles.calcHint}>Record any deposit or partial payment received at time of order.</p>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Advance Paid (Rs)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={advancePaid}
                onChange={e => setField("advancePaid", e.target.value)}
                placeholder="0.00"
                className={errors.advancePaid ? styles.inputError : ""}
              />
              {errors.advancePaid && <span className={styles.error}>{errors.advancePaid}</span>}
              {advancePaid && totalPrice && Number(advancePaid) > 0 && (
                <span className={styles.calcHint}>
                  Balance due: Rs {(parseFloat(totalPrice) - parseFloat(advancePaid)).toFixed(2)}
                </span>
              )}
            </div>
            <div className={styles.field}>
              <label>Payment Notes</label>
              <input
                type="text"
                value={advanceNotes}
                onChange={e => setField("advanceNotes", e.target.value)}
                placeholder="e.g. Cash advance received"
              />
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <Link href="/orders" className={styles.cancelBtn}>Cancel</Link>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : initialData ? "Save Changes" : "Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
