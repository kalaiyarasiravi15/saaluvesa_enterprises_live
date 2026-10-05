import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./Labels.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || "http://localhost:5175";

function imageUrl(pathVal) {
  if (!pathVal) return "";
  try {
    const base = new URL(API_BASE, window.location.origin);
    return new URL(pathVal, base.origin).href;
  } catch {
    return pathVal;
  }
}

export default function Labels() {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const [downloading, setDownloading] = useState(null);

  const fetchLabels = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`${API_BASE}/labels?page=${page}&search=${encodeURIComponent(search)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setLabels(data.items || []);
        setTotal(data.total || 0);
      })
      .catch((err) => setError(err.message || "Could not load labels."))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    const timer = setTimeout(fetchLabels, 300);
    return () => clearTimeout(timer);
  }, [fetchLabels]);

  const openLabel = (label) => {
    setDownloading(label.id);
    window.open(`${ADMIN_URL}/labels/${label.id}/edit`, "_blank");
    setTimeout(() => setDownloading(null), 1000);
  };

  return (
    <div className="labels-page">
      <Header />
      <main className="labels-main wrap">

        {/* Page header */}
        <div className="labels-page-header">
          <div>
            <span className="eyebrow">Label Studio</span>
            <h1 className="labels-page-title">Created Labels</h1>
            <p className="labels-page-sub">
              Browse all saved export labels. Download as image or open in the label editor.
            </p>
          </div>
          <a
            href={`${ADMIN_URL}/labels`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--mint labels-create-btn"
          >
            + Create Label
          </a>
        </div>

        {/* Search bar */}
        <div className="labels-search-row">
          <input
            type="search"
            className="labels-search-input"
            placeholder="Search labels…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          {!loading && total > 0 && (
            <span className="labels-total">{total} label{total !== 1 ? "s" : ""}</span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="labels-error">
            <p>{error}</p>
            <button className="btn btn--outline-dark" onClick={fetchLabels}>Retry</button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="labels-loading">
            <div className="labels-spinner" />
            <p>Loading labels…</p>
          </div>

        /* Empty */
        ) : !labels.length ? (
          <div className="labels-empty">
            <div className="labels-empty__icon">🏷️</div>
            <h3>{search ? "No labels match your search." : "No labels created yet."}</h3>
            <p>{search ? "Try a different search term." : "Create your first label in the admin dashboard."}</p>
            <a href={`${ADMIN_URL}/labels`} target="_blank" rel="noopener noreferrer" className="btn btn--mint">
              + Create Label
            </a>
          </div>

        /* Grid */
        ) : (
          <div className="labels-grid">
            {labels.map((label) => {
              let rawSec = label.sections;
              if (typeof rawSec === "string") {
                try { rawSec = JSON.parse(rawSec); } catch { rawSec = []; }
              }
              const sections = Array.isArray(rawSec) ? rawSec : [];

              return (
              <article className="label-card-front" key={label.id}>

                {/* Navy header bar */}
                <div className="label-card-front__header">
                  <h2>{label.title}</h2>
                  <span className="label-card-front__badge">
                    {sections.length} sec{sections.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Section previews */}
                <div className="label-card-front__body">
                  {sections.slice(0, 2).map((sec, si) => (
                    <div className="label-card-front__section" key={sec.id || si}>
                      <div className="label-card-front__section-head">
                        {sec.logoPath && (
                          <img
                            className="label-card-front__logo"
                            src={imageUrl(sec.logoPath)}
                            alt=""
                            loading="lazy"
                          />
                        )}
                        <div>
                          <p className="label-card-front__heading">{sec.heading}</p>
                          {sec.subHeading && (
                            <p className="label-card-front__subheading">{sec.subHeading}</p>
                          )}
                        </div>
                        {sec.rightLogoPath && (
                          <img
                            className="label-card-front__logo"
                            src={imageUrl(sec.rightLogoPath)}
                            alt=""
                            loading="lazy"
                          />
                        )}
                      </div>

                      {/* Numbered rows */}
                      {sec.rows?.filter((r) => r.key || r.value).slice(0, 4).map((row, ri) => (
                        <div className="label-card-front__row" key={row.id || ri}>
                          <span className="label-card-front__num">{ri + 1}</span>
                          <span className="label-card-front__key">{row.key}</span>
                          <span className="label-card-front__arrow">→</span>
                          <span className="label-card-front__val">{row.value}</span>
                        </div>
                      ))}
                      {sec.rows?.filter((r) => r.key || r.value).length > 4 && (
                        <p className="label-card-front__more">
                          +{sec.rows.filter((r) => r.key || r.value).length - 4} more rows
                        </p>
                      )}
                    </div>
                  ))}
                  {(label.sections?.length || 0) > 2 && (
                    <p className="label-card-front__more-sec">
                      +{label.sections.length - 2} more section{label.sections.length - 2 !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                {/* Footer: date + action icons */}
                <div className="label-card-front__footer">
                  <span className="label-card-front__date">
                    {new Date(label.updatedAt).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </span>
                  <div className="label-card-front__actions">
                    <a
                      href={`${ADMIN_URL}/labels/${label.id}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="label-front-action-btn label-front-action-btn--edit"
                      title="Edit label"
                      aria-label={`Edit ${label.title}`}
                    >✏️</a>
                    <button
                      className="label-front-action-btn label-front-action-btn--dl"
                      title="Open to download PNG"
                      aria-label={`Download ${label.title}`}
                      disabled={downloading === label.id}
                      onClick={() => openLabel(label)}
                    >{downloading === label.id ? "…" : "⬇️"}</button>
                  </div>
                </div>
              </article>
            );
          })}
          </div>
        )}

        {/* Pagination */}
        {total > pageSize && (
          <div className="labels-pagination">
            <button
              className="btn btn--outline-dark"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >← Previous</button>
            <span className="labels-page-info">Page {page} of {Math.ceil(total / pageSize)}</span>
            <button
              className="btn btn--outline-dark"
              disabled={page * pageSize >= total || loading}
              onClick={() => setPage((p) => p + 1)}
            >Next →</button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
