"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/website/AddToCartButton";
import { formatCurrency } from "@/lib/utils/currency";
import { formatProductCategoryLabel } from "@/lib/products/categories";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import { WebsiteNav } from "@/components/website/WebsiteNav";
import styles from "./LandingPage.module.css";

export interface WebsiteProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  imageUrl: string | null;
}

interface LandingPageProps {
  products: WebsiteProduct[];
}

const infoCards = [
  {
    id: "service",
    eyebrow: "What We Offer",
    title: "Custom 3D printing and ready-to-buy products.",
    text: "From one-off prototypes to finished product pieces, we print with practical quality and clear communication.",
  },
  {
    id: "workflow",
    eyebrow: "How We Work",
    title: "Simple process, reliable delivery.",
    text: "Share what you need, we suggest the right print path, and we deliver parts you can use with confidence.",
  },
  {
    id: "studio",
    eyebrow: "Studio",
    title: "Based in Kathmandu, serving teams and individuals.",
    text: "We support engineers, creators, students, and businesses that need fast and dependable 3D printing support.",
  },
];

function shuffleProducts(items: WebsiteProduct[]) {
  return [...items].sort((a, b) => {
    const aScore = Array.from(a.id).reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 3), 0);
    const bScore = Array.from(b.id).reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 3), 0);
    return aScore - bScore;
  });
}

