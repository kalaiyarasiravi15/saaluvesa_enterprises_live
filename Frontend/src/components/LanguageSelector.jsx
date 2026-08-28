import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { LANGUAGES, EUROPE_COUNTRIES } from "../data/languages.js";
import "./LanguageSelector.css";

export { LANGUAGES, EUROPE_COUNTRIES };

let activeLanguageCode = "en";

export function getActiveLanguageCode() {
  return activeLanguageCode;
}

export function applyLanguage(langCode, retriesLeft = 15) {
  activeLanguageCode = langCode;
  const langObj = LANGUAGES.find((l) => l.code === langCode);
  const targetCode = langObj?.translateCode || langCode;

  if (typeof window.triggerGoogleTranslate === "function") {
    const ok = window.triggerGoogleTranslate(langCode);
    if (ok) return;
  }

  const select = document.querySelector(".goog-te-combo");
  if (select && select.options && select.options.length > 0) {
    let targetIndex = -1;
    for (let i = 0; i < select.options.length; i++) {
      const opt = select.options[i];
      if (targetCode === "en" || langCode === "en") {
        if (
          opt.value === "" ||
          opt.value === "en" ||
          opt.text.toLowerCase().includes("select") ||
          opt.text.toLowerCase().includes("english")
        ) {
          targetIndex = i;
          break;
        }
      } else {
        if (
          opt.value.toLowerCase() === targetCode.toLowerCase() ||
          opt.value.toLowerCase() === langCode.toLowerCase()
        ) {
          targetIndex = i;
          break;
        }
      }
    }

    if (targetIndex !== -1) {
      select.selectedIndex = targetIndex;
      select.value = select.options[targetIndex].value;
      select.options[targetIndex].selected = true;
    } else {
      select.value = targetCode === "en" ? "" : targetCode;
    }

    select.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  if (retriesLeft > 0) {
    setTimeout(() => applyLanguage(langCode, retriesLeft - 1), 150);
  }
}

export default function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selected, setSelected] = useState(LANGUAGES[0]);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Sync state if language changes elsewhere
  useEffect(() => {
    const handleLangChange = (e) => {
      const code = e.detail || "en";
      const lang = LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
      setSelected(lang);
    };

    window.addEventListener("saalu_language_changed", handleLangChange);
    return () => window.removeEventListener("saalu_language_changed", handleLangChange);
  }, []);

  // Focus search input on open, clear search on close
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        containerRef.current?.querySelector(".lang-selector__trigger")?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Filter languages by selected country and search term
  const filteredLanguages = useMemo(() => {
    let list = LANGUAGES;

    // Filter by Country if a specific country is selected
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

  // Handle language selection
  const handleSelect = useCallback((lang) => {
    setSelected(lang);
    setOpen(false);
    window.dispatchEvent(new CustomEvent("saalu_language_changed", { detail: lang.code }));
    applyLanguage(lang.code);
  }, []);

  return (
    <div
      className={`lang-selector notranslate${open ? " lang-selector--open" : ""}`}
      ref={containerRef}
      translate="no"
    >
      <button
        type="button"
        className="lang-selector__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${selected.label}. Click to change language.`}
        onClick={() => setOpen((v) => !v)}
        title="Select language"
      >
        <svg
          className="lang-selector__globe"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.4" />
          <ellipse cx="10" cy="10" rx="3.5" ry="8.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M1.5 7.5h17M1.5 12.5h17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>

        <span className="lang-selector__label">{selected.native}</span>

        <svg
          className="lang-selector__chevron"
          viewBox="0 0 10 6"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="lang-selector__dropdown">
          {/* Country Quick Filter */}
          <div className="lang-selector__country-box">
            <select
              className="lang-selector__country-select"
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setSearch("");
              }}
              aria-label="Filter by Country"
            >
              <option value="">All European Countries ({EUROPE_COUNTRIES.length})</option>
              {EUROPE_COUNTRIES.map((c) => (
                <option key={c.country} value={c.country}>
                  {c.country} ({c.languages.length} lang{c.languages.length > 1 ? "s" : ""})
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="lang-selector__search-box">
            <svg
              className="lang-selector__search-icon"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
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
              className="lang-selector__search-input"
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
                className="lang-selector__search-clear"
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
          <ul
            className="lang-selector__list"
            role="listbox"
            aria-label="Language options"
          >
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang) => (
                <li
                  key={lang.code}
                  role="option"
                  aria-selected={selected.code === lang.code}
                  className={`lang-selector__option${selected.code === lang.code ? " is-active" : ""}`}
                  onClick={() => handleSelect(lang)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(lang);
                    }
                  }}
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
                    <svg
                      className="lang-selector__check"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
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
              <li className="lang-selector__empty">No languages found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
