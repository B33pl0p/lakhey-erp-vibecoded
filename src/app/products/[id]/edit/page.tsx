import { ProductForm } from "@/components/products/ProductForm";
import { getProduct } from "@/lib/api/products";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  try {
    const product = await getProduct(id);
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <ProductForm initialData={product} />
      </div>
    );
  } catch {
    notFound();
  }
}