export function LandingPage({ products }: LandingPageProps) {
  const [rotation, setRotation] = useState(0);
  const heroImage = "/website/hero.png";
  const showcasePool = useMemo(() => shuffleProducts(products.slice(0, 10)), [products]);

  useEffect(() => {
    if (showcasePool.length <= 2) return;

    const timer = window.setInterval(() => {
      setRotation((current) => current + 1);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [showcasePool.length]);

  const showcaseProducts = useMemo(() => {
    if (showcasePool.length === 0) return [];
    const normalizedRotation = rotation % showcasePool.length;
    const rotated = showcasePool.slice(normalizedRotation).concat(showcasePool.slice(0, normalizedRotation));
    return rotated.slice(0, 2);
  }, [rotation, showcasePool]);

  return (
    <main className={styles.page}>
      <div className={styles.bgBase} />
      <div className={styles.bgGrid} />
      <div className={styles.bgDhaka} />
      <div className={styles.bgGlowPrimary} />

      <WebsiteNav />

      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden="true">
          {heroImage ? (
            <Image src={heroImage} alt="" fill unoptimized className={styles.heroBgImage} />
          ) : (
            <div className={styles.imageFallback}>Featured Studio Build</div>
          )}
        </div>
        <div className={styles.heroBgOverlay} aria-hidden="true" />

        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Lakhey Labs 3D Printing Studio</p>
          <h1>Simple, reliable 3D printing for custom work and product sales.</h1>
          <p className={styles.heroText}>
            We help individuals and businesses turn ideas into physical parts and products. Fast replies, practical
            guidance, and consistent print quality.
          </p>
          <p className={styles.heroTagline}>Designed in Nepal, built with precision.</p>

          <div className={styles.heroActions}>
            <Link href="/products" className={styles.primaryBtn}>
              Visit Store
            </Link>
            <Link href="/studio" className={styles.primaryBtn}>
              Start Custom Project
            </Link>
          </div>

          <div className={styles.signalRow}>
            <span>Custom Prints</span>
            <span>Ready Products</span>
            <span className={styles.heritageBadge}>Made in Nepal</span>
          </div>
        </div>
      </section>

      <section id="info" className={styles.section}>
        <div className={styles.sectionIntro}>
          <p className={styles.kicker}>Information</p>
          <h2>Everything you need to know in one place.</h2>
          <p>
            We keep our service straightforward: clear options, fair pricing, and dependable turnaround.
          </p>
        </div>

        <div className={styles.capabilityGrid}>
          {infoCards.map((card) => (
            <article key={card.id} className={styles.capabilityCard}>
              <p className={styles.cardEyebrow}>{card.eyebrow}</p>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="showroom" className={styles.section}>
        <div className={styles.sectionIntro}>
          <p className={styles.kicker}>Store</p>
          <h2>Browse our ready-to-buy products.</h2>
          <p>
            Discover our current product collection or start a custom project from the project page.
          </p>
          <Link href="/products" className={styles.viewMoreLink}>
            View Full Store
          </Link>
        </div>

        <div className={styles.showcaseGrid}>
          {showcaseProducts.length > 0 ? (
            showcaseProducts.map((product, index) => (
              <article
                key={`${product.id}-${index}`}
                className={`${styles.productCard} ${index === 0 ? styles.productCardHero : styles.productCardFeature} ${index === 0 ? styles.slideCardLeft : styles.slideCardRight}`.trim()}
              >
                <Link href={`/products/${product.id}`} className={styles.productMedia}>
                  <div className={styles.mediaBadge}>{index === 0 ? "Featured Build" : "Next Highlight"}</div>
                  {product.imageUrl ? (
                    <Image src={product.imageUrl} alt={product.name} fill unoptimized className={styles.productImage} />
                  ) : (
                    <div className={styles.imageFallback}>Built by Us</div>
                  )}
                </Link>
                <div className={styles.productBody}>
                  <p className={styles.productCategory}>{formatProductCategoryLabel(product.category)}</p>
                  <h3>{product.name}</h3>
                  <p>{product.description || "Precision-printed in house for practical use, clean presentation, and reliable output."}</p>
                  <div className={styles.productRow}>
                    <strong>{formatCurrency(product.price)}</strong>
                    <div className={styles.productActions}>
                      <Link href={`/products/${product.id}`} className={styles.cardBtn}>
                        View
                      </Link>
                      <AddToCartButton
                        product={{
                          id: product.id,
                          name: product.name,
                          category: formatProductCategoryLabel(product.category),
                          description: product.description,
                          price: product.price,
                          imageUrl: product.imageUrl,
                        }}
                        className={styles.cardPrimaryBtn}
                        idleLabel="Add to Cart"
                        addedLabel="Added"
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            ["Prototype Housing", "Desk Utility Rack", "Architectural Volume Study", "Custom Bracket System"].map(
              (name, index) => (
                <article
                  key={name}
                  className={`${styles.productCard} ${index === 0 ? styles.productCardHero : styles.productCardFeature}`.trim()}
                >
                  <Link href="/products" className={styles.productMedia}>
                    <div className={styles.mediaBadge}>{index === 0 ? "Featured Build" : "Next Highlight"}</div>
                    <div className={styles.imageFallback}>Built by Us</div>
                  </Link>
                  <div className={styles.productBody}>
                    <p className={styles.productCategory}>Sample Build</p>
                    <h3>{name}</h3>
                    <p>Example output showing how we balance detail, durability, and presentation across use cases.</p>
                  <div className={styles.productRow}>
                    <strong>Made to order</strong>
                    <div className={styles.productActions}>
                      <Link href="/products" className={styles.cardBtn}>
                        View
                      </Link>
                      <Link href="/products" className={styles.cardPrimaryBtn}>
                        Add to Cart
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
              )
            )
          )}
        </div>
        {showcaseProducts.length > 1 ? (
          <div className={styles.showcaseIndicators} aria-hidden="true">
            {showcasePool.map((product, index) => (
              <span
                key={product.id}
                className={`${styles.showcaseDot} ${index === rotation % showcasePool.length ? styles.showcaseDotActive : ""}`.trim()}
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className={styles.pivot}>
        <div>
          <p className={styles.kicker}>Custom Orders</p>
          <h2>Need a custom 3D print?</h2>
        </div>
        <p>Send us your requirement and we will guide you on material, timeline, and pricing.</p>
        <Link href="/studio" className={styles.primaryBtn}>
          Start a Custom Project
        </Link>
      </section>

      <section id="about" className={styles.section}>
        <div className={styles.aboutBlock}>
          <p className={styles.kicker}>About Us</p>
          <h2>We make digital work tangible.</h2>
          <p>
            We are based in Kathmandu. Our goal is simple: help you move from idea to object with less friction and
            reliable results.
          </p>
        </div>
      </section>
      <WebsiteFooter />
    </main>
  );
}
