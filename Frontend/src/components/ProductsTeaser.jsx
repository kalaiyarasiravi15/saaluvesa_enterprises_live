import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./ProductsTeaser.css";
import useScrollAnimation from "../hooks/useScrollAnimation";
import { api, assetUrl } from "../lib/api";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%239ca3af'%3ENo Image Available%3C/text%3E%3C/svg%3E";

/* ------------------------------------------------------------------ */
/* Image Slider                                                        */
/* ------------------------------------------------------------------ */

/**
 * Shows an image within a product card.
 */
function ProductImageSlider({ images, productName, productId }) {
  const currentImage = images?.[0] || PLACEHOLDER_IMAGE;

  return (
    <div className="product-card__slider">
      <img
        src={currentImage}
        alt={productName || "Product"}
        className="product-card__image"
        onError={(e) => {
          if (e.currentTarget.src !== PLACEHOLDER_IMAGE) {
            e.currentTarget.onerror = null;
            e.currentTarget.src = PLACEHOLDER_IMAGE;
          }
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Product Card (shared)                                               */
/* ------------------------------------------------------------------ */

function ProductCard({ p, i }) {
  return (
    <article
      className={`product-card delay-${(i % 5) + 1} is-visible`}
      data-animate="card"
    >
      <Link
        to={`/products/${encodeURIComponent(p.id)}`}
        className="product-card__image-container"
        aria-label={`View details for ${p.name}`}
      >
        <ProductImageSlider
          images={p.images && p.images.length ? p.images : []}
          productName={p.name}
          productId={p.id}
        />
        {p.category && p.category !== "Apparel Sector" && (
          <span className="product-card__category">{p.category}</span>
        )}
      </Link>
      <div className="product-card__content">
        <h3 title={p.name}>
          <Link to={`/products/${encodeURIComponent(p.id)}`}>
            {p.name}
          </Link>
        </h3>
        {p.description && (
          <p className="product-card__desc">{p.description}</p>
        )}
        <Link to={`/products/${encodeURIComponent(p.id)}`} className="product-card__link">
          View details
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Product Carousel (only when products.length > 3)                   */
/* ------------------------------------------------------------------ */

/**
 * Horizontal drag-and-click carousel with left/right arrow navigation.
 * Shows ~3 cards at a time on desktop, 2 on tablet, 1 (+peek) on mobile.
 * Arrows are disabled at the start/end of the list.
 *
 * Slide width is measured directly from the rendered viewport element
 * (clientWidth, minus its own padding) rather than derived from a
 * vw-based CSS formula. vw includes the page scrollbar and doesn't
 * necessarily match the real content width of `.wrap`, which is what
 * was causing the right-most card to be clipped at the edge of the
 * viewport. Measuring the real element removes that mismatch entirely.
 */
function ProductCarousel({ products }) {
  const viewportRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const [cardWidth, setCardWidth] = useState(0); // slideWidth + gap, used for scroll math

  const recomputeLayout = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const trackEl = viewport.querySelector(".products-carousel__track");
    const viewportStyles = getComputedStyle(viewport);
    const paddingX =
      (parseFloat(viewportStyles.paddingLeft) || 0) +
      (parseFloat(viewportStyles.paddingRight) || 0);

    // Real available width for the track's children — not 100vw.
    const containerWidth = viewport.clientWidth - paddingX;
    if (containerWidth <= 0) return;

    const gap = trackEl ? parseFloat(getComputedStyle(trackEl).gap) || 0 : 0;

    let count = 3;
    if (window.innerWidth <= 600) {
      count = 1;
    } else if (window.innerWidth <= 960) {
      count = 2;
    }

    let width;
    if (count === 1) {
      // Mobile: fill container width so card is centered cleanly without offset gap
      width = containerWidth;
    } else {
      width = (containerWidth - gap * (count - 1)) / count;
    }

    setSlideWidth(width);
    setCardWidth(width + gap);
    setActiveIndex((idx) => Math.max(0, Math.min(idx, products.length - 1)));
  }, [products.length]);

  useEffect(() => {
    recomputeLayout();

    const handleResize = () => recomputeLayout();
    window.addEventListener("resize", handleResize);

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined" && viewportRef.current) {
      resizeObserver = new ResizeObserver(() => recomputeLayout());
      resizeObserver.observe(viewportRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [recomputeLayout]);

  // Scroll by one card in either direction (with cyclic loop so arrow click ALWAYS changes product)
  const scrollTo = useCallback(
    (index) => {
      if (!viewportRef.current || products.length <= 1) return;
      const nextIndex = (index + products.length) % products.length;
      setActiveIndex(nextIndex);

      const slides = viewportRef.current.querySelectorAll(".products-carousel__slide");
      const targetSlide = slides[nextIndex];
      if (targetSlide) {
        const viewport = viewportRef.current;
        const targetLeft = targetSlide.offsetLeft - (viewport.clientWidth - targetSlide.clientWidth) / 2;
        viewport.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
      }
    },
    [products.length],
  );

  // Sync activeIndex when the user drags/scrolls manually
  const onScroll = useCallback(() => {
    if (!viewportRef.current || products.length <= 1) return;
    const viewport = viewportRef.current;
    const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
    const slides = viewport.querySelectorAll(".products-carousel__slide");
    
    let closestIndex = 0;
    let minDistance = Infinity;
    slides.forEach((slide, idx) => {
      const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
      const dist = Math.abs(viewportCenter - slideCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });
    setActiveIndex(closestIndex);
  }, [products.length]);

  const showNav = products.length > 1;

  return (
    <div className="products-carousel">
      {/* Left arrow */}
      {showNav && (
        <button
          type="button"
          className="products-carousel__arrow products-carousel__arrow--left"
          aria-label="Previous product"
          onClick={() => scrollTo(activeIndex - 1)}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Scrollable track */}
      <div
        className="products-carousel__viewport"
        ref={viewportRef}
        onScroll={onScroll}
      >
        <div className="products-carousel__track">
          {products.map((p, i) => (
            <div
              className="products-carousel__slide"
              key={p.id}
              style={slideWidth ? { width: `${slideWidth}px` } : undefined}
            >
              <ProductCard p={p} i={i} />
            </div>
          ))}
        </div>
      </div>

      {/* Right arrow */}
      {showNav && (
        <button
          type="button"
          className="products-carousel__arrow products-carousel__arrow--right"
          aria-label="Next product"
          onClick={() => scrollTo(activeIndex + 1)}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Dot indicators */}
      {showNav && (
        <div className="products-carousel__dots" role="tablist" aria-label="Product slides">
          {products.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={`Go to product ${idx + 1}`}
              className={`products-carousel__dot${idx === activeIndex ? " is-active" : ""}`}
              onClick={() => scrollTo(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Products Teaser Section                                             */
/* ------------------------------------------------------------------ */

/**
 * Three-state behaviour:
 *  null  → still loading (render nothing — avoids flash)
 *  []    → API returned an empty list → hide the section entirely
 *  [...] → show the product grid (with optional slider per card)
 *
 * Static FALLBACK is only used when the API call *errors* (server offline).
 */

export default function ProductsTeaser({ showAll = false }) {
  const [products, setProducts] = useState([]);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 960 : false
  );
  const animRef = useScrollAnimation(0.12, "0px 0px -8% 0px", products);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileOrTablet(window.innerWidth <= 960);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let isMounted = true;
    api("/products")
      .then((rows) => {
        if (!isMounted) return;
        const apiRows = Array.isArray(rows) ? rows : [];
        const mapped = apiRows.map((product) => {
          const apiImages = Array.isArray(product.images) && product.images.length
            ? product.images.map((img) => assetUrl(img) || img).filter(Boolean)
            : product.image
            ? [assetUrl(product.image)].filter(Boolean)
            : [];
          return {
            id: product.slug || product.id,
            name: product.name,
            category:
              product.category && product.category !== "Apparel Sector"
                ? product.category
                : "",
            description: product.description || "",
            images: apiImages,
          };
        });

        setProducts(mapped);
      })
      .catch(() => {
        if (!isMounted) return;
        setProducts([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!products || products.length === 0) {
    return (
      <section id="products" className="products-teaser">
        <div className="wrap">
          <div className="products-teaser__head" style={{ marginBottom: "2rem" }}>
            <div>
              <div className="eyebrow products-teaser__eyebrow">Our Products</div>
              <h2>Built for Global Export.</h2>
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "3.5rem 1.5rem",
              background: "#f9fafb",
              borderRadius: "12px",
              border: "1px dashed #d1d5db",
            }}
          >
            <h3 style={{ fontSize: "1.35rem", color: "#111827", marginBottom: "1.5rem", fontWeight: "600" }}>
              Catalogue Under Update
            </h3>
            <Link to="/contact" className="btn btn--mint" style={{ display: "inline-block" }}>
              Enquire for Custom Orders
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // On the dedicated products page (showAll=true), ALWAYS render all products in the responsive grid!
  // On the homepage teaser, use the carousel if there are >3 items or mobile/tablet.
  const showCarousel = !showAll && (isMobileOrTablet || products.length > 3);

  return (
    <section id="products" className="products-teaser" ref={animRef}>
      <div className="wrap">
        <div className="products-teaser__head" data-animate="fade-up">
          <div>
            <div className="eyebrow products-teaser__eyebrow">Our Products</div>
            <h2>Built for Global Export.</h2>
          </div>
          {!showAll && (
            <div className="products-teaser__actions">
              <Link to="/products" className="products-teaser__view-all">
                View All Products ({products.length}) &rarr;
              </Link>
            </div>
          )}
        </div>

        {showCarousel ? (
          <ProductCarousel products={products} />
        ) : (
          <div className="products-teaser__grid">
            {products.map((p, i) => (
              <ProductCard key={p.id} p={p} i={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}