"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastContext";
import { createInventoryItem, updateInventoryItem, type InventoryItem } from "@/lib/api/inventory";
import styles from "./InventoryForm.module.css";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

interface InventoryFormProps {
  initialData?: InventoryItem;
}

export function InventoryForm({ initialData }: InventoryFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    category: initialData?.category || "filament",
    unit: initialData?.unit || "grams",
    unit_cost: initialData?.unit_cost || 0,
    stock_qty: initialData?.stock_qty || 0,
    low_stock_threshold: initialData?.low_stock_threshold || 0,
    supplier: initialData?.supplier || "",
    supplier_sku: initialData?.supplier_sku || "",
    weight_per_unit_grams: initialData?.weight_per_unit_grams || 0,
    length_mm: initialData?.length_mm || "",
    width_mm: initialData?.width_mm || "",
    height_mm: initialData?.height_mm || "",
    notes: initialData?.notes || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.image_id ? `/api/storage?id=${initialData.image_id}` : null
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast("File too large — maximum size is 10 MB", "error");
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let uploadedImageId = initialData?.image_id;

    try {
      if (selectedFile) {
        toast("Uploading image...", "info");
        const formData = new FormData();
        formData.append("file", selectedFile);
        
        // Dynamic import to avoid client-side bundling of server functions if Next.js complains
        const { uploadFile } = await import("@/lib/api/storage");
        uploadedImageId = await uploadFile(formData);
      }

      // Cast string inputs from HTML forms to standard numbers for the API
      const payload = {
        ...formData,
        length_mm: formData.length_mm ? Number(formData.length_mm) : undefined,
        width_mm: formData.width_mm ? Number(formData.width_mm) : undefined,
        height_mm: formData.height_mm ? Number(formData.height_mm) : undefined,
        image_id: uploadedImageId
      } as Partial<InventoryItem>;
      
      if (initialData?.$id) {
        await updateInventoryItem(initialData.$id, payload);
        toast("Inventory item updated successfully", "success");
      } else {
        await createInventoryItem(payload);
        toast("Inventory item created successfully", "success");
      }
      router.refresh();
      router.push("/admin/inventory");
    } catch (error) {
      console.error(error);
      toast("Error saving inventory item", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/admin/inventory" className={styles.backBtn}>
            <ArrowLeft size={18} />
          </Link>
          <h1>{initialData ? "Edit Item" : "New Item"}</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        
        <div className={styles.section}>
          <h2>Media</h2>
          <div className={styles.mediaUploadBox}>
            {previewUrl ? (
              <div className={styles.previewContainer}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className={styles.imagePreview} />
                <button 
                  type="button" 
                  className={styles.clearImageBtn}
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                >
                  Remove Photo
                </button>
              </div>
            ) : (
              <div className={styles.uploadPrompt}>
                <div className={styles.uploadIcon}>📷</div>
                <p>Click to upload a photo of this item</p>
                <span className={styles.uploadSubtext}>Recommend 1:1 aspect ratio, up to 5MB</span>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className={styles.fileInput} 
              title="Upload photo"
            />
          </div>
        </div>

        <div className={styles.section}>
          <h2>Basic Details</h2>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label htmlFor="name">Item Name *</label>
              <input required id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. PLA Black 1kg" />
            </div>
            <div className={styles.field}>
              <label htmlFor="category">Category *</label>
              <select required id="category" name="category" value={formData.category} onChange={handleChange}>
                <option value="filament">Filament</option>
                <option value="resin">Resin</option>
                <option value="electronics">Electronics</option>
                <option value="wire">Wire</option>
                <option value="hardware">Hardware</option>
                <option value="packaging">Packaging</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Stock & Pricing</h2>
          <div className={styles.grid3}>
            <div className={styles.field}>
              <label htmlFor="unit">Tracking Unit *</label>
              <select required id="unit" name="unit" value={formData.unit} onChange={handleChange}>
                <option value="grams">Grams</option>
                <option value="meters">Meters</option>
                <option value="pieces">Pieces</option>
                <option value="liters">Liters</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="stock_qty">Current Stock *</label>
              <input required type="number" step="0.01" id="stock_qty" name="stock_qty" value={formData.stock_qty} onChange={handleChange} />
            </div>
            <div className={styles.field}>
              <label htmlFor="unit_cost">Cost per Unit (Rs) *</label>
              <input required type="number" step="0.001" id="unit_cost" name="unit_cost" value={formData.unit_cost} onChange={handleChange} />
            </div>
          </div>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label htmlFor="low_stock_threshold">Low Stock Threshold</label>
              <input type="number" step="0.01" id="low_stock_threshold" name="low_stock_threshold" value={formData.low_stock_threshold} onChange={handleChange} />
            </div>
            <div className={styles.field}>
              <label htmlFor="weight_per_unit_grams">Weight per Unit (g)</label>
              <input type="number" step="0.1" id="weight_per_unit_grams" name="weight_per_unit_grams" value={formData.weight_per_unit_grams} onChange={handleChange} placeholder="Important for BOM calc" />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Sourcing</h2>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label htmlFor="supplier">Supplier</label>
              <input id="supplier" name="supplier" value={formData.supplier} onChange={handleChange} placeholder="e.g. PolyMaker" />
            </div>
            <div className={styles.field}>
              <label htmlFor="supplier_sku">Supplier SKU</label>
              <input id="supplier_sku" name="supplier_sku" value={formData.supplier_sku} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Dimensions & Notes</h2>
          <div className={styles.grid3}>
            <div className={styles.field}>
              <label htmlFor="length_mm">Length (mm)</label>
              <input type="number" step="0.1" id="length_mm" name="length_mm" value={formData.length_mm} onChange={handleChange} />
            </div>
            <div className={styles.field}>
              <label htmlFor="width_mm">Width (mm)</label>
              <input type="number" step="0.1" id="width_mm" name="width_mm" value={formData.width_mm} onChange={handleChange} />
            </div>
            <div className={styles.field}>
              <label htmlFor="height_mm">Height (mm)</label>
              <input type="number" step="0.1" id="height_mm" name="height_mm" value={formData.height_mm} onChange={handleChange} />
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} placeholder="Any specific printing specs, colors, etc." />
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/admin/inventory" className={styles.cancelBtn}>Cancel</Link>
          <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
            <Save size={18} />
            {isSubmitting ? "Saving..." : "Save Item"}
          </button>
        </div>
      </form>
    </div>
  );
}
