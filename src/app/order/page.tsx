import { redirect } from "next/navigation";
import { getProducts } from "@/lib/api/products";
import { getCustomerSessionUser } from "@/lib/api/customerAuth";
import { OrderPageClient } from "./OrderPageClient";
import { getFilePreviewUrl } from "@/lib/api/storage";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ product?: string; cart?: string }>;
}

export default async function OrderPage({ searchParams }: Props) {
  const { product, cart } = await searchParams;
  const user = await getCustomerSessionUser();
  const isCartCheckout = cart === "1";

  if (!user) {
    const next = isCartCheckout
      ? "/order?cart=1"
      : product
        ? `/order?product=${encodeURIComponent(product)}`
        : "/order";
    redirect(`/account?next=${encodeURIComponent(next)}`);
  }

  const products = await Promise.all(
    (await getProducts())
      .filter((p) => p.is_active)
      .map(async (p) => {
        const primaryImageId = p.image_ids?.[0] || p.image_id;
        return {
          id: p.$id,
          name: p.name,
          price: p.selling_price,
          category: p.category,
          description: p.description || "",
          imageUrl: primaryImageId ? await getFilePreviewUrl(primaryImageId, 900, 700) : null,
        };
      })
  );

  return (
    <OrderPageClient
      products={products}
      selectedProductId={product}
      userEmail={user.email}
      initialPhone={user.phone || ""}
      initialAddress={user.address || ""}
      checkoutMode={isCartCheckout ? "cart" : "single"}
    />
  );
}
