"use client";

import { useState, useTransition } from "react";
import { MailCheck } from "lucide-react";
import { sendOrderConfirmationEmail } from "@/lib/email/orderConfirmation";
import { useToast } from "@/components/ui/ToastContext";

interface SendOrderConfirmationButtonProps {
  orderId: string;
  customerEmail?: string;
  className?: string;
}

export function SendOrderConfirmationButton({
  orderId,
  customerEmail,
  className,
}: SendOrderConfirmationButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const disabled = isPending || !customerEmail;

  const handleSend = () => {
    if (!customerEmail) {
      toast("Add customer email before sending confirmation", "warning");
      return;
    }

    startTransition(async () => {
      try {
        const result = await sendOrderConfirmationEmail(orderId);
        if (!result.ok) {
          toast(result.message, "error");
          return;
        }
        setSent(true);
        toast(result.message, "success");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not send confirmation email";
        toast(message, "error");
      }
    });
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleSend}
      disabled={disabled}
      title={customerEmail ? `Send to ${customerEmail}` : "Customer email is missing"}
    >
      <MailCheck size={16} />
      {isPending ? "Sending..." : sent ? "Sent" : "Send Confirmation"}
    </button>
  );
}
