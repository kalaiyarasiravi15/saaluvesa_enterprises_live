/**
 * LanguageSelector  v3.0
 *
 * Architecture:
 *  - localStorage('saalu_selected_lang') = single source of truth for app code
 *  - applyLanguage() is the one place that writes cookies + triggers GT
 *  - On mount: restore state from localStorage, then tell GT to translate
 *  - On select: save to localStorage, set cookie, trigger GT live
 *  - On English: clear cookie + reload (only reliable way to un-translate GT)
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { LANGUAGES, EUROPE_COUNTRIES, getTranslateCode } from "../data/languages.js";
import "./LanguageSelector.css";

// Re-export so other modules can import from this single file
export { LANGUAGES, EUROPE_COUNTRIES, getTranslateCode };

// Module-level tracker — keeps React components and plain JS in sync
let _activeCode = "en";

export function getActiveLanguageCode() {
  return _activeCode;
}

// ─── Safe localStorage helpers ────────────────────────────────────────────────
function lsGet(key) {
  try { return localStorage.getItem(key) || ""; } catch (_) { return ""; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, val); } catch (_) {}
}

// ─── applyLanguage ────────────────────────────────────────────────────────────
/**
 * Tell Google Translate to switch to `langCode`.
 * 1. Update module tracker
 * 2. Set / clear the googtrans cookie (so refresh works)
 * 3. Attempt to update the hidden .goog-te-combo directly
 * 4. If combo not ready yet, retry up to `retriesLeft` times (150 ms apart)
 */
