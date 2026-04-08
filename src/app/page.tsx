import { LandingPage } from "@/components/website/LandingPage";
import { getProducts } from "@/lib/api/products";
import { getFilePreviewUrl } from "@/lib/api/storage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const allProducts = await getProducts();
  const activeProducts = allProducts.filter((p) => p.is_active).slice(0, 10);

  const products = await Promise.all(
    activeProducts.map(async (p) => {
      const primaryImageId = p.image_ids?.[0] || p.image_id;
      return {
        id: p.$id,
        name: p.name,
        category: p.category,
        description: p.description || "",
        price: p.selling_price,
        imageUrl: primaryImageId ? await getFilePreviewUrl(primaryImageId, 900, 700) : null,
      };
    })
  );

  return <LandingPage products={products} />;
}
