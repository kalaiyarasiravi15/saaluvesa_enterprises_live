import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api.js";
import { LANGUAGES } from "../../data/languages.js";
import { Icon } from "../icons.jsx";
import LabelCanvas from "./LabelCanvas.jsx";
import {
  exportPng,
  exportPdf,
  filenameFor,
  getLabelTranslationCode,
  imageUrl,
  LABEL_HEADER_TRANSLATIONS,
  newLabel,
  newRow,
  newSection,
  resizeLogo,
  translateLabel,
  translateLabelAsync,
  validateDraft,
} from "./labelDocument.js";
import "./LabelStudio.css";

function sanitizeLabel(raw) {
  if (!raw || typeof raw !== "object") return newLabel();
  let sections = raw.sections;
  if (typeof sections === "string") {
    try {
      sections = JSON.parse(sections);
    } catch {
      sections = [];
    }
  }
  if (!Array.isArray(sections) || !sections.length) {
    sections = [newSection()];
  } else {
    sections = sections.map((sec) => {
      let rows = sec?.rows;
      if (typeof rows === "string") {
        try {
          rows = JSON.parse(rows);
        } catch {
          rows = [];
        }
      }
      return {
        ...sec,
        id: sec?.id || crypto.randomUUID(),
        heading: sec?.heading || "",
        fontSizePx: Number(sec?.fontSizePx) || 32,
        subHeading: sec?.subHeading || "",
        subFontSizePx: Number(sec?.subFontSizePx) || 20,
        logoPath: sec?.logoPath || null,
        rightLogoPath: sec?.rightLogoPath || null,
        rows:
          Array.isArray(rows) && rows.length
            ? rows.map((r) => ({
                id: r?.id || crypto.randomUUID(),
                key: r?.key || "",
                value: r?.value || "",
              }))
            : [newRow()],
      };
    });
  }
  return {
    ...raw,
    title: raw.title || "",
    sections,
  };
}

function getPreferredLabelLanguage() {
  try {
    const storedCode = localStorage.getItem("saalu_selected_lang");
    return LANGUAGES.find((item) => item.code === storedCode) || LANGUAGES[0];
  } catch {
    return LANGUAGES[0];
  }
}

