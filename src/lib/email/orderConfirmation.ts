"use server";

import { revalidatePath } from "next/cache";
import { ensureAdminSession } from "@/lib/api/adminAuth";
import { getBusinessConfig } from "@/lib/api/businessConfig";
import { getCustomer } from "@/lib/api/customers";
import { getOrder, updateOrderStatus } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/utils/currency";
import { sendMail } from "./mailer";

interface SendOrderConfirmationResult {
  ok: boolean;
  message: string;
  to?: string;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function optionalLine(label: string, value?: string | null) {
  if (!value) return "";
  return `${label}: ${value}\n`;
}

function optionalHtmlRow(label: string, value?: string | null) {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:8px 0;color:#667085;">${escapeHtml(label)}</td>
      <td style="padding:8px 0;text-align:right;font-weight:600;color:#101828;">${escapeHtml(value)}</td>
    </tr>
  `;
}

export async function sendOrderConfirmationEmail(orderId: string): Promise<SendOrderConfirmationResult> {
  await ensureAdminSession();

  const [order, business] = await Promise.all([
    getOrder(orderId),
    getBusinessConfig(),
  ]);
  const customer = await getCustomer(order.customer_id);

  if (!customer.email) {
    return {
      ok: false,
      message: "This customer does not have an email address saved.",
    };
  }

  const companyName = business.company_name || "Lakhey Labs";
  const replyTo = business.email || process.env.SMTP_USER;
  const balanceDue = Math.max(0, order.total_price - (order.advance_paid || 0));
  const createdAt = new Date(order.$createdAt).toLocaleDateString("en-NP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const deadline = order.deadline
    ? new Date(order.deadline).toLocaleDateString("en-NP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : undefined;

  const subject = `Order confirmation - ${order.title}`;
  const text = [
    `Hi ${customer.name},`,
    "",
    `Thanks for ordering from ${companyName}. We have confirmed your order.`,
    "",
    `Order: ${order.title}`,
    `Quantity: ${order.quantity}`,
    `Total: ${formatCurrency(order.total_price)}`,
    optionalLine("Advance paid", order.advance_paid ? formatCurrency(order.advance_paid) : undefined).trim(),
    optionalLine("Balance due", balanceDue > 0 ? formatCurrency(balanceDue) : undefined).trim(),
    optionalLine("Delivery address", order.delivery_address || customer.address).trim(),
    optionalLine("Expected date", deadline).trim(),
    "",
    "If anything looks wrong, please reply to this email and we will fix it.",
    "",
    `Regards,`,
    companyName,
  ].filter(Boolean).join("\n");

  const html = `
    <div style="margin:0;padding:24px;background:#f6f4ef;font-family:Arial,sans-serif;color:#101828;">
      <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e7e0d4;border-radius:18px;overflow:hidden;">
        <div style="padding:28px 30px;background:#1f2933;color:#fff;">
          <p style="margin:0 0 8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#d9c7a3;">Order Confirmed</p>
          <h1 style="margin:0;font-size:25px;line-height:1.25;">${escapeHtml(order.title)}</h1>
        </div>
        <div style="padding:30px;">
          <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Hi ${escapeHtml(customer.name)},</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#475467;">
            Thanks for ordering from ${escapeHtml(companyName)}. We have confirmed your order and saved the details below.
          </p>

          <table style="width:100%;border-collapse:collapse;border-top:1px solid #eadfce;border-bottom:1px solid #eadfce;margin:22px 0;">
            <tr>
              <td style="padding:12px 0;color:#667085;">Order date</td>
              <td style="padding:12px 0;text-align:right;font-weight:600;color:#101828;">${escapeHtml(createdAt)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#667085;">Quantity</td>
              <td style="padding:8px 0;text-align:right;font-weight:600;color:#101828;">${order.quantity}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#667085;">Total</td>
              <td style="padding:8px 0;text-align:right;font-weight:700;color:#101828;">${escapeHtml(formatCurrency(order.total_price))}</td>
            </tr>
            ${optionalHtmlRow("Advance paid", order.advance_paid ? formatCurrency(order.advance_paid) : undefined)}
            ${optionalHtmlRow("Balance due", balanceDue > 0 ? formatCurrency(balanceDue) : undefined)}
            ${optionalHtmlRow("Delivery address", order.delivery_address || customer.address)}
            ${optionalHtmlRow("Expected date", deadline)}
          </table>

          <p style="margin:0;font-size:14px;line-height:1.7;color:#667085;">
            If anything looks wrong, please reply to this email and we will fix it.
          </p>
          <p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#475467;">
            Regards,<br />
            <strong>${escapeHtml(companyName)}</strong>
          </p>
        </div>
      </div>
    </div>
  `;

  await sendMail({
    to: customer.email,
    subject,
    text,
    html,
    replyTo,
  });

  if (order.status === "pending") {
    await updateOrderStatus(order.$id, "confirmed");
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.$id}`);

  return {
    ok: true,
    message: `Order confirmation sent to ${customer.email}.`,
    to: customer.email,
  };
}
