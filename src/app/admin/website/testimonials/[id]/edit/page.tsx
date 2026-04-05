import { notFound, redirect } from "next/navigation";
import { getWebsiteTestimonial, updateWebsiteTestimonial } from "@/lib/api/website";
import { TestimonialForm } from "@/components/website-admin/TestimonialForm";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditWebsiteTestimonialPage({ params }: Props) {
  const { id } = await params;

  let testimonial;
  try {
    testimonial = await getWebsiteTestimonial(id);
  } catch {
    notFound();
  }

  async function updateAction(formData: FormData) {
    "use server";
    await updateWebsiteTestimonial(id, {
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

  return (
    <TestimonialForm
      mode="edit"
      initialData={testimonial}
      action={updateAction}
      cancelHref="/admin/website/testimonials"
    />
  );
}

