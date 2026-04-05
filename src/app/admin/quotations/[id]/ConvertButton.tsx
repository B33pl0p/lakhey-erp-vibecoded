"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { convertQuoteToOrder } from "@/lib/api/quotations";
import { useToast } from "@/components/ui/ToastContext";
import { CheckCircle } from "lucide-react";
import styles from "./ConvertButton.module.css";

export function ConvertButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (!confirm("Convert this quotation into a new order? The quote will be marked as Accepted.")) return;
    setLoading(true);
    try {
      const { orderId } = await convertQuoteToOrder(quoteId);
      toast("Order created from quotation!", "success");
      router.push(`/admin/orders/${orderId}`);
      router.refresh();
    } catch {
      toast("Failed to convert quotation", "error");
      setLoading(false);
    }
  };

  return (
    <button className={styles.convertBtn} onClick={handleConvert} disabled={loading}>
      <CheckCircle size={16} />
      {loading ? "Converting…" : "Convert to Order"}
    </button>
  );
}
