import { notFound, redirect } from "next/navigation";
import { getWebsiteSection, updateWebsiteSection } from "@/lib/api/website";
import { SectionForm } from "@/components/website-admin/SectionForm";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditWebsiteSectionPage({ params }: Props) {
  const { id } = await params;

  let section;
  try {
    section = await getWebsiteSection(id);
  } catch {
    notFound();
  }

  async function updateAction(formData: FormData) {
    "use server";
    await updateWebsiteSection(id, {
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

  return <SectionForm mode="edit" initialData={section} action={updateAction} cancelHref="/admin/website/sections" />;
}

