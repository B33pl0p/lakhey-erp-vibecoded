import Link from "next/link";
import { AddToCartButton } from "@/components/website/AddToCartButton";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import { getProducts } from "@/lib/api/products";
import { getFilePreviewUrl } from "@/lib/api/storage";
import { formatCurrency } from "@/lib/utils/currency";
import { formatProductCategoryLabel } from "@/lib/products/categories";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ ordered?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const { ordered } = await searchParams;
  const products = (await getProducts()).filter((p) => p.is_active);

  const cards = await Promise.all(
    products.map(async (p) => {
      const primaryImageId = p.image_ids?.[0] || p.image_id;
      return {
        id: p.$id,
        name: p.name,
        category: p.category,
        categoryLabel: formatProductCategoryLabel(p.category),
        description: p.description || "",
        price: p.selling_price,
        imageUrl: primaryImageId ? await getFilePreviewUrl(primaryImageId, 900, 700) : null,
      };
    })
  );

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <WebsiteNav />
        <header className={styles.header}>
          <p className={styles.kicker}>Showroom</p>
          <h1>All Products</h1>
          <p>Browse the full Lakhey Labs collection. Open each product to see detailed photos and information.</p>
          {ordered === "1" ? (
            <p className={styles.notice}>
              Your order was placed successfully. You can track it anytime from <Link href="/track">Track Order</Link>.
            </p>
          ) : null}
        </header>

        <div className={styles.grid}>
          {cards.map((product) => (
            <article key={product.id} className={styles.card}>
              <Link href={`/products/${product.id}`} className={styles.mediaWrap}>
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.name} className={styles.media} />
                ) : (
                  <div className={styles.mediaFallback}>Lakhey Labs</div>
                )}
              </Link>
              <div className={styles.body}>
                <p className={styles.category}>{product.categoryLabel}</p>
                <h2>{product.name}</h2>
                <p>{product.description || "Premium 3D printed product by Lakhey Labs."}</p>
                <div className={styles.row}>
                  <strong>{formatCurrency(product.price)}</strong>
                  <div className={styles.actions}>
                    <Link href={`/products/${product.id}`} className={styles.secondaryBtn}>View</Link>
                    <AddToCartButton
                      product={{
                        id: product.id,
                        name: product.name,
                        category: product.categoryLabel,
                        description: product.description,
                        price: product.price,
                        imageUrl: product.imageUrl,
                      }}
                      className={styles.primaryBtn}
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
        <WebsiteFooter />
      </section>
    </main>
  );
}
