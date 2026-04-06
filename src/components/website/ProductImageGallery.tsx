"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import styles from "./ProductImageGallery.module.css";

interface Props {
  productName: string;
  imageUrls: string[];
}

export function ProductImageGallery({ productName, imageUrls }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const selectedImage = imageUrls[selectedIndex];

  function showPrevious() {
    setSelectedIndex((current) => (current === 0 ? imageUrls.length - 1 : current - 1));
  }

  function showNext() {
    setSelectedIndex((current) => (current === imageUrls.length - 1 ? 0 : current + 1));
  }

  return (
    <>
      <div className={styles.gallery}>
        <button type="button" className={styles.mainImageButton} onClick={() => setIsViewerOpen(true)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selectedImage} alt={productName} className={styles.mainImage} />
          <span className={styles.zoomHint}>
            <ZoomIn size={16} />
            <span>Tap to enlarge</span>
          </span>
        </button>

        {imageUrls.length > 1 ? (
          <div className={styles.thumbGrid}>
            {imageUrls.map((url, idx) => (
              <button
                key={`${url}-${idx}`}
                type="button"
                className={`${styles.thumbButton} ${idx === selectedIndex ? styles.thumbActive : ""}`.trim()}
                onClick={() => setSelectedIndex(idx)}
                aria-label={`View image ${idx + 1} of ${imageUrls.length}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`${productName} ${idx + 1}`} className={styles.thumb} />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {isViewerOpen ? (
        <div className={styles.viewer} role="dialog" aria-modal="true" aria-label={`${productName} image viewer`}>
          <button
            type="button"
            className={`${styles.viewerAction} ${styles.closeBtn}`.trim()}
            onClick={() => setIsViewerOpen(false)}
            aria-label="Close image viewer"
          >
            <X size={20} />
          </button>

          {imageUrls.length > 1 ? (
            <button
              type="button"
              className={`${styles.viewerAction} ${styles.prevBtn}`.trim()}
              onClick={showPrevious}
              aria-label="Previous image"
            >
              <ChevronLeft size={22} />
            </button>
          ) : null}

          <div className={styles.viewerImageWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedImage} alt={productName} className={styles.viewerImage} />
          </div>

          {imageUrls.length > 1 ? (
            <button
              type="button"
              className={`${styles.viewerAction} ${styles.nextBtn}`.trim()}
              onClick={showNext}
              aria-label="Next image"
            >
              <ChevronRight size={22} />
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
