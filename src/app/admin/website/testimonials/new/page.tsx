import { redirect } from "next/navigation";
import { createWebsiteTestimonial } from "@/lib/api/website";
import { TestimonialForm } from "@/components/website-admin/TestimonialForm";

export const dynamic = "force-dynamic";

async function createAction(formData: FormData) {
  "use server";
  await createWebsiteTestimonial({
    name: String(formData.get("name") || ""),
    role: String(formData.get("role") || ""),
    company: String(formData.get("company") || ""),
    quote: String(formData.get("quote") || ""),
    rating: Number(formData.get("rating") || 5),
    image_id: String(formData.get("image_id") || ""),
    is_active: formData.get("is_active") === "on",
    sort_order: Number(formData.get("sort_order") || 100),
  });
  redirect("/admin/website/testimonials");
}

export default function NewWebsiteTestimonialPage() {
  return (
    <TestimonialForm
      mode="create"
      action={createAction}
      cancelHref="/admin/website/testimonials"
    />
  );
}

