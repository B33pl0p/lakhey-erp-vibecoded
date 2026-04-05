"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastContext";
import { createProduct, updateProduct, type Product } from "@/lib/api/products";
import { uploadFile } from "@/lib/api/storage";
import { formatCurrency } from "@/lib/utils/currency";
import type { InventoryItem } from "@/lib/api/inventory";
import { BomEditor } from "./BomEditor";
import styles from "./ProductForm.module.css";
import Link from "next/link";
import { ArrowLeft, Save, ImageIcon, FileText, CheckCircle, Edit2, Package, Calculator } from "lucide-react";

interface ProductFormProps {
  initialData?: Product;
  allInventoryItems?: InventoryItem[];
}

const CATEGORIES = ["lamp", "print", "enclosure", "decor", "other"] as const;

export function ProductForm({ initialData, allInventoryItems = [] }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    category: initialData?.category || "print",
    description: initialData?.description || "",
    // Pricing — only used in edit mode
    labor_cost: initialData?.labor_cost ?? 0,
    selling_price: initialData?.selling_price ?? 0,
    is_active: initialData?.is_active ?? true,
  });

  const [existingImageIds, setExistingImageIds] = useState<string[]>(
    initialData?.image_ids?.length
      ? initialData.image_ids
      : (initialData?.image_id ? [initialData.image_id] : [])
  );
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [stlFile, setStlFile] = useState<File | null>(null);

  // Phase 2: set after creation to enter BOM + pricing inline
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);

  // Edit mode live pricing
  const editMaterialCost = initialData
    ? Math.max(0, (initialData.making_cost ?? 0) - (initialData.labor_cost ?? 0))
    : 0;
  const liveLaborCost = Number(formData.labor_cost) || 0;
  const liveMakingCost = initialData ? liveLaborCost + editMaterialCost : liveLaborCost;
  const liveSellingPrice = Number(formData.selling_price) || 0;
  const liveProfit = liveSellingPrice - liveMakingCost;
  const liveMargin = liveSellingPrice > 0 ? (liveProfit / liveSellingPrice) * 100 : 0;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const tooLarge = files.find((f) => f.size > 10 * 1024 * 1024);
    if (tooLarge) {
      toast(`"${tooLarge.name}" is too large — maximum size is 10 MB`, "error");
      e.target.value = "";
      return;
    }

    setNewImageFiles((prev) => [...prev, ...files]);
    setNewImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const uploadedImageIds: string[] = [];
      let file_id = initialData?.file_id;

      if (newImageFiles.length > 0) {
        toast(`Uploading ${newImageFiles.length} image(s)...`, "info");
        for (const imageFile of newImageFiles) {
          const fd = new FormData();
          fd.append("file", imageFile);
          uploadedImageIds.push(await uploadFile(fd));
        }
      }

      if (stlFile) {
        toast("Uploading file...", "info");
        const fd = new FormData();
        fd.append("file", stlFile);
        file_id = await uploadFile(fd);
      }

      const image_ids = [...existingImageIds, ...uploadedImageIds];
      const imageIdsPayload =
        image_ids.length > 0
          ? image_ids
          : (initialData ? [] : undefined);

      const payload: Partial<Product> = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        is_active: formData.is_active,
        image_ids: imageIdsPayload,
        image_id: image_ids[0],
        file_id,
        // Edit mode: include pricing
        ...(initialData ? {
          labor_cost: Number(formData.labor_cost),
          selling_price: Number(formData.selling_price),
          making_cost: Number(formData.labor_cost) + editMaterialCost,
        } : {
          labor_cost: 0,
          selling_price: 0,
          making_cost: 0,
        }),
      };

      if (initialData?.$id) {
        await updateProduct(initialData.$id, payload);
        toast("Product updated", "success");
        router.refresh();
        router.push(`/admin/products/${initialData.$id}`);
      } else {
        const created = await createProduct(payload);
        toast("Product created — now add materials & set pricing", "success");
        // Phase 2: stay on this page and show BOM + pricing inline
        setCreatedProduct(created);
      }
    } catch (err) {
      console.error(err);
      toast("Error saving product", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Phase 2: show BOM editor inline after creation
  if (createdProduct) {
    return (
      <Phase2View
        createdProduct={createdProduct}
        allInventoryItems={allInventoryItems}
      />
    );
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/admin/products" className={styles.backBtn}>
            <ArrowLeft size={18} />
          </Link>
          <h1>{initialData ? "Edit Product" : "New Product"}</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>

        {/* Image upload */}
        <div className={styles.section}>
          <h2>Product Photo</h2>
          <div className={styles.mediaRow}>
            <div className={styles.mediaBox}>
              {existingImageIds.length > 0 || newImagePreviews.length > 0 ? (
                <div className={styles.previewContainer}>
                  <div className={styles.imageGrid}>
                    {existingImageIds.map((imgId, idx) => (
                      <div key={`${imgId}-${idx}`} className={styles.imageTile}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/storage?id=${imgId}`}
                          alt={`Product image ${idx + 1}`}
                          className={styles.imagePreview}
                        />
                        <button
                          type="button"
                          className={styles.clearBtn}
                          onClick={() => setExistingImageIds((prev) => prev.filter((id) => id !== imgId))}
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    {newImagePreviews.map((previewUrl, idx) => (
                      <div key={`${previewUrl}-${idx}`} className={styles.imageTile}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt={`New image ${idx + 1}`}
                          className={styles.imagePreview}
                        />
                        <button
                          type="button"
                          className={styles.clearBtn}
                          onClick={() => {
                            setNewImageFiles((prev) => prev.filter((_, i) => i !== idx));
                            setNewImagePreviews((prev) => prev.filter((_, i) => i !== idx));
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.uploadPrompt}>
                  <ImageIcon size={28} />
                  <p>Upload product photos</p>
                  <span>Multiple JPG, PNG, WEBP files up to 10 MB each</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className={styles.fileInput}
                title="Upload photos"
              />
            </div>

            <div className={styles.mediaBox}>
              <div className={stlFile ? styles.fileReady : styles.uploadPrompt}>
                <FileText size={28} />
                {stlFile
                  ? <p className={styles.fileName}>{stlFile.name}</p>
                  : <>
                      <p>Upload STL / 3MF file</p>
                      <span>Optional print file</span>
                    </>
                }
              </div>
              <input
                type="file"
                accept=".stl,.3mf,.obj,.gcode"
                onChange={e => {
                  const f = e.target.files?.[0] ?? null;
                  if (f && f.size > 10 * 1024 * 1024) {
                    toast("File too large — maximum size is 10 MB", "error");
                    e.target.value = "";
                    return;
                  }
                  setStlFile(f);
                }}
                className={styles.fileInput}
                title="Upload STL/3MF"
              />
            </div>
          </div>
        </div>

        {/* Basic Details */}
        <div className={styles.section}>
          <h2>Basic Details</h2>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label htmlFor="name">Product Name *</label>
              <input required id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Honeycomb Lamp" />
            </div>
            <div className={styles.field}>
              <label htmlFor="category">Category *</label>
              <select required id="category" name="category" value={formData.category} onChange={handleChange}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Brief product description..." />
          </div>
        </div>

        {/* Pricing — edit mode only; new products set pricing in Phase 2 */}
        {initialData && (
          <div className={styles.section}>
            <h2>Pricing</h2>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label htmlFor="labor_cost">Labor Cost (Rs) *</label>
                <input required type="number" step="0.01" id="labor_cost" name="labor_cost" value={formData.labor_cost} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label htmlFor="selling_price">Selling Price (Rs) *</label>
                <input required type="number" step="0.01" id="selling_price" name="selling_price" value={formData.selling_price} onChange={handleChange} />
              </div>
            </div>
            <p className={styles.hint}>Making cost = labor cost + material cost from BOM.</p>
            {/* Live pricing preview */}
            <div className={styles.liveSummary}>
              <div className={styles.liveRow}>
                <span>Labor Cost</span>
                <span>{formatCurrency(liveLaborCost)}</span>
              </div>
              {editMaterialCost > 0 && (
                <div className={styles.liveRow}>
                  <span>Material Cost</span>
                  <span>{formatCurrency(editMaterialCost)}</span>
                </div>
              )}
              <div className={styles.liveRow}>
                <span>Making Cost</span>
                <span>{formatCurrency(liveMakingCost)}</span>
              </div>
              <div className={`${styles.liveRow} ${styles.liveRowSelling}`}>
                <span>Selling Price</span>
                <span>{formatCurrency(liveSellingPrice)}</span>
              </div>
              <div className={styles.liveDivider} />
              <div className={`${styles.liveRow} ${styles.liveRowProfit}`}>
                <span>Profit</span>
                <strong className={liveProfit < 0 ? styles.profitLoss : styles.profitGain}>
                  {formatCurrency(liveProfit)}
                </strong>
              </div>
              <div className={styles.liveRow}>
                <span>Margin</span>
                <strong className={liveMargin < 20 ? styles.marginLow : styles.marginGood}>
                  {liveMargin.toFixed(1)}%
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        <div className={styles.section}>
          <div className={styles.checkRow}>
            <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleChange} />
            <label htmlFor="is_active">Active (visible in order creation)</label>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/admin/products" className={styles.cancelBtn}>Cancel</Link>
          <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
            <Save size={18} />
            {isSubmitting
              ? "Saving..."
              : initialData
                ? "Save Product"
                : "Create & Add Materials →"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Phase 2: BOM + margin-based pricing after product creation ──────────────
function Phase2View({
  createdProduct,
  allInventoryItems,
}: {
  createdProduct: Product;
  allInventoryItems: InventoryItem[];
}) {
  const { toast } = useToast();
  const router = useRouter();

  // BomEditor runs with laborCost=0 so onMakingCostChange returns pure material cost
  const [materialCost, setMaterialCost] = useState(0);

  // Pricing inputs
  const [laborCost, setLaborCost] = useState("");
  const [targetMargin, setTargetMargin] = useState("30");
  const [pricingSaved, setPricingSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const phase2ImageId = createdProduct.image_ids?.[0] || createdProduct.image_id;

  const numLabor = Number(laborCost) || 0;
  const numMargin = Math.max(0, Math.min(99, Number(targetMargin) || 0));
  const makingCost = materialCost + numLabor;
  // selling price derived from margin: price = making_cost / (1 - margin/100)
  const suggestedPrice = numMargin < 100 && makingCost > 0
    ? makingCost / (1 - numMargin / 100)
    : makingCost;
  const profit = suggestedPrice - makingCost;
  const effectiveMargin = suggestedPrice > 0 ? (profit / suggestedPrice) * 100 : 0;

  const handleSavePricing = async () => {
    setIsSaving(true);
    try {
      await updateProduct(createdProduct.$id, {
        labor_cost: numLabor,
        selling_price: Math.round(suggestedPrice * 100) / 100,
        making_cost: makingCost,
      });
      setPricingSaved(true);
      toast("Pricing saved", "success");
    } catch {
      toast("Failed to save pricing", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDone = async () => {
    if (!pricingSaved) {
      await handleSavePricing();
    }
    router.push(`/admin/products/${createdProduct.$id}`);
  };

  return (
    <div className={styles.phase2Wrapper}>
      {/* Top bar */}
      <header className={styles.phase2Header}>
        <div className={styles.phase2TitleRow}>
          <CheckCircle size={22} className={styles.successIcon} />
          <h1>{createdProduct.name}</h1>
          <span className={styles.phase2Cat}>{createdProduct.category}</span>
        </div>
        <div className={styles.phase2Actions}>
          <Link href={`/admin/products/${createdProduct.$id}/edit`} className={styles.editDetailsBtn}>
            <Edit2 size={15} /> Edit Details
          </Link>
          <button
            onClick={handleDone}
            disabled={isSaving}
            className={styles.doneBtn}
          >
            <CheckCircle size={15} />
            {isSaving ? "Saving..." : "Save & View Product"}
          </button>
        </div>
      </header>

      <div className={styles.phase2Layout}>
        {/* Left: image + pricing calculator */}
        <aside className={styles.phase2Side}>
          {phase2ImageId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${phase2ImageId}/preview?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}&width=400&height=400`}
              alt={createdProduct.name}
              className={styles.phase2Img}
            />
          ) : (
            <div className={styles.phase2ImgPlaceholder}>
              <Package size={36} />
              <span>No photo</span>
            </div>
          )}

          {/* Cost breakdown — live from BOM */}
          <div className={styles.phase2PricingCard}>
            <h3>Making Cost</h3>
            <div className={styles.phase2Row}>
              <span>Material Cost</span>
              <strong>{formatCurrency(materialCost)}</strong>
            </div>
            <div className={styles.phase2Row}>
              <span>Labor Cost</span>
              <strong>{formatCurrency(numLabor)}</strong>
            </div>
            <div className={styles.phase2Divider} />
            <div className={styles.phase2Row}>
              <span>Total Making Cost</span>
              <strong className={styles.phase2Selling}>{formatCurrency(makingCost)}</strong>
            </div>
          </div>

          {/* Margin calculator */}
          <div className={styles.phase2PricingCard}>
            <h3>
              <Calculator size={13} style={{ display: "inline", marginRight: 6 }} />
              Pricing Calculator
            </h3>

            <div className={styles.calcField}>
              <label>Labor Cost (Rs)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={laborCost}
                onChange={e => { setLaborCost(e.target.value); setPricingSaved(false); }}
              />
            </div>

            <div className={styles.calcField}>
              <label>Target Profit Margin (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="99"
                value={targetMargin}
                onChange={e => { setTargetMargin(e.target.value); setPricingSaved(false); }}
              />
            </div>

            <div className={styles.phase2Divider} />

            <div className={styles.phase2Row}>
              <span>Suggested Price</span>
              <strong className={styles.phase2Selling}>{formatCurrency(suggestedPrice)}</strong>
            </div>
            <div className={styles.phase2Row}>
              <span>Profit</span>
              <strong className={profit < 0 ? styles.profitLoss : styles.profitGain}>
                {formatCurrency(profit)}
              </strong>
            </div>
            <div className={styles.phase2Row}>
              <span>Margin</span>
              <strong className={effectiveMargin < 20 ? styles.marginLow : styles.marginGood}>
                {effectiveMargin.toFixed(1)}%
              </strong>
            </div>

            {pricingSaved ? (
              <div className={styles.savedBadge}>✓ Pricing saved</div>
            ) : (
              <button
                className={styles.savePricingBtn}
                onClick={handleSavePricing}
                disabled={isSaving || makingCost === 0}
              >
                <Save size={14} />
                {isSaving ? "Saving..." : "Save Pricing"}
              </button>
            )}
          </div>
        </aside>

        {/* Right: BOM editor — labor=0 so onChange = pure material cost */}
        <div className={styles.phase2Main}>
          <BomEditor
            productId={createdProduct.$id}
            laborCost={0}
            sellingPrice={Math.round(suggestedPrice * 100) / 100}
            initialBom={[]}
            allInventoryItems={allInventoryItems}
            onMakingCostChange={setMaterialCost}
          />
        </div>
      </div>
    </div>
  );
}
