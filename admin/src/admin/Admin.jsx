import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useLocation,
  useOutletContext,
} from "react-router-dom";
import { api } from "../lib/api";
import { Icon } from "./icons";
import {
  LANGUAGES as ADMIN_LANGUAGES,
  EUROPE_COUNTRIES as ADMIN_EUROPE_COUNTRIES,
  getDocTranslation,
  translateDocValue,
  getDocWeightInfo,
  formatAmountInWords,
} from "../data/languages.js";
import brandLogo from "../../../Frontend/src/assets/logo.jpeg";
import siteImageCustom from "../../../Frontend/src/assets/product_custom.jpg";
import siteImagePlain from "../../../Frontend/src/assets/product_plain.jpg";
import siteImageMerch from "../../../Frontend/src/assets/product_merch.jpg";

const SITE_IMAGES = [
  { file: "product_custom.jpg", label: "Custom t-shirts", src: siteImageCustom },
  { file: "product_plain.jpg", label: "Plain t-shirts", src: siteImagePlain },
  { file: "product_merch.jpg", label: "Personalized merch", src: siteImageMerch },
];

const IMAGE_RULES = {
  exactWidth: 800,
  exactHeight: 600,
  types: ["image/jpeg", "image/png", "image/webp"],
};

function validateImageFile(file) {
  return new Promise((resolve) => {
    if (!file) return resolve("Please choose an image file.");
    const isAllowedType =
      IMAGE_RULES.types.includes(file.type) ||
      /\.(jpe?g|png|webp)$/i.test(file.name || "");
    if (!isAllowedType) {
      return resolve("Unsupported file type. Please upload a JPG, PNG or WebP image.");
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      URL.revokeObjectURL(url);
      if (!w || !h) return resolve("This file could not be read as an image.");
      if (w !== IMAGE_RULES.exactWidth || h !== IMAGE_RULES.exactHeight) {
        return resolve(
          `Image must be exactly 800 × 600 pixels (selected image is ${w} × ${h} px).`,
        );
      }
      resolve(null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("This file could not be read as an image. Please upload a valid image file.");
    };
    img.src = url;
  });
}

const pageNames = {
  "/": "Dashboard",
  "/products": "Products",
  "/export-documents": "Export documents",
  "/contacts": "Contacts",
};


const initials = (name) =>
  (name || "?")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const fmtDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const timeAgo = (value) => {
  if (!value) return "—";
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000),
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return fmtDate(value);
};

const statusTone = (s) => {
  const v = (s || "").toLowerCase();
  if (v === "new") return "mint";
  if (v === "responded") return "navy";
  if (v === "closed") return "gray";
  return "neutral";
};

function Avatar({ name, size = 38 }) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
    >
      {initials(name)}
    </span>
  );
}

function Badge({ children, tone = "neutral" }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

function Spinner({ size = 18 }) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size, borderWidth: Math.max(2, size / 8) }}
      aria-hidden="true"
    />
  );
}

function EmptyState({ icon, title, hint, action }) {
  return (
    <div className="admin-empty">
      <div className="admin-empty__icon">
        <Icon name={icon} size={26} />
      </div>
      <h3>{title}</h3>
      {hint && <p>{hint}</p>}
      {action}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="admin-card admin-card--skeleton" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <div className="admin-skeleton-row" key={i}>
          <div className="skeleton skeleton--circle" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line short" />
        </div>
      ))}
    </div>
  );
}

function StatSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div className="admin-card admin-stat admin-card--skeleton stat" key={i}>
          <div className="admin-skeleton-stat-head">
            <div className="skeleton skeleton--line" style={{ width: "42%", height: "14px" }} />
            <div className="skeleton skeleton--circle" style={{ width: "44px", height: "44px" }} />
          </div>
          <div className="skeleton skeleton--line" style={{ width: "50%", height: "36px", margin: "10px 0 6px" }} />
          <div className="skeleton skeleton--line" style={{ width: "65%", height: "20px", marginBottom: "10px" }} />
          <div className="skeleton skeleton--line" style={{ width: "85%", height: "14px" }} />
          <div className="admin-skeleton-stat-foot">
            <div className="skeleton skeleton--line" style={{ width: "35%", height: "14px" }} />
          </div>
        </div>
      ))}
    </>
  );
}

const PAGE_SIZE = 10;

