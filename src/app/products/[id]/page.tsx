import Link from "next/link";
import { notFound } from "next/navigation";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import { getProduct } from "@/lib/api/products";
import { getFilePreviewUrl } from "@/lib/api/storage";
import { formatCurrency } from "@/lib/utils/currency";
import { formatProductCategoryLabel } from "@/lib/products/categories";
import styles from "./page.module.css";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ProductDetailWebsitePage({ params }: Props) {
  const { id } = await params;

  let product;
  try {
    product = await getProduct(id);
  } catch {
    notFound();
  }

  if (!product.is_active) {
    notFound();
  }

  const imageIds = product.image_ids?.length ? product.image_ids : (product.image_id ? [product.image_id] : []);
  const imageUrls = await Promise.all(imageIds.map((imageId) => getFilePreviewUrl(imageId, 1200, 900)));

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <WebsiteNav />
        <div className={styles.topbar}>
          <Link href="/products" className={styles.backLink}>← Back to Products</Link>
          <Link href={`/order?product=${product.$id}`} className={styles.orderBtn}>Order This Product</Link>
        </div>

        <div className={styles.layout}>
          <div className={styles.gallery}>
            {imageUrls.length > 0 ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrls[0]} alt={product.name} className={styles.mainImage} />
                {imageUrls.length > 1 ? (
                  <div className={styles.thumbGrid}>
                    {imageUrls.slice(1).map((url, idx) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={`${url}-${idx}`} src={url} alt={`${product.name} ${idx + 2}`} className={styles.thumb} />
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className={styles.fallback}>Lakhey Labs</div>
            )}
          </div>

          <div className={styles.infoCard}>
            <p className={styles.category}>{formatProductCategoryLabel(product.category)}</p>
            <h1>{product.name}</h1>
            <p className={styles.desc}>{product.description || "Premium 3D printed product by Lakhey Labs."}</p>

            <div className={styles.price}>{formatCurrency(product.selling_price)}</div>

            <div className={styles.actions}>
              <Link href={`/order?product=${product.$id}`} className={styles.orderBtn}>Order Now</Link>
              <Link href="/studio" className={styles.inquireBtn}>Custom Inquiry</Link>
            </div>
          </div>
        </div>
        <WebsiteFooter />
      </section>
    </main>
  );
}
