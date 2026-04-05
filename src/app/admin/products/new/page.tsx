import { ProductForm } from "@/components/products/ProductForm";
import { getInventoryItems } from "@/lib/api/inventory";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const inventoryItems = await getInventoryItems();
  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
      <ProductForm allInventoryItems={inventoryItems} />
    </div>
  );
}
