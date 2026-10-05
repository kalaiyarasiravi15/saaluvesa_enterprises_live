import { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../lib/api.js";
import { Icon } from "./icons.jsx";
import "./BannerAdmin.css";

const API_BASE = import.meta.env.VITE_ADMIN_API_URL || "http://localhost:3000/api";

function assetUrl(path) {
  if (!path) return "";
  try {
    const origin = API_BASE.replace(/\/api\/?$/, "");
    return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
  } catch {
    return path;
  }
}

const PAGE_PRESETS = [
  { label: "External Website URL", value: "custom", defaultUrl: "https://", defaultText: "" },
  { label: "Contact Us Page (/contact)", value: "/contact", defaultUrl: "/contact", defaultText: "Contact Us" },
];

export default function BannerAdmin() {
  const { pushToast } = useOutletContext();

  const [form, setForm] = useState({
    eyebrow: "",
    headline: "",
    headline_highlight: "",
    sub: "",
    notice_text_before: "",
    notice_text_after: "",
    badge1_num: "",
    badge1_label: "",
    badge2_num: "",
    badge2_label: "",
    image_url: "",
  });

  const [links, setLinks] = useState([
    {
      id: "link-1",
      type: "custom",
      url: "https://castbull.co.in/",
      text: "https://castbull.co.in/",
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api("/admin/banner");
      if (data) {
        setForm({
          eyebrow: data.eyebrow || "",
          headline: data.headline || "",
          headline_highlight: data.headline_highlight || "",
          sub: data.sub || "",
          notice_text_before: data.notice_text_before || "",
          notice_text_after: data.notice_text_after || "",
          badge1_num: data.badge1_num || "",
          badge1_label: data.badge1_label || "",
          badge2_num: data.badge2_num || "",
          badge2_label: data.badge2_label || "",
          image_url: data.image_url || "",
        });

        if (Array.isArray(data.links) && data.links.length > 0) {
          setLinks(
            data.links.map((l) => ({
              id: l.id || crypto.randomUUID(),
              type: PAGE_PRESETS.some((p) => p.value === l.url) ? l.url : "custom",
              url: l.url || "",
              text: l.text || "",
            }))
          );
        } else if (data.notice_link_url) {
          setLinks([
            {
              id: "link-1",
              type: PAGE_PRESETS.some((p) => p.value === data.notice_link_url) ? data.notice_link_url : "custom",
              url: data.notice_link_url,
              text: data.notice_link_text || data.notice_link_url,
            },
          ]);
        }

        setRemoveImage(false);
        setSelectedFile(null);
        setPreviewUrl("");
        setFieldErrors({});
      }
    } catch (err) {
      pushToast("error", err.message || "Failed to load banner settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setRemoveImage(false);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Links Management ───────────────────────────────────────
  const addLink = () => {
    setLinks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "custom",
        url: "",
        text: "",
      },
    ]);
  };

  const removeLink = (idToRemove) => {
    if (links.length <= 1) {
      pushToast("error", "At least one callout link is required.");
      return;
    }
    setLinks((prev) => prev.filter((l) => l.id !== idToRemove));
  };

  const updateLinkType = (idToUpdate, newType) => {
    const preset = PAGE_PRESETS.find((p) => p.value === newType);
    setLinks((prev) =>
      prev.map((l) => {
        if (l.id !== idToUpdate) return l;
        if (newType === "custom") {
          return { ...l, type: "custom", url: l.url.startsWith("http") ? l.url : "https://", text: l.text || "" };
        }
        return {
          ...l,
          type: newType,
          url: preset?.defaultUrl || newType,
          text: l.text || preset?.defaultText || "",
        };
      })
    );
  };

  const updateLinkField = (idToUpdate, field, val) => {
    setLinks((prev) =>
      prev.map((l) => (l.id === idToUpdate ? { ...l, [field]: val } : l))
    );
  };

  // ── Validation ─────────────────────────────────────────────
  const validate = () => {
    const errors = {};
    if (!form.eyebrow.trim()) errors.eyebrow = "Top Eyebrow / Tagline is required.";
    if (!form.headline.trim()) errors.headline = "Headline (White text) is required.";
    if (!form.headline_highlight.trim()) errors.headline_highlight = "Headline Highlight is required.";
    if (!form.sub.trim()) errors.sub = "Description paragraph is required.";
    if (!form.notice_text_before.trim()) errors.notice_text_before = "Notice text before link is required.";
    if (!form.badge1_num.trim() || !form.badge1_label.trim()) errors.badge1 = "Badge 1 number and label are required.";
    if (!form.badge2_num.trim() || !form.badge2_label.trim()) errors.badge2 = "Badge 2 number and label are required.";

    const invalidLink = links.find((l) => !l.url.trim() || !l.text.trim());
    if (invalidLink) {
      errors.links = "All links must have both a Target URL and a Display Text.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Save ───────────────────────────────────────────────────
  const save = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) {
      pushToast("error", "Please fill in all required fields marked with *");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("eyebrow", form.eyebrow.trim());
      formData.append("headline", form.headline.trim());
      formData.append("headline_highlight", form.headline_highlight.trim());
      formData.append("sub", form.sub.trim());
      formData.append("notice_text_before", form.notice_text_before);
      formData.append("notice_text_after", form.notice_text_after);
      formData.append("badge1_num", form.badge1_num.trim());
      formData.append("badge1_label", form.badge1_label.trim());
      formData.append("badge2_num", form.badge2_num.trim());
      formData.append("badge2_label", form.badge2_label.trim());

      // Pass links as clean JSON string
      const cleanLinks = links.map((l) => ({
        id: l.id,
        type: l.type,
        url: l.url.trim(),
        text: l.text.trim(),
      }));
      formData.append("links", JSON.stringify(cleanLinks));

      if (cleanLinks[0]) {
        formData.append("notice_link_url", cleanLinks[0].url);
        formData.append("notice_link_text", cleanLinks[0].text);
      }

      if (selectedFile) {
        formData.append("image", selectedFile);
      } else if (removeImage) {
        formData.append("remove_image", "true");
      }

      const updated = await api("/admin/banner", {
        method: "PUT",
        body: formData,
      });

      setForm({
        eyebrow: updated.eyebrow || "",
        headline: updated.headline || "",
        headline_highlight: updated.headline_highlight || "",
        sub: updated.sub || "",
        notice_text_before: updated.notice_text_before || "",
        notice_text_after: updated.notice_text_after || "",
        badge1_num: updated.badge1_num || "",
        badge1_label: updated.badge1_label || "",
        badge2_num: updated.badge2_num || "",
        badge2_label: updated.badge2_label || "",
        image_url: updated.image_url || "",
      });

      setSelectedFile(null);
      setPreviewUrl("");
      setRemoveImage(false);
      setFieldErrors({});
      pushToast("success", "Home banner updated successfully! The live website is updated.");
    } catch (err) {
      pushToast("error", err.message || "Failed to save banner.");
    } finally {
      setSaving(false);
    }
  };

  const displayImg = previewUrl || (removeImage ? "" : (form.image_url ? assetUrl(form.image_url) : ""));

  return (
    <div className="admin-page banner-admin-page notranslate" translate="no">
      {/* Top Header */}
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Website Content</p>
          <h2>Home Banner</h2>
        </div>
        <div className="admin-page-heading__actions">
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={save}
            disabled={saving || loading}
          >
            <Icon name="check" size={16} />
            <span>{saving ? "Saving…" : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-card" style={{ padding: 48, textAlign: "center" }}>
          <p className="admin-muted">Loading banner settings…</p>
        </div>
      ) : (
        <form className="admin-form banner-admin-form" onSubmit={save} style={{ display: "grid", gap: 24 }}>
          {/* Card 1: Headings & Description */}
          <div className="admin-card" style={{ display: "grid", gap: 22 }}>
            <div className="admin-card__head">
              <div>
                <h3 style={{ margin: 0, color: "var(--admin-navy)" }}>Banner Headings &amp; Text</h3>
                <p className="admin-muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                  Headline and mission paragraph shown prominently to every visitor. All fields are required.
                </p>
              </div>
            </div>

            {/* Eyebrow */}
            <div className="admin-field">
              <div className="banner-field-header">
                <label className="banner-field-label" htmlFor="banner-eyebrow">
                  Top Eyebrow / Tagline <span className="admin-req-star">*</span>
                </label>
                <span className={`banner-char-counter ${form.eyebrow.length > 110 ? "banner-char-counter--limit" : form.eyebrow.length > 90 ? "banner-char-counter--warn" : ""}`}>
                  {form.eyebrow.length} / 120
                </span>
              </div>
              <input
                id="banner-eyebrow"
                maxLength={120}
                className={fieldErrors.eyebrow ? "banner-input--error" : ""}
                value={form.eyebrow}
                onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
                placeholder="WELCOME TO SAALUVESA ENTERPRISES PRIVATE LIMITED"
              />
              {fieldErrors.eyebrow && <span className="banner-error-msg">{fieldErrors.eyebrow}</span>}
            </div>

            {/* Headline and Highlight */}
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
              <div className="admin-field">
                <div className="banner-field-header">
                  <label className="banner-field-label" htmlFor="banner-headline">
                    Headline (White text) <span className="admin-req-star">*</span>
                  </label>
                  <span className={`banner-char-counter ${form.headline.length > 90 ? "banner-char-counter--limit" : ""}`}>
                    {form.headline.length} / 100
                  </span>
                </div>
                <input
                  id="banner-headline"
                  maxLength={100}
                  className={fieldErrors.headline ? "banner-input--error" : ""}
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  placeholder="Crafting Custom Apparel"
                />
                {fieldErrors.headline && <span className="banner-error-msg">{fieldErrors.headline}</span>}
              </div>

              <div className="admin-field">
                <div className="banner-field-header">
                  <label className="banner-field-label" htmlFor="banner-headline-highlight">
                    Headline Highlight (Mint text) <span className="admin-req-star">*</span>
                  </label>
                  <span className={`banner-char-counter ${form.headline_highlight.length > 70 ? "banner-char-counter--limit" : ""}`}>
                    {form.headline_highlight.length} / 80
                  </span>
                </div>
                <input
                  id="banner-headline-highlight"
                  maxLength={80}
                  className={fieldErrors.headline_highlight ? "banner-input--error" : ""}
                  value={form.headline_highlight}
                  onChange={(e) => setForm({ ...form, headline_highlight: e.target.value })}
                  placeholder="for the World."
                />
                {fieldErrors.headline_highlight && <span className="banner-error-msg">{fieldErrors.headline_highlight}</span>}
              </div>
            </div>

            {/* Description */}
            <div className="admin-field">
              <div className="banner-field-header">
                <label className="banner-field-label" htmlFor="banner-sub">
                  Description / Subtitle Paragraph <span className="admin-req-star">*</span>
                </label>
                <span className={`banner-char-counter ${form.sub.length > 550 ? "banner-char-counter--limit" : form.sub.length > 480 ? "banner-char-counter--warn" : ""}`}>
                  {form.sub.length} / 600
                </span>
              </div>
              <textarea
                id="banner-sub"
                rows={4}
                maxLength={600}
                className={fieldErrors.sub ? "banner-input--error" : ""}
                value={form.sub}
                onChange={(e) => setForm({ ...form, sub: e.target.value })}
                placeholder="Detailed mission and export summary..."
              />
              {fieldErrors.sub && <span className="banner-error-msg">{fieldErrors.sub}</span>}
            </div>
          </div>

          {/* Card 2: Notice Card & Multiple Action Links */}
          <div className="admin-card" style={{ display: "grid", gap: 20 }}>
            <div className="admin-card__head">
              <div>
                <h3 style={{ margin: 0, color: "var(--admin-navy)" }}>Callout Notice &amp; Multiple Links</h3>
                <p className="admin-muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                  Highlighted notice card pointing visitors to your apparel store or contact page. Add multiple links with the + icon.
                </p>
              </div>
            </div>

            {/* Notice Lead Text */}
            <div className="admin-field">
              <div className="banner-field-header">
                <label className="banner-field-label" htmlFor="notice-before">
                  Text Preceding Link <span className="admin-req-star">*</span>
                </label>
                <span className={`banner-char-counter ${form.notice_text_before.length > 220 ? "banner-char-counter--limit" : ""}`}>
                  {form.notice_text_before.length} / 250
                </span>
              </div>
              <input
                id="notice-before"
                maxLength={250}
                className={fieldErrors.notice_text_before ? "banner-input--error" : ""}
                value={form.notice_text_before}
                onChange={(e) => setForm({ ...form, notice_text_before: e.target.value })}
                placeholder="Requested to proceed with our Integrated Customer-friendly Apparel Brand Website, "
              />
              {fieldErrors.notice_text_before && <span className="banner-error-msg">{fieldErrors.notice_text_before}</span>}
            </div>

            {/* Multiple Links List */}
            <div style={{ display: "grid", gap: 14 }}>
              <div className="banner-links-header">
                <div>
                  <h4 style={{ margin: 0, color: "var(--admin-navy)", fontSize: "0.95rem" }}>
                    Action Links ({links.length})
                  </h4>
                  <span className="admin-muted" style={{ fontSize: 12 }}>
                    Choose an internal website page or enter an external website URL.
                  </span>
                </div>
                <button
                  type="button"
                  className="admin-btn admin-btn--soft admin-btn--sm"
                  onClick={addLink}
                >
                  <Icon name="plus" size={15} />
                  <span>+ Add Another Link</span>
                </button>
              </div>

              {fieldErrors.links && <span className="banner-error-msg">{fieldErrors.links}</span>}

              <div className="banner-links-list">
                {links.map((link, idx) => (
                  <div className="banner-link-card" key={link.id}>
                    <div className="banner-link-card__top">
                      <span className="banner-link-badge">Link #{idx + 1}</span>
                      {links.length > 1 && (
                        <button
                          type="button"
                          className="admin-btn admin-btn--soft admin-btn--sm"
                          style={{ color: "var(--admin-danger)", padding: "4px 8px" }}
                          onClick={() => removeLink(link.id)}
                          title="Remove this link"
                        >
                          <Icon name="trash" size={14} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="banner-link-grid">
                      {/* Dropdown: Link Type */}
                      <div className="admin-field">
                        <label className="banner-field-label">Target Page / Type</label>
                        <select
                          value={link.type}
                          onChange={(e) => updateLinkType(link.id, e.target.value)}
                        >
                          {PAGE_PRESETS.map((preset) => (
                            <option key={preset.value} value={preset.value}>
                              {preset.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Target URL */}
                      <div className="admin-field">
                        <label className="banner-field-label">
                          Target URL <span className="admin-req-star">*</span>
                        </label>
                        <input
                          value={link.url}
                          onChange={(e) => updateLinkField(link.id, "url", e.target.value)}
                          placeholder="https://castbull.co.in/ or /contact"
                        />
                      </div>

                      {/* Display Text */}
                      <div className="admin-field">
                        <label className="banner-field-label">
                          Display Text <span className="admin-req-star">*</span>
                        </label>
                        <input
                          value={link.text}
                          onChange={(e) => updateLinkField(link.id, "text", e.target.value)}
                          placeholder="e.g. https://castbull.co.in/ or Contact Us"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notice Trailing Text */}
            <div className="admin-field">
              <div className="banner-field-header">
                <label className="banner-field-label" htmlFor="notice-after">
                  Text Following Links
                </label>
                <span className={`banner-char-counter ${form.notice_text_after.length > 220 ? "banner-char-counter--limit" : ""}`}>
                  {form.notice_text_after.length} / 250
                </span>
              </div>
              <input
                id="notice-after"
                maxLength={250}
                value={form.notice_text_after}
                onChange={(e) => setForm({ ...form, notice_text_after: e.target.value })}
                placeholder=", to place all your plain apparel, custom printing, and private label branding requirements."
              />
            </div>
          </div>

          {/* Card 3: Floating Badges & Visual Image */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Stat Badges */}
            <div className="admin-card" style={{ display: "grid", gap: 18 }}>
              <div className="admin-card__head">
                <div>
                  <h3 style={{ margin: 0, color: "var(--admin-navy)" }}>Floating Stat Badges</h3>
                  <p className="admin-muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                    Badges positioned over the visual image. Both fields are required.
                  </p>
                </div>
              </div>

              {/* Badge 1 */}
              <div style={{ border: "1.5px solid var(--admin-line)", padding: 14, borderRadius: 14, background: "var(--admin-ivory)" }}>
                <p style={{ fontWeight: 700, fontSize: 12, margin: "0 0 10px", color: "var(--admin-navy)" }}>
                  Badge 1 (Top-Left) <span className="admin-req-star">*</span>
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 10 }}>
                  <input
                    maxLength={30}
                    value={form.badge1_num}
                    onChange={(e) => setForm({ ...form, badge1_num: e.target.value })}
                    placeholder="100%"
                  />
                  <input
                    maxLength={50}
                    value={form.badge1_label}
                    onChange={(e) => setForm({ ...form, badge1_label: e.target.value })}
                    placeholder="Tailor-Made Solutions"
                  />
                </div>
              </div>

              {/* Badge 2 */}
              <div style={{ border: "1.5px solid var(--admin-line)", padding: 14, borderRadius: 14, background: "var(--admin-ivory)" }}>
                <p style={{ fontWeight: 700, fontSize: 12, margin: "0 0 10px", color: "var(--admin-navy)" }}>
                  Badge 2 (Bottom-Right) <span className="admin-req-star">*</span>
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 10 }}>
                  <input
                    maxLength={30}
                    value={form.badge2_num}
                    onChange={(e) => setForm({ ...form, badge2_num: e.target.value })}
                    placeholder="Global"
                  />
                  <input
                    maxLength={50}
                    value={form.badge2_label}
                    onChange={(e) => setForm({ ...form, badge2_label: e.target.value })}
                    placeholder="Export & Delivery"
                  />
                </div>
              </div>
              {(fieldErrors.badge1 || fieldErrors.badge2) && (
                <span className="banner-error-msg">Both stat badges (numbers &amp; labels) are required.</span>
              )}
            </div>

            {/* Visual Image */}
            <div className="admin-card" style={{ display: "grid", gap: 16 }}>
              <div className="admin-card__head">
                <div>
                  <h3 style={{ margin: 0, color: "var(--admin-navy)" }}>Banner Visual Image</h3>
                  <p className="admin-muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                    Right-side showcase image (defaults to warehouse export background).
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                {displayImg ? (
                  <div style={{ position: "relative", width: 140, height: 95, borderRadius: 12, overflow: "hidden", border: "1.5px solid var(--admin-line)", flexShrink: 0 }}>
                    <img src={displayImg} alt="Banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : (
                  <div style={{ width: 140, height: 95, borderRadius: 12, background: "var(--admin-navy)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, textAlign: "center", padding: 10, flexShrink: 0 }}>
                    Default Export Visual
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label className="admin-btn admin-btn--soft admin-btn--sm" style={{ cursor: "pointer", width: "fit-content" }}>
                    <Icon name="upload" size={14} />
                    <span>Upload new image</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/webp"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                  </label>

                  {(form.image_url || selectedFile) && (
                    <button
                      type="button"
                      className="admin-btn admin-btn--soft admin-btn--sm"
                      style={{ color: "var(--admin-danger)", width: "fit-content" }}
                      onClick={handleRemoveImage}
                    >
                      Reset to default image
                    </button>
                  )}
                  <span className="admin-muted" style={{ fontSize: 11 }}>JPG, PNG, or WebP up to 10 MB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Mini Preview */}
          <div className="banner-preview-card">
            <p className="banner-preview-eyebrow">
              Live Website Preview
            </p>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                {form.eyebrow || "WELCOME TO SAALUVESA ENTERPRISES PRIVATE LIMITED"}
              </div>
              <h2 className="banner-preview-headline">
                {form.headline || "Crafting Custom Apparel"}{" "}
                <span className="banner-preview-highlight">{form.headline_highlight || "for the World."}</span>
              </h2>
              <p className="banner-preview-sub">
                {form.sub}
              </p>

              <div className="banner-preview-notice">
                <div className="banner-preview-notice-icon">
                  <Icon name="package" size={18} />
                </div>
                <div>
                  <span>{form.notice_text_before} </span>
                  <span className="banner-preview-links">
                    {links.map((link, idx) => (
                      <span key={link.id || idx}>
                        {idx > 0 && <span style={{ color: "rgba(255,255,255,0.5)", margin: "0 4px" }}>·</span>}
                        <span className="banner-preview-link-item">{link.text || link.url || "Link"}</span>
                      </span>
                    ))}
                  </span>
                  <span> {form.notice_text_after}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingBottom: 24 }}>
            <button
              type="button"
              className="admin-btn admin-btn--soft"
              onClick={load}
              disabled={saving}
            >
              Reset to Saved
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={saving}
            >
              <Icon name="check" size={16} />
              <span>{saving ? "Saving…" : "Save Changes"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
