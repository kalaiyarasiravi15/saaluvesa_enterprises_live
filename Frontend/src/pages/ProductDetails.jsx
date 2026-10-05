import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./ProductDetails.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactSection from "../components/ContactSection";
import { api, assetUrl } from "../lib/api";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%239ca3af'%3ENo Image Available%3C/text%3E%3C/svg%3E";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3.5 8h8M8.5 4l4 4-4 4" />
    </svg>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  let productId = "";
  try {
    productId = decodeURIComponent(id || "");
  } catch {
    productId = id || "";
  }

  const [apiProduct, setApiProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(false);
    setNotFound(false);
    setApiProduct(null);

    Promise.allSettled([
      api(`/products/${encodeURIComponent(productId)}`),
      api("/products"),
    ]).then(([detailResult, listResult]) => {
      if (!isMounted) return;

      let foundFromList = null;
      if (
        listResult.status === "fulfilled" &&
        Array.isArray(listResult.value) &&
        listResult.value.length > 0
      ) {
        const mapped = listResult.value.map((p) => {
          const images =
            Array.isArray(p.images) && p.images.length
              ? p.images.map((img) => assetUrl(img) || img).filter(Boolean)
              : p.image
              ? [assetUrl(p.image) || p.image].filter(Boolean)
              : [];

          return {
            id: p.slug || String(p.id),
            rawId: p.id,
            slug: p.slug,
            name: p.name,
            category:
              p.category && p.category !== "Apparel Sector" ? p.category : "",
            description: p.description || "",
            images,
          };
        });
        setAllProducts(mapped);

        foundFromList = listResult.value.find(
          (p) =>
            String(p.id) === String(productId) ||
            String(p.slug || "").toLowerCase() === productId.toLowerCase() ||
            String(p.name || "").trim().toLowerCase() ===
              productId.trim().toLowerCase()
        );
      } else {
        setAllProducts([]);
      }

      if (detailResult.status === "fulfilled" && detailResult.value) {
        setApiProduct(detailResult.value);
        setIsLoading(false);
      } else if (foundFromList) {
        setApiProduct(foundFromList);
        setIsLoading(false);
      } else {
        const error = detailResult.reason;
        if (
          error?.message === "Product not found" ||
          detailResult.status === "rejected"
        ) {
          setNotFound(true);
        } else {
          setLoadError(true);
        }
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [productId, retryKey]);

  const product = (() => {
    if (notFound && !apiProduct) return null;

    if (apiProduct) {
      const apiImages =
        Array.isArray(apiProduct.images) && apiProduct.images.length
          ? apiProduct.images
              .map((img) => assetUrl(img) || img)
              .filter(Boolean)
          : apiProduct.image
          ? [assetUrl(apiProduct.image)].filter(Boolean)
          : [];

      return {
        id: apiProduct.slug || String(apiProduct.id),
        rawId: apiProduct.id,
        slug: apiProduct.slug,
        name: apiProduct.name || "Product",
        category:
          apiProduct.category && apiProduct.category !== "Apparel Sector"
            ? apiProduct.category
            : "",
        tagline:
          apiProduct.tagline ||
          "High-quality products, manufactured and sourced for global export.",
        aboutHeading:
          apiProduct.aboutHeading ||
          "Crafted for Performance, Scale, and Comfort.",
        shortDescription: apiProduct.description || "",
        description: apiProduct.description || "",
        images: apiImages.length > 0 ? apiImages : [PLACEHOLDER_IMAGE],
        website_link:
          apiProduct.website_link || "https://castbull.co.in/",
      };
    }

    return null;
  })();

  if (isLoading) {
    return (
      <div className="product-details-page">
        <Header />
        <main className="details-not-found">
          <p className="eyebrow">Product Catalogue</p>
          <h1>Loading product details…</h1>
        </main>
        <Footer />
      </div>
    );
  }

  if (loadError && !product) {
    return (
      <div className="product-details-page">
        <Header />
        <main className="details-not-found">
          <p className="eyebrow">Product Catalogue</p>
          <h1>We couldn't load this product.</h1>
          <p className="details-not-found__hint">
            Something went wrong while fetching the product details. Please try again.
          </p>
          <div className="details-not-found__actions">
            <button
              type="button"
              className="btn btn--mint"
              onClick={() => setRetryKey((k) => k + 1)}
            >
              Try again
            </button>
            <Link className="btn btn--outline-light" to="/products">
              Back to products
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-details-page">
        <Header />
        <main className="details-not-found">
          <p className="eyebrow">Product Catalogue</p>
          <h1>That product is not available.</h1>
          <Link className="btn btn--mint" to="/products">
            Back to products
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Related products selection:
  // Strictly excludes the current product, and picks the next available products sequentially.
  const related = (() => {
    const list = Array.isArray(allProducts) ? allProducts : [];
    if (!product || !list.length) return [];

    const isCurrentProduct = (item) => {
      if (!item) return false;
      const sameId =
        (product.id &&
          String(item.id).toLowerCase() === String(product.id).toLowerCase()) ||
        (product.slug &&
          String(item.slug || "").toLowerCase() ===
            String(product.slug).toLowerCase()) ||
        (product.rawId && String(item.rawId || "") === String(product.rawId)) ||
        (product.id && String(item.rawId || "") === String(product.id));
      const sameName =
        item.name &&
        product.name &&
        item.name.trim().toLowerCase() === product.name.trim().toLowerCase();
      return Boolean(sameId || sameName);
    };

    const currentIndex = list.findIndex(isCurrentProduct);

    const candidates = [];
    if (currentIndex !== -1) {
      for (let i = 1; i < list.length; i++) {
        const candidate = list[(currentIndex + i) % list.length];
        if (
          !isCurrentProduct(candidate) &&
          !candidates.some((c) => String(c.id) === String(candidate.id))
        ) {
          candidates.push(candidate);
        }
      }
    } else {
      for (const item of list) {
        if (
          !isCurrentProduct(item) &&
          !candidates.some((c) => String(c.id) === String(item.id))
        ) {
          candidates.push(item);
        }
      }
    }

    return candidates.slice(0, 2);
  })();

  const activeImage =
    (product.images && product.images[0]) || PLACEHOLDER_IMAGE;

  return (
    <div className="product-details-page">
      <Header />
      <main>
        <nav className="details-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Products</Link>
          <span>/</span>
          <strong>{product.name}</strong>
        </nav>

        {/* Hero Section */}
        <section className="details-hero">
          <div className="wrap details-hero__grid">
            <div className="details-gallery">
              <div className="details-gallery__main">
                <img
                  src={activeImage}
                  alt={product.name}
                  onError={(e) => {
                    if (e.currentTarget.src !== PLACEHOLDER_IMAGE) {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = PLACEHOLDER_IMAGE;
                    }
                  }}
                />
              </div>
            </div>

            <div className="details-summary">
              <h1>{product.name}</h1>
              <p className="details-summary__description">{product.description}</p>
              <div className="details-summary__actions">
                {product.website_link === "contact" ? (
                  <Link
                    to="/contact"
                    className="btn btn--mint details-summary__button"
                  >
                    Order
                  </Link>
                ) : (
                  <a
                    href={product.website_link || "https://castbull.co.in/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--mint details-summary__button"
                  >
                    Order
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="details-related">
            <div className="wrap">
              <div className="details-section-head">
                <p className="eyebrow">Explore More</p>
                <h2>Related products.</h2>
              </div>
              <div className="details-related__grid">
                {related.map((item) => (
                  <Link
                    className="details-related-card"
                    to={`/products/${encodeURIComponent(item.id)}`}
                    key={item.id}
                    aria-label={`View details for ${item.name}`}
                  >
                    <div className="details-related-card__image">
                      <img
                        src={
                          (item.images && item.images[0]) ||
                          item.image ||
                          PLACEHOLDER_IMAGE
                        }
                        alt={item.name}
                        onError={(e) => {
                          if (e.currentTarget.src !== PLACEHOLDER_IMAGE) {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = PLACEHOLDER_IMAGE;
                          }
                        }}
                      />
                    </div>
                    <div className="details-related-card__body">
                      <p>{item.category}</p>
                      <h3>{item.name}</h3>
                      <span>
                        View details <ArrowIcon />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
