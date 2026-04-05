"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastContext";
import { createCustomer, updateCustomer, type Customer } from "@/lib/api/customers";
import styles from "./CustomerForm.module.css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface CustomerFormProps {
  initialData?: Customer;
}

export function CustomerForm({ initialData }: CustomerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    notes: initialData?.notes || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      if (initialData?.$id) {
        await updateCustomer(initialData.$id, formData);
        toast("Customer updated successfully", "success");
      } else {
        await createCustomer(formData);
        toast("Customer created successfully", "success");
      }
      router.refresh();
      router.push("/admin/customers");
    } catch (error) {
      console.error(error);
      toast("Error saving customer", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/admin/customers" className={styles.backBtn}>
            <ArrowLeft size={18} />
          </Link>
          <h1>{initialData ? "Edit Customer" : "New Customer"}</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h2>Customer Info</h2>

          <div className={styles.field}>
            <label htmlFor="name">Full Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Jane Doe"
            />
            {errors.name && <span className={styles.error}>{errors.name}</span>}
          </div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jane@example.com"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+977-9800000000"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              rows={3}
              value={formData.address}
              onChange={handleChange}
              placeholder="Street, City, Country"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any internal notes about this customer..."
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <Link href="/admin/customers" className={styles.cancelBtn}>
            Cancel
          </Link>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : initialData ? "Save Changes" : "Create Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}