function Pagination({ page, pageCount, onPage }) {
  if (pageCount <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  const pages = [];
  for (let p = start; p <= Math.min(pageCount, start + 4); p += 1) pages.push(p);
  return (
    <div className="admin-pagination">
      <button
        type="button"
        className="admin-pagination__nav"
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
      >
        <Icon name="chevron-left" size={15} />
        Prev
      </button>
      <div className="admin-pagination__pages">
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`admin-pagination__page${p === page ? " admin-pagination__page--active" : ""}`}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onPage(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="admin-pagination__nav"
        disabled={page === pageCount}
        onClick={() => onPage(page + 1)}
      >
        Next
        <Icon name="chevron-right" size={15} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* overlays: modal, confirm, toasts, dropdown                          */
/* ------------------------------------------------------------------ */

function Modal({ open, onClose, title, sub, icon, children, drawer, wide, notranslate = true }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className={`admin-overlay${notranslate ? " notranslate" : ""}`}
      translate={notranslate ? "no" : "yes"}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`admin-dialog${drawer ? " admin-dialog--drawer" : ""}${
          wide ? " admin-dialog--wide" : ""
        }${notranslate ? " notranslate" : ""}`}
        ref={ref}
        role="dialog"
        aria-modal="true"
        translate={notranslate ? "no" : "yes"}
      >
        <div className="admin-dialog__head notranslate" translate="no">
          <div className="admin-dialog__head-content">
            {icon && (
              <span className="admin-dialog__head-icon">
                <Icon name={icon} size={20} />
              </span>
            )}
            <div>
              <h2>{title}</h2>
              {sub && <p>{sub}</p>}
            </div>
          </div>
          <button className="admin-icon-btn admin-dialog__close notranslate" translate="no" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="admin-dialog__body">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ state, onResolve }) {
  return (
    <div
      className="admin-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onResolve(false)}
    >
      <div className="admin-dialog admin-dialog--confirm" role="alertdialog">
        <div className="admin-confirm__icon">
          <Icon name="alert" size={24} />
        </div>
        <h2>{state.title}</h2>
        <p>{state.message}</p>
        <div className="admin-dialog__foot">
          <button className="admin-btn admin-btn--ghost" onClick={() => onResolve(false)}>
            Cancel
          </button>
          <button
            className="admin-btn admin-btn--danger"
            onClick={() => onResolve(true)}
            autoFocus
          >
            {state.confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToastStack({ toasts, dismiss }) {
  return (
    <div className="admin-toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`admin-toast admin-toast--${t.type}`}>
          <span className="admin-toast__icon">
            <Icon name={t.type === "success" ? "check-circle" : t.type === "error" ? "alert" : "bell"} size={17} />
          </span>
          <p>{t.message}</p>
          <button className="admin-toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function useClickOutside(ref, onClose) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

/* ------------------------------------------------------------------ */
/* notifications                                                        */
/* ------------------------------------------------------------------ */

function NotificationBell({ items, unreadCount, onView, onMarkAllRead }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="admin-notif" ref={ref}>
      <button
        type="button"
        className="admin-icon-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
      >
        <Icon name="bell" size={18} />
        {unreadCount > 0 && (
          <span className="admin-notif__count">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="admin-notif__panel">
          <div className="admin-notif__head">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button type="button" className="admin-text-btn" onClick={onMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="admin-notif__empty">No notifications yet. New contact form submissions will appear here.</p>
          ) : (
            <ul className="admin-notif__list">
              {items.map((n) => {
                const s = n.submission || {};
                return (
                  <li
                    key={n.id}
                    className={`admin-notif-item${n.is_read ? "" : " admin-notif-item--unread"}`}
                    onClick={() => {
                      onView(n);
                      setOpen(false);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onView(n);
                        setOpen(false);
                      }
                    }}
                  >
                    <div className="admin-notif-item__icon-wrap">
                      <Avatar name={s.name || n.title} size={36} />
                      {!n.is_read && (
                        <span className="admin-notif-item__badge">
                          <Icon name="mail" size={9} />
                        </span>
                      )}
                    </div>
                    <div className="admin-notif-item__main">
                      <strong>{s.name || n.title}</strong>
                      {s.email && <small>{s.email}</small>}
                      <span className="admin-notif-item__time">
                        <Icon name="clock" size={12} />
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    {!n.is_read && <span className="admin-notif-item__dot" aria-hidden="true" />}
                    <button
                      type="button"
                      className="admin-btn admin-btn--soft admin-btn--sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(n);
                        setOpen(false);
                      }}
                    >
                      <Icon name="eye" size={14} />
                      View
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationDetails({ item, onClose, onRespond, updating, pushToast }) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const s = item?.submission;

  const copyEmail = () => {
    if (!s?.email) return;
    navigator.clipboard.writeText(s.email);
    setCopiedEmail(true);
    if (pushToast) pushToast("success", "Copied email to clipboard");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  if (!item || !s) return null;

  return (
    <div className="admin-ndetail">
      <div className="admin-ndetail__hero">
        <div className="admin-ndetail__hero-glow" aria-hidden="true" />
        <Avatar name={s.name} size={56} />
        <div className="admin-ndetail__hero-main">
          <p className="admin-ndetail__hero-eyebrow">Contact enquiry</p>
          <h3>{s.name}</h3>
          <div className="admin-ndetail__email-row">
            <a href={`mailto:${s.email}`} className="admin-ndetail__email">
              <Icon name="mail" size={13} />
              {s.email}
            </a>
            <button
              type="button"
              className={`admin-ndetail__copy${copiedEmail ? " is-copied" : ""}`}
              onClick={copyEmail}
            >
              <Icon name={copiedEmail ? "check" : "copy"} size={12} />
              <span>{copiedEmail ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
        <Badge tone={statusTone(s.status)}>
          <span className={`admin-status-dot admin-status-dot--${statusTone(s.status)}`} />
          {s.status}
        </Badge>
      </div>

      <div className="admin-ndetail__timeline">
        <div className="admin-ndetail__tile">
          <Icon name="calendar" size={16} />
          <div>
            <span>Submitted on</span>
            <strong>{fmtDateTime(s.createdAt)}</strong>
          </div>
        </div>
        <div className="admin-ndetail__tile">
          <Icon name="check-circle" size={16} />
          <div>
            <span>Current status</span>
            <strong>{s.status === "New" ? "Pending response" : "Responded"}</strong>
          </div>
        </div>
      </div>

      <section className="admin-ndetail__card">
        <div className="admin-ndetail__label">
          <Icon name="file-text" size={14} />
          Requirement details
        </div>
        <p className="admin-ndetail__text">
          {s.requirement_details || "No specific requirement details provided."}
        </p>
      </section>

      <div className="admin-ndetail__grid">
        <section className="admin-ndetail__card">
          <div className="admin-ndetail__label">
            <Icon name="package" size={14} />
            Requested product
          </div>
          <strong className="admin-ndetail__value">{s.Product?.name || "General Enquiry"}</strong>
          <small className="admin-ndetail__hint">
            {s.Product ? "Attached catalogue product" : "General customer requirement"}
          </small>
        </section>
        <section className="admin-ndetail__card">
          <div className="admin-ndetail__label">
            <Icon name="globe" size={14} />
            Delivery location
          </div>
          <strong className="admin-ndetail__value">
            {s.address || "—"}
            {s.postal_code ? ` — PIN: ${s.postal_code}` : ""}
          </strong>
          <small className="admin-ndetail__hint">Customer business or delivery location</small>
        </section>
      </div>

      <div className="admin-ndetail__foot">
        {onRespond && s.status === "New" && (
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => onRespond(s)}
            disabled={updating === s.id}
          >
            {updating === s.id ? <Spinner size={16} /> : <Icon name="check" size={16} />}
            <span>Mark as responded</span>
          </button>
        )}
        <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* login                                                               */
/* ------------------------------------------------------------------ */

function Login() {
  const nav = useNavigate();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const pending = sessionStorage.getItem("saaluvesa_pending_toast");
    if (pending) {
      try {
        const parsed = JSON.parse(pending);
        const id = Date.now() + Math.random().toString(16).slice(2);
        setToasts([{ id, type: parsed.type, message: parsed.message }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
      } catch {}
      sessionStorage.removeItem("saaluvesa_pending_toast");
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    const errors = {};
    if (!email) {
      errors.email = "Email address is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = "Please enter a valid email address (e.g. saaluvesa@gmail.com).";
    }
    if (!password) {
      errors.password = "Password is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setBusy(true);
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("saaluvesa_admin_access_token", data.accessToken);
      localStorage.setItem("saaluvesa_admin_refresh_token", data.refreshToken);
      sessionStorage.setItem(
        "saaluvesa_pending_toast",
        JSON.stringify({
          type: "success",
          message: "Logged in successfully! Welcome to Saaluvesa Admin.",
        }),
      );
      nav("/");
    } catch (err) {
      setError(
        err.status === 401
          ? err.message || "Invalid credentials"
          : err.message || "Unable to connect to the backend server. Please make sure the backend is running on http://localhost:5000.",
      );
      setBusy(false);
    }
  };

  return (
    <main className="admin-login">
      <ToastStack toasts={toasts} dismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
      <div className="admin-login__card">
        <div className="admin-login__brand">
          <img src={brandLogo} alt="Saaluvesa" />
        </div>
        <p className="admin-login__wordmark">
          SAALU<span>VESA</span>
        </p>
        <p className="admin-login__sub">Admin</p>
        {error && (
          <div className="admin-alert admin-alert--error" role="alert" aria-live="polite">
            <Icon name="alert" size={16} />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={submit} noValidate>
          <div className="admin-field">
            <label htmlFor="login-email">
              Email address <span className="admin-req-star" style={{ color: "#e5484d", fontWeight: "bold", marginLeft: "4px" }}>*</span>
            </label>
            <div className={`admin-input${fieldErrors.email ? " admin-field-input--error" : ""}`}>
              <Icon name="mail" size={16} />
              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="saaluvesa@gmail.com"
                autoComplete="email"
                onChange={() => {
                  if (error) setError("");
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                }}
              />
            </div>
            {fieldErrors.email && (
              <span className="admin-field-error-msg">{fieldErrors.email}</span>
            )}
          </div>
          <div className="admin-field">
            <label htmlFor="login-password">
              Password <span className="admin-req-star" style={{ color: "#e5484d", fontWeight: "bold", marginLeft: "4px" }}>*</span>
            </label>
            <div className={`admin-input admin-input--reveal${fieldErrors.password ? " admin-field-input--error" : ""}`}>
              <Icon name="lock" size={16} />
              <input
                id="login-password"
                name="password"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                onChange={() => {
                  if (error) setError("");
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
                }}
              />
              <button
                type="button"
                className="admin-input__toggle"
                onClick={() => setShowPass((s) => !s)}
                aria-label={showPass ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                <Icon name={showPass ? "eye-off" : "eye"} size={16} />
              </button>
            </div>
            {fieldErrors.password && (
              <span className="admin-field-error-msg">{fieldErrors.password}</span>
            )}
          </div>
          <button className="admin-btn admin-btn--primary admin-btn--block" disabled={busy}>
            {busy ? <Spinner size={17} /> : <Icon name="arrow" size={17} />}
            <span>{busy ? "Logging in…" : "Login"}</span>
          </button>
        </form>
      </div>
    </main>
  );
}


const ShellContext = createContext(null);
const useShell = () => useContext(ShellContext);

function Sidebar() {
  const { navItems } = useShell();
  const nav = useNavigate();
  return (
    <aside className="admin-sidebar notranslate" translate="no">
      <div className="admin-brand">
        <img src={brandLogo} alt="Saaluvesa" />
        <div>
          <strong>SAALU<span>VESA</span></strong>
          <small>ADMIN</small>
        </div>
      </div>
      <nav className="admin-nav">
        <p className="admin-nav-label">Main</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `admin-nav-item${isActive ? " admin-nav-item--active" : ""}`}
          >
            <Icon name={item.icon} size={18} />
            <span className="admin-nav-item__label">{item.label}</span>
            <span className="admin-nav-item__arrow"><Icon name="chevron-right" size={14} /></span>
          </NavLink>
        ))}
      </nav>
      <div className="admin-nav-bottom">
        <button
          className="admin-logout-btn"
          onClick={() => {
            localStorage.removeItem("saaluvesa_admin_access_token");
            localStorage.removeItem("saaluvesa_admin_refresh_token");
            sessionStorage.setItem(
              "saaluvesa_pending_toast",
              JSON.stringify({
                type: "success",
                message: "Logged out successfully!",
              }),
            );
            nav("/login");
          }}
        >
          <Icon name="logout" size={17} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}

function Topbar({ notifItems, unreadCount, onViewNotification, onMarkAllNotificationsRead }) {
  const location = useLocation();
  const pageName = pageNames[location.pathname] || "Admin";

  return (
    <header className="admin-topbar notranslate" translate="no">
      <div className="admin-topbar__title">
        <p className="admin-topbar__eyebrow">Saaluvesa Enterprises</p>
        <h1>{pageName}</h1>
      </div>

      <div className="admin-topbar__actions">
        <NotificationBell
          items={notifItems}
          unreadCount={unreadCount}
          onView={onViewNotification}
          onMarkAllRead={onMarkAllNotificationsRead}
        />
        <div className="admin-profile">
          <span className="admin-profile__avatar">A</span>
          <span className="admin-profile__meta">
            <strong>Admin</strong>
          </span>
        </div>
      </div>
    </header>
  );
}

function Shell() {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [viewingNotif, setViewingNotif] = useState(null);
  const [updatingNotifId, setUpdatingNotifId] = useState(null);

  const pushToast = (type, message) => {
    const id = Date.now() + Math.random().toString(16).slice(2);
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  };

  const confirm = (opts) =>
    new Promise((resolve) => setConfirmState({ ...opts, resolve }));

  const resolveConfirm = (value) => {
    confirmState?.resolve(value);
    setConfirmState(null);
  };

  const loadNotifications = useCallback(() => {
    api("/admin/notifications")
      .then((data) => {
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        setUnreadCount(Number(data.unreadCount) || 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const pending = sessionStorage.getItem("saaluvesa_pending_toast");
    if (pending) {
      try {
        const parsed = JSON.parse(pending);
        pushToast(parsed.type, parsed.message);
      } catch {}
      sessionStorage.removeItem("saaluvesa_pending_toast");
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 3000);
    const onStorage = (e) => {
      if (e.key === "saaluvesa_last_contact_submission") loadNotifications();
    };
    window.addEventListener("focus", loadNotifications);
    window.addEventListener("saaluvesa_new_contact_submission", loadNotifications);
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", loadNotifications);
      window.removeEventListener("saaluvesa_new_contact_submission", loadNotifications);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadNotifications]);

  const viewNotification = (n) => {
    setViewingNotif(n);
    if (!n.is_read) {
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((list) =>
        list.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
      );
      api(`/admin/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => {});
    }
  };

  const respondFromNotification = async (submission) => {
    setUpdatingNotifId(submission.id);
    try {
      await api(`/admin/contact-submissions/${submission.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Responded" }),
      });
      pushToast("success", `Marked ${submission.name.split(" ")[0]}'s enquiry as responded`);
      setViewingNotif((cur) =>
        cur?.submission
          ? { ...cur, submission: { ...cur.submission, status: "Responded" } }
          : cur
            ? { ...cur, status: "Responded" }
            : null,
      );
      setNotifications((list) =>
        list.map((x) =>
          x.submission?.id === submission.id
            ? { ...x, submission: { ...x.submission, status: "Responded" } }
            : x,
        ),
      );
    } catch (err) {
      pushToast("error", err.message || "Failed to update status");
    } finally {
      setUpdatingNotifId(null);
    }
  };

  const markAllNotificationsRead = () => {
    setUnreadCount(0);
    setNotifications((list) => list.map((x) => ({ ...x, is_read: true })));
    api("/admin/notifications/read-all", { method: "POST" }).catch(() => {});
  };

  const navItems = [
    { to: "/", label: "Overview", icon: "dashboard", end: true },
    { to: "/products", label: "Products", icon: "package" },
    { to: "/export-documents", label: "Export documents", icon: "file-text" },
    { to: "/contacts", label: "Contacts", icon: "mail" },
  ];

  return (
    <ShellContext.Provider value={{ pushToast, confirm, query, setQuery, navItems }}>
      <div className="admin-shell">
        <Sidebar />
        <div className="admin-main">
          <Topbar
            notifItems={notifications}
            unreadCount={unreadCount}
            onViewNotification={viewNotification}
            onMarkAllNotificationsRead={markAllNotificationsRead}
          />
          <main className="admin-content">
            <Outlet context={{ pushToast, confirm, query }} />
          </main>
        </div>
        <ToastStack toasts={toasts} dismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
        {confirmState && <ConfirmDialog state={confirmState} onResolve={resolveConfirm} />}
        {viewingNotif && (
          <Modal open onClose={() => setViewingNotif(null)} title="Enquiry details">
            <NotificationDetails
              item={viewingNotif}
              onClose={() => setViewingNotif(null)}
              onRespond={respondFromNotification}
              updating={updatingNotifId}
              pushToast={pushToast}
            />
          </Modal>
        )}
      </div>
    </ShellContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* charts                                                              */
/* ------------------------------------------------------------------ */

function Bars({ data, height = 200 }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="admin-bars" style={{ height }}>
      {data.map((d) => (
        <div className="admin-bars__col" key={d.label} title={`${d.label}: ${d.value}`}>
          <div className="admin-bars__track">
            <div className="admin-bars__fill" style={{ height: `${Math.max(2, Math.round((d.value / max) * 100))}%` }}>
              {d.value > 0 && <b>{d.value}</b>}
            </div>
          </div>
          <span className="admin-bars__label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function Donut({ parts, size = 150, centerLabel, centerSub }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  const r = 40;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const slices = total > 0 ? parts.filter((p) => p.value > 0) : [];
  return (
    <div className="admin-donut" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(7,16,91,0.07)" strokeWidth="11" />
        {slices.map((p, i) => {
          const dash = (p.value / total) * c;
          const el = (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={p.color}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={`${Math.max(dash - 2, 1)} ${c}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="admin-donut__center">
        <b>{total}</b>
        <span>{centerSub || "total"}</span>
      </div>
      {centerLabel && <p className="admin-donut__caption">{centerLabel}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Export Document Language Selector (strictly isolated to export view/PDF) */
/* ------------------------------------------------------------------ */

function ExportDocLangSelector({ selectedLang, onSelectLang }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const selected = selectedLang || ADMIN_LANGUAGES[0];
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const filteredLanguages = useMemo(() => {
    let list = ADMIN_LANGUAGES;

    if (selectedCountry) {
      const countryObj = ADMIN_EUROPE_COUNTRIES.find((c) => c.country === selectedCountry);
      if (countryObj) {
        list = countryObj.languages
          .map((code) => ADMIN_LANGUAGES.find((l) => l.code === code))
          .filter(Boolean);
      }
    }

    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter((lang) => {
      const matchLabel = lang.label.toLowerCase().includes(q);
      const matchNative = lang.native.toLowerCase().includes(q);
      const matchCode = lang.code.toLowerCase().includes(q);
      const matchCountry = (lang.countries || []).some((c) =>
        c.toLowerCase().includes(q)
      );
      return matchLabel || matchNative || matchCode || matchCountry;
    });
  }, [search, selectedCountry]);

  const handleSelect = (lang) => {
    if (onSelectLang) onSelectLang(lang);
    setOpen(false);
  };

  return (
    <div
      className={`admin-lang-selector notranslate${open ? " admin-lang-selector--open" : ""}`}
      translate="no"
      ref={containerRef}
    >
      <button
        type="button"
        className="admin-lang-selector__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${selected.label}. Click to change document language.`}
        onClick={() => setOpen((v) => !v)}
        title="Select document language"
      >
        {/* Globe icon */}
        <svg className="admin-lang-selector__globe" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.4" />
          <ellipse cx="10" cy="10" rx="3.5" ry="8.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M1.5 7.5h17M1.5 12.5h17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span className="admin-lang-selector__label">{selected.native}</span>
        {/* Chevron icon */}
        <svg className="admin-lang-selector__chevron" viewBox="0 0 10 6" fill="none" aria-hidden="true">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="admin-lang-selector__dropdown">
          {/* Country Quick Filter */}
          <div className="admin-lang-selector__country-box">
            <select
              className="admin-lang-selector__country-select"
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setSearch("");
              }}
              aria-label="Filter by Country"
            >
              <option value="">All European Countries ({ADMIN_EUROPE_COUNTRIES.length})</option>
              {ADMIN_EUROPE_COUNTRIES.map((c) => (
                <option key={c.country} value={c.country}>
                  {c.country} ({c.languages.length} lang{c.languages.length > 1 ? "s" : ""})
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="admin-lang-selector__search-box">
            <svg className="admin-lang-selector__search-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="admin-lang-selector__search-input"
              placeholder="Search country or language (e.g. Spain, Français...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filteredLanguages.length === 1) {
                  e.preventDefault();
                  handleSelect(filteredLanguages[0]);
                }
              }}
              aria-label="Search language or country"
            />
            {search && (
              <button
                type="button"
                className="admin-lang-selector__search-clear"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearch("");
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Language list */}
          <ul className="admin-lang-selector__list" role="listbox" aria-label="Language options">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang) => (
                <li
                  key={lang.code}
                  role="option"
                  aria-selected={selected.code === lang.code}
                  className={`admin-lang-selector__option${selected.code === lang.code ? " is-active" : ""}`}
                  onClick={() => handleSelect(lang)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(lang);
                    }
                  }}
                  tabIndex={0}
                >
                  <span className="admin-lang-selector__option-text">
                    <span className="admin-lang-selector__option-native">{lang.native}</span>
                    <span className="admin-lang-selector__option-secondary">({lang.label})</span>
                    {lang.countries && lang.countries.length > 0 && (
                      <span className="admin-lang-selector__option-country">
                        {lang.countries.slice(0, 2).join(", ")}
                        {lang.countries.length > 2 ? ` +${lang.countries.length - 2}` : ""}
                      </span>
                    )}
                  </span>
                  {selected.code === lang.code && (
                    <svg className="admin-lang-selector__check" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path
                        d="M3.5 8.5L6.5 11.5L12.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </li>
              ))
            ) : (
              <li className="admin-lang-selector__empty">No languages found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* dashboard                                                           */
/* ------------------------------------------------------------------ */

function Dashboard() {
  const [state, setState] = useState(null);

  const load = useCallback(() => {
    let alive = true;
    Promise.all([
      api("/admin/products").catch(() => []),
      api("/admin/contact-submissions").catch(() => []),
      api("/admin/export-documents").catch(() => []),
    ])
      .then(([products, submissions, exportDocs]) => {
        if (!alive) return;
        setState({
          products: Array.isArray(products) ? products : [],
          submissions: Array.isArray(submissions) ? submissions : [],
          exportDocs: Array.isArray(exportDocs) ? exportDocs : [],
        });
      })
      .catch(() => {
        if (!alive) return;
        setState({ products: [], submissions: [], exportDocs: [] });
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    const onStorage = (e) => {
      if (e.key === "saaluvesa_last_contact_submission") load();
    };
    window.addEventListener("focus", load);
    window.addEventListener("saaluvesa_new_contact_submission", load);
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", load);
      window.removeEventListener("saaluvesa_new_contact_submission", load);
      window.removeEventListener("storage", onStorage);
    };
  }, [load]);

  if (!state) {
    return (
      <div className="admin-page">
        <div className="admin-grid admin-grid--stats">
          <StatSkeleton />
        </div>
      </div>
    );
  }

  const { products, submissions, exportDocs } = state;
  const activeProducts = products.filter((p) => p.is_active).length;
  const newSubmissions = submissions.filter(
    (s) => (s.status || "").toLowerCase() === "new"
  ).length;

  const stats = [
    {
      label: "Products Catalogue",
      value: products.length,
      icon: "package",
      tone: "mint",
      badge: `${activeProducts} active in store`,
      badgeTone: "mint",
      sub: "Active and catalogue products managed",
      link: "/products",
      actionText: "Manage products",
    },
    {
      label: "Customer Inquiries",
      value: submissions.length,
      icon: "mail",
      tone: "navy",
      badge: newSubmissions > 0 ? `${newSubmissions} new inquiries` : "All caught up",
      badgeTone: newSubmissions > 0 ? "amber" : "mint",
      sub: "Submissions from website contact forms",
      link: "/contacts",
      actionText: "View submissions",
    },
    {
      label: "Export Documents",
      value: exportDocs.length,
      icon: "file-text",
      tone: "violet",
      badge: "Invoices & Slips",
      badgeTone: "violet",
      sub: "Generated export invoices & packing slips",
      link: "/export-documents",
      actionText: "Browse documents",
    },
  ];

  return (
    <div className="admin-page notranslate" translate="no">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Overview</p>
          <h2>Dashboard</h2>
        </div>
      </div>

      <div className="admin-grid admin-grid--stats">
        {stats.map((s) => (
          <Link
            to={s.link}
            className={`admin-card admin-stat admin-stat--${s.tone}`}
            key={s.label}
          >
            <div className="admin-stat__header">
              <span className="admin-stat__label">{s.label}</span>
              <span className={`admin-stat__icon admin-stat__icon--${s.tone}`}>
                <Icon name={s.icon} size={22} />
              </span>
            </div>

            <div className="admin-stat__body">
              <div className="admin-stat__value-row">
                <span className="admin-stat__value">{s.value}</span>
              </div>
              <div className="admin-stat__badge-wrap">
                <span className={`admin-stat__badge admin-stat__badge--${s.badgeTone}`}>
                  <span className={`admin-stat__badge-dot admin-stat__badge-dot--${s.badgeTone}`} />
                  {s.badge}
                </span>
              </div>
              <p className="admin-stat__sub">{s.sub}</p>
            </div>

            <div className="admin-stat__footer">
              <span className="admin-stat__action">
                {s.actionText}
                <Icon name="chevron-right" size={14} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* product detail drawer                                              */
/* ------------------------------------------------------------------ */

function ProductDetailDrawer({ product, onClose }) {
  if (!product) return null;
  const imgs = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.image
    ? [product.image]
    : [];

  return (
    <div className="admin-product-view">
      {/* 1. Product Images Showcase */}
      <div className="admin-product-view__media">
        {imgs.length > 0 ? (
          <div className="admin-product-view__gallery">
            <div className="admin-product-view__image-wrap">
              <img
                src={imgs[0]}
                alt={product.name}
                className="admin-product-view__image"
              />
            </div>
            {imgs.length > 1 && (
              <div className="admin-product-view__thumbs">
                {imgs.map((src, i) => (
                  <div className="admin-product-view__thumb" key={i}>
                    <img src={src} alt="" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="admin-product-view__placeholder">
            <Icon name="image" size={38} />
            <p>No product image uploaded</p>
          </div>
        )}
      </div>

      {/* 2. Product Title & Meta Header */}
      <div className="admin-product-view__body">
        <div className="admin-product-view__header">
          <div className="admin-product-view__meta-pills">
            <Badge tone={product.is_active ? "mint" : "gray"}>
              <span className={`admin-status-dot admin-status-dot--${product.is_active ? "mint" : "gray"}`} />
              {product.is_active ? "Active" : "Inactive"}
            </Badge>
            <span className="admin-product-view__order-pill">
              <Icon name="layers" size={13} />
              Display Order #{product.display_order ?? 0}
            </span>
          </div>
          <h3 className="admin-product-view__title">{product.name}</h3>
        </div>

        {/* 3. Description Card */}
        <div className="admin-product-view__description-card">
          <div className="admin-product-view__section-label">
            <Icon name="file-text" size={14} />
            <span>Product Description</span>
          </div>
          <div className="admin-product-view__text">
            {product.description ? (
              <p>{product.description}</p>
            ) : (
              <p className="admin-product-view__empty-text">No description provided for this product.</p>
            )}
          </div>
        </div>

        {/* 4. Website / Catalogue Navigation Link */}
        {product.website_link && (
          <div className="admin-product-view__link-card">
            <div className="admin-product-view__link-head">
              <span className="admin-product-view__link-icon-box">
                <Icon name="external-link" size={15} />
              </span>
              <span className="admin-product-view__link-label">Navigation Link</span>
            </div>
            {product.website_link === "contact" ? (
              <span className="admin-product-view__link">
                <Icon name="mail" size={15} />
                <span>Direct to Contact Page</span>
              </span>
            ) : (
              <a
                href={product.website_link}
                target="_blank"
                rel="noreferrer"
                className="admin-product-view__link"
              >
                <span>{product.website_link}</span>
                <Icon name="external-link" size={14} />
              </a>
            )}
          </div>
        )}
      </div>

      {/* 5. Actions */}
      <div className="admin-product-view__actions">
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* enquiry detail drawer                                              */
/* ------------------------------------------------------------------ */

function EnquiryDetailDrawer({
  selected,
  onClose,
  onRespond,
  onDelete,
  updating,
  busyId,
  pushToast,
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  const copyText = (text, key, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    if (pushToast) pushToast("success", `Copied ${label} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!selected) return null;
  const s = selected?.submission || selected;

  return (
    <div className="admin-detail-view">
      {/* Customer Hero Card */}
      <div className="admin-detail-header-card">
        <div className="admin-detail-header-top">
          <div className="admin-detail-header-badge-group">
            <span className="admin-detail-eyebrow">Customer Contact</span>
            <Badge tone={statusTone(s.status)}>
              <span className={`admin-status-dot admin-status-dot--${statusTone(s.status)}`} />
              {s.status}
            </Badge>
          </div>
        </div>
        <div className="admin-detail-customer-header">
          <Avatar name={s.name} size={52} />
          <div className="admin-detail-customer-info">
            <h3 className="admin-detail-product-title">{s.name}</h3>
            <div className="admin-detail-customer-email-row">
              <a href={`mailto:${s.email}`} className="admin-detail-email-link">
                <Icon name="mail" size={14} />
                {s.email}
              </a>
              <button
                type="button"
                className={`admin-detail-inline-copy${copiedKey === "email" ? " is-copied" : ""}`}
                title="Copy email address"
                onClick={() => copyText(s.email, "email", "email")}
              >
                <Icon name={copiedKey === "email" ? "check" : "copy"} size={13} />
                <span>{copiedKey === "email" ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Requirement Details */}
      <div className="admin-detail-section">
        <div className="admin-detail-section-title">
          <Icon name="file-text" size={15} />
          <h4>Requirement &amp; Message</h4>
        </div>
        <div className="admin-detail-description-card admin-detail-description-card--quote">
          <p>{s.requirement_details || "No specific requirement details provided."}</p>
        </div>
      </div>

      {/* Linked Product & Location Information */}
      <div className="admin-detail-section">
        <div className="admin-detail-section-title">
          <Icon name="package" size={15} />
          <h4>Enquiry Specifications</h4>
        </div>
        <div className="admin-detail-meta-grid">
          <div className="admin-detail-meta-tile">
            <div className="admin-detail-meta-tile__head">
              <span className="admin-detail-meta-tile__icon-box">
                <Icon name="package" size={16} />
              </span>
              <span className="admin-detail-meta-tile__label">Requested Product</span>
            </div>
            <strong className="admin-detail-meta-tile__value">
              {s.Product?.name || "General Catalogue Enquiry"}
            </strong>
            <small>{s.Product ? "Attached catalogue product item" : "General customer requirement"}</small>
          </div>
          <div className="admin-detail-meta-tile">
            <div className="admin-detail-meta-tile__head">
              <span className="admin-detail-meta-tile__icon-box">
                <Icon name="globe" size={16} />
              </span>
              <span className="admin-detail-meta-tile__label">Delivery / Contact Location</span>
            </div>
            <p className="admin-detail-meta-tile__value admin-detail-meta-tile__address">
              {s.address || "Address not specified"}
              {s.postal_code ? ` — PIN: ${s.postal_code}` : ""}
            </p>
            <small>Customer business or delivery location</small>
          </div>
        </div>
      </div>

      {/* Timeline Audit */}
      <div className="admin-detail-section">
        <div className="admin-detail-section-title">
          <Icon name="clock" size={15} />
          <h4>Submission Audit</h4>
        </div>
        <div className="admin-detail-audit-box">
          <div className="admin-detail-audit-item">
            <Icon name="calendar" size={16} />
            <div>
              <span>Submitted On</span>
              <strong>{fmtDateTime(s.createdAt)}</strong>
            </div>
          </div>
          <div className="admin-detail-audit-divider" />
          <div className="admin-detail-audit-item">
            <Icon name="check-circle" size={16} />
            <div>
              <span>Current Status</span>
              <strong>{s.status === "New" ? "Pending Response" : "Responded"}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="admin-detail-actions">
        {onRespond && s.status === "New" && (
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => onRespond(s)}
            disabled={updating === s.id}
          >
            {updating === s.id ? <Spinner size={16} /> : <Icon name="check" size={16} />}
            <span>Mark as responded</span>
          </button>
        )}
        {/* {onDelete && (
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            onClick={() => onDelete(s)}
            disabled={busyId === s.id}
          >
            {busyId === s.id ? <Spinner size={16} /> : <Icon name="trash" size={16} />}
            <span>Delete enquiry</span>
          </button>
        )} */}
        <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* products                                                            */
/* ------------------------------------------------------------------ */

function ProductsAdmin() {
  const { pushToast, confirm, query } = useOutletContext();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [formError, setFormError] = useState("");
  const [page, setPage] = useState(1);

  // Multi-image state: Min 1 image required (Mandatory), Max 5 images allowed (800 × 600 px)
  const [imageFiles, setImageFiles] = useState([]); // [{ id, file, previewUrl }]
  const [existingImages, setExistingImages] = useState([]); // [url1, url2, ...]
  const [imageError, setImageError] = useState("");
  const [imageRemovedNotice, setImageRemovedNotice] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const load = () => {
    setLoading(true);
    api("/admin/products")
      .then((rows) => setRows(Array.isArray(rows) ? rows : []))
      .catch((err) => {
        setRows([]);
        pushToast("error", err.message || "Could not load products");
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  useEffect(() => setPage(1), [query]);

  const filtered = rows.filter((p) =>
    [p.name, p.description, p.website_link].filter(Boolean).join(" ").toLowerCase().includes(query.toLowerCase()),
  );
  const productPageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const productPage = Math.min(page, productPageCount);
  const pagedProducts = filtered.slice((productPage - 1) * PAGE_SIZE, productPage * PAGE_SIZE);

  const resetImageState = () => {
    imageFiles.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    setImageFiles([]);
    setExistingImages([]);
    setImageError("");
    setImageRemovedNotice("");
    setFormError("");
    setFieldErrors({});
  };

  const openAdd = () => {
    setEditing(null);
    resetImageState();
    setOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    resetImageState();
    const existingList = Array.isArray(p.images) && p.images.length
      ? p.images
      : p.image
      ? [p.image]
      : [];
    setExistingImages(existingList);
    setOpen(true);
  };

  /** Handle multi-image file picking (up to 5 max) */
  const handleImageFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setImageError("");
    setImageRemovedNotice("");

    const currentTotal = existingImages.length + imageFiles.length;
    if (currentTotal >= 5) {
      setImageError("Maximum 5 images allowed per product.");
      return;
    }

    const availableSlots = 5 - currentTotal;
    const filesToProcess = files.slice(0, availableSlots);

    const newAdditions = [];
    for (const file of filesToProcess) {
      const error = await validateImageFile(file);
      if (error) {
        setImageError(error);
        return;
      }
      newAdditions.push({
        id: Date.now() + Math.random().toString(16).slice(2),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setImageFiles((prev) => [...prev, ...newAdditions]);
  };

  /** Remove existing image from gallery */
  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
    setImageRemovedNotice("Image removed. At least 1 image is required (maximum 5 images allowed).");
  };

  /** Remove newly selected image from gallery */
  const removeNewFileImage = (id) => {
    setImageFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});
    setImageError("");

    const form = new FormData(e.currentTarget);
    const name = (form.get("name") || "").trim();
    const description = (form.get("description") || "").trim();
    const website_link = (form.get("website_link") || "").trim();
    const website_link_preset = form.get("website_link_preset") || "";
    const resolvedLink = website_link_preset === "contact" ? "contact" : website_link;
    const display_order = (form.get("display_order") || "").trim();
    const is_active = form.get("is_active") === "true";

    const errors = {};
    if (!name) errors.name = "Product name is required.";
    if (!description) errors.description = "Description is required.";
    if (display_order === "") {
      errors.display_order = "Display order is required.";
    } else if (!/^\d+$/.test(display_order)) {
      errors.display_order = "Display order must be zero or a positive whole number.";
    }

    const totalImageCount = existingImages.length + imageFiles.length;
    if (totalImageCount < 1) {
      errors.images = "Product image is required.";
      setImageError("At least 1 product image is required. Please upload an image with 800 × 600 pixels.");
    } else if (totalImageCount > 5) {
      errors.images = "Maximum 5 images allowed.";
      setImageError("Maximum 5 images allowed per product.");
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = new FormData();
    payload.append("name", name);
    payload.append("description", description);
    payload.append("display_order", display_order);
    payload.append("is_active", String(is_active));
    if (resolvedLink) payload.append("website_link", resolvedLink);

    if (imageFiles.length > 0) {
      payload.append("image", imageFiles[0].file, imageFiles[0].file.name);
    }

    setSaving(true);
    try {
      await api(`/admin/products${editing?.id ? `/${editing.id}` : ""}`, {
        method: editing?.id ? "PUT" : "POST",
        body: payload,
      });
      pushToast("success", editing ? "Product updated successfully" : "Product added to catalogue");
      setOpen(false);
      setEditing(null);
      resetImageState();
      load();
    } catch (err) {
      pushToast("error", err.message || "Could not save product");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    const ok = await confirm({
      title: `Delete "${p.name}"?`,
      message: "This will permanently remove the product and its image from your catalogue. This action cannot be undone.",
      confirmLabel: "Delete product",
    });
    if (!ok) return;
    setBusyId(p.id);
    try {
      await api(`/admin/products/${p.id}`, { method: "DELETE" });
      pushToast("error", `Product "${p.name}" deleted from catalogue`);
      load();
    } catch (err) {
      pushToast("error", err.message || "Could not delete product");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-page notranslate" translate="no">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Catalogue</p>
          <h2>Products</h2>
        </div>
        <div className="admin-page-heading__actions">
          <button
            className="admin-btn admin-btn--primary"
            onClick={openAdd}
          >
            <Icon name="plus" size={17} />
            Add product
          </button>
        </div>
      </div>

      <div className="admin-toolbar">
        <span className="admin-toolbar__count">
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
        </span>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : filtered.length ? (
        <div className="admin-card admin-card--table">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Description</th>
                  <th>Display order</th>
                  <th>Status</th>
                  <th>Website link</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedProducts.map((p) => (
                  <tr key={p.id} className="admin-row" onClick={() => setViewing(p)}>
                    <td>
                      <div className="cell-name">
                        {p.image ? (
                          <img className="cell-thumb" src={p.image} alt="" />
                        ) : (
                          <Avatar name={p.name} size={36} />
                        )}
                        <strong>{p.name}</strong>
                      </div>
                    </td>
                    <td className="cell-clamp" title={p.description}>{p.description}</td>
                    <td>{p.display_order ?? 0}</td>
                    <td>
                      <Badge tone={p.is_active ? "mint" : "gray"}>
                        {p.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td>
                      {p.website_link === "contact" ? (
                        <span className="cell-link" style={{ cursor: "default" }}>
                          <Icon name="external-link" size={14} />
                          Contact
                        </span>
                      ) : p.website_link ? (
                        <a
                          href={p.website_link}
                          target="_blank"
                          rel="noreferrer"
                          className="cell-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Icon name="external-link" size={14} />
                          Visit page
                        </a>
                      ) : (
                        <span className="cell-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="admin-icon-btn admin-icon-btn--soft"
                          title="View details"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewing(p);
                          }}
                        >
                          <Icon name="eye" size={16} />
                        </button>
                        <button
                          className="admin-icon-btn admin-icon-btn--soft"
                          title="Edit product"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(p);
                          }}
                        >
                          <Icon name="pencil" size={16} />
                        </button>
                        <button
                          className="admin-icon-btn admin-icon-btn--danger"
                          title="Delete product"
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(p);
                          }}
                          disabled={busyId === p.id}
                        >
                          {busyId === p.id ? <Spinner size={15} /> : <Icon name="trash" size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : query ? (
        <div className="admin-card">
          <EmptyState icon="search" title={`No results for “${query}”`} hint="Try a different search term." />
        </div>
      ) : (
        <div className="admin-card">
          <EmptyState
            icon="package"
            title="No products yet"
            hint="Add your first product to start building the catalogue."
            action={
              <button className="admin-btn admin-btn--primary" onClick={openAdd}>
                <Icon name="plus" size={17} />
                Add your first product
              </button>
            }
          />
        </div>
      )}

      <Pagination page={productPage} pageCount={productPageCount} onPage={setPage} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Product" : "Add New Product"}
        sub={editing ? `Update details and image for “${editing.name}”` : "Fill in the details below to add a product to the catalogue"}
        wide
      >
        <form onSubmit={save} noValidate className="admin-form admin-product-form">
          {/* Product Fields */}
          <div className="admin-form-grid">
            <div className="admin-field admin-field--full">
              <label htmlFor="p-name">
                Product Name <span className="admin-req-star" style={{ color: "#e5484d", fontWeight: "bold", marginLeft: "4px" }}>*</span>
              </label>
              <input
                id="p-name"
                name="name"
                className={fieldErrors.name ? "admin-field-input--error" : ""}
                placeholder="e.g. Custom Printed T-Shirts"
                defaultValue={editing?.name}
                autoFocus
                onChange={() => {
                  if (formError) setFormError("");
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
                }}
              />
              {fieldErrors.name && (
                <span className="admin-field-error-msg">{fieldErrors.name}</span>
              )}
            </div>

            <div className="admin-field admin-field--full">
              <label htmlFor="p-desc">
                Description <span className="admin-req-star" style={{ color: "#e5484d", fontWeight: "bold", marginLeft: "4px" }}>*</span>
              </label>
              <textarea
                id="p-desc"
                name="description"
                className={fieldErrors.description ? "admin-field-input--error" : ""}
                placeholder="Describe the product — materials, print techniques, sizing, export quality..."
                defaultValue={editing?.description}
                rows={4}
                onChange={() => {
                  if (formError) setFormError("");
                  if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: null }));
                }}
              />
              {fieldErrors.description && (
                <span className="admin-field-error-msg">{fieldErrors.description}</span>
              )}
            </div>

            <div className="admin-field">
              <label htmlFor="p-display-order">
                Display Order <span className="admin-req-star" style={{ color: "#e5484d", fontWeight: "bold", marginLeft: "4px" }}>*</span>
              </label>
              <input
                id="p-display-order"
                name="display_order"
                type="number"
                min="0"
                step="1"
                className={fieldErrors.display_order ? "admin-field-input--error" : ""}
                defaultValue={editing?.display_order ?? 0}
                onChange={() => {
                  if (fieldErrors.display_order) setFieldErrors((prev) => ({ ...prev, display_order: null }));
                }}
              />
              {fieldErrors.display_order && (
                <span className="admin-field-error-msg">{fieldErrors.display_order}</span>
              )}
            </div>

            <div className="admin-field">
              <label htmlFor="p-website">
                Website / Catalog Link <span className="admin-opt-badge">(Optional)</span>
              </label>
              <input
                id="p-website"
                name="website_link"
                placeholder="https://castbull.co.in/ or leave blank"
                defaultValue={editing?.website_link === "contact" ? "" : editing?.website_link}
              />
            </div>

            <div className="admin-field admin-field--full">
              <label htmlFor="p-active">Catalogue Visibility</label>
              <label className="admin-toggle-card" htmlFor="p-active">
                <input
                  id="p-active"
                  name="is_active"
                  type="checkbox"
                  value="true"
                  defaultChecked={editing?.is_active ?? true}
                />
                <div className="admin-toggle-card__switch">
                  <span className="admin-toggle-card__slider" />
                </div>
                <div className="admin-toggle-card__content">
                  <strong>Active on Website</strong>
                  <small>Visible in public catalogue & products list</small>
                </div>
              </label>
            </div>
          </div>

          {/* Card 2: Product Images (Min 1, Max 5) */}
          <div className="admin-form-card">
            <div className="admin-form-card__head">
              <div className="admin-form-card__icon">
                <Icon name="image" size={18} />
              </div>
              <div className="admin-form-card__head-text">
                <div className="admin-form-card__title-row">
                  <h3 className="admin-form-card__title">
                    Product Images <span className="admin-req-star" style={{ color: "#e5484d", fontWeight: "bold", marginLeft: "4px" }}>*</span>
                  </h3>
                  <span className="admin-badge-count">
                    {existingImages.length + imageFiles.length} / 5 Images
                  </span>
                </div>
                <p className="admin-form-card__desc">Upload 800 × 600 px images (JPG, PNG or WebP). Minimum 1 mandatory image, maximum 5 images.</p>
              </div>
            </div>

            {/* Highlighted Rule Banner */}
            {/* Highlighted Rule Banner (React Icon instead of emoji) */}
            <div
              style={{
                background: "rgba(121, 246, 194, 0.16)",
                border: "1.5px solid var(--admin-mint-dim)",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--admin-navy)", fontWeight: 700, fontSize: "0.88rem" }}>
                <Icon name="image" size={16} />
                <span>Product Image Upload Rules</span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--admin-ink)" }}>
                • <strong>Mandatory Rule:</strong> Must include <strong>at least 1 image</strong> per product.<br />
                • <strong>Maximum Limit:</strong> You can upload up to <strong>5 images maximum</strong> (800 × 600 px each).<br />
                • The 1st image is designated as the <strong>Primary Main Image</strong>.
              </p>
            </div>

            {/* Image Gallery Grid (Existing + New Files) */}
            {(existingImages.length > 0 || imageFiles.length > 0) && (
              <div className="admin-multi-images-grid">
                {/* Render Existing Image URLs */}
                {existingImages.map((imgUrl, index) => (
                  <div key={`existing-${index}`} className="admin-multi-image-tile">
                    <img src={imgUrl} alt={`Product ${index + 1}`} />
                    <span className={`admin-multi-image-badge ${index === 0 ? "admin-multi-image-badge--primary" : ""}`}>
                      {index === 0 ? "Primary Image" : `Gallery #${index + 1}`}
                    </span>
                    <button
                      type="button"
                      className="admin-multi-image-remove"
                      title="Remove this image"
                      onClick={() => removeExistingImage(index)}
                      aria-label="Remove image"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                ))}

                {/* Render Newly Selected Image Files */}
                {imageFiles.map((fileObj, index) => {
                  const displayIdx = existingImages.length + index;
                  return (
                    <div key={fileObj.id} className="admin-multi-image-tile">
                      <img src={fileObj.previewUrl} alt={`New upload ${index + 1}`} />
                      <span className={`admin-multi-image-badge ${displayIdx === 0 ? "admin-multi-image-badge--primary" : ""}`}>
                        {displayIdx === 0 ? "Primary Image" : `New #${displayIdx + 1}`}
                      </span>
                      <button
                        type="button"
                        className="admin-multi-image-remove"
                        title="Remove this image"
                        onClick={() => removeNewFileImage(fileObj.id)}
                        aria-label="Remove image"
                      >
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dropzone for picking additional images if total < 5 */}
            {existingImages.length + imageFiles.length < 5 ? (
              <label className="admin-upload-dropzone" style={{ marginTop: "14px" }}>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageFiles}
                />
                <div className="admin-upload-dropzone__icon">
                  <Icon name="upload" size={22} />
                </div>
                <div className="admin-upload-dropzone__text">
                  <strong>
                    {existingImages.length + imageFiles.length === 0
                      ? "+ Click to upload at least 1 image (Mandatory)"
                      : `+ Add more images (${5 - (existingImages.length + imageFiles.length)} slot(s) remaining)`}
                  </strong>
                  <span>Requires exactly 800 × 600 pixels · JPG, PNG or WebP · Up to 5 images max</span>
                </div>
              </label>
            ) : (
              <div
                style={{
                  marginTop: "14px",
                  padding: "10px 14px",
                  background: "rgba(7, 16, 91, 0.05)",
                  borderRadius: "8px",
                  textAlign: "center",
                  fontSize: "0.82rem",
                  color: "var(--admin-ink-soft)",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <Icon name="check-circle" size={15} />
                <span>Maximum 5 images limit reached for this product.</span>
              </div>
            )}

            {imageError && (
              <div className="admin-image-error-box" role="alert">
                <Icon name="alert" size={16} />
                <span>{imageError}</span>
              </div>
            )}

            {imageRemovedNotice && (
              <div className="admin-image-removed-box" role="alert">
                <Icon name="trash" size={16} />
                <span>{imageRemovedNotice}</span>
              </div>
            )}
          </div>

          {/* Card 3: Additional Details */}
          <div className="admin-form-card">
            <div className="admin-form-card__head">
              <div className="admin-form-card__icon">
                <Icon name="external-link" size={18} />
              </div>
              <div className="admin-form-card__head-text">
                <h3 className="admin-form-card__title">
                  Website Link <span className="admin-optional">(Optional)</span>
                </h3>
                <p className="admin-form-card__desc">Direct link to an order or external product page</p>
              </div>
            </div>

            <div className="admin-form-grid">
              <div className="admin-field admin-field--full">
                <label htmlFor="p-link">Website Link</label>
                <div className="admin-input-with-dropdown">
                  <input
                    id="p-link"
                    name="website_link"
                    type="url"
                    placeholder="https://castbull.co.in/custom-tshirts"
                    defaultValue={editing?.website_link === "contact" ? "" : editing?.website_link}
                    disabled={editing?.website_link === "contact"}
                  />
                  <select
                    name="website_link_preset"
                    className="admin-input-dropdown"
                    defaultValue={editing?.website_link === "contact" ? "contact" : ""}
                    onChange={(e) => {
                      const input = e.currentTarget.parentElement.querySelector('input[name="website_link"]');
                      if (e.target.value === "contact") {
                        input.value = "";
                        input.disabled = true;
                      } else {
                        input.disabled = false;
                        input.focus();
                      }
                    }}
                  >
                    <option value="">Custom URL</option>
                    <option value="contact">Contact</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {formError && (
            <p className="admin-field-error admin-form__error" role="alert">
              <Icon name="alert" size={14} />
              {formError}
            </p>
          )}

          <div className="admin-form__actions admin-form__actions--sticky">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? <Spinner size={16} /> : <Icon name="check" size={16} />}
              {editing ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Product details"
        sub={viewing?.name || ""}
        wide
      >
        <ProductDetailDrawer
          product={viewing}
          onClose={() => setViewing(null)}
        />
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* export documents                                                    */
/* ------------------------------------------------------------------ */

const blankExportItem = () => ({ product_name: "", qty: "", unit_value: "", unit_net_weight: "0.00", uom: "PCS" });

function LegacyExportDocumentPreview({ document, type }) {
  const title = { commercial: "COMMERCIAL INVOICE", proforma: "PROFORMA INVOICE", packing: "PACKING LIST" }[type];
  const party = (name, address, contact, email, taxId) => <div className="export-preview__party"><strong>{name || "—"}</strong><span>{address || "—"}</span>{type !== "packing" && <><span>Contact: {contact || "—"}</span><span>Email: {email || "—"}</span><span>Tax ID No.: {taxId || "—"}</span></>}</div>;
  return <article className="export-preview">
    <header className="export-preview__header"><h1>{title}</h1><h2>{document.sender_name || "SAALUVESA ENTERPRISES PRIVATE LIMITED"}</h2><p>{document.sender_address || ""}</p></header>
    <div className="export-preview__meta"><span>Date: {document.shipment_date || "—"}</span><span>Invoice Number: {document.invoice_no}</span><span>{type === "packing" ? "File Number" : "Air Waybill Number"}: {type === "packing" ? document.file_number || "—" : document.awb_bl_no || "—"}</span></div>
    {type === "packing" ? <div className="export-preview__grid export-preview__grid--three"><section><h3>SHIPPER</h3>{party(document.sender_name, document.sender_address, document.sender_contact, document.sender_email, document.sender_tax_id)}</section><section><h3>CONSIGNEE</h3>{party(document.receiver_name, document.receiver_address, document.receiver_contact, document.receiver_email, document.receiver_tax_id)}</section><section><h3>BILL TO</h3>{party(document.importer_name, document.importer_address, document.importer_contact, document.importer_email, document.importer_tax_id)}</section></div> : <><div className="export-preview__grid"><section><h3>Sender Details</h3>{party(document.sender_name, document.sender_address, document.sender_contact, document.sender_email, document.sender_tax_id)}</section><section><h3>Shipment Details</h3><p>Shipment Date: {document.shipment_date || "—"}</p><p>Reference No.: {document.shipment_ref_no || "—"}</p><p>Reason for Export: {document.reason_for_export || "—"}</p><p>Incoterms: {document.incoterms || "—"}</p><p>Currency: {document.currency_code || "—"}</p></section></div><div className="export-preview__grid"><section><h3>Receiver Details</h3>{party(document.receiver_name, document.receiver_address, document.receiver_contact, document.receiver_email, document.receiver_tax_id)}</section><section><h3>Importer of Record Details</h3>{party(document.importer_name, document.importer_address, document.importer_contact, document.importer_email, document.importer_tax_id)}</section></div></>}
    <table><thead><tr><th>No.</th><th>{type === "packing" ? "Description" : "Item Description"}</th><th>{type === "packing" ? "Quantity" : "Qty UOM"}</th>{type !== "packing" && <th>Unit Value</th>}<th>{type === "packing" ? "Net Weight (Grams)" : "Sub-Total Value"}</th></tr></thead><tbody>{document.items?.map((item, index) => <tr key={item.id || index}><td>{index + 1}</td><td>{item.product_name}</td><td>{item.qty} {item.uom || "PCS"}</td>{type !== "packing" && <td>{document.currency_code} {Math.round(Number(item.unit_value || 0))}</td>}<td>{type === "packing" ? (Number(item.unit_net_weight || 0) * 1000).toFixed(2) : item.sub_total}</td></tr>)}</tbody></table>
    <section className="export-preview__details"><h3>{type === "packing" ? "Shipment Information" : "Other Information and Compliance Details"}</h3><p>{type === "packing" ? `Mode of Transportation: ${document.mode_of_transportation || "—"} · Packages: ${document.no_of_packages || "—"} · Package Description: ${document.package_description || "—"}` : document.other_information_compliance_details || "—"}</p></section>
    <footer><p>Signature: ______________________________</p><p>Name: {document.signatory_name || "—"}</p><p>Designation/Title: {document.signatory_designation || "—"}</p></footer>
  </article>;
}

function formatDocDate(val, langCode = "en") {
  if (!val) return "N/A";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val).toUpperCase();
    return new Intl.DateTimeFormat(langCode || "en", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(d).toUpperCase();
  } catch {
    return String(val).toUpperCase();
  }
}

const CURRENCY_RATES = {
  USD: 1.0,
  INR: 87.0,
  EUR: 0.92,
  GBP: 0.78,
  AED: 3.67,
  SAR: 3.75,
  CAD: 1.38,
  AUD: 1.52,
  SGD: 1.34,
  JPY: 155.0,
  CNY: 7.25,
};

function convertDocForCurrency(doc, targetCurrency) {
  if (!doc) return doc;
  const sourceCurrency = doc.currency_code || "USD";
  if (!targetCurrency || sourceCurrency === targetCurrency) return doc;

  const sourceRate = CURRENCY_RATES[sourceCurrency] || 1.0;
  const targetRate = CURRENCY_RATES[targetCurrency] || 1.0;
  const ratio = targetRate / sourceRate;

  const convertedItems = (doc.items || []).map((item) => {
    const rawVal = Number(item.unit_value || 0);
    const convertedUnitVal = rawVal * ratio;
    const newUnitVal = convertedUnitVal >= 10 ? Math.round(convertedUnitVal) : Number(convertedUnitVal.toFixed(2));
    const qty = Number(item.qty || 1);
    const newSubTotal = (qty * newUnitVal).toFixed(2);
    return {
      ...item,
      unit_value: newUnitVal,
      sub_total: newSubTotal,
    };
  });

  const totalGoodsValue = convertedItems.reduce((acc, it) => acc + Number(it.sub_total || 0), 0);
  const taxRate = Number(doc.tax_rate || 0);
  const tax2Rate = Number(doc.tax2_rate || 0);
  const taxAmount = (totalGoodsValue * taxRate) / 100;
  const tax2Amount = (totalGoodsValue * tax2Rate) / 100;
  const finalTotalAmount = totalGoodsValue + taxAmount + tax2Amount;

  return {
    ...doc,
    currency_code: targetCurrency,
    total_goods_value: totalGoodsValue.toFixed(2),
    tax_amount: taxAmount.toFixed(2),
    tax2_amount: tax2Amount.toFixed(2),
    final_total_amount: finalTotalAmount.toFixed(2),
    total_amount_words: String(finalTotalAmount.toFixed(2)),
    items: convertedItems,
  };
}

export function getCurrencyForLangCode(langCode, docCurrency = "USD") {
  const code = (langCode || "").toLowerCase().split("-")[0];
  const euroLangs = ["de", "fr", "es", "it", "nl", "pt", "el", "sv", "da", "fi", "cs", "ro", "hu", "pl"];
  if (euroLangs.includes(code)) return "EUR";
  if (code === "ar") return "AED";
  if (code === "hi" || code === "ta") return "INR";
  return docCurrency || "USD";
}

function ExportDocumentPreview({ document: rawDocument, type, langCode = "en", targetCurrency }) {
  const activeCurrency = targetCurrency || getCurrencyForLangCode(langCode, rawDocument?.currency_code);
  const document = activeCurrency ? convertDocForCurrency(rawDocument, activeCurrency) : rawDocument;
  const isPacking = type === "packing";
  const t = getDocTranslation(langCode);
  const tr = (val) => translateDocValue(val, langCode);
  const value = (entry) => (entry === undefined || entry === null || entry === "" ? (t.val_na || "N/A") : String(entry));
  const totalNetKg = Number(document.total_net_weight_kg || 0);

  // Dynamic Weight Unit calculation (GRAMS, KILOGRAMS, TONNES)
  const selectedWeightUnit = String(document.total_gross_weight_unit || "GRAMS").toUpperCase();
  const weightInfo = getDocWeightInfo(totalNetKg, selectedWeightUnit, langCode);

  const Field = ({ label, children }) => (
    <p><b>{label}:</b> <span>{value(children)}</span></p>
  );

  const senderName = document.sender_name || (t.val_na || "N/A");
  const senderAddress = document.sender_address || (t.val_na || "N/A");
  const senderContact = document.sender_contact || (t.val_na || "N/A");
  const senderEmail = document.sender_email || (t.val_na || "N/A");
  const senderTaxId = document.sender_tax_id || (t.val_na || "N/A");

  const receiverName = document.receiver_name ? tr(document.receiver_name) : (t.val_na || "N/A");
  const receiverAddress = document.receiver_address || (t.val_na || "N/A");
  const receiverContact = document.receiver_contact || (t.val_na || "N/A");
  const receiverEmail = document.receiver_email || (t.val_na || "N/A");
  const receiverTaxId = document.receiver_tax_id || (t.val_na || "N/A");

  const importerName = document.importer_name ? tr(document.importer_name) : (t.val_na || "N/A");
  const importerAddress = document.importer_address || (t.val_na || "N/A");
  const importerContact = document.importer_contact || (t.val_na || "N/A");
  const importerEmail = document.importer_email || (t.val_na || "N/A");
  const importerTaxId = document.importer_tax_id || (t.val_na || "N/A");

  const complianceText = document.other_information_compliance_details ? tr(document.other_information_compliance_details) : (t.val_na || "N/A");
  const signatoryName = document.signatory_name || (t.val_na || "N/A");
  const signatoryDesignation = document.signatory_designation ? tr(document.signatory_designation) : (t.val_na || "N/A");

  const itemRows = document.items?.map((item, index) =>
    isPacking ? (
      <tr key={item.id || index}>
        <td>{index + 1}</td>
        <td>{item.qty || 1}</td>
        <td>
          <b>{tr(item.product_name)}</b>
          {(item.size || item.color) && (
            <div style={{ fontSize: "10px", color: "var(--admin-ink-soft)" }}>
              {[item.size && `- ${t.size || "Size"}: ${tr(item.size)}`, item.color && `${t.color || "Color"}: ${tr(item.color)}`].filter(Boolean).join(" ")}
            </div>
          )}
        </td>
        <td>{item.hs_code || document.hs_code || "84433210"}</td>
        <td>{(Number(item.unit_net_weight || 0) * 1000).toFixed(2)}</td>
        <td>{tr(item.uom || "PCS")}</td>
      </tr>
    ) : (
      <tr key={item.id || index}>
        <td>{index + 1}</td>
        <td>
          {tr(item.product_name)}
          {(item.size || item.color) && (
            <div style={{ fontSize: "10px", color: "var(--admin-ink-soft)" }}>
              {[item.size && `- ${t.size || "Size"}: ${tr(item.size)}`, item.color && `${t.color || "Color"}: ${tr(item.color)}`].filter(Boolean).join(" ")}
            </div>
          )}
        </td>
        <td>{item.hs_code || document.hs_code || "84433210"}</td>
        <td>{tr(item.country_of_origin || document.country_of_origin || "India")}</td>
        <td>{item.qty || 1} {tr(item.uom || "PCS")}</td>
        <td>{document.currency_code || "USD"} {Math.round(Number(item.unit_value || 0))}</td>
        <td>{document.currency_code || "USD"} {Number(item.sub_total || Number(item.qty || 1) * Math.round(Number(item.unit_value || 0)) || 0).toFixed(2)}</td>
        <td>{(Number(item.unit_net_weight || 0) * 1000).toFixed(2)}</td>
        <td>{(Number(item.qty || 1) * Number(item.unit_net_weight || 0) * 1000).toFixed(2)}</td>
      </tr>
    )
  );

  // Extract all configured taxes (up to 5 max) without Tax 1/Tax 2 prefix
  const taxEntries = [
    { type: document.tax_type, rate: document.tax_rate, amount: document.tax_amount },
    { type: document.tax2_type, rate: document.tax2_rate, amount: document.tax2_amount },
    { type: document.tax3_type, rate: document.tax3_rate, amount: document.tax3_amount },
    { type: document.tax4_type, rate: document.tax4_rate, amount: document.tax4_amount },
    { type: document.tax5_type, rate: document.tax5_rate, amount: document.tax5_amount },
  ].filter((t) => t.type || Number(t.rate) > 0 || Number(t.amount) > 0);

  const amountInWordsText = formatAmountInWords(
    document.final_total_amount || document.total_goods_value || document.total_amount_words,
    document.currency_code || "USD",
    langCode
  );

  return (
    <article
      id="export-document-to-print"
      className={`export-document export-document--${type} notranslate`}
      data-document-id={document.id}
      data-document-type={type}
      data-language={langCode}
      translate="no"
    >
      {/* ── Header ── */}
      <div className="export-document__title">
        {isPacking ? t.packing_list : type === "commercial" ? t.commercial_invoice : t.proforma_invoice}
      </div>
      <header className="export-document__header-box">
        <img className="export-document__logo" src={brandLogo} alt="Saaluvesa Enterprises" />
        <div className="export-document__header-info">
          <h2>{document.sender_name || "Saaluvesa Enterprises Private Limited"}</h2>
          <p>{document.sender_address || "Dr.No.18/76, Thiru.Ve.Ka. St, Punjai Puliampatti, SATHYAMANGALAM, ERODE, TAMIL NADU. -638459"}</p>
          <p className="export-document__reg-details">
            <b>{t.reg_cin || "C.I.N :"}</b> U46900TZ2025PTC36041 | <b>{t.reg_roc || "ROC COIMBATORE - REG. NO :"}</b> 036041<br />
            <b>{t.reg_gst || "GST -"}</b> 33ABRCS3304A1ZR | <b>{t.reg_iec || "Import Export code -"}</b> ABRCS3304A | <b>{t.reg_icegate || "ICEGATE ID -"}</b> ABRCS3304APIE000
          </p>
        </div>
      </header>

      {/* ── Dashed Separator Box ── */}
      <div className="export-document__dashed-box" />

      {isPacking ? (
        <>
          {/* ── Packing List: right-aligned meta ── */}
          <div className="export-document__packing-meta">
            <span><b>{t.page || "Page"}:</b> <span style={{ textDecoration: "underline" }}>1 {t.of || "of"} 1</span></span>
            <span><b>{t.date || "Date"}:</b> {formatDocDate(document.shipment_date, langCode)}</span>
            <span><b>{t.invoice_number || "Invoice Number"}:</b> {value(document.invoice_no)}</span>
            <span><b>{t.shipment_date_upper || t.shipment_date || "SHIPMENT DATE"}:</b> {formatDocDate(document.shipment_date, langCode)}</span>
          </div>
          {/* ── References row ── */}
          <div className="export-document__references">
            <span className="export-document__ref-underline"><b>{t.invoice_no || "Invoice No"}:</b> {value(document.invoice_no)}</span>
            <span className="export-document__ref-right">
              <span><b>{t.invoice_date || "Invoice Date"}:</b> {formatDocDate(document.shipment_date, langCode)}</span>
              <span><b>{t.file_number || "File Number"}:</b> {value(document.file_number)}</span>
            </span>
          </div>
          {/* ── SHIPPER / CONSIGNEE / BILL TO ── */}
          <div className="export-document__grid export-document__grid--three">
            <section>
              <h3>{t.shipper || "SHIPPER"}</h3>
              <div className="export-doc-party">
                <b>{senderName}</b>
                <span>{senderAddress}</span>
              </div>
            </section>
            <section>
              <h3>{t.consignee || "CONSIGNEE"}</h3>
              <div className="export-doc-party">
                <b>{receiverName}</b>
                <span>{receiverAddress}</span>
              </div>
            </section>
            <section>
              <h3>{t.bill_to || "BILL TO"}</h3>
              <div className="export-doc-party">
                <b>{importerName}</b>
                <span>{importerAddress}</span>
              </div>
            </section>
          </div>
          {/* ── Shipment Information ── */}
          <section className="export-document__shipment">
            <h3>{t.shipment_info || "SHIPMENT INFORMATION"}</h3>
            <div>
              <Field label={t.letter_of_credit_no || "Letter of Credit No"}>{document.letter_of_credit_no}</Field>
              <Field label={t.customer_po_no || "Customer PO No"}>{document.customer_po_no}</Field>
              <Field label={t.po_date || "PO Date"}>{formatDocDate(document.po_date, langCode)}</Field>
              <Field label={t.currency || "Currency"}>{document.currency_code || "USD"}</Field>
              <Field label={t.ref_no || "Ref No"}>{document.shipment_ref_no}</Field>
              <Field label={t.payment_terms || "Payment Terms"}>{tr(document.payment_method || "Bank Transfer")}</Field>
              <Field label={t.incoterms_desc || "Incoterms Desc."}>{document.incoterms || "DAP"}</Field>
              <Field label={t.awb_bl_no || "AWB/BL No"}>{document.awb_bl_no}</Field>
            </div>
            <div>
              <Field label={t.mode_of_transportation || "Mode of Transportation"}>{tr(document.mode_of_transportation || "Air")}</Field>
              <Field label={t.transportation_terms || "Transportation Terms"}>{tr(document.transportation_terms || "EXW")}</Field>
              <Field label={t.number_of_packages || "Number of Packages"}>{document.no_of_packages || "1"}</Field>
              <Field label={`${t.gross_weight || "Gross Weight"} (${weightInfo.shortUnit})`}>{weightInfo.displayWithUnit}</Field>
            </div>
          </section>
        </>
      ) : (
        <>
          {/* ── Commercial / Proforma: date/invoice/awb row ── */}
          <div className="export-document__meta">
            <span><b>{t.date || "Date"}:</b> {formatDocDate(document.shipment_date, langCode)}</span>
            <span><b>{t.invoice_number || "Invoice Number"}:</b> {value(document.invoice_no)}</span>
            <span><b>{t.awb_number || t.awb_bl || "Air Waybill Number"}:</b> {value(document.awb_bl_no)}</span>
          </div>
          <h3 className="export-document__bar">{t.general_info || "General Information"}</h3>
          <div className="export-document__grid">
            <section>
              <h3>{t.sender_details || "Sender Details"}</h3>
              <div className="export-doc-party">
                <Field label={t.name || "Name"}>{senderName}</Field>
                <Field label={t.address || "Address"}>{senderAddress}</Field>
                <Field label={t.contact_number || "Contact Number"}>{senderContact}</Field>
                <Field label={t.email || "Email"}>{senderEmail}</Field>
                <Field label={t.tax_id || "Tax ID No."}>{senderTaxId}</Field>
              </div>
            </section>
            <section>
              <h3>{t.shipment_details || "Shipment Details"}</h3>
              <div className="export-doc-party">
                <Field label={t.shipment_date_upper || t.shipment_date || "SHIPMENT DATE"}>{formatDocDate(document.shipment_date, langCode)}</Field>
                <Field label={t.shipment_ref_no || "Shipment Reference No."}>{document.shipment_ref_no}</Field>
                <Field label={t.reason_for_export || "Reason for Export"}>{tr(document.reason_for_export || "Commercial")}</Field>
                <Field label={t.type_of_export || "Type of Export"}>{tr(document.type_of_export || "Permanent")}</Field>
                <Field label={t.export_license_no || "Export License No."}>{document.export_license_no}</Field>
                <Field label={t.import_license_no || "Import License No."}>{document.import_license_no}</Field>
                <Field label={t.incoterms || "INCOTERMS"}>{document.incoterms || "DAP"}</Field>
                <Field label={t.currency_code || "Currency Code"}>{document.currency_code || "USD"}</Field>
                <Field label={t.payment_method || "Payment Method"}>{tr(document.payment_method || "Bank Transfer")}</Field>
              </div>
            </section>
          </div>
          <div className="export-document__grid" style={{ borderTop: "none" }}>
            <section>
              <h3>{t.receiver_details || "Receiver Details"}</h3>
              <div className="export-doc-party">
                <Field label={t.name || "Name"}>{receiverName}</Field>
                <Field label={t.address || "Address"}>{receiverAddress}</Field>
                <Field label={t.contact_number || "Contact Number"}>{receiverContact}</Field>
                <Field label={t.email || "Email"}>{receiverEmail}</Field>
                <Field label={t.tax_id || "Tax ID No."}>{receiverTaxId}</Field>
              </div>
            </section>
            <section>
              <h3>{t.importer_details || "Importer of Record Details"}</h3>
              <div className="export-doc-party">
                <Field label={t.name || "Name"}>{importerName}</Field>
                <Field label={t.address || "Address"}>{importerAddress}</Field>
                <Field label={t.contact_number || "Contact Number"}>{importerContact}</Field>
                <Field label={t.email || "Email"}>{importerEmail}</Field>
                <Field label={t.tax_id || "Tax ID No."}>{importerTaxId}</Field>
              </div>
            </section>
          </div>
        </>
      )}

      {/* ── Items table ── */}
      <table>
        <thead>
          <tr>
            {isPacking ? (
              <>
                <th>{t.col_nos || t.col_num || "NOs"}</th>
                <th>{t.col_quantity || t.col_qty || "QUANTITY"}</th>
                <th>{t.col_description || t.col_product || "DESCRIPTION"}</th>
                <th>{t.col_hsn_code || t.col_hs_code || "HSN CODE"}</th>
                <th>{t.col_net_weight_in_grams || t.col_total_weight || "NET WEIGHT IN GRAMS"}</th>
                <th>{t.col_unit || t.col_uom || "UNIT"}</th>
              </>
            ) : (
              <>
                <th>{t.col_num || "No."}</th>
                <th>{t.col_item_desc || t.col_product || "Item Description"}</th>
                <th>{t.col_hs_code || "HS Code"}</th>
                <th>{t.col_country_origin || t.col_origin || "Country of Origin"}</th>
                <th>{t.col_qty || "Qty"} {t.col_uom || "UOM"}</th>
                <th>{t.col_unit_value || t.col_unit_price || "Unit Value"}</th>
                <th>{t.col_subtotal_value || t.col_subtotal || "Sub-Total Value"}</th>
                <th>{t.col_unit_net_wt || t.col_unit_weight || "Unit Net Wt."}</th>
                <th>{t.col_net_weight_g || t.col_total_weight || "Net Weight (g)"}</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {itemRows}
          <tr><td colSpan={isPacking ? 6 : 9} style={{ height: "16px" }}></td></tr>
          <tr><td colSpan={isPacking ? 6 : 9} style={{ height: "16px" }}></td></tr>
        </tbody>
      </table>

      {/* ── Totals / compliance / package ── */}
      {isPacking ? (
        <>
          <div className="export-document__packing-totals-wrapper">
            <b className="export-document__packing-totals-label">{t.total || "TOTAL:"}</b>
            <table className="export-document__packing-totals-table">
              <thead>
                <tr>
                  <th>{t.no_pkgs || "NO. PKGS"}</th>
                  <th>{t.total_gross_weight || "TOTAL GROSS WEIGHT"}<br />{weightInfo.unitLabel}</th>
                  <th>{t.net_weight_lbs || "NET WEIGHT LBS"}</th>
                  <th>{t.net_weight_kgs || "NET WEIGHT KGS"}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{value(document.no_of_packages || "1")}</td>
                  <td>{weightInfo.formattedValue}</td>
                  <td>{(totalNetKg * 2.20462).toFixed(2)}</td>
                  <td>{totalNetKg.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <section className="export-document__package">
            <b>{t.package_description || "PACKAGE DESCRIPTION"}:</b>
            <p>{tr(document.package_description || "Apparel and Textiles in corrugated boxes")}</p>
          </section>
        </>
      ) : (
        <>
          <div className="export-document__compliance-wrap">
            <b>{t.compliance || t.terms_conditions || "OTHER INFORMATION AND COMPLIANCE DETAILS"}:</b>
            <div className="export-document__compliance-body">
              <div className="export-document__compliance-box">
                {complianceText}
              </div>
              <div className="export-document__compliance-totals">
                <div><span>{t.packages || "No. of Packages"}</span><span>{value(document.no_of_packages || "1")}</span></div>
                <div><span>{t.total_cost || "Total Goods Value"}</span><span>{document.currency_code || "USD"} {Number(document.total_goods_value || 0).toFixed(2)}</span></div>
                <div><span><b>{t.total_weight || "Total Weight"}<br />{weightInfo.unitLabel}</b></span><span>{weightInfo.displayWithUnit}</span></div>
              </div>
            </div>
          </div>
          <div className="export-document__invoice-tax-totals" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px", marginTop: "8px", fontSize: "11px", fontWeight: "700" }}>
            <div>{t.total_cost || "Total Goods Value"}: {document.currency_code || "USD"} {Number(document.total_goods_value || 0).toFixed(2)}</div>
            {taxEntries.map((tax, idx) => {
              const taxName = tax.type ? tr(tax.type) : (t.tax || "Tax");
              const taxLabel = Number(tax.rate) > 0 ? `${taxName} (${Number(tax.rate).toFixed(2)}%)` : taxName;
              return (
                <div key={idx}>
                  {taxLabel}: {document.currency_code || "USD"} {Number(tax.amount || 0).toFixed(2)}
                </div>
              );
            })}
            <div>{t.final_total_amount || t.total_goods_value_final || "Final Total Amount"}: {document.currency_code || "USD"} {Number(document.final_total_amount || document.total_goods_value || 0).toFixed(2)}</div>
          </div>
          <p className="export-document__words" style={{ fontStyle: "italic", fontWeight: "700", fontSize: "11px", marginTop: "6px", marginBottom: "4px" }}>
            {t.total_amount_in_words || t.amount_in_words || "Amount in Words"}: {amountInWordsText}
          </p>
          <p className="export-document__certify">{t.certify || t.declaration}</p>
        </>
      )}

      {/* ── Spacer: pushes signature footer to bottom ── */}
      <div style={{ flexGrow: 1 }} />

      {/* ── Signature footer ── */}
      <footer className="export-document__footer">
        <div className="export-document__footer-row">
          <span className="export-document__footer-label"><b>{t.signature || "Signature"}:</b></span>
          <span className="export-document__footer-line"></span>
        </div>
        <div className="export-document__footer-row">
          <span className="export-document__footer-label"><b>{t.name || "Name"}:</b></span>
          <span className="export-document__footer-line">{signatoryName}</span>
        </div>
        <div className="export-document__footer-row">
          <span className="export-document__footer-label"><b>{t.authorized_signatory || t.designation_title || "Designation/Title"}:</b></span>
          <span className="export-document__footer-line">{signatoryDesignation}</span>
        </div>
      </footer>
    </article>
  );
}


const defaultExportDocValues = () => ({
  sender_name: "Saaluvesa Enterprises Private Limited",
  sender_email: "info@saaluvesa.com",
  sender_address: "Dr.No.18/76, Thiru.Ve.Ka. St, Punjai Puliampatti, SATHYAMANGALAM, ERODE, TAMIL NADU. -638459",
  additional_company_details: "C.I.N : U46900TZ2025PTC36041 | ROC COIMBATORE - REG. NO : 036041\nGST - 33ABRCS3304A1ZR | Import Export code - ABRCS3304A | ICEGATE ID - ABRCS3304APIE000",
  sender_contact: "+91 94884 10884",
  sender_tax_id: "33ABRCS3304A1ZR",
  importer_name: "",
  importer_email: "",
  importer_address: "",
  importer_contact: "",
  importer_tax_id: "",
  receiver_name: "",
  receiver_email: "",
  receiver_address: "",
  receiver_contact: "",
  receiver_tax_id: "",
  invoice_no: `PI-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900 + 100))}`,
  shipment_date: new Date().toISOString().split("T")[0],
  shipment_ref_no: "",
  reason_for_export: "Commercial",
  type_of_export: "Permanent",
  export_license_no: "",
  import_license_no: "",
  incoterms: "DAP",
  currency_code: "USD",
  payment_method: "Bank Transfer",
  letter_of_credit_no: "",
  customer_po_no: "",
  po_date: "",
  file_number: "",
  tax_type: "",
  tax_rate: "",
  tax2_type: "",
  tax2_rate: "",
  mode_of_transportation: "Air",
  transportation_terms: "EXW",
  awb_bl_no: "",
  no_of_packages: "1",
  package_description: "Apparel and Textiles in corrugated boxes",
  total_gross_weight_unit: "GRAMS",
  hs_code: "61091000",
  country_of_origin: "India",
  other_information_compliance_details: "Good Condition. Export cargo properly packaged and verified.",
  signatory_name: "Saaluvesa Enterprises Private Limited",
  signatory_designation: "Authorized Signatory",
});

function ExportDocuments() {
  const { pushToast, confirm, query: shellQuery } = useOutletContext();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [activeSavedDoc, setActiveSavedDoc] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [viewingHtmlType, setViewingHtmlType] = useState(null);
  const [docLang, setDocLang] = useState(ADMIN_LANGUAGES[0]);
  const [pendingAutoPdf, setPendingAutoPdf] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [paste, setPaste] = useState("");

  const [formState, setFormState] = useState(defaultExportDocValues());
  const [items, setItems] = useState([blankExportItem()]);
  const [taxesList, setTaxesList] = useState([{ name: "GST", rate: "18" }]);
  const [fieldErrors, setFieldErrors] = useState({});
  const selectedDocLanguage = docLang.translateCode || docLang.code;
  const documentPreviewRef = useRef(null);

  const extractTaxesFromDoc = (doc) => {
    if (!doc) return [{ name: "GST", rate: "18" }];
    const list = [];
    if (doc.tax_type || doc.tax_rate) list.push({ name: doc.tax_type || "", rate: doc.tax_rate !== null && doc.tax_rate !== undefined ? String(doc.tax_rate) : "" });
    if (doc.tax2_type || doc.tax2_rate) list.push({ name: doc.tax2_type || "", rate: doc.tax2_rate !== null && doc.tax2_rate !== undefined ? String(doc.tax2_rate) : "" });
    if (doc.tax3_type || doc.tax3_rate) list.push({ name: doc.tax3_type || "", rate: doc.tax3_rate !== null && doc.tax3_rate !== undefined ? String(doc.tax3_rate) : "" });
    if (doc.tax4_type || doc.tax4_rate) list.push({ name: doc.tax4_type || "", rate: doc.tax4_rate !== null && doc.tax4_rate !== undefined ? String(doc.tax4_rate) : "" });
    if (doc.tax5_type || doc.tax5_rate) list.push({ name: doc.tax5_type || "", rate: doc.tax5_rate !== null && doc.tax5_rate !== undefined ? String(doc.tax5_rate) : "" });
    return list.length > 0 ? list : [{ name: "", rate: "" }];
  };

  const addTaxRow = () => {
    if (taxesList.length >= 5) {
      pushToast("error", "Maximum 5 taxes limit reached.");
      return;
    }
    setTaxesList((prev) => [...prev, { name: "", rate: "" }]);
  };

  const removeTaxRow = (index) => {
    setTaxesList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTaxRow = (index, field, val) => {
    setTaxesList((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: val } : t)));
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await api("/admin/export-documents");
      const docList = Array.isArray(data) ? data : [];
      setRows(docList);
      setActiveSavedDoc((current) => {
        if (current) return docList.find((doc) => doc.id === current.id) || null;
        return docList[0] || null;
      });
      return docList;
    } catch (err) {
        pushToast("error", err.message || "Failed to load export documents.");
        setRows([]);
        return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreateModal = () => {
    setEditingDoc(null);
    setFormState(defaultExportDocValues());
    setItems([blankExportItem()]);
    setTaxesList([{ name: "GST", rate: "18" }]);
    setError("");
    setFieldErrors({});
    setShowBulkPaste(false);
    setFormOpen(true);
  };

  const openEditModal = (doc) => {
    setEditingDoc(doc);
    setActiveSavedDoc(doc);
    setFormState({
      sender_name: doc.sender_name ?? "",
      sender_email: doc.sender_email ?? "",
      sender_address: doc.sender_address ?? "",
      additional_company_details: doc.additional_company_details ?? "",
      sender_contact: doc.sender_contact ?? "",
      sender_tax_id: doc.sender_tax_id ?? "",
      importer_name: doc.importer_name ?? "",
      importer_email: doc.importer_email ?? "",
      importer_address: doc.importer_address ?? "",
      importer_contact: doc.importer_contact ?? "",
      importer_tax_id: doc.importer_tax_id ?? "",
      receiver_name: doc.receiver_name ?? "",
      receiver_email: doc.receiver_email ?? "",
      receiver_address: doc.receiver_address ?? "",
      receiver_contact: doc.receiver_contact ?? "",
      receiver_tax_id: doc.receiver_tax_id ?? "",
      invoice_no: doc.invoice_no ?? "",
      shipment_date: doc.shipment_date ? doc.shipment_date.split("T")[0] : "",
      shipment_ref_no: doc.shipment_ref_no ?? "",
      reason_for_export: doc.reason_for_export ?? "Commercial",
      type_of_export: doc.type_of_export ?? "Permanent",
      export_license_no: doc.export_license_no ?? "",
      import_license_no: doc.import_license_no ?? "",
      incoterms: doc.incoterms ?? "DAP",
      currency_code: doc.currency_code ?? "USD",
      payment_method: doc.payment_method ?? "Bank Transfer",
      letter_of_credit_no: doc.letter_of_credit_no ?? "",
      customer_po_no: doc.customer_po_no ?? "",
      po_date: doc.po_date ? doc.po_date.split("T")[0] : "",
      file_number: doc.file_number ?? "",
      tax_type: doc.tax_type ?? "",
      tax_rate: doc.tax_rate !== null && doc.tax_rate !== undefined ? String(doc.tax_rate) : "",
      tax2_type: doc.tax2_type ?? "",
      tax2_rate: doc.tax2_rate !== null && doc.tax2_rate !== undefined ? String(doc.tax2_rate) : "",
      mode_of_transportation: doc.mode_of_transportation ?? "Air",
      transportation_terms: doc.transportation_terms ?? "EXW",
      awb_bl_no: doc.awb_bl_no ?? "",
      no_of_packages: doc.no_of_packages !== null && doc.no_of_packages !== undefined ? String(doc.no_of_packages) : "1",
      package_description: doc.package_description ?? "",
      total_gross_weight_unit: doc.total_gross_weight_unit ?? "GRAMS",
      hs_code: doc.hs_code ?? "",
      country_of_origin: doc.country_of_origin ?? "India",
      other_information_compliance_details: doc.other_information_compliance_details ?? "",
      signatory_name: doc.signatory_name ?? "",
      signatory_designation: doc.signatory_designation ?? "",
    });
    setTaxesList(extractTaxesFromDoc(doc));
    setFieldErrors({});

    if (Array.isArray(doc.items) && doc.items.length > 0) {
      setItems(
        doc.items.map((it) => ({
          product_name: it.product_name ?? "",
          qty: it.qty !== undefined && it.qty !== null ? String(it.qty) : "",
          unit_value: it.unit_value !== undefined && it.unit_value !== null && it.unit_value !== "" ? String(Math.round(Number(it.unit_value))) : "",
          unit_net_weight: it.unit_net_weight !== undefined && it.unit_net_weight !== null ? String(Number(it.unit_net_weight) * 1000) : "0.00",
          uom: it.uom ?? "PCS",
          extra_price: it.extra_price ?? 0,
        })),
      );
    } else {
      setItems([blankExportItem()]);
    }
    setError("");
    setShowBulkPaste(false);
    setFormOpen(true);
  };

  const openViewModal = (doc) => {
    setViewingDoc(doc);
    setActiveSavedDoc(doc);
  };

  const deleteDocument = async (doc) => {
    const ok = await confirm({
      title: `Delete export document "${doc.invoice_no}"?`,
      message: `This will permanently delete export document "${doc.invoice_no}" for buyer "${doc.importer_name}". This action cannot be undone.`,
      confirmLabel: "Delete Document",
    });
    if (!ok) return;

    setDeletingId(doc.id);
    try {
      await api(`/admin/export-documents/${doc.id}`, { method: "DELETE" });
      pushToast("success", `Export document "${doc.invoice_no}" deleted successfully.`);
      if (viewingDoc && viewingDoc.id === doc.id) {
        setViewingDoc(null);
      }
      if (activeSavedDoc && activeSavedDoc.id === doc.id) {
        setActiveSavedDoc(null);
      }
      const remainingDocs = await load();
      setActiveSavedDoc(remainingDocs[0] || null);
    } catch (err) {
      pushToast("error", err.message || "Failed to delete export document.");
    } finally {
      setDeletingId(null);
    }
  };

  const getRenderedDocumentElement = () =>
    documentPreviewRef.current?.querySelector(".export-document") || null;

  // Capture the exact rendered document and produce a pixel-perfect PDF.
  // Strategy: clone the .export-document element into an off-screen container
  // fixed at exactly 794 px wide (A4 @ 96 dpi), let all existing CSS styles
  // apply so the layout is identical to the on-screen view, then capture with
  // html2canvas and fit everything onto one A4 page (scaling down only if the
  // content is taller than one page). This guarantees the PDF matches the view
  // regardless of modal size, browser zoom, or content language.
  const renderElementToPdf = async (el) => {
    const { default: html2canvas } = await import("html2canvas");
    const { jsPDF } = await import("jspdf");

    // ── A4 dimensions ────────────────────────────────────────────────────────
    const A4_W_PX  = 794;   // A4 width  in CSS px at 96 dpi
    const A4_H_PX  = 1123;  // A4 height in CSS px at 96 dpi
    const A4_W_MM  = 210;   // A4 width  in mm
    const A4_H_MM  = 297;   // A4 height in mm
    const MARGIN_MM = 8;    // page margin (mm, all sides)
    const CONTENT_W_MM = A4_W_MM - MARGIN_MM * 2; // 194 mm
    const CONTENT_H_MM = A4_H_MM - MARGIN_MM * 2; // 281 mm

    // ── Off-screen clone at exactly A4 width ─────────────────────────────────
    // We render a clone in a hidden container so all CSS classes/styles apply
    // and the width is forced to exactly 794 px (the natural A4 pixel width).
    const wrapper = window.document.createElement("div");
    wrapper.className = "notranslate";
    wrapper.setAttribute("translate", "no");
    Object.assign(wrapper.style, {
      position:   "fixed",
      top:        "-9999px",
      left:       "-9999px",
      width:      `${A4_W_PX}px`,
      minHeight:  `${A4_H_PX}px`,
      overflow:   "visible",
      background: "#ffffff",
      zIndex:     "-1",
    });

    const clone = el.cloneNode(true);
    clone.normalize();
    clone.classList.add("notranslate");
    clone.setAttribute("translate", "no");
    // Set min-height to A4 so the flex-grow spacer pushes the signature footer
    // to the bottom of the page, exactly matching the on-screen view layout.
    // height: auto allows overflow to grow beyond A4 if there is too much content.
    Object.assign(clone.style, {
      width:         `${A4_W_PX}px`,
      maxWidth:      `${A4_W_PX}px`,
      minHeight:     `${A4_H_PX}px`,
      height:        "auto",
      margin:        "0",
      padding:       "18px 22px",
      boxSizing:     "border-box",
      display:       "flex",
      flexDirection: "column",
    });

    wrapper.appendChild(clone);
    window.document.body.appendChild(wrapper);

    // Wait for images inside the clone to load
    const images = Array.from(clone.querySelectorAll("img"));
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload  = resolve;
          img.onerror = resolve;
        });
      }),
    );
    await document.fonts?.ready;
    // Two animation frames so the browser has fully laid out the clone
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const cloneH = clone.scrollHeight || clone.getBoundingClientRect().height || A4_H_PX;

    // ── Capture the clone ─────────────────────────────────────────────────────
    // scale: 3 gives very sharp text; windowWidth/windowHeight match the clone
    // exactly so html2canvas does not try to scroll or clip anything.
    const SCALE = 3;
    let canvas;
    try {
      canvas = await html2canvas(clone, {
        scale:        SCALE,
        useCORS:      true,
        allowTaint:   true,
        logging:      false,
        backgroundColor: "#ffffff",
        scrollX:      0,
        scrollY:      0,
        windowWidth:  A4_W_PX,
        windowHeight: cloneH,
        width:        A4_W_PX,
        height:       cloneH,
        x:            0,
        y:            0,
      });
    } finally {
      window.document.body.removeChild(wrapper);
    }

    // ── Build PDF ─────────────────────────────────────────────────────────────
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

    // Content size in mm that this canvas represents
    const canvasContentW_mm = CONTENT_W_MM; // canvas width maps to A4 content width
    const canvasContentH_mm = (cloneH / A4_W_PX) * CONTENT_W_MM; // proportional height

    const fitsOnePage = canvasContentH_mm <= CONTENT_H_MM;

    if (fitsOnePage) {
      // ── Single-page: draw the entire canvas scaled to fit one A4 page ──────
      // If the document is shorter than A4, it sits at the top and the rest
      // of the page is white (which is correct – matching the view).
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.97),
        "JPEG",
        MARGIN_MM,
        MARGIN_MM,
        CONTENT_W_MM,
        canvasContentH_mm,
      );
    } else {
      // ── Multi-page: slice the canvas into A4-height strips ────────────────
      // Scale factor: canvas pixels → mm
      const pxToMm = CONTENT_W_MM / canvas.width; // mm per canvas pixel
      // How many canvas pixels fit in one page's content area
      const pageStripPx = Math.floor(CONTENT_H_MM / pxToMm);

      for (let srcY = 0, page = 0; srcY < canvas.height; page += 1) {
        const stripH = Math.min(pageStripPx, canvas.height - srcY);
        const strip  = window.document.createElement("canvas");
        strip.width  = canvas.width;
        strip.height = stripH;
        strip.getContext("2d").drawImage(
          canvas,
          0, srcY, canvas.width, stripH,
          0, 0,    canvas.width, stripH,
        );
        if (page > 0) pdf.addPage();
        const drawH = stripH * pxToMm;
        pdf.addImage(
          strip.toDataURL("image/jpeg", 0.97),
          "JPEG",
          MARGIN_MM,
          MARGIN_MM,
          CONTENT_W_MM,
          drawH,
        );
        srcY += stripH;
      }
    }

    return { pdf, canvas };
  };

  // Generate and download a PDF from the same element shown in the view.
  const captureElementToPdf = async (el, resolvedFilename) => {
    const { pdf } = await renderElementToPdf(el);
    pdf.save(resolvedFilename);
  };

  // Generate and open a PDF from the same element shown in the view.
  const captureElementToPdfPreview = async (el) => {
    const { pdf } = await renderElementToPdf(el);
    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 120000);
  };

  const pendingPdfRef = useRef(null);

  const downloadPdf = async (doc, documentType, filename) => {
    if (!doc) return;
    const resolvedFilename = filename || `${doc.invoice_no || "document"}-${documentType}.pdf`;
    const printEl = getRenderedDocumentElement();
    if (printEl && viewingHtmlType === documentType) {
      try {
        pushToast("info", `Generating translated ${resolvedFilename}...`);
        await captureElementToPdf(printEl, resolvedFilename);
        pushToast("success", `${resolvedFilename} downloaded successfully.`);
        return;
      } catch (err) {
        console.error("Client-side PDF generation error:", err);
        pushToast("error", err.message || "Could not generate the PDF.");
        return;
      }
    }
    pendingPdfRef.current = { type: documentType, filename: resolvedFilename };
    setViewingDoc(doc);
    setViewingHtmlType(documentType);
  };

  const previewPdf = async (doc, documentType) => {
    if (!doc) return;
    const printEl = getRenderedDocumentElement();
    if (printEl && viewingHtmlType === documentType) {
      try {
        pushToast("info", `Preparing translated PDF preview...`);
        await captureElementToPdfPreview(printEl);
        return;
      } catch (err) {
        console.error("Client-side preview error:", err);
        pushToast("error", err.message || "Could not preview the PDF.");
        return;
      }
    }
    pendingPdfRef.current = { type: documentType, filename: null };
    setViewingDoc(doc);
    setViewingHtmlType(documentType);
  };

  // When a PDF was requested before the document element was mounted (e.g. from
  // the details view), open the HTML preview modal, then capture the already
  // dictionary-translated element.
  useEffect(() => {
    if (!viewingHtmlType || !pendingPdfRef.current) return;
    if (pendingPdfRef.current.type !== viewingHtmlType) return;
    const task = pendingPdfRef.current;
    pendingPdfRef.current = null;

    const timer = setTimeout(async () => {
      const el = getRenderedDocumentElement();
      if (!el) return;
      try {
        if (task.filename) {
          pushToast("info", `Generating translated ${task.filename}...`);
          await captureElementToPdf(el, task.filename);
          pushToast("success", `${task.filename} downloaded successfully.`);
        } else {
          pushToast("info", `Preparing translated PDF preview...`);
          await captureElementToPdfPreview(el);
        }
      } catch (err) {
        console.error("Auto PDF generation error:", err);
        pushToast("error", err.message || "Could not generate the PDF.");
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [viewingHtmlType, selectedDocLanguage]);

  const handleFieldChange = (key, val) => {
    if (key === "currency_code" && formState.currency_code !== val) {
      const oldCurrency = formState.currency_code || "USD";
      const newCurrency = val;
      const oldRate = CURRENCY_RATES[oldCurrency] || 1.0;
      const newRate = CURRENCY_RATES[newCurrency] || 1.0;

      if (oldRate > 0 && newRate > 0) {
        const ratio = newRate / oldRate;
        setItems((prevItems) =>
          prevItems.map((item) => {
            const rawVal = Number(item.unit_value);
            if (!item.unit_value || isNaN(rawVal) || rawVal <= 0) return item;
            const converted = rawVal * ratio;
            const formattedVal = converted >= 10 ? String(Math.round(converted)) : converted.toFixed(2);
            return { ...item, unit_value: formattedVal };
          })
        );
      }
    }
    setFormState((prev) => ({ ...prev, [key]: val }));
  };

  const setItem = (index, key, value) => {
    setItems((old) => old.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const addItemRow = () => {
    setItems((old) => [...old, blankExportItem()]);
  };

  const removeItemRow = (index) => {
    setItems((old) => (old.length > 1 ? old.filter((_, i) => i !== index) : [blankExportItem()]));
  };

  const addPastedItems = () => {
    const parsed = paste
      .split(/\r?\n/)
      .map((line) => {
        const [product_name, qty, unit_value, unit_net_weight] = line.split(/\t|,/).map((value) => value.trim());
        const roundedUnit = unit_value !== "" && !isNaN(Number(unit_value)) ? String(Math.round(Number(unit_value))) : unit_value;
        return product_name ? { product_name, qty, unit_value: roundedUnit, unit_net_weight: unit_net_weight || "0.00", uom: "PCS" } : null;
      })
      .filter(Boolean);

    if (!parsed.length) {
      return setError("Paste format: Product Name, Quantity, Price, Unit Net Weight (Grams) per line.");
    }
    setItems((old) => old.filter((item) => item.product_name || item.qty || item.unit_value).concat(parsed));
    setPaste("");
    setError("");
    setShowBulkPaste(false);
  };

  const saveForm = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setFieldErrors({});

    const errors = {};
    if (!formState.importer_name || !formState.importer_name.trim()) {
      errors.importer_name = "Importer (Buyer) name is required.";
    }
    if (!formState.invoice_no || !formState.invoice_no.trim()) {
      errors.invoice_no = "Invoice number is required.";
    }

    const hasInvalidItem =
      !items.length ||
      items.some(
        (item) => !item.product_name.trim() || Number(item.qty) <= 0 || item.unit_value === "" || Number(item.unit_value) < 0,
      );

    if (hasInvalidItem) {
      setError("Please add at least one product with a valid name, quantity > 0, and unit price.");
      errors.items = "Please add at least one product with a valid name, quantity > 0, and unit price.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const emptyToNull = (value) => (typeof value === "string" && !value.trim() ? null : value);
      const payload = {
        ...formState,
        sender_email: emptyToNull(formState.sender_email),
        importer_email: emptyToNull(formState.importer_email),
        receiver_email: emptyToNull(formState.receiver_email),
        shipment_date: emptyToNull(formState.shipment_date),
        po_date: emptyToNull(formState.po_date),
        tax_type: taxesList[0]?.name || null,
        tax_rate: Number(taxesList[0]?.rate || 0),
        tax2_type: taxesList[1]?.name || null,
        tax2_rate: Number(taxesList[1]?.rate || 0),
        tax3_type: taxesList[2]?.name || null,
        tax3_rate: Number(taxesList[2]?.rate || 0),
        tax4_type: taxesList[3]?.name || null,
        tax4_rate: Number(taxesList[3]?.rate || 0),
        tax5_type: taxesList[4]?.name || null,
        tax5_rate: Number(taxesList[4]?.rate || 0),
        items: items.map((item) => ({
          ...item,
          unit_value: item.unit_value !== "" ? Math.round(Number(item.unit_value)) : 0,
          unit_net_weight: Number(item.unit_net_weight || 0) / 1000,
        })),
      };

      let resultDoc = null;
      if (editingDoc) {
        resultDoc = await api(`/admin/export-documents/${editingDoc.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        pushToast("success", `Export document "${resultDoc.invoice_no}" updated successfully.`);
        if (viewingDoc && viewingDoc.id === editingDoc.id) {
          setViewingDoc(resultDoc);
        }
      } else {
        resultDoc = await api("/admin/export-documents", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        pushToast("success", `Export document "${resultDoc.invoice_no}" created successfully.`);
        setEditingDoc(resultDoc);
      }

      setActiveSavedDoc(resultDoc);
      await load();
      return resultDoc;
    } catch (err) {
      setError(err.message || "Failed to save export document details.");
    } finally {
      setSaving(false);
    }
  };

  // Live calculations for form summary
  const formTotals = items.reduce(
    (all, item) => ({
      quantity: all.quantity + (Number(item.qty) || 0),
      value: all.value + (Number(item.qty) || 0) * (item.unit_value !== "" ? Math.round(Number(item.unit_value)) : 0),
      weight: all.weight + (Number(item.qty) || 0) * (Number(item.unit_net_weight) || 0),
    }),
    { quantity: 0, value: 0, weight: 0 },
  );

  const calculatedTaxes = taxesList
    .map((t) => ({
      name: (t.name || "").trim() || "Tax",
      rate: Number(t.rate || 0),
      amount: Number(t.rate || 0) > 0 ? (formTotals.value * Number(t.rate || 0)) / 100 : 0,
    }))
    .filter((t) => t.rate > 0);

  const totalTaxVal = calculatedTaxes.reduce((sum, t) => sum + t.amount, 0);
  const calculatedFinalTotal = formTotals.value + totalTaxVal;

  const currentPreviewDoc = activeSavedDoc || {
    ...formState,
    tax_type: taxesList[0]?.name || null,
    tax_rate: Number(taxesList[0]?.rate || 0),
    tax_amount: calculatedTaxes[0]?.amount || 0,
    tax2_type: taxesList[1]?.name || null,
    tax2_rate: Number(taxesList[1]?.rate || 0),
    tax2_amount: calculatedTaxes[1]?.amount || 0,
    items: items.map((it, idx) => ({
      id: idx + 1,
      product_name: it.product_name || `Product ${idx + 1}`,
      qty: it.qty || 1,
      unit_value: it.unit_value !== "" ? Math.round(Number(it.unit_value)) : 0,
      sub_total: (Number(it.qty || 1) * (it.unit_value !== "" ? Math.round(Number(it.unit_value)) : 0)).toFixed(2),
      unit_net_weight: Number(it.unit_net_weight || 0) / 1000,
      uom: it.uom || "PCS",
    })),
    total_goods_value: formTotals.value.toFixed(2),
    final_total_amount: calculatedFinalTotal.toFixed(2),
    total_net_weight_kg: (formTotals.weight / 1000).toFixed(3),
    total_net_weight_lbs: ((formTotals.weight / 1000) * 2.20462262).toFixed(3),
  };

  const searchQuery = (localSearch || shellQuery || "").trim().toLowerCase();
  const filteredRows = rows.filter((r) => {
    if (!searchQuery) return true;
    const searchString = [
      r.invoice_no,
      r.importer_name,
      r.importer_email,
      r.importer_address,
      r.receiver_name,
      r.country_of_origin,
      r.mode_of_transportation,
      r.incoterms,
      r.currency_code,
      ...(r.items || []).map((it) => it.product_name),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return searchString.includes(searchQuery);
  });

  return (
    <div className="admin-page notranslate" translate="no">
      {/* ── Page Header matching reference image ── */}
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Orders report</p>
          <h2>Export documents</h2>
        </div>
        <div className="admin-page-heading__actions">
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={openCreateModal}
          >
            <Icon name="plus" size={17} />
            <span>Add export document</span>
          </button>
        </div>
      </div>

      {/* ── Main Saved Documents Table Card ── */}
      <div className="admin-card admin-card--table">
        <div className="export-docs-toolbar">
          <div className="export-docs-search">
            <Icon name="search" size={16} />
            <input
              type="search"
              placeholder="Search by invoice no, buyer, product, country..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
            {localSearch && (
              <button
                type="button"
                className="admin-icon-btn"
                style={{ width: 22, height: 22 }}
                onClick={() => setLocalSearch("")}
                aria-label="Clear search"
              >
                <Icon name="x" size={12} />
              </button>
            )}
          </div>
          <span className="export-docs-count">
            {filteredRows.length} {filteredRows.length === 1 ? "document" : "documents"}
          </span>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : filteredRows.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>Importer / Buyer</th>
                  <th>Shipment / Logistics</th>
                  <th>Products</th>
                  <th>Total Value</th>
                  <th>Status</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((doc) => (
                  <tr key={doc.id} className="admin-row" onClick={() => openViewModal(doc)}>
                    <td>
                      <span className="cell-invoice-badge">
                        <Icon name="file-text" size={14} />
                        {doc.invoice_no}
                      </span>
                      <small className="cell-meta-sub">Created: {fmtDate(doc.createdAt)}</small>
                    </td>
                    <td>
                      <strong>{doc.importer_name}</strong>
                      <small className="cell-meta-sub">
                        {doc.importer_email || doc.importer_address || "—"}
                      </small>
                    </td>
                    <td>
                      <span>{doc.shipment_date ? fmtDate(doc.shipment_date) : "—"}</span>
                      <small className="cell-meta-sub">
                        {doc.mode_of_transportation || "Air"} · {doc.incoterms || "DAP"}
                      </small>
                    </td>
                    <td>
                      <Badge tone="mint">
                        {doc.items?.length || 0} {doc.items?.length === 1 ? "item" : "items"}
                      </Badge>
                      <small className="cell-meta-sub">
                        {doc.total_net_weight_kg
                          ? String(doc.total_gross_weight_unit || "GRAMS").toUpperCase() === "KILOGRAMS"
                            ? `${Number(doc.total_net_weight_kg).toFixed(3)} kg`
                            : String(doc.total_gross_weight_unit || "GRAMS").toUpperCase() === "TONNES"
                            ? `${(Number(doc.total_net_weight_kg) / 1000).toFixed(4)} Tonnes`
                            : `${(Number(doc.total_net_weight_kg) * 1000).toFixed(0)} g`
                          : "—"}
                      </small>
                    </td>
                    <td>
                      <span className="cell-amount-strong">
                        {doc.currency_code || "USD"}{" "}
                        {Number(doc.final_total_amount || doc.total_goods_value || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <small className="cell-meta-sub">
                        Goods: {doc.currency_code || "USD"} {Number(doc.total_goods_value || 0).toFixed(2)}
                      </small>
                    </td>
                    <td>
                      <Badge tone={statusTone(doc.status)}>{doc.status || "Generated"}</Badge>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="admin-actions-cell">
                        {/* <button
                          type="button"
                          className="admin-action-btn admin-action-btn--view"
                          onClick={() => openViewModal(doc)}
                          title="View document details and PDF downloads"
                        >
                          <Icon name="eye" size={14} />
                          <span>View</span>
                        </button> */}
                        <button
                          type="button"
                          className="admin-action-btn admin-action-btn--edit"
                          onClick={() => openEditModal(doc)}
                          title="Edit export document"
                        >
                          <Icon name="pencil" size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="admin-action-btn admin-action-btn--delete"
                          onClick={() => deleteDocument(doc)}
                          disabled={deletingId === doc.id}
                          title="Delete export document"
                        >
                          {deletingId === doc.id ? <Spinner size={13} /> : <Icon name="trash" size={14} />}
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon="file-text"
            title="No export documents found"
            hint={
              searchQuery
                ? "No export documents match your search criteria. Try a different query."
                : "Create your first export document to generate commercial invoices, proforma invoices, and packing lists."
            }
            action={
              <button type="button" className="admin-btn admin-btn--primary" onClick={openCreateModal}>
                <Icon name="plus" size={16} />
                <span>Add export document</span>
              </button>
            }
          />
        )}
      </div>

      {/* ── Add / Edit Export Document Modal (Sections 1 to 8 + Document Options) ── */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingDoc ? `Generate Export Documents: ${editingDoc.invoice_no}` : "Generate Export Documents"}
        sub={
          editingDoc
            ? "Update shipment, buyer, and product details for this export document."
            : "Fill in the details below to generate and save your export document."
        }
        wide
      >
        <form className="admin-form" onSubmit={saveForm} autoComplete="off" noValidate>
          {/* Section 1: Sender Details */}
          <div className="export-form-section">
            <div className="export-form-section__head">
              <div>
                <h3>1. Sender Details</h3>
                {/* <p>Company information appearing as the exporter / shipper</p> */}
              </div>
            </div>
            <div className="admin-form-grid">
              <div className="admin-field">
                <label>Sender Name</label>
                <input
                  name="saalu_sender_name_field"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  value={formState.sender_name}
                  onChange={(e) => handleFieldChange("sender_name", e.target.value)}
                  placeholder="Company name"
                />
              </div>
              <div className="admin-field">
                <label>Sender Email</label>
                <input
                  name="saalu_sender_email_field"
                  type="text"
                  inputMode="email"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  value={formState.sender_email}
                  onChange={(e) => handleFieldChange("sender_email", e.target.value)}
                  placeholder="info@saaluvesa.com"
                />
              </div>
              <div className="admin-field admin-field--full">
                <label>Sender Address</label>
                <textarea
                  name="saalu_sender_address_field"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  rows="2"
                  value={formState.sender_address}
                  onChange={(e) => handleFieldChange("sender_address", e.target.value)}
                  placeholder="Full registered company address"
                />
              </div>
              <div className="admin-field admin-field--full">
                <label>Additional Company Details (Appears below company info)</label>
                <textarea
                  name="saalu_sender_additional_field"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  rows="2"
                  value={formState.additional_company_details}
                  onChange={(e) => handleFieldChange("additional_company_details", e.target.value)}
                  placeholder="C.I.N, ROC, GST, Import Export code, ICEGATE ID"
                />
              </div>
              <div className="admin-field">
                <label>Sender Contact Number</label>
                <input
                  name="saalu_sender_contact_field"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  value={formState.sender_contact}
                  onChange={(e) => handleFieldChange("sender_contact", e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>
              <div className="admin-field">
                <label>Sender Tax ID No.</label>
                <input
                  name="saalu_sender_tax_id_field"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  value={formState.sender_tax_id}
                  onChange={(e) => handleFieldChange("sender_tax_id", e.target.value)}
                  placeholder="33ABRCS3304A1ZR"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Importer of Record Details */}
          <div className="export-form-section">
            <div className="export-form-section__head">
              <div>
                <h3>2. Importer of Record Details</h3>
                {/* <p>Primary international customer or billing recipient</p> */}
              </div>
            </div>
            <div className="admin-form-grid">
              <div className="admin-field">
                <label>
                  Importer Name <span className="admin-req-star" style={{ color: "#e5484d", fontWeight: "bold", marginLeft: "4px" }}>*</span>
                </label>
                <input
                  name="saalu_importer_name_field"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  value={formState.importer_name}
                  className={fieldErrors.importer_name ? "admin-field-input--error" : ""}
                  onChange={(e) => {
                    handleFieldChange("importer_name", e.target.value);
                    if (fieldErrors.importer_name) setFieldErrors((prev) => ({ ...prev, importer_name: null }));
                  }}
                  placeholder=""
                />
                {fieldErrors.importer_name && (
                  <span className="admin-field-error-msg">{fieldErrors.importer_name}</span>
                )}
              </div>
              <div className="admin-field">
                <label>Importer Email <span className="admin-opt-badge">(Optional)</span></label>
                <input
                  name="saalu_importer_email_field"
                  type="text"
                  inputMode="email"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  value={formState.importer_email}
                  onChange={(e) => handleFieldChange("importer_email", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field admin-field--full">
                <label>Importer Address <span className="admin-opt-badge">(Optional)</span></label>
                <textarea
                  name="saalu_importer_address_field"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  rows="2"
                  value={formState.importer_address}
                  onChange={(e) => handleFieldChange("importer_address", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field">
                <label>Importer Contact Number <span className="admin-opt-badge">(Optional)</span></label>
                <input
                  name="saalu_importer_contact_field"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  value={formState.importer_contact}
                  onChange={(e) => handleFieldChange("importer_contact", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field">
                <label>Importer Tax ID No. <span className="admin-opt-badge">(Optional)</span></label>
                <input
                  name="saalu_importer_tax_id_field"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  value={formState.importer_tax_id}
                  onChange={(e) => handleFieldChange("importer_tax_id", e.target.value)}
                  placeholder=""
                />
              </div>
            </div>
          </div>

          {/* Section 3: Recipient / User Data Details */}
          <div className="export-form-section">
            <div className="export-form-section__head">
              <div>
                <h3>3. Recipient / User Data Details</h3>
              </div>
            </div>
            <div className="admin-form-grid">
              <div className="admin-field">
                <label>Receiver Name <span className="admin-opt-badge">(Optional)</span></label>
                <input
                  name="saalu_receiver_name_field"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  value={formState.receiver_name}
                  onChange={(e) => handleFieldChange("receiver_name", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field">
                <label>Receiver Email <span className="admin-opt-badge">(Optional)</span></label>
                <input
                  name="saalu_receiver_email_field"
                  type="text"
                  inputMode="email"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  value={formState.receiver_email}
                  onChange={(e) => handleFieldChange("receiver_email", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field admin-field--full">
                <label>Receiver Address <span className="admin-opt-badge">(Optional)</span></label>
                <textarea
                  name="saalu_receiver_address_field"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  rows="2"
                  value={formState.receiver_address}
                  onChange={(e) => handleFieldChange("receiver_address", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field">
                <label>Receiver Contact Number <span className="admin-opt-badge">(Optional)</span></label>
                <input
                  name="saalu_receiver_contact_field"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  value={formState.receiver_contact}
                  onChange={(e) => handleFieldChange("receiver_contact", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field">
                <label>Receiver Tax ID No. <span className="admin-opt-badge">(Optional)</span></label>
                <input
                  name="saalu_receiver_tax_id_field"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  value={formState.receiver_tax_id}
                  onChange={(e) => handleFieldChange("receiver_tax_id", e.target.value)}
                  placeholder=""
                />
              </div>
            </div>
          </div>

          {/* Section 4: General Information / Shipment Information */}
          <div className="export-form-section">
            <div className="export-form-section__head">
              <div>
                <h3>4. General Information / Shipment Information</h3>
              </div>
            </div>
            <div className="admin-form-grid">
              <div className="admin-field">
                <label>
                  Invoice No. <span className="admin-req-star" style={{ color: "#e5484d", fontWeight: "bold", marginLeft: "4px" }}>*</span>
                </label>
                <input
                  name="doc_invoice_no"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.invoice_no}
                  className={fieldErrors.invoice_no ? "admin-field-input--error" : ""}
                  onChange={(e) => {
                    handleFieldChange("invoice_no", e.target.value);
                    if (fieldErrors.invoice_no) setFieldErrors((prev) => ({ ...prev, invoice_no: null }));
                  }}
                  placeholder=""
                />
                {fieldErrors.invoice_no && (
                  <span className="admin-field-error-msg">{fieldErrors.invoice_no}</span>
                )}
              </div>
              <div className="admin-field">
                <label>Shipment Date <span className="admin-opt-badge">(Optional)</span></label>
                <input
                  name="doc_shipment_date"
                  type="date"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.shipment_date}
                  onChange={(e) => handleFieldChange("shipment_date", e.target.value)}
                />
              </div>
              <div className="admin-field">
                <label>Shipment Reference No. <span className="admin-opt-badge">(Optional)</span></label>
                <input
                  name="doc_shipment_ref_no"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.shipment_ref_no}
                  onChange={(e) => handleFieldChange("shipment_ref_no", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field">
                <label>Reason for Export <span className="admin-opt-badge">(Optional)</span></label>
                <input
                  name="doc_reason_for_export"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.reason_for_export}
                  onChange={(e) => handleFieldChange("reason_for_export", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field">
                <label>Type of Export <span className="admin-opt-badge">(Optional)</span></label>
                <input
                  name="doc_type_of_export"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.type_of_export}
                  onChange={(e) => handleFieldChange("type_of_export", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field">
                <label>Export License No.</label>
                <input
                  name="doc_export_license_no"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.export_license_no}
                  onChange={(e) => handleFieldChange("export_license_no", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field">
                <label>Import License No.</label>
                <input
                  name="doc_import_license_no"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.import_license_no}
                  onChange={(e) => handleFieldChange("import_license_no", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field">
                <label>INCOTERMS / Incoterms Desc.</label>
                <input
                  name="doc_incoterms"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.incoterms}
                  onChange={(e) => handleFieldChange("incoterms", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field">
                <label>Currency Code</label>
                <select
                  name="doc_currency_code"
                  value={formState.currency_code}
                  onChange={(e) => handleFieldChange("currency_code", e.target.value)}
                >
                  <option value="USD">USD – US Dollar</option>
                  <option value="INR">INR – Indian Rupee</option>
                  <option value="EUR">EUR – Euro</option>
                  <option value="GBP">GBP – British Pound</option>
                  <option value="AED">AED – UAE Dirham</option>
                  <option value="SAR">SAR – Saudi Riyal</option>
                  <option value="CAD">CAD – Canadian Dollar</option>
                  <option value="AUD">AUD – Australian Dollar</option>
                  <option value="SGD">SGD – Singapore Dollar</option>
                  <option value="JPY">JPY – Japanese Yen</option>
                  <option value="CNY">CNY – Chinese Yuan</option>
                </select>
              </div>
              <div className="admin-field">
                <label>Payment Method / Payment Terms</label>
                <input
                  name="doc_payment_method"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.payment_method}
                  onChange={(e) => handleFieldChange("payment_method", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field">
                <label>Letter of Credit No.</label>
                <input
                  name="doc_letter_of_credit_no"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.letter_of_credit_no}
                  onChange={(e) => handleFieldChange("letter_of_credit_no", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field">
                <label>Customer PO No.</label>
                <input
                  name="doc_customer_po_no"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.customer_po_no}
                  onChange={(e) => handleFieldChange("customer_po_no", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field">
                <label>PO Date</label>
                <input
                  name="doc_po_date"
                  type="date"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.po_date}
                  onChange={(e) => handleFieldChange("po_date", e.target.value)}
                />
              </div>
              <div className="admin-field">
                <label>File Number</label>
                <input
                  name="doc_file_number"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.file_number}
                  onChange={(e) => handleFieldChange("file_number", e.target.value)}
                  placeholder=""
                />
              </div>
            </div>
          </div>

          {/* Section 4.5: Tax Configuration (Max 5 Taxes with + Add Tax button above) */}
          <div className="export-form-section">
            <div className="export-items-header" style={{ marginBottom: "14px" }}>
              <div>
                <h3 style={{ margin: 0, color: "var(--admin-navy)", fontSize: "1.05rem", fontWeight: 700 }}>
                  Tax Configuration <span className="admin-opt-badge">(Optional - Max 5 Taxes)</span>
                </h3>
                <span style={{ fontSize: "0.78rem", color: "var(--admin-ink-soft)" }}>
                  Configure up to 5 tax lines (e.g., GST, IGST, VAT, Cess, Duties)
                </span>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--soft"
                style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                onClick={addTaxRow}
                disabled={taxesList.length >= 5}
              >
                <Icon name="plus" size={14} />
                <span>{taxesList.length >= 5 ? "Max 5 Taxes Reached" : "+ Add Tax"}</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {taxesList.map((tax, index) => (
                <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "14px", alignItems: "flex-end" }}>
                  <div className="admin-field" style={{ marginBottom: 0 }}>
                    <label>
                      Tax Name <span className="admin-opt-badge">(Optional)</span>
                    </label>
                    <input
                      value={tax.name}
                      onChange={(e) => updateTaxRow(index, "name", e.target.value)}
                      placeholder="e.g. GST, VAT, Cess"
                    />
                  </div>
                  <div className="admin-field" style={{ marginBottom: 0 }}>
                    <label>
                      Tax Percentage (%) <span className="admin-opt-badge">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={tax.rate}
                      onChange={(e) => updateTaxRow(index, "rate", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <button
                    type="button"
                    className="admin-action-btn admin-action-btn--delete"
                    onClick={() => removeTaxRow(index)}
                    title="Remove Tax"
                    style={{ padding: "10px 12px" }}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              ))}
              {!taxesList.length && (
                <p style={{ fontSize: "0.82rem", color: "var(--admin-ink-soft)", margin: "4px 0" }}>
                  No taxes configured. Click <strong>"+ Add Tax"</strong> to add a tax line (up to 5 max).
                </p>
              )}
            </div>
          </div>

          {/* Section 5: Packing / Item Details */}
          <div className="export-form-section">
            <div className="export-form-section__head">
              <div>
                <h3 style={{ color: "var(--admin-navy)" }}>Packing / Item Details</h3>
                {/* <p>Mode of transportation, packages, and logistics compliance</p> */}
              </div>
            </div>
            <div className="admin-form-grid">
              <div className="admin-field">
                <label>Mode of Transportation</label>
                <input
                  name="doc_mode_of_transportation"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.mode_of_transportation}
                  onChange={(e) => handleFieldChange("mode_of_transportation", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field">
                <label>Transportation Terms</label>
                <input
                  name="doc_transportation_terms"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.transportation_terms}
                  onChange={(e) => handleFieldChange("transportation_terms", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field">
                <label>AWB / BL No.</label>
                <input
                  name="doc_awb_bl_no"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.awb_bl_no}
                  onChange={(e) => handleFieldChange("awb_bl_no", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field">
                <label>Number of Packages</label>
                <input
                  name="doc_no_of_packages"
                  type="number"
                  min="0"
                  step="1"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.no_of_packages}
                  onChange={(e) => handleFieldChange("no_of_packages", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field admin-field--full">
                <label>Package Description</label>
                <textarea
                  name="doc_package_description"
                  autoComplete="off"
                  data-lpignore="true"
                  rows="2"
                  value={formState.package_description}
                  onChange={(e) => handleFieldChange("package_description", e.target.value)}
                  placeholder="Apparel and Textiles in corrugated boxes"
                />
              </div>
              <div className="admin-field">
                <label>Total Gross Weight Unit</label>
                <select
                  name="doc_total_gross_weight_unit"
                  value={formState.total_gross_weight_unit}
                  onChange={(e) => handleFieldChange("total_gross_weight_unit", e.target.value)}
                >
                  <option value="GRAMS">GRAMS</option>
                  <option value="KILOGRAMS">KILOGRAMS</option>
                  <option value="TONNES">TONNES</option>
                </select>
              </div>
              <div className="admin-field">
                <label>HS Code</label>
                <input
                  name="doc_hs_code"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.hs_code}
                  onChange={(e) => handleFieldChange("hs_code", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field">
                <label>Country of Origin</label>
                <input
                  name="doc_country_of_origin"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.country_of_origin}
                  onChange={(e) => handleFieldChange("country_of_origin", e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="admin-field admin-field--full">
                <label>OTHER INFORMATION AND COMPLIANCE DETAILS</label>
                <textarea
                  name="doc_other_information_compliance_details"
                  autoComplete="off"
                  data-lpignore="true"
                  rows="2"
                  value={formState.other_information_compliance_details}
                  onChange={(e) => handleFieldChange("other_information_compliance_details", e.target.value)}
                  placeholder="Good Condition"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Product Details */}
          <div className="export-form-section">
            <div className="export-items-header">
              <div>
                <h3 style={{ margin: 0, color: "var(--admin-navy)" }}>6. Product Details</h3>
                {/* <p style={{ margin: "2px 0 0", color: "var(--admin-ink-soft)", fontSize: "0.78rem" }}>
                  Add products with Product Name, Quantity, and Price ({formState.currency_code || "USD"})
                </p> */}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  style={{ padding: "6px 12px", fontSize: "0.82rem" }}
                  onClick={() => setShowBulkPaste((prev) => !prev)}
                >
                  <Icon name="copy" size={14} />
                  <span>{showBulkPaste ? "Hide Bulk Paste" : "Bulk Paste"}</span>
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--soft"
                  style={{ padding: "6px 12px", fontSize: "0.82rem" }}
                  onClick={addItemRow}
                >
                  <Icon name="plus" size={14} />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {showBulkPaste && (
              <div className="export-bulk-paste-box">
                <p style={{ margin: "0 0 6px", fontSize: "0.8rem", color: "var(--admin-ink-soft)" }}>
                  Paste rows from Excel or TSV (Columns: Product, Quantity, Price, Unit Net Weight in Grams):
                </p>
                <textarea
                  rows="3"
                  value={paste}
                  onChange={(e) => setPaste(e.target.value)}
                  placeholder="Product 1&#9;10&#9;100&#9;180&#10;Product 2&#9;20&#9;250&#9;210"
                />
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                  onClick={addPastedItems}
                >
                  Import Pasted Rows
                </button>
              </div>
            )}

            <div className="admin-table-wrap" style={{ marginTop: 12 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: "50%" }}>Product</th>
                    <th style={{ width: "20%" }}>Quantity</th>
                    <th style={{ width: "22%" }}>Price ({formState.currency_code || "USD"})</th>
                    <th style={{ width: "8%", textAlign: "right" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          required
                          autoComplete="off"
                          data-lpignore="true"
                          value={item.product_name}
                          onChange={(e) => setItem(index, "product_name", e.target.value)}
                          placeholder={`Product ${index + 1}`}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            border: "1px solid var(--admin-line)",
                            borderRadius: "8px",
                            fontSize: "0.86rem",
                          }}
                        />
                      </td>
                      <td>
                        <input
                          required
                          type="number"
                          min="0.001"
                          step="any"
                          autoComplete="off"
                          data-lpignore="true"
                          value={item.qty}
                          onChange={(e) => setItem(index, "qty", e.target.value)}
                          placeholder="Quantity"
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            border: "1px solid var(--admin-line)",
                            borderRadius: "8px",
                            fontSize: "0.86rem",
                          }}
                        />
                      </td>
                      <td>
                        <input
                          required
                          type="number"
                          min="0"
                          step="1"
                          autoComplete="off"
                          data-lpignore="true"
                          value={item.unit_value !== "" && !isNaN(Number(item.unit_value)) ? Math.round(Number(item.unit_value)) : item.unit_value}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItem(index, "unit_value", val === "" ? "" : String(Math.round(Number(val))));
                          }}
                          placeholder="Price"
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            border: "1px solid var(--admin-line)",
                            borderRadius: "8px",
                            fontSize: "0.86rem",
                          }}
                        />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="admin-action-btn admin-action-btn--delete"
                          onClick={() => removeItemRow(index)}
                          title="Remove item"
                          style={{ padding: "6px 8px" }}
                        >
                          <Icon name="x" size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 7: Individual Product Unit Net Weights */}
          <div className="export-form-section">
            <div className="export-form-section__head">
              <div>
                <h3>7. Individual Product Unit Net Weights</h3>
                {/* <p>Enter the unit net weight in grams for each added product</p> */}
              </div>
            </div>
            <div className="admin-form-grid">
              {items.map((item, index) => (
                <div key={index} className="admin-field">
                  <label>
                    {item.product_name.trim() || `Product ${index + 1}`} Unit Net Weight (Grams)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    autoComplete="off"
                    data-lpignore="true"
                    value={item.unit_net_weight}
                    onChange={(e) => setItem(index, "unit_net_weight", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 8: Signatory Details */}
          <div className="export-form-section">
            <div className="export-form-section__head">
              <div>
                <h3>8. Signatory Details</h3>
                {/* <p>Authorized signature and designation</p> */}
              </div>
            </div>
            <div className="admin-form-grid">
              <div className="admin-field">
                <label>Signatory Name</label>
                <input
                  name="doc_signatory_name"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.signatory_name}
                  onChange={(e) => handleFieldChange("signatory_name", e.target.value)}
                  placeholder="Saaluvesa Enterprises Private Limited"
                />
              </div>
              <div className="admin-field">
                <label>Signatory Designation</label>
                <input
                  name="doc_signatory_designation"
                  autoComplete="off"
                  data-lpignore="true"
                  value={formState.signatory_designation}
                  onChange={(e) => handleFieldChange("signatory_designation", e.target.value)}
                  placeholder="Manager"
                />
              </div>
            </div>
          </div>

          {/* Live Calculations Summary Box */}
          <div className="export-form-live-summary">
            <div className="export-form-live-summary__item">
              <span className="export-form-live-summary__label">Total Products</span>
              <span className="export-form-live-summary__val">{items.length}</span>
            </div>
            <div className="export-form-live-summary__item">
              <span className="export-form-live-summary__label">Total Quantity</span>
              <span className="export-form-live-summary__val">{formTotals.quantity}</span>
            </div>
            <div className="export-form-live-summary__item">
              <span className="export-form-live-summary__label">Total Cost</span>
              <span className="export-form-live-summary__val">
                {formState.currency_code || "USD"} {formTotals.value.toFixed(2)}
              </span>
            </div>
            {calculatedTaxes.map((tax, index) => (
              <div key={index} className="export-form-live-summary__item">
                <span className="export-form-live-summary__label">
                  {tax.name} ({tax.rate}%)
                </span>
                <span className="export-form-live-summary__val">
                  {formState.currency_code || "USD"} {tax.amount.toFixed(2)}
                </span>
              </div>
            ))}
            <div className="export-form-live-summary__item">
              <span className="export-form-live-summary__label">
                {String(formState.total_gross_weight_unit || "GRAMS").toUpperCase() === "KILOGRAMS"
                  ? "Total Weight (Kilograms)"
                  : String(formState.total_gross_weight_unit || "GRAMS").toUpperCase() === "TONNES"
                  ? "Total Weight (Tonnes)"
                  : "Total Weight (Grams)"}
              </span>
              <span className="export-form-live-summary__val">
                {String(formState.total_gross_weight_unit || "GRAMS").toUpperCase() === "KILOGRAMS"
                  ? `${(formTotals.weight / 1000).toFixed(3)} kg`
                  : String(formState.total_gross_weight_unit || "GRAMS").toUpperCase() === "TONNES"
                  ? `${(formTotals.weight / 1000000).toFixed(4)} Tonnes`
                  : `${formTotals.weight.toFixed(0)} g`}
              </span>
            </div>
            <div className="export-form-live-summary__item">
              <span className="export-form-live-summary__label">Total Goods Value</span>
              <span className="export-form-live-summary__val">
                {formState.currency_code || "USD"} {calculatedFinalTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {error && (
            <p className="admin-field-error" style={{ marginTop: 12 }} role="alert">
              <Icon name="alert" size={14} />
              {error}
            </p>
          )}

          {/* ── Save Details Button matching screenshot ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24, marginBottom: 16 }}>
            <button
              type="submit"
              className="admin-btn admin-btn--primary export-save-details"
              style={{ padding: "10px 22px", fontSize: "0.92rem", fontWeight: 600, background: "var(--admin-navy)", borderColor: "var(--admin-navy)" }}
              disabled={saving}
            >
              {saving ? <Spinner size={16} /> : <Icon name="save" size={16} />}
              <span>{saving ? "Saving Details…" : "Save Details"}</span>
            </button>
          </div>

          {/* ── Under Save Details: Commercial Invoice, Proforma Invoice, Packing List (View, PDF) ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "20px",
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: "1px solid var(--admin-line)",
              textAlign: "center",
            }}
          >
            {/* Commercial Invoice */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <strong style={{ color: "var(--admin-navy)", fontSize: "14px", fontWeight: 700 }}>Commercial Invoice</strong>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--admin-navy)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 8px",
                  }}
                  onClick={() => {
                    setViewingDoc(currentPreviewDoc);
                    setViewingHtmlType("commercial");
                  }}
                >
                  <Icon name="eye" size={14} />
                  <span>View</span>
                </button>
                <button
                  type="button"
                  style={{
                    background: "var(--admin-navy)",
                    border: "none",
                    borderRadius: "6px",
                    color: "var(--admin-white)",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 14px",
                  }}
                  onClick={async () => {
                    if (!activeSavedDoc?.id) {
                      const saved = await saveForm();
                      if (saved?.id) previewPdf(saved, "commercial");
                    } else {
                      previewPdf(activeSavedDoc, "commercial");
                    }
                  }}
                >
                  <Icon name="download" size={13} />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {/* Proforma Invoice */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <strong style={{ color: "var(--admin-navy)", fontSize: "14px", fontWeight: 700 }}>Proforma Invoice</strong>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--admin-navy)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 8px",
                  }}
                  onClick={() => {
                    setViewingDoc(currentPreviewDoc);
                    setViewingHtmlType("proforma");
                  }}
                >
                  <Icon name="eye" size={14} />
                  <span>View</span>
                </button>
                <button
                  type="button"
                  style={{
                    background: "var(--admin-navy)",
                    border: "none",
                    borderRadius: "6px",
                    color: "var(--admin-white)",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 14px",
                  }}
                  onClick={async () => {
                    if (!activeSavedDoc?.id) {
                      const saved = await saveForm();
                      if (saved?.id) previewPdf(saved, "proforma");
                    } else {
                      previewPdf(activeSavedDoc, "proforma");
                    }
                  }}
                >
                  <Icon name="download" size={13} />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {/* Packing List */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <strong style={{ color: "var(--admin-navy)", fontSize: "14px", fontWeight: 700 }}>Packing List</strong>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--admin-navy)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 8px",
                  }}
                  onClick={() => {
                    setViewingDoc(currentPreviewDoc);
                    setViewingHtmlType("packing");
                  }}
                >
                  <Icon name="eye" size={14} />
                  <span>View</span>
                </button>
                <button
                  type="button"
                  style={{
                    background: "var(--admin-navy)",
                    border: "none",
                    borderRadius: "6px",
                    color: "var(--admin-white)",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 14px",
                  }}
                  onClick={async () => {
                    if (!activeSavedDoc?.id) {
                      const saved = await saveForm();
                      if (saved?.id) previewPdf(saved, "packing");
                    } else {
                      previewPdf(activeSavedDoc, "packing");
                    }
                  }}
                >
                  <Icon name="download" size={13} />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* ── View Export Document Details Modal ── */}
      <Modal
        open={!!viewingDoc && !viewingHtmlType}
        onClose={() => setViewingDoc(null)}
        title={viewingDoc ? `Export Document: ${viewingDoc.invoice_no}` : "Document Details"}
        sub={viewingDoc ? `Buyer: ${viewingDoc.importer_name} · Shipment Date: ${viewingDoc.shipment_date ? fmtDate(viewingDoc.shipment_date) : "—"}` : ""}
        wide
        notranslate
      >
        {viewingDoc && (() => {
          const docT = getDocTranslation(selectedDocLanguage);
          return (
          <div className="export-view-container" key={`${viewingDoc.id || viewingDoc.invoice_no}-${selectedDocLanguage}`} translate="no">
            {/* Quick Actions / PDF Downloads Toolbar */}
            <div className="export-view-hero">
              <div className="export-view-hero__left">
                <div className="export-view-hero__icon">
                  <Icon name="file-text" size={24} />
                </div>
                <div className="export-view-hero__titles">
                  <h3>{viewingDoc.invoice_no}</h3>
                  <p>
                    {viewingDoc.importer_name} · {viewingDoc.items?.length || 0} product
                    {viewingDoc.items?.length === 1 ? "" : "s"} · Created {fmtDateTime(viewingDoc.createdAt)}
                  </p>
                </div>
              </div>
              <div className="export-view-hero__right">
                <ExportDocLangSelector selectedLang={docLang} onSelectLang={setDocLang} />
                <Badge tone={statusTone(viewingDoc.status)}>{viewingDoc.status || "Generated"}</Badge>
                <button
                  type="button"
                  className="admin-btn admin-btn--soft"
                  onClick={() => {
                    openEditModal(viewingDoc);
                  }}
                >
                  <Icon name="pencil" size={14} />
                  <span>Edit Document</span>
                </button>
              </div>
            </div>

            {/* Document PDF Generation & HTML Preview Cards */}
            <div className="export-view-downloads">
              <div className="export-view-download-card">
                <div>
                  <strong>{docT.commercial_invoice || "Commercial Invoice"}</strong>
                  <small>{docT.commercial_desc || "For customs declaration & international trade"}</small>
                </div>
                <div className="export-view-download-card__actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--soft"
                    onClick={() => {
                      setViewingHtmlType("commercial");
                    }}
                  >
                    <Icon name="eye" size={13} />
                    <span>View</span>
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--soft"
                    onClick={() => downloadPdf(viewingDoc, "commercial", null)}
                  >
                    <Icon name="download" size={13} />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <div className="export-view-download-card">
                <div>
                  <strong>{docT.proforma_invoice || "Proforma Invoice"}</strong>
                  <small>{docT.proforma_desc || "Preliminary bill of sale for buyer approval"}</small>
                </div>
                <div className="export-view-download-card__actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--soft"
                    onClick={() => {
                      setViewingHtmlType("proforma");
                    }}
                  >
                    <Icon name="eye" size={13} />
                    <span>View</span>
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--soft"
                    onClick={() => downloadPdf(viewingDoc, "proforma", null)}
                  >
                    <Icon name="download" size={13} />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <div className="export-view-download-card">
                <div>
                  <strong>{docT.packing_list || "Packing List"}</strong>
                  <small>{docT.packing_desc || "Itemized package weights, cartons & dimensions"}</small>
                </div>
                <div className="export-view-download-card__actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--soft"
                    onClick={() => {
                      setViewingHtmlType("packing");
                    }}
                  >
                    <Icon name="eye" size={13} />
                    <span>View</span>
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--soft"
                    onClick={() => downloadPdf(viewingDoc, "packing", null)}
                  >
                    <Icon name="download" size={13} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="export-view-grid">
              <div className="export-view-card">
                <div className="export-view-card__title">
                  <Icon name="user" size={16} />
                  <h4>{docT.sender_buyer || "Sender & Buyer"}</h4>
                </div>
                <div className="export-view-card__body">
                  <p><strong>{docT.sender || "Sender"}:</strong> {viewingDoc.sender_name || "Saaluvesa Enterprises Private Limited"}</p>
                  <p><strong>{docT.buyer || "Buyer (Importer)"}:</strong> {viewingDoc.importer_name}</p>
                  <p><strong>{docT.buyer_email || "Buyer Email"}:</strong> {viewingDoc.importer_email || "—"}</p>
                  <p><strong>{docT.buyer_address || "Buyer Address"}:</strong> {viewingDoc.importer_address || "—"}</p>
                  <p><strong>{docT.buyer_tax_id || "Buyer Tax ID"}:</strong> {viewingDoc.importer_tax_id || "—"}</p>
                </div>
              </div>

              <div className="export-view-card">
                <div className="export-view-card__title">
                  <Icon name="truck" size={16} />
                  <h4>{docT.shipment_logistics || "Shipment Logistics"}</h4>
                </div>
                <div className="export-view-card__body">
                  <p><strong>{docT.shipment_date || "Shipment Date"}:</strong> {viewingDoc.shipment_date ? fmtDate(viewingDoc.shipment_date) : "—"}</p>
                  <p><strong>{docT.mode || "Mode"}:</strong> {String(viewingDoc.mode_of_transportation || "Air").toLowerCase() === "air" ? (docT.val_air || "Air") : (docT.val_sea || viewingDoc.mode_of_transportation || "Air")}</p>
                  <p><strong>{docT.incoterms || "Incoterms"}:</strong> {viewingDoc.incoterms || "DAP"}</p>
                  <p><strong>{docT.awb_bl || "AWB / BL"}:</strong> {viewingDoc.awb_bl_no || "—"}</p>
                  <p><strong>{docT.packages || "Packages"}:</strong> {viewingDoc.no_of_packages || 1}</p>
                </div>
              </div>

              <div className="export-view-card">
                <div className="export-view-card__title">
                  <Icon name="dollar-sign" size={16} />
                  <h4>{docT.financial_totals || "Financial Totals"}</h4>
                </div>
                <div className="export-view-card__body">
                  <p><strong>{docT.total_cost || "Total Cost"}:</strong> {viewingDoc.currency_code || "USD"} {Number(viewingDoc.total_goods_value || 0).toFixed(2)}</p>
                  {(Number(viewingDoc.tax_rate) > 0 || Number(viewingDoc.tax_amount) > 0 || viewingDoc.tax_type) && (
                    <p><strong>{viewingDoc.tax_type || "Tax 1"} {Number(viewingDoc.tax_rate) > 0 ? `(${viewingDoc.tax_rate}%)` : ""}:</strong> {viewingDoc.currency_code || "USD"} {Number(viewingDoc.tax_amount || 0).toFixed(2)}</p>
                  )}
                  {(Number(viewingDoc.tax2_rate) > 0 || Number(viewingDoc.tax2_amount) > 0 || viewingDoc.tax2_type) && (
                    <p><strong>{viewingDoc.tax2_type || "Tax 2"} {Number(viewingDoc.tax2_rate) > 0 ? `(${viewingDoc.tax2_rate}%)` : ""}:</strong> {viewingDoc.currency_code || "USD"} {Number(viewingDoc.tax2_amount || 0).toFixed(2)}</p>
                  )}
                  <p><strong>{docT.total_goods_value_final || docT.total_goods_value || "Total Goods Value (Final)"}:</strong> {viewingDoc.currency_code || "USD"} {Number(viewingDoc.final_total_amount || viewingDoc.total_goods_value || 0).toFixed(2)}</p>
                  <p><strong>{docT.total_weight || "Total Weight"}:</strong> {viewingDoc.total_net_weight_kg || "0.00"} kg ({viewingDoc.total_net_weight_lbs || "0.00"} lbs)</p>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="admin-table-wrap" style={{ marginTop: 16 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{docT.col_num || "#"}</th>
                    <th>{docT.col_product || "Product"}</th>
                    <th>{docT.col_qty || "Qty"}</th>
                    <th>{docT.col_unit_price || "Unit Price"}</th>
                    <th>{docT.col_subtotal || "Subtotal"}</th>
                    <th>{docT.col_unit_weight || "Unit Wt. (g)"}</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewingDoc.items || []).map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <strong>{translateDocValue(it.product_name, selectedDocLanguage)}</strong>
                      </td>
                      <td>{it.qty} {translateDocValue(it.uom || "PCS", selectedDocLanguage)}</td>
                      <td>{viewingDoc.currency_code || "USD"} {Math.round(Number(it.unit_value || 0))}</td>
                      <td>{viewingDoc.currency_code || "USD"} {Number(it.sub_total || Number(it.qty) * Math.round(Number(it.unit_value || 0)) || 0).toFixed(2)}</td>
                      <td>{(Number(it.unit_net_weight || 0) * 1000).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          );
        })()}
      </Modal>

      {/* ── Document HTML Preview Modal ── */}
      <Modal
        open={Boolean(viewingHtmlType && viewingDoc)}
        onClose={() => {
          setViewingHtmlType(null);
          setViewingDoc(null);
        }}
        title={
          viewingHtmlType === "packing"
            ? (getDocTranslation(selectedDocLanguage).packing_list || "Packing List")
            : viewingHtmlType === "commercial"
              ? (getDocTranslation(selectedDocLanguage).commercial_invoice || "Commercial Invoice")
              : (getDocTranslation(selectedDocLanguage).proforma_invoice || "Proforma Invoice")
        }
        sub={`Previewing document for ${viewingDoc?.invoice_no}`}
        wide
        notranslate={true}
      >
        {viewingDoc && viewingHtmlType && (
          <div>
            <div className="notranslate" translate="no" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
              <ExportDocLangSelector selectedLang={docLang} onSelectLang={setDocLang} />
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--soft"
                  onClick={() => previewPdf(viewingDoc, viewingHtmlType)}
                >
                  <Icon name="external-link" size={14} />
                  <span>Open PDF</span>
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  onClick={() =>
                    downloadPdf(
                      viewingDoc,
                      viewingHtmlType,
                      `${viewingDoc.invoice_no}-${viewingHtmlType}.pdf`,
                    )
                  }
                >
                  <Icon name="download" size={14} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
            <div ref={documentPreviewRef} style={{ border: "1px solid var(--admin-line)", borderRadius: 8, padding: 12, background: "var(--admin-white)", overflowX: "auto" }}>
              <ExportDocumentPreview key={`${viewingDoc?.id || viewingDoc?.invoice_no}-${viewingHtmlType}-${selectedDocLanguage}`} document={viewingDoc} type={viewingHtmlType} langCode={selectedDocLanguage} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* contacts                                                            */
/* ------------------------------------------------------------------ */

function Contacts() {
  const { pushToast, confirm, query } = useOutletContext();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    api(`/admin/contact-submissions${status ? `?status=${status}` : ""}`)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, [status]);

  useEffect(() => setPage(1), [query, status]);

  const filtered = rows.filter((row) =>
    [row.name, row.email, row.requirement_details, row.Product?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const contactPageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const contactPage = Math.min(page, contactPageCount);
  const pagedContacts = filtered.slice((contactPage - 1) * PAGE_SIZE, contactPage * PAGE_SIZE);

  const respond = async (row) => {
    setUpdating(row.id);
    try {
      await api(`/admin/contact-submissions/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Responded" }),
      });
      pushToast("success", `Marked ${row.name.split(" ")[0]}'s enquiry as responded`);
      load();
      setSelected((prev) => (prev && prev.id === row.id ? { ...prev, status: "Responded" } : prev));
    } catch (err) {
      pushToast("error", err.message || "Could not update enquiry");
    } finally {
      setUpdating(null);
    }
  };

  const [busyId, setBusyId] = useState(null);

  const removeContact = async (row) => {
    const ok = await confirm({
      title: `Delete enquiry from "${row.name}"?`,
      message: "This will permanently remove this contact submission. This action cannot be undone.",
      confirmLabel: "Delete enquiry",
    });
    if (!ok) return;
    setBusyId(row.id);
    try {
      await api(`/admin/contact-submissions/${row.id}`, { method: "DELETE" });
      pushToast("success", "Enquiry deleted");
      setSelected((prev) => (prev && prev.id === row.id ? null : prev));
      load();
    } catch (err) {
      pushToast("error", err.message || "Could not delete enquiry");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-page notranslate" translate="no">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Customer desk</p>
          <h2>Contact submissions</h2>
        </div>
        {/* <p>Review and respond to customer requirements from one place.</p> */}
      </div>

      <div className="admin-toolbar">
        <div className="admin-filter">
          <span className="admin-filter__label"><Icon name="layers" size={15} /> Filter</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option>New</option>
            <option>Responded</option>
          </select>
        </div>
        <span className="admin-toolbar__count">
          {filtered.length} {filtered.length === 1 ? "submission" : "submissions"}
        </span>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : filtered.length ? (
        <div className="admin-card admin-card--table">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Requirement</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedContacts.map((row) => (
                  <tr key={row.id} className="admin-row" onClick={() => setSelected(row)}>
                    <td>
                      <div className="cell-name cell-name--stacked">
                        <Avatar name={row.name} size={36} />
                        <div>
                          <strong>{row.name}</strong>
                          <small>{row.email}</small>
                        </div>
                      </div>
                    </td>
                    <td className="cell-clamp" title={row.requirement_details}>{row.requirement_details}</td>
                    <td>{row.Product?.name || <span className="cell-muted">General</span>}</td>
                    <td><Badge tone={statusTone(row.status)}>{row.status}</Badge></td>
                    <td>{fmtDate(row.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="admin-icon-btn admin-icon-btn--soft"
                          title="View"
                          onClick={(e) => { e.stopPropagation(); setSelected(row); }}
                        >
                          <Icon name="eye" size={16} />
                        </button>
                        <button
                          className="admin-icon-btn admin-icon-btn--danger"
                          title="Delete"
                          onClick={(e) => { e.stopPropagation(); removeContact(row); }}
                          disabled={busyId === row.id}
                        >
                          {busyId === row.id ? <Spinner size={15} /> : <Icon name="trash" size={16} />}
                        </button>
                        {row.status === "New" && (
                          <button
                            className="admin-btn admin-btn--soft admin-btn--sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              respond(row);
                            }}
                            disabled={updating === row.id}
                          >
                            {updating === row.id ? <Spinner size={14} /> : <Icon name="check" size={15} />}
                            Mark responded
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : query || status ? (
        <div className="admin-card">
          <EmptyState icon="search" title="No submissions match" hint="Adjust the filter or search to see more results." />
        </div>
      ) : (
        <div className="admin-card">
          <EmptyState icon="inbox" title="No submissions yet" hint="Enquiries submitted through the website will appear here." />
        </div>
      )}

      <Pagination page={contactPage} pageCount={contactPageCount} onPage={setPage} />

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Enquiry details"
        sub={selected ? `${selected.name} · ${fmtDate(selected.createdAt)}` : ""}
        wide
      >
        <EnquiryDetailDrawer
          selected={selected}
          onClose={() => setSelected(null)}
          onRespond={(item) => respond(item)}
          onDelete={(item) => removeContact(item)}
          updating={updating}
          busyId={busyId}
          pushToast={pushToast}
        />
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* auth guard + router                                                 */
/* ------------------------------------------------------------------ */

function RequireAuth() {
  return localStorage.getItem("saaluvesa_admin_access_token") ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
}

export default function Admin() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<Shell />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductsAdmin />} />
            <Route path="export-documents" element={<ExportDocuments />} />
            <Route path="contacts" element={<Contacts />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
