import { redirect } from "next/navigation";
import { getWebsiteSettings, upsertWebsiteSettings } from "@/lib/api/website";
import { WebsiteSettingsForm } from "@/components/website-admin/WebsiteSettingsForm";

export const dynamic = "force-dynamic";

export default async function WebsiteSettingsPage() {
  const settings = await getWebsiteSettings();

  async function saveAction(formData: FormData) {
    "use server";
    await upsertWebsiteSettings({
      site_name: String(formData.get("site_name") || "Lakhey Labs"),
      hero_title: String(formData.get("hero_title") || ""),
      hero_subtitle: String(formData.get("hero_subtitle") || ""),
      hero_cta_primary_label: String(formData.get("hero_cta_primary_label") || "Visit Store"),
      hero_cta_primary_href: String(formData.get("hero_cta_primary_href") || "/products"),
      hero_cta_secondary_label: String(formData.get("hero_cta_secondary_label") || "Start Custom Project"),
      hero_cta_secondary_href: String(formData.get("hero_cta_secondary_href") || "/studio"),
      hero_tagline: String(formData.get("hero_tagline") || ""),
      contact_email: String(formData.get("contact_email") || ""),
      contact_phone: String(formData.get("contact_phone") || ""),
      studio_location: String(formData.get("studio_location") || ""),
      is_store_enabled: formData.get("is_store_enabled") === "on",
    });
    redirect("/admin/website/settings");
  }

  return <WebsiteSettingsForm initialData={settings} action={saveAction} />;
}

