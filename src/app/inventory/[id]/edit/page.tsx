import { InventoryForm } from "@/components/inventory/InventoryForm";
import { getInventoryItem } from "@/lib/api/inventory";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface EditInventoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInventoryPage({ params }: EditInventoryPageProps) {
  const { id } = await params;
  
  try {
    const item = await getInventoryItem(id);
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <InventoryForm initialData={item} />
      </div>
    );
  } catch (error) {
    console.error(error);
    notFound();
  }
}