export default function LabelStudio({ LanguageSelector }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Route-based view mode:
  // - /labels/new         -> Brand new label editor
  // - /labels/:id/edit    -> Existing label editor
  // - /labels             -> List view of all saved labels
  const isNew = location.pathname.endsWith("/new");
  const isEditing = Boolean(id);
  const isEditor = isNew || isEditing;

  // Draft state for editor
  const [draft, setDraft] = useState(() => sanitizeLabel(newLabel()));
  const [baseline, setBaseline] = useState(() => JSON.stringify(draft));
  const [language, setLanguage] = useState(getPreferredLabelLanguage);
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // List view state
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [list, setList] = useState({ items: [], total: 0, pageSize: 10 });
  const [listError, setListError] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [reload, setReload] = useState(0);
  const [loadedKey, setLoadedKey] = useState(null);

  // Styled confirmation modal (replaces window.confirm)
  const [confirmState, setConfirmState] = useState(null); // { title, message, danger }
  const confirmResolveRef = useRef(null);
  const pendingNavRef = useRef(null); // stores { link } for deferred navigation after confirm

  // Quick preview modal state
  const [previewModalLabel, setPreviewModalLabel] = useState(null);
  const [previewModalLang, setPreviewModalLang] = useState(getPreferredLabelLanguage);
  const modalPaperRef = useRef(null);

  const paper = useRef(null);
  const operation = useRef(false);
  const dirty = JSON.stringify(draft) !== baseline;
  const navigationState = useRef({ dirty, busy });
  const draftKey = `saaluvesa-label-draft-${id || (isNew ? "new" : "list")}`;
  navigationState.current = { dirty, busy, draftKey };

  // Multi-language live translation state for draft label
  const [translated, setTranslated] = useState(() => ({ ...draft, tableHeaderNo: "S.NO", tableHeaderField: "FIELD", tableHeaderDetail: "DETAIL" }));
  const [translating, setTranslating] = useState(false);
  const [translationRetry, setTranslationRetry] = useState(0);
  const code = getLabelTranslationCode(language);
  const translateForPreview = async (label, selectedLanguage) => {
    try {
      return await api("/admin/labels/translate", {
        method: "POST",
        body: JSON.stringify({ label, languageCode: getLabelTranslationCode(selectedLanguage) }),
      });
    } catch {
      try {
        return await translateLabelAsync(label, selectedLanguage);
      } catch {
        return translateLabel(label, selectedLanguage);
      }
    }
  };

  useEffect(() => {
    let active = true;
    const targetCode = getLabelTranslationCode(language);
    const headerTrans = LABEL_HEADER_TRANSLATIONS[targetCode] || LABEL_HEADER_TRANSLATIONS.en;

    if (targetCode === "en") {
      setTranslated({
        ...draft,
        tableHeaderNo: "S.NO",
        tableHeaderField: "FIELD",
        tableHeaderDetail: "DETAIL",
      });
      setTranslating(false);
      return () => { active = false; };
    }

    // Immediately update table headers so preview reflects the selected language without delay
    setTranslated((prev) => ({
      ...(prev || draft),
      tableHeaderNo: headerTrans.no,
      tableHeaderField: headerTrans.field,
      tableHeaderDetail: headerTrans.detail,
    }));
    setTranslating(true);

    const timer = setTimeout(async () => {
      try {
        const result = await translateForPreview(draft, language);
        if (active) {
          setTranslated(result);
          setError("");
        }
      } catch {
        if (active) {
          setTranslated((prev) => ({
            ...(prev || draft),
            tableHeaderNo: headerTrans.no,
            tableHeaderField: headerTrans.field,
            tableHeaderDetail: headerTrans.detail,
          }));
        }
      } finally {
        if (active) setTranslating(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [draft.title, JSON.stringify(draft.sections?.map((s) => ({ h: s.heading, sub: s.subHeading, rows: s.rows?.map((row) => [row.key, row.value]) }))), language, translationRetry, code]);

  // Sync draft row modifications, font sizes, and logos to translated preview immediately without re-triggering translation
  useEffect(() => {
    setTranslated((prev) => {
      if (!prev || !Array.isArray(prev.sections)) return prev;
      return {
        ...prev,
        sections: prev.sections.map((sec, idx) => {
          const draftSec = draft.sections?.[idx];
          if (!draftSec) return sec;
          return {
            ...sec,
            fontSizePx: draftSec.fontSizePx,
            subFontSizePx: draftSec.subFontSizePx,
            logoPath: draftSec.logoPath,
            rightLogoPath: draftSec.rightLogoPath,
            rows: draftSec.rows.map((draftRow, rowIndex) => {
              const translatedRow = sec.rows?.find((row) => row.id === draftRow.id) || sec.rows?.[rowIndex];
              return { ...draftRow, key: translatedRow?.key ?? draftRow.key, value: translatedRow?.value ?? draftRow.value };
            }),
          };
        }),
      };
    });
  }, [draft.sections]);

  // Modal translation state
  const [modalTranslated, setModalTranslated] = useState(null);
  const [modalTranslating, setModalTranslating] = useState(false);

  useEffect(() => {
    if (!previewModalLabel) {
      setModalTranslated(null);
      setModalTranslating(false);
      return;
    }
    let active = true;
    const modalCode = getLabelTranslationCode(previewModalLang);
    const headerTrans = LABEL_HEADER_TRANSLATIONS[modalCode] || LABEL_HEADER_TRANSLATIONS.en;

    if (modalCode === "en") {
      setModalTranslated({
        ...previewModalLabel,
        tableHeaderNo: "S.NO",
        tableHeaderField: "FIELD",
        tableHeaderDetail: "DETAIL",
      });
      setModalTranslating(false);
      return () => { active = false; };
    }

    setModalTranslated((prev) => ({
      ...(prev || previewModalLabel),
      tableHeaderNo: headerTrans.no,
      tableHeaderField: headerTrans.field,
      tableHeaderDetail: headerTrans.detail,
    }));
    setModalTranslating(true);

    const timer = window.setTimeout(async () => {
      try {
        const result = await translateForPreview(previewModalLabel, previewModalLang);
        if (active) setModalTranslated(result);
      } catch {
        if (active) {
          setModalTranslated((prev) => ({
            ...(prev || previewModalLabel),
            tableHeaderNo: headerTrans.no,
            tableHeaderField: headerTrans.field,
            tableHeaderDetail: headerTrans.detail,
          }));
        }
      } finally {
        if (active) setModalTranslating(false);
      }
    }, 200);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [previewModalLabel, previewModalLang, translationRetry]);

  const accept = useCallback((label) => {
    const sanitized = sanitizeLabel(label);
    setDraft(sanitized);
    setBaseline(JSON.stringify(sanitized));
  }, []);

  // Load editor label when route or id changes
  useEffect(() => {
    let current = true;
    const load = (saved) => {
      accept(saved);
      try {
        const cached = JSON.parse(sessionStorage.getItem(draftKey) || "null");
        if (
          cached &&
          typeof cached.title === "string" &&
          (Array.isArray(cached.sections) || typeof cached.sections === "string")
        ) {
          accept(cached);
          setNotice("Your unsaved draft was restored in this tab. Saving keeps the shared dashboard up to date.");
        }
      } catch {
        /* Storage may be unavailable */
      }
      setLoadedKey(draftKey);
    };

    if (!isEditor) {
      setLoading(false);
      setLoadError("");
      return;
    }

    if (isNew) {
      load(newLabel());
      setLoading(false);
      setLoadError("");
      return;
    }

    setLoading(true);
    setLoadError("");
    api(`/admin/labels/${id}`)
      .then((label) => {
        if (current) {
          load(label);
          setError("");
        }
      })
      .catch((err) => {
        if (current) setLoadError(err.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [id, isNew, isEditor, reload, accept, draftKey]);

  // Sync draft to sessionStorage when editing
  useEffect(() => {
    if (!isEditor || loadedKey !== draftKey || loading || loadError) return;
    try {
      if (dirty) sessionStorage.setItem(draftKey, JSON.stringify(draft));
      else sessionStorage.removeItem(draftKey);
    } catch {
      /* Storage quota */
    }
  }, [draft, dirty, draftKey, loadedKey, loading, loadError, isEditor]);

  const clearDraft = () => {
    try {
      sessionStorage.removeItem(draftKey);
    } catch {
      /* Storage quota */
    }
  };

  // Load saved labels list (always keep up to date)
  useEffect(() => {
    let current = true;
    setListLoading(true);
    const timer = setTimeout(() => {
      api(`/admin/labels?page=${page}&search=${encodeURIComponent(search)}`)
        .then((result) => {
          if (!current) return;
          if (!result.items.length && result.total > 0 && page > 1) {
            setPage(Math.max(1, Math.ceil(result.total / result.pageSize)));
            return;
          }
          setList(result);
          setListError("");
        })
        .catch((err) => {
          if (current) setListError(err.message);
        })
        .finally(() => {
          if (current) setListLoading(false);
        });
    }, 250);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [page, search, refresh]);

  // Unload / discard confirmation
  useEffect(() => {
    const beforeUnload = (event) => {
      if (navigationState.current.dirty || navigationState.current.busy) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const linkClick = (event) => {
      const link = event.target.closest?.("a[href]");
      if (!link || link.target === "_blank" || link.download || event.ctrlKey || event.metaKey || event.shiftKey || event.button > 0) return;
      if (link.href === window.location.href) return;
      if (navigationState.current.busy) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (navigationState.current.dirty) {
        event.preventDefault();
        event.stopPropagation();
        const targetHref = link.href;
        // Store pending nav and show styled confirmation modal
        pendingNavRef.current = targetHref;
        askConfirm("Unsaved Changes", "Discard your unsaved label changes? This cannot be undone.", false).then((ok) => {
          if (ok) {
            try { sessionStorage.removeItem(navigationState.current.draftKey); } catch { /* Storage */ }
            pendingNavRef.current = null;
            window.location.href = targetHref;
          } else {
            pendingNavRef.current = null;
          }
        });
      }
    };

    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", linkClick, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", linkClick, true);
    };
  }, []);

  const run = async (name, task) => {
    if (operation.current) return;
    operation.current = true;
    setBusy(name);
    setError("");
    setNotice("");
    try {
      await task();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      operation.current = false;
      setBusy("");
    }
  };

  // Opens the styled confirmation modal. Returns a Promise<boolean>.
  const askConfirm = (title, message, danger = false) =>
    new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmState({ title, message, danger });
    });

  const resolveConfirm = (result) => {
    setConfirmState(null);
    if (confirmResolveRef.current) {
      confirmResolveRef.current(result);
      confirmResolveRef.current = null;
    }
  };

  const canDiscardAsync = async () => {
    if (busy) return false;
    if (!dirty) return true;
    return askConfirm("Unsaved Changes", "Discard your unsaved label changes? This cannot be undone.", false);
  };

  const patchSection = (sectionId, change) =>
    setDraft((val) => ({
      ...val,
      sections: val.sections.map((s) => (s.id === sectionId ? { ...s, ...change } : s)),
    }));

  const patchRow = (section, rowId, change) =>
    patchSection(section.id, {
      rows: section.rows.map((r) => (r.id === rowId ? { ...r, ...change } : r)),
    });

  const startCreate = async () => {
    if (!(await canDiscardAsync())) return;
    clearDraft();
    accept(newLabel());
    setError("");
    setNotice("");
    setLoadError("");
    setLanguage(LANGUAGES[0]);
    navigate("/labels/new");
  };

  const backToList = async () => {
    if (!(await canDiscardAsync())) return;
    clearDraft();
    setError("");
    setNotice("");
    setLoadError("");
    navigate("/labels");
    setRefresh((v) => v + 1);
  };

  const reset = async () => {
    if (!(await canDiscardAsync())) return;
    clearDraft();
    accept(newLabel());
    setError("");
    setNotice("");
    setLoadError("");
    setLanguage(LANGUAGES[0]);
    if (id) {
      navigate("/labels/new");
    }
  };

  const edit = async (label) => {
    if (!(await canDiscardAsync())) return;
    clearDraft();
    setError("");
    setNotice("");
    setLanguage(LANGUAGES[0]);
    navigate(`/labels/${label.id}/edit`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  const save = () =>
    run("Saving", async () => {
      const problem = validateDraft(draft);
      if (problem) throw new Error(problem);
      const saved = await api(draft.id ? `/admin/labels/${draft.id}` : "/admin/labels", {
        method: draft.id ? "PUT" : "POST",
        body: JSON.stringify({
          title: draft.title,
          sections: draft.sections,
          revision: draft.revision,
        }),
      });
      clearDraft();
      accept(saved);
      setNotice("Label saved to the shared dashboard.");
      setRefresh((v) => v + 1);
      navigate(`/labels/${saved.id}/edit`, { replace: true });
    });

  const remove = async (label) => {
    const confirmed = await askConfirm(
      "Delete Label",
      `Permanently delete "${label.title}"? This cannot be undone.`,
      true
    );
    if (!confirmed) return;
    if (draft.id === label.id && !(await canDiscardAsync())) return;
    run("Deleting", async () => {
      await api(`/admin/labels/${label.id}`, {
        method: "DELETE",
        body: JSON.stringify({ revision: label.revision }),
      });
      if (draft.id === label.id) {
        clearDraft();
        accept(newLabel());
        navigate("/labels");
      }
      setRefresh((v) => v + 1);
      setNotice("Label deleted.");
    });
  };

  const upload = (sectionId, file, field = "logoPath") =>
    run(field === "rightLogoPath" ? "Uploading right logo" : "Uploading left logo", async () => {
      const blob = await resizeLogo(file);
      const form = new FormData();
      form.append("image", blob, "logo.webp");
      const result = await api("/admin/labels/logos", { method: "POST", body: form });
      patchSection(sectionId, { [field]: result.path });
    });


  const downloadDirectPng = async (label) => {
    setPreviewModalLabel(label);
    setPreviewModalLang(LANGUAGES[0]);
  };

  // -----------------------------------------------------------------
  // VIEW: LIST MODE (When visiting /labels)
  // -----------------------------------------------------------------
  if (!isEditor) {
    return (
      <div className="admin-page label-studio" translate="no">
        {/* Top Header matching Export Documents & Products */}
        <div className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">Warehouse &amp; export tags</p>
            <h2>Label Studio</h2>
          </div>
          <div className="admin-page-heading__actions">
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={startCreate}
            >
              <Icon name="plus" size={17} />
              <span>Create Label</span>
            </button>
          </div>
        </div>

        {notice && <div className="label-card label-notice-card" role="status">{notice}</div>}
        {error && <div className="label-message" role="alert">{error}</div>}

        {/* Main Table Card */}
        <div className="admin-card admin-card--table">
          <div className="label-toolbar">
            <div className="label-search-box">
              <Icon name="search" size={16} />
              <input
                type="search"
                aria-label="Search saved labels"
                placeholder="Search by label name, heading, or detail..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              {search && (
                <button
                  type="button"
                  className="admin-icon-btn"
                  style={{ width: 22, height: 22 }}
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <Icon name="x" size={12} />
                </button>
              )}
            </div>
            <div className="label-toolbar-meta">
              <span className="label-count-pill">
                {list.total} {list.total === 1 ? "label" : "labels"}
              </span>
              <button
                disabled={listLoading}
                className="admin-btn admin-btn--soft admin-btn--sm"
                onClick={() => setRefresh((v) => v + 1)}
                title="Refresh label list"
              >
                Refresh
              </button>
            </div>
          </div>

          {listError ? (
            <div className="label-message" role="alert" style={{ margin: 18 }}>
              {listError}{" "}
              <button
                className="admin-btn admin-btn--soft admin-btn--sm"
                onClick={() => setRefresh((v) => v + 1)}
              >
                Retry
              </button>
            </div>
          ) : listLoading ? (
            <div className="admin-empty" role="status">
              <div className="labels-spinner" style={{ margin: "0 auto 12px" }} />
              <p style={{ margin: 0, color: "var(--admin-ink-soft)" }}>Loading saved labels…</p>
            </div>
          ) : !list.items.length ? (
            <div className="admin-empty">
              <div className="admin-empty__icon">
                <Icon name={search ? "search" : "file-text"} size={26} />
              </div>
              <h3>{search ? "No labels match your search" : "No saved labels yet"}</h3>
              <p>
                {search
                  ? "Try searching with different keywords."
                  : "Design export labels, warehouse bin tags, and product stickers with custom typography, logos, and structured data."}
              </p>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={startCreate}
                style={{ marginTop: 8 }}
              >
                <Icon name="plus" size={16} />
                <span>Create your first label</span>
              </button>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Label Name</th>
                    <th>Heading &amp; Content</th>
                    <th>Logo</th>
                    <th>Sections &amp; Data</th>
                    <th>Last Updated</th>
                    <th className="th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((label) => {
                    let rawSec = label?.sections;
                    if (typeof rawSec === "string") {
                      try {
                        rawSec = JSON.parse(rawSec);
                      } catch {
                        rawSec = [];
                      }
                    }
                    const sections = Array.isArray(rawSec) ? rawSec : [];
                    const firstSection = sections[0] || {};
                    const totalRows = sections.reduce(
                      (acc, s) => {
                        const r = Array.isArray(s?.rows) ? s.rows : [];
                        return acc + r.filter((row) => row && (row.key || row.value)).length;
                      },
                      0
                    );
                    const logoImg = sections.find((s) => s?.logoPath)?.logoPath || sections.find((s) => s?.rightLogoPath)?.rightLogoPath;

                    return (
                      <tr key={label.id} className="admin-row">
                        <td>
                          <span className="cell-invoice-badge">
                            <Icon name="file-text" size={14} />
                            <strong>{label.title}</strong>
                          </span>
                          <small className="cell-meta-sub">ID #{label.id} · Rev #{label.revision || 1}</small>
                        </td>

                        <td>
                          <div style={{ fontWeight: 600, color: "var(--admin-navy)" }}>
                            {firstSection.heading || "—"}
                          </div>
                          {firstSection.subHeading && (
                            <small className="cell-meta-sub">{firstSection.subHeading}</small>
                          )}
                        </td>

                        <td>
                          {logoImg ? (
                            <img
                              className="label-table-logo-thumb"
                              src={imageUrl(logoImg)}
                              alt="logo"
                            />
                          ) : (
                            <span className="label-muted">—</span>
                          )}
                        </td>

                        <td>
                          <span className="label-table-badge">
                            {label.sections?.length || 0} {label.sections?.length === 1 ? "section" : "sections"}
                          </span>
                          <small className="cell-meta-sub" style={{ display: "block", marginTop: 3 }}>
                            {totalRows} data {totalRows === 1 ? "row" : "rows"}
                          </small>
                        </td>

                        <td>
                          <span>
                            {new Date(label.updatedAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <small className="cell-meta-sub">
                            {new Date(label.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </small>
                        </td>

                        <td className="th-actions">
                          <div className="label-table-actions">
                            <button
                              type="button"
                              className="admin-icon-btn"
                              title="Preview label"
                              aria-label={`Preview ${label.title}`}
                              onClick={() => downloadDirectPng(label)}
                            >
                              <Icon name="eye" size={16} />
                            </button>
                            <button
                              type="button"
                              className="admin-icon-btn"
                              title="Edit label in studio"
                              aria-label={`Edit ${label.title}`}
                              onClick={() => edit(label)}
                            >
                              <Icon name="pencil" size={15} />
                            </button>
                            <button
                              type="button"
                              className="admin-icon-btn"
                              title="Download label PNG"
                              aria-label={`Download ${label.title}`}
                              onClick={() => downloadDirectPng(label)}
                            >
                              <Icon name="download" size={15} />
                            </button>
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-btn--danger"
                              title="Delete label"
                              aria-label={`Delete ${label.title}`}
                              onClick={() => remove(label)}
                            >
                              <Icon name="trash" size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {list.total > list.pageSize && (
            <div className="admin-pagination" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="admin-pagination__nav"
                disabled={page === 1 || listLoading}
                onClick={() => setPage((v) => v - 1)}
              >
                <Icon name="chevron-left" size={15} />
                Prev
              </button>
              <div className="admin-pagination__pages">
                {Array.from({ length: Math.ceil(list.total / list.pageSize) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`admin-pagination__page${p === page ? " admin-pagination__page--active" : ""}`}
                    aria-current={p === page ? "page" : undefined}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="admin-pagination__nav"
                disabled={page * list.pageSize >= list.total || listLoading}
                onClick={() => setPage((v) => v + 1)}
              >
                Next
                <Icon name="chevron-right" size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Quick Preview & Download Modal */}
        {previewModalLabel && (
          <div className="label-modal-backdrop" onClick={() => setPreviewModalLabel(null)}>
            <div className="label-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="label-modal-header">
                <div>
                  <h3 style={{ margin: 0, color: "var(--admin-navy)" }}>{modalTranslated?.title || previewModalLabel.title}</h3>
                  <p className="label-muted" style={{ margin: "2px 0 0" }}>Live document preview &amp; PNG export</p>
                </div>
                <button
                  type="button"
                  className="admin-icon-btn"
                  onClick={() => setPreviewModalLabel(null)}
                  aria-label="Close modal"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <div className="label-modal-body">
                <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Language:</span>
                  <LanguageSelector
                    selectedLang={previewModalLang}
                    onSelectLang={(l) => { setModalTranslating(true); setPreviewModalLang(l); setTranslationRetry((value) => value + 1); }}
                  />
                </div>
                <div className="label-canvas-wrapper" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                  <LabelCanvas
                    label={modalTranslated || previewModalLabel}
                    canvasRef={modalPaperRef}
                    language={getLabelTranslationCode(previewModalLang)}
                  />
                </div>
              </div>

              <div className="label-modal-footer notranslate" translate="no">
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  disabled={modalTranslating}
                  onClick={async () => {
                    if (modalPaperRef.current) {
                      const activeLabel = modalTranslated || previewModalLabel;
                      await exportPng(
                        modalPaperRef.current,
                        filenameFor(activeLabel.title || previewModalLabel.title, previewModalLang.code, "png")
                      );
                      setNotice(`Label image downloaded in ${previewModalLang.label} (${previewModalLang.native}).`);
                    }
                  }}
                >
                  <Icon name="download" size={16} />
                  <span>{modalTranslating ? "Translating label…" : `Download PNG (${previewModalLang.native})`}</span>
                </button>

                <button
                  type="button"
                  className="admin-btn admin-btn--soft"
                  disabled={modalTranslating}
                  onClick={async () => {
                    if (modalPaperRef.current) {
                      const activeLabel = modalTranslated || previewModalLabel;
                      await exportPdf(modalPaperRef.current, filenameFor(activeLabel.title || previewModalLabel.title, previewModalLang.code, "pdf"));
                      setNotice(`Label PDF downloaded in ${previewModalLang.label} (${previewModalLang.native}).`);
                    }
                  }}
                >
                  <Icon name="download" size={16} />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  className="admin-btn admin-btn--soft"
                  onClick={() => {
                    const l = previewModalLabel;
                    setPreviewModalLabel(null);
                    edit(l);
                  }}
                >
                  <Icon name="pencil" size={15} />
                  <span>Open in Editor</span>
                </button>

                <button
                  type="button"
                  className="admin-btn admin-btn--soft"
                  onClick={() => setPreviewModalLabel(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      {/* ── Styled Confirmation Modal (replaces window.confirm) ─── */}
      {confirmState && (
        <div className="label-confirm-backdrop" onClick={() => resolveConfirm(false)}>
          <div className={`label-confirm-dialog${confirmState.danger ? " label-confirm-dialog--danger" : ""}`} onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-msg">
            <div className="label-confirm-icon-wrap">
              {confirmState.danger ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              )}
            </div>
            <h3 id="confirm-title" className="label-confirm-title">{confirmState.title}</h3>
            <p id="confirm-msg" className="label-confirm-msg">{confirmState.message}</p>
            <div className="label-confirm-actions">
              <button type="button" className="admin-btn admin-btn--soft" onClick={() => resolveConfirm(false)}>Cancel</button>
              <button type="button" className={`admin-btn ${confirmState.danger ? "admin-btn--danger" : "admin-btn--primary"}`} onClick={() => resolveConfirm(true)} autoFocus>
                {confirmState.danger ? "Delete" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    );
  }

  // -----------------------------------------------------------------
  // VIEW: EDITOR MODE (When visiting /labels/new or /labels/:id/edit)
  // -----------------------------------------------------------------
  return (
    <div className="admin-page label-studio" translate="no">
      {/* Top Header with Back to Labels button */}
      <div className="admin-page-heading">
        <div>
          <button
            type="button"
            className="admin-btn admin-btn--soft admin-btn--sm label-back-btn"
            onClick={backToList}
          >
            <Icon name="chevron-left" size={14} />
            <span>Back to all labels</span>
          </button>
          <div style={{ marginTop: 8 }}>
            <p className="admin-eyebrow">
              {draft.id ? `Editing Label #${draft.id}` : "New Label Creation"}
            </p>
            <h2>{draft.id ? draft.title || "Edit Label" : "Create New Label"}</h2>
          </div>
        </div>
        <div className="admin-page-heading__actions">
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={save}
            disabled={Boolean(busy)}
          >
            {busy === "Saving" ? "Saving…" : draft.id ? "Save changes" : "Save to dashboard"}
          </button>
        </div>
      </div>

      {error && <div className="label-message" role="alert">{error}</div>}
      {notice && <div className="label-card label-notice-card" role="status">{notice}</div>}

      {loading ? (
        <div className="label-card label-empty" role="status">
          <div className="labels-spinner" style={{ margin: "0 auto 12px" }} />
          Loading label…
        </div>
      ) : loadError ? (
        <div className="label-card label-error-card">
          <p role="alert">{loadError}</p>
          <div className="label-actions">
            <button className="admin-btn admin-btn--primary" onClick={() => setReload((v) => v + 1)}>Retry</button>
            <button className="admin-btn admin-btn--soft" onClick={reset}>Start a new label</button>
            <button className="admin-btn admin-btn--soft" onClick={backToList}>Back to all labels</button>
          </div>
        </div>
      ) : (
        <div className="label-workspace">
          {/* ── LEFT COLUMN: FORM & SECTIONS ── */}
          <div className="label-editor-column">
            <fieldset disabled={Boolean(busy)} style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: "grid", gap: 20 }}>
              {/* Step 1: Label Details */}
              <section className="label-card label-card--header">
                <div className="label-bar">
                  <div className="label-card__heading-group">
                    <span className="label-step-indicator">1</span>
                    <div>
                      <h3>{draft.id ? "Edit Label" : "Label Details"}</h3>
                      <p className="label-muted">General title for document identification</p>
                    </div>
                  </div>
                  <span className={`label-status-pill ${dirty ? "label-status-pill--dirty" : draft.id ? "label-status-pill--saved" : ""}`}>
                    {dirty ? "Unsaved changes" : draft.id ? "Saved" : "New label"}
                  </span>
                </div>
                <div className="label-field">
                  <label htmlFor="label-title-input">Label name</label>
                  <input
                    id="label-title-input"
                    className="label-input"
                    value={draft.title}
                    maxLength={200}
                    placeholder="e.g. Warehouse Bin Tag"
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  />
                </div>
              </section>

              {/* Step 2: Headings & Content */}
              <section className="label-card label-card--sections">
                <div className="label-bar">
                  <div className="label-card__heading-group">
                    <span className="label-step-indicator">2</span>
                    <div>
                      <h3>Headings &amp; Content</h3>
                      <p className="label-muted">Large heading, sub-heading, logo and numbered data rows</p>
                    </div>
                  </div>
                  <span className="label-count-badge">
                    {draft.sections.length} {draft.sections.length === 1 ? "Section" : "Sections"}
                  </span>
                </div>

                <div className="label-sections-list">
                  {draft.sections.map((section, index) => (
                    <div className="label-section" key={section.id}>
                      {/* Section Top Bar */}
                      <div className="label-section__top">
                        <div className="label-section__badge-row">
                          <span className="label-section-number">Section {index + 1}</span>
                          <span className="label-muted">
                            {section.rows.length} {section.rows.length === 1 ? "row" : "rows"}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="admin-btn admin-btn--soft admin-btn--sm label-btn-remove"
                          onClick={async () => {
                            if (
                              (section.heading || section.logoPath || section.rightLogoPath || section.rows.some((r) => r.key || r.value)) &&
                              !(await askConfirm("Remove Section", "Remove this section and all its data rows? This cannot be undone.", true))
                            )
                              return;
                            setDraft({ ...draft, sections: draft.sections.filter((s) => s.id !== section.id) });
                          }}
                        >
                          Remove section
                        </button>
                      </div>

                      {/* Large Heading + Logo Side-by-Side */}
                      <div className="label-heading-logo-grid">
                        <div className="label-field label-heading-area">
                          <div className="label-field-header">
                            <label htmlFor={`heading-${section.id}`}>Large heading text</label>
                            <span className="label-font-current-val">{section.fontSizePx || 32} px</span>
                          </div>
                          <textarea
                            id={`heading-${section.id}`}
                            className="label-input"
                            rows={2}
                            maxLength={500}
                            value={section.heading}
                            placeholder="LARGE VISIBLE LETTERS HEADING"
                            onChange={(e) => patchSection(section.id, { heading: e.target.value })}
                          />
                          <div className="label-font-row">
                            <div className="label-stepper">
                              <button
                                type="button"
                                className="admin-btn admin-btn--soft admin-btn--sm"
                                aria-label="Decrease font size"
                                onClick={() =>
                                  patchSection(section.id, {
                                    fontSizePx: Math.max(8, Number(section.fontSizePx || 32) - 1),
                                  })
                                }
                              >
                                −
                              </button>
                              <input
                                className="label-input label-font-input"
                                type="number"
                                min={8}
                                max={200}
                                step="any"
                                value={section.fontSizePx}
                                onChange={(e) =>
                                  patchSection(section.id, {
                                    fontSizePx: e.target.value === "" ? "" : Number(e.target.value),
                                  })
                                }
                              />
                              <button
                                type="button"
                                className="admin-btn admin-btn--soft admin-btn--sm"
                                aria-label="Increase font size"
                                onClick={() =>
                                  patchSection(section.id, {
                                    fontSizePx: Math.min(200, Number(section.fontSizePx || 32) + 1),
                                  })
                                }
                              >
                                +
                              </button>
                            </div>
                            <div className="label-presets">
                              {[14, 18, 24, 32, 44, 60].map((sz) => (
                                <button
                                  type="button"
                                  key={sz}
                                  className="admin-btn admin-btn--soft admin-btn--sm label-preset"
                                  aria-pressed={section.fontSizePx === sz}
                                  onClick={() => patchSection(section.id, { fontSizePx: sz })}
                                >
                                  {sz}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Left Logo */}
                        <div className="label-field label-logo-group">
                          <div className="label-field-header">
                            <label>Left Logo</label>
                            <span className="label-muted">Placed on left</span>
                          </div>
                          {section.logoPath ? (
                            <div className="label-logo-preview-card">
                              <img className="label-logo" src={imageUrl(section.logoPath)} alt="Left logo" />
                              <div className="label-logo-buttons">
                                <label className="admin-btn admin-btn--soft admin-btn--sm label-upload">
                                  Replace left logo
                                  <input
                                    aria-label={`Upload section ${index + 1} left logo`}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={(e) => {
                                      const f = e.target.files[0];
                                      e.target.value = "";
                                      if (f) upload(section.id, f, "logoPath");
                                    }}
                                  />
                                </label>
                                <button
                                  type="button"
                                  className="admin-btn admin-btn--soft admin-btn--sm label-btn-remove"
                                  onClick={() => patchSection(section.id, { logoPath: null })}
                                >
                                  Remove logo
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="label-logo-upload-box">
                              <label className="admin-btn admin-btn--soft label-upload">
                                ↑ Upload left logo
                                <input
                                  aria-label={`Upload section ${index + 1} left logo`}
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp"
                                  onChange={(e) => {
                                    const f = e.target.files[0];
                                    e.target.value = "";
                                    if (f) upload(section.id, f, "logoPath");
                                  }}
                                />
                              </label>
                              <span className="label-muted">Optional</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sub-heading Row + Right Logo Side-by-Side */}
                      <div className="label-heading-logo-grid">
                        <div className="label-field label-heading-area">
                          <div className="label-field-header">
                            <label htmlFor={`subheading-${section.id}`}>
                              Semi-large visible letters heading <span className="label-optional">(optional)</span>
                            </label>
                            <span className="label-font-current-val">{section.subFontSizePx || 20} px</span>
                          </div>
                          <textarea
                            id={`subheading-${section.id}`}
                            className="label-input"
                            rows={1}
                            maxLength={500}
                            value={section.subHeading || ""}
                            placeholder="SEMI LARGE VISIBLE LETTERS HEADING"
                            onChange={(e) => patchSection(section.id, { subHeading: e.target.value })}
                          />
                          <div className="label-font-row">
                            <div className="label-stepper">
                              <button
                                type="button"
                                className="admin-btn admin-btn--soft admin-btn--sm"
                                onClick={() =>
                                  patchSection(section.id, {
                                    subFontSizePx: Math.max(8, Number(section.subFontSizePx || 20) - 1),
                                  })
                                }
                              >
                                −
                              </button>
                              <input
                                className="label-input label-font-input"
                                type="number"
                                min={8}
                                max={200}
                                step="any"
                                value={section.subFontSizePx || 20}
                                onChange={(e) =>
                                  patchSection(section.id, {
                                    subFontSizePx: e.target.value === "" ? "" : Number(e.target.value),
                                  })
                                }
                              />
                              <button
                                type="button"
                                className="admin-btn admin-btn--soft admin-btn--sm"
                                onClick={() =>
                                  patchSection(section.id, {
                                    subFontSizePx: Math.min(200, Number(section.subFontSizePx || 20) + 1),
                                  })
                                }
                              >
                                +
                              </button>
                            </div>
                            <div className="label-presets">
                              {[12, 16, 20, 24, 28, 36].map((sz) => (
                                <button
                                  type="button"
                                  key={sz}
                                  className="admin-btn admin-btn--soft admin-btn--sm label-preset"
                                  aria-pressed={(section.subFontSizePx || 20) === sz}
                                  onClick={() => patchSection(section.id, { subFontSizePx: sz })}
                                >
                                  {sz}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right Logo */}
                        <div className="label-field label-logo-group">
                          <div className="label-field-header">
                            <label>Right Logo</label>
                            <span className="label-muted">Placed on right</span>
                          </div>
                          {section.rightLogoPath ? (
                            <div className="label-logo-preview-card">
                              <img className="label-logo" src={imageUrl(section.rightLogoPath)} alt="Right logo" />
                              <div className="label-logo-buttons">
                                <label className="admin-btn admin-btn--soft admin-btn--sm label-upload">
                                  Replace right logo
                                  <input
                                    aria-label={`Upload section ${index + 1} right logo`}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={(e) => {
                                      const f = e.target.files[0];
                                      e.target.value = "";
                                      if (f) upload(section.id, f, "rightLogoPath");
                                    }}
                                  />
                                </label>
                                <button
                                  type="button"
                                  className="admin-btn admin-btn--soft admin-btn--sm label-btn-remove"
                                  onClick={() => patchSection(section.id, { rightLogoPath: null })}
                                >
                                  Remove logo
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="label-logo-upload-box">
                              <label className="admin-btn admin-btn--soft label-upload">
                                ↑ Upload right logo
                                <input
                                  aria-label={`Upload section ${index + 1} right logo`}
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp"
                                  onChange={(e) => {
                                    const f = e.target.files[0];
                                    e.target.value = "";
                                    if (f) upload(section.id, f, "rightLogoPath");
                                  }}
                                />
                              </label>
                              <span className="label-muted">Optional</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Numbered Data Rows */}
                      <div className="label-field label-rows-container">
                        <div className="label-field-header">
                          <label>Numbered data rows</label>
                          <span className="label-muted">Any information → Any information</span>
                        </div>
                        <div className="label-rows-box">
                          <div className="label-rows-head">
                            <span className="label-row-num-head">#</span>
                            <span>KEY / FIELD</span>
                            <span>VALUE / DETAIL</span>
                            <span></span>
                          </div>
                          <div className="label-rows">
                            {section.rows.map((row, rowIndex) => (
                              <div className="label-row" key={row.id}>
                                <span className="label-row-num">{rowIndex + 1}</span>
                                <input
                                  className="label-input"
                                  aria-label={`Section ${index + 1} row ${rowIndex + 1} key`}
                                  maxLength={300}
                                  placeholder="Key (e.g. Weight)"
                                  value={row.key}
                                  onChange={(e) => patchRow(section, row.id, { key: e.target.value })}
                                />
                                <textarea
                                  className="label-input"
                                  rows={1}
                                  aria-label={`Section ${index + 1} row ${rowIndex + 1} value`}
                                  maxLength={4000}
                                  placeholder="Value (e.g. 4.2 kg)"
                                  value={row.value}
                                  onChange={(e) => patchRow(section, row.id, { value: e.target.value })}
                                />
                                <button
                                  type="button"
                                  className="admin-btn admin-btn--soft admin-btn--sm label-row-del"
                                  title="Delete row"
                                  aria-label={`Remove row ${rowIndex + 1}`}
                                  onClick={() =>
                                    patchSection(section.id, {
                                      rows: section.rows.filter((r) => r.id !== row.id),
                                    })
                                  }
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="label-add-row-bar">
                            <button
                              type="button"
                              className="admin-btn admin-btn--soft admin-btn--sm"
                              onClick={() => patchSection(section.id, { rows: [...section.rows, newRow()] })}
                            >
                              + Newly Add continuous Rows
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="admin-btn admin-btn--soft label-add-section"
                  onClick={() => setDraft({ ...draft, sections: [...draft.sections, newSection()] })}
                >
                  + Newly Add Heading Section
                </button>
              </section>

              {/* ── LEFT SIDE ACTIONS (Save to dashboard) ── */}
              <div className="label-left-actions">
                <button
                  disabled={Boolean(busy)}
                  className="admin-btn admin-btn--primary label-btn-save"
                  onClick={save}
                >
                  {busy === "Saving" ? "Saving…" : draft.id ? "Save changes" : "Save to dashboard"}
                </button>
                <button
                  disabled={Boolean(busy)}
                  className="admin-btn admin-btn--soft"
                  onClick={reset}
                >
                  Start a new label
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--soft"
                  onClick={backToList}
                >
                  Back to all labels
                </button>
              </div>
            </fieldset>
          </div>

          {/* ── RIGHT COLUMN: STICKY LIVE PREVIEW & OPTIONS ── */}
          <div className="label-preview-column">
            <div className="label-sticky-container">
              <section className="label-card label-card--preview">
                <div className="label-bar">
                  <div className="label-preview-title-row">
                    <h3>Live preview</h3>
                    <span className="label-lang-pill">{language.native}</span>
                  </div>
                  <span className="label-muted">{busy || (translating ? "Translating…" : "Ready")}</span>
                </div>
                <p className="label-muted label-preview-hint">The image download uses this exact layout.</p>

                <div className="label-canvas-wrapper">
                  <LabelCanvas label={translated} canvasRef={paper} language={code} />
                </div>

                {/* 1. Language Selection (Choose language first) */}
                <div className="label-language" style={{ marginTop: 20 }}>
                  <div className="label-language__header">
                    <h4>Multi-Language translation</h4>
                    <p className="label-muted">Select language before downloading. Entire label translates automatically.</p>
                  </div>
                  <div className="label-actions label-language__row" style={{ marginTop: 10 }}>
                    <LanguageSelector
                      selectedLang={language}
                      onSelectLang={(sel) => {
                        if (!busy) { setTranslating(true); setLanguage(sel); setTranslationRetry((value) => value + 1); }
                      }}
                    />
                  </div>
                </div>

                {/* 2. Download Button (Below language selector, No JSON format) */}
                <div className="label-right-options notranslate" translate="no" style={{ marginTop: 16, display: "flex", flexDirection: "column" }}>
                  <button
                    disabled={Boolean(busy) || translating}
                    className="admin-btn admin-btn--primary label-option-btn label-download-full"
                    style={{ width: "100%", justifyContent: "center", padding: "14px 18px", fontSize: "14px", fontWeight: 600, gap: 8 }}
                    onClick={() =>
                      run("Exporting image", async () => {
                        const problem = validateDraft(draft);
                        if (problem) throw new Error(problem);
                        await exportPng(paper.current, filenameFor(translated?.title || draft.title, language.code, "png"));
                        setNotice(`Label downloaded in ${language.label} (${language.native}).`);
                      })
                    }
                  >
                    <Icon name="download" size={17} />
                    <span>{translating ? "Translating label…" : `Download PNG in ${language.native} (${language.label})`}</span>
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* ── Styled Confirmation Modal (replaces window.confirm) ─── */}
      {confirmState && (
        <div className="label-confirm-backdrop" onClick={() => resolveConfirm(false)}>
          <div className={`label-confirm-dialog${confirmState.danger ? " label-confirm-dialog--danger" : ""}`} onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title-e" aria-describedby="confirm-msg-e">
            <div className="label-confirm-icon-wrap">
              {confirmState.danger ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              )}
            </div>
            <h3 id="confirm-title-e" className="label-confirm-title">{confirmState.title}</h3>
            <p id="confirm-msg-e" className="label-confirm-msg">{confirmState.message}</p>
            <div className="label-confirm-actions">
              <button type="button" className="admin-btn admin-btn--soft" onClick={() => resolveConfirm(false)}>Cancel</button>
              <button type="button" className={`admin-btn ${confirmState.danger ? "admin-btn--danger" : "admin-btn--primary"}`} onClick={() => resolveConfirm(true)} autoFocus>
                {confirmState.danger ? "Delete" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
