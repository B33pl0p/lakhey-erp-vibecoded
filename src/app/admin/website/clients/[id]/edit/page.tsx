import { notFound, redirect } from "next/navigation";
import { getWebsiteClient, updateWebsiteClient } from "@/lib/api/website";
import { ClientForm } from "@/components/website-admin/ClientForm";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditWebsiteClientPage({ params }: Props) {
  const { id } = await params;

  let client;
  try {
    client = await getWebsiteClient(id);
  } catch {
    notFound();
  }

  async function updateAction(formData: FormData) {
    "use server";
    await updateWebsiteClient(id, {
      name: String(formData.get("name") || ""),
      logo_image_id: String(formData.get("logo_image_id") || ""),
      website_url: String(formData.get("website_url") || ""),
      is_active: formData.get("is_active") === "on",
      sort_order: Number(formData.get("sort_order") || 100),
    });
    redirect("/admin/website/clients");
  }

  return <ClientForm mode="edit" initialData={client} action={updateAction} cancelHref="/admin/website/clients" />;
}