export function applyLanguage(langCode, retriesLeft = 20) {
  _activeCode = langCode || "en";
  const tc = getTranslateCode(langCode);

  // Step 2 – sync cookie with new language
  if (tc === "en") {
    if (typeof window.clearGoogleTranslateCookie === "function") {
      window.clearGoogleTranslateCookie();
    }
  } else {
    if (typeof window.setGoogTransCookie === "function") {
      window.setGoogTransCookie(tc); // setGoogTransCookie already calls gtCode() internally
    }
  }

  // Step 3 – try updating the combo directly via the global helper
  if (typeof window.triggerGoogleTranslate === "function") {
    const ok = window.triggerGoogleTranslate(langCode);
    if (ok) return; // success — done
  }

  // Step 4 – GT widget not ready yet; retry
  if (retriesLeft > 0) {
    setTimeout(() => applyLanguage(langCode, retriesLeft - 1), 150);
  } else {
    console.warn("[Saalu] applyLanguage: GT combo never became ready for", langCode);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// React component
// ─────────────────────────────────────────────────────────────────────────────
export default function LanguageSelector() {
  const [open, setOpen]                   = useState(false);
  const [search, setSearch]               = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");

  // Read from localStorage synchronously on first render (no flash)
  const [selected, setSelected] = useState(() => {
    const saved = lsGet("saalu_selected_lang");
    return LANGUAGES.find((l) => l.code === saved) || LANGUAGES[0];
  });

  const containerRef   = useRef(null);
  const searchInputRef = useRef(null);

  // ── On mount: apply saved language to GT (GT may not have loaded yet,
  //    so applyLanguage's retry loop handles the wait) ───────────────────────
  useEffect(() => {
    const saved = lsGet("saalu_selected_lang");
    if (saved && saved !== "en") {
      const lang = LANGUAGES.find((l) => l.code === saved);
      if (lang) {
        setSelected(lang);
        _activeCode = saved;
        applyLanguage(saved);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cross-instance sync (two LanguageSelector instances in DOM) ───────────
  useEffect(() => {
    const onLangChange = (e) => {
      const code = e.detail || "en";
      const lang = LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
      setSelected(lang);
    };
    window.addEventListener("saalu_language_changed", onLangChange);
    return () => window.removeEventListener("saalu_language_changed", onLangChange);
  }, []);

  // ── Focus / close helpers ─────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch("");
      setSelectedCountry("");
    }
  }, [open]);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        containerRef.current?.querySelector(".lang-selector__trigger")?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredLanguages = useMemo(() => {
    let list = LANGUAGES;

    if (selectedCountry) {
      const countryObj = EUROPE_COUNTRIES.find((c) => c.country === selectedCountry);
      if (countryObj) {
        list = countryObj.languages
          .map((code) => LANGUAGES.find((l) => l.code === code))
          .filter(Boolean);
      }
    }

    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter((lang) =>
      lang.label.toLowerCase().includes(q) ||
      lang.native.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q) ||
      (lang.countries || []).some((c) => c.toLowerCase().includes(q))
    );
  }, [search, selectedCountry]);

  // ── Select a language ─────────────────────────────────────────────────────
  const handleSelect = useCallback((lang) => {
    const prevCode = lsGet("saalu_selected_lang") || "en";
    const newCode  = lang.code;

    // Update UI state immediately
    setSelected(lang);
    setOpen(false);

    // Persist selection
    lsSet("saalu_selected_lang", newCode);
    _activeCode = newCode;

    // Broadcast so the other LanguageSelector instance (mobile/desktop) updates
    window.dispatchEvent(new CustomEvent("saalu_language_changed", { detail: newCode }));

    if (newCode === "en") {
      // Restore English:
      //   - Clear the cookie
      //   - Reload the page (most reliable way to remove Google Translate's DOM transforms)
      if (typeof window.clearGoogleTranslateCookie === "function") {
        window.clearGoogleTranslateCookie();
      }
      if (prevCode !== "en") {
        // Small delay so the cookie write completes before reload
        setTimeout(() => window.location.reload(), 80);
      }
    } else {
      // Foreign language: set cookie + trigger GT live
      if (typeof window.setGoogTransCookie === "function") {
        window.setGoogTransCookie(newCode);
      }
      applyLanguage(newCode);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className={`lang-selector notranslate${open ? " lang-selector--open" : ""}`}
      ref={containerRef}
      translate="no"
    >
      {/* Trigger button */}
      <button
        type="button"
        className="lang-selector__trigger notranslate"
        translate="no"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${selected.label}. Click to change language.`}
        onClick={() => setOpen((v) => !v)}
        title="Select language"
      >
        <svg className="lang-selector__globe" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.4" />
          <ellipse cx="10" cy="10" rx="3.5" ry="8.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M1.5 7.5h17M1.5 12.5h17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span className="lang-selector__label notranslate" translate="no">{selected.native}</span>
        <svg className="lang-selector__chevron" viewBox="0 0 10 6" fill="none" aria-hidden="true">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="lang-selector__dropdown">

          {/* Country quick-filter */}
          <div className="lang-selector__country-box">
            <select
              className="lang-selector__country-select"
              value={selectedCountry}
              onChange={(e) => { setSelectedCountry(e.target.value); setSearch(""); }}
              aria-label="Filter by Country"
            >
              <option value="">All Countries ({EUROPE_COUNTRIES.length})</option>
              {EUROPE_COUNTRIES.map((c) => (
                <option key={c.country} value={c.country}>
                  {c.country} ({c.languages.length} lang{c.languages.length > 1 ? "s" : ""})
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="lang-selector__search-box">
            <svg className="lang-selector__search-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="lang-selector__search-input"
              placeholder="Search language or country (e.g. Tamil, Hindi, Spain…)"
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
                className="lang-selector__search-clear"
                onClick={(e) => { e.stopPropagation(); setSearch(""); searchInputRef.current?.focus(); }}
                aria-label="Clear search"
              >✕</button>
            )}
          </div>

          {/* Language list */}
          <ul className="lang-selector__list" role="listbox" aria-label="Language options">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang) => (
                <li
                  key={lang.code}
                  role="option"
                  aria-selected={selected.code === lang.code}
                  className={`lang-selector__option${selected.code === lang.code ? " is-active" : ""}`}
                  onClick={() => handleSelect(lang)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelect(lang); } }}
                  tabIndex={0}
                >
                  <span className="lang-selector__option-text">
                    <span className="lang-selector__option-native">{lang.native}</span>
                    <span className="lang-selector__option-secondary">({lang.label})</span>
                    {lang.countries && lang.countries.length > 0 && (
                      <span className="lang-selector__option-country">
                        {lang.countries.slice(0, 2).join(", ")}
                        {lang.countries.length > 2 ? ` +${lang.countries.length - 2}` : ""}
                      </span>
                    )}
                  </span>
                  {selected.code === lang.code && (
                    <svg className="lang-selector__check" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </li>
              ))
            ) : (
              <li className="lang-selector__empty">No languages found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
