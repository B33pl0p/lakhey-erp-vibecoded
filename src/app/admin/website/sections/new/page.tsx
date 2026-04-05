import { redirect } from "next/navigation";
import { createWebsiteSection } from "@/lib/api/website";
import { SectionForm } from "@/components/website-admin/SectionForm";

export const dynamic = "force-dynamic";

async function createAction(formData: FormData) {
  "use server";
  await createWebsiteSection({
    section_key: String(formData.get("section_key") || ""),
    title: String(formData.get("title") || ""),
    body: String(formData.get("body") || ""),
    image_id: String(formData.get("image_id") || ""),
    cta_label: String(formData.get("cta_label") || ""),
    cta_href: String(formData.get("cta_href") || ""),
    is_active: formData.get("is_active") === "on",
    sort_order: Number(formData.get("sort_order") || 100),
  });
  redirect("/admin/website/sections");
}

export default function NewWebsiteSectionPage() {
  return <SectionForm mode="create" action={createAction} cancelHref="/admin/website/sections" />;
}

