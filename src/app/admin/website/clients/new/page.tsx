import { redirect } from "next/navigation";
import { createWebsiteClient } from "@/lib/api/website";
import { ClientForm } from "@/components/website-admin/ClientForm";

export const dynamic = "force-dynamic";

async function createAction(formData: FormData) {
  "use server";
  await createWebsiteClient({
    name: String(formData.get("name") || ""),
    logo_image_id: String(formData.get("logo_image_id") || ""),
    website_url: String(formData.get("website_url") || ""),
    is_active: formData.get("is_active") === "on",
    sort_order: Number(formData.get("sort_order") || 100),
  });
  redirect("/admin/website/clients");
}

export default function NewWebsiteClientPage() {
  return <ClientForm mode="create" action={createAction} cancelHref="/admin/website/clients" />;
}

