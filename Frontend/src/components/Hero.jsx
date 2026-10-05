import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Hero.css";
import heroBg from "../assets/saaluvesa_export_bg.jpg";
import { api, assetUrl } from "../lib/api.js";

const DEFAULT_BANNER = {
  eyebrow: "Welcome to SAALUVESA ENTERPRISES PRIVATE LIMITED",
  headline: "Crafting Custom Apparel",
  headline_highlight: "for the World.",
  sub: "Now we concentrate on the textile and garment sector, with a strategic focus on the export of custom-printed T-shirts and apparel. Our mission is to deliver high-quality, tailor-made clothing solutions that meet diverse customer requirements across global markets.",
  notice_text_before: "Requested to proceed with our Integrated Customer-friendly Apparel Brand Website, ",
  notice_link_url: "https://castbull.co.in/",
  notice_link_text: "https://castbull.co.in/",
  notice_text_after: ", to place all your plain apparel, custom printing, and private label branding requirements.",
  links: [
    {
      id: "default-1",
      type: "custom",
      url: "https://castbull.co.in/",
      text: "https://castbull.co.in/",
    },
  ],
  badge1_num: "100%",
  badge1_label: "Tailor-Made Solutions",
  badge2_num: "Global",
  badge2_label: "Export & Delivery",
  image_url: "",
};

export default function Hero() {
  const [banner, setBanner] = useState(DEFAULT_BANNER);

  useEffect(() => {
    let active = true;
    api("/banner")
      .then((data) => {
        if (active && data && typeof data === "object") {
          setBanner((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {
        // Fallback to default gracefully
      });
    return () => {
      active = false;
    };
  }, []);

  const bgImage = banner.image_url ? assetUrl(banner.image_url) : heroBg;

  const renderedLinks =
    Array.isArray(banner.links) && banner.links.length > 0
      ? banner.links.filter((l) => l && l.url)
      : banner.notice_link_url
      ? [
          {
            id: "default-1",
            url: banner.notice_link_url,
            text: banner.notice_link_text || banner.notice_link_url,
          },
        ]
      : [];

  const heroStyle = {
    backgroundImage: [
      "radial-gradient(50% 60% at 85% 15%, rgba(121, 246, 194, 0.15), transparent 70%)",
      "linear-gradient(105deg, rgba(5, 10, 60, 0.94) 0%, rgba(5, 10, 60, 0.85) 45%, rgba(7, 16, 91, 0.70) 100%)",
      `url(${bgImage})`,
    ].join(", "),
  };

  return (
    <section id="home" className="hero" style={heroStyle}>
      {/* signature stitch-line decoration */}
      <svg className="hero__stitch" viewBox="0 0 600 600" aria-hidden="true">
        <line
          x1="520" y1="0" x2="60" y2="600"
          stroke="var(--color-mint)" strokeOpacity="0.35"
          strokeWidth="2" strokeDasharray="10 10"
        />
        <line
          x1="600" y1="80" x2="140" y2="600"
          stroke="var(--color-mint)" strokeOpacity="0.2"
          strokeWidth="2" strokeDasharray="10 10"
        />
      </svg>

      <div className="hero__inner">
        <div className="hero__copy-col">
          <div className="hero__copy">
            <div className="eyebrow hero__eyebrow stitch-line">
              {banner.eyebrow}
            </div>

            <h1 className="hero__headline">
              {banner.headline} {banner.headline_highlight && <span>{banner.headline_highlight}</span>}
            </h1>

            <p className="hero__sub">
              {banner.sub}
            </p>

            <div className="hero__notice-card">
              <div className="hero__notice-icon-box" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                  <polyline points="3.29 7 12 12 20.71 7" />
                  <line x1="12" y1="22" x2="12" y2="12" />
                </svg>
              </div>
              <div className="hero__notice-content">
                <p className="hero__notice-text">
                  {banner.notice_text_before}
                  {renderedLinks.map((lnk, idx) => {
                    const isInternal = lnk.url.startsWith("/") && !lnk.url.startsWith("//");
                    return (
                      <React.Fragment key={lnk.id || idx}>
                        {idx > 0 && ", "}
                        {isInternal ? (
                          <Link to={lnk.url} className="hero__notice-link">
                            {lnk.text || lnk.url}
                          </Link>
                        ) : (
                          <a
                            href={lnk.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hero__notice-link"
                          >
                            {lnk.text || lnk.url}
                            <svg
                              className="hero__notice-external-icon"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {banner.notice_text_after}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — fabric visual showcase */}
        <div className="hero__visual" aria-hidden="true">
          <img src={bgImage} alt="Apparel and Textile Manufacturing" className="hero__visual-img" />
          <div className="hero__visual-overlay" />
          {/* floating stat badges */}
          {(banner.badge1_num || banner.badge1_label) && (
            <div className="hero__badge hero__badge--tl">
              {banner.badge1_num && <span className="hero__badge-num">{banner.badge1_num}</span>}
              {banner.badge1_label && <span className="hero__badge-label">{banner.badge1_label}</span>}
            </div>
          )}
          {(banner.badge2_num || banner.badge2_label) && (
            <div className="hero__badge hero__badge--br">
              {banner.badge2_num && <span className="hero__badge-num">{banner.badge2_num}</span>}
              {banner.badge2_label && <span className="hero__badge-label">{banner.badge2_label}</span>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
