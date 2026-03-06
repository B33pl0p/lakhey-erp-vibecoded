"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastContext";
import { createProduct, updateProduct, type Product } from "@/lib/api/products";
import { uploadFile } from "@/lib/api/storage";
import styles from "./ProductForm.module.css";
import Link from "next/link";
import { ArrowLeft, Save, ImageIcon, FileText } from "lucide-react";

interface ProductFormProps {
  initialData?: Product;
}

const CATEGORIES = ["lamp", "print", "enclosure", "decor", "other"] as const;

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    category: initialData?.category || "print",
    description: initialData?.description || "",
    labor_cost: initialData?.labor_cost ?? 0,
    selling_price: initialData?.selling_price ?? 0,
    height_mm: initialData?.height_mm || "",
    width_mm: initialData?.width_mm || "",
    depth_mm: initialData?.depth_mm || "",
    is_active: initialData?.is_active ?? true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [stlFile, setStlFile] = useState<File | null>(null);

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
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let image_id = initialData?.image_id;
      let file_id = initialData?.file_id;

      if (imageFile) {
        toast("Uploading image...", "info");
        const fd = new FormData();
        fd.append("file", imageFile);
        image_id = await uploadFile(fd);
      }

      if (stlFile) {
        toast("Uploading file...", "info");
        const fd = new FormData();
        fd.append("file", stlFile);
        file_id = await uploadFile(fd);
      }

      const payload: Partial<Product> = {
        ...formData,
        labor_cost: Number(formData.labor_cost),
        selling_price: Number(formData.selling_price),
        height_mm: formData.height_mm ? Number(formData.height_mm) : undefined,
        width_mm: formData.width_mm ? Number(formData.width_mm) : undefined,
        depth_mm: formData.depth_mm ? Number(formData.depth_mm) : undefined,
        // making_cost starts at labor_cost; BOM editor will update it
        making_cost: Number(formData.labor_cost),
        image_id,
        file_id,
      };

      if (initialData?.$id) {
        await updateProduct(initialData.$id, payload);
        toast("Product updated", "success");
        router.push(`/products/${initialData.$id}`);
      } else {
        const created = await createProduct(payload);
        toast("Product created — now add materials in the BOM editor", "success");
        router.push(`/products/${created.$id}`);
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      toast("Error saving product", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/products" className={styles.backBtn}>
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
              {imagePreview || initialData?.image_id ? (
                <div className={styles.previewContainer}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview || `/api/storage?id=${initialData?.image_id}`}
                    alt="Preview"
                    className={styles.imagePreview}
                  />
                  <button
                    type="button"
                    className={styles.clearBtn}
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className={styles.uploadPrompt}>
                  <ImageIcon size={28} />
                  <p>Upload product photo</p>
                  <span>JPG, PNG, WEBP up to 5MB</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.fileInput}
                title="Upload photo"
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
                onChange={e => setStlFile(e.target.files?.[0] ?? null)}
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

        {/* Pricing */}
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
          <p className={styles.hint}>
            Making cost = labor cost + material cost from BOM. You can set materials after saving on the product detail page.
          </p>
        </div>

        {/* Dimensions */}
        <div className={styles.section}>
          <h2>Dimensions</h2>
          <div className={styles.grid3}>
            <div className={styles.field}>
              <label htmlFor="height_mm">Height (mm)</label>
              <input type="number" step="0.1" id="height_mm" name="height_mm" value={formData.height_mm} onChange={handleChange} />
            </div>
            <div className={styles.field}>
              <label htmlFor="width_mm">Width (mm)</label>
              <input type="number" step="0.1" id="width_mm" name="width_mm" value={formData.width_mm} onChange={handleChange} />
            </div>
            <div className={styles.field}>
              <label htmlFor="depth_mm">Depth (mm)</label>
              <input type="number" step="0.1" id="depth_mm" name="depth_mm" value={formData.depth_mm} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className={styles.section}>
          <div className={styles.checkRow}>
            <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleChange} />
            <label htmlFor="is_active">Active (visible in order creation)</label>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/products" className={styles.cancelBtn}>Cancel</Link>
          <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
            <Save size={18} />
            {isSubmitting ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
