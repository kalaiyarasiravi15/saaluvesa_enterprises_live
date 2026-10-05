/**
 * Saaluvesa – Language / Country Configuration  v3.0
 *
 * VERIFIED Google Translate codes (checked against the GT combo select):
 *   - Only codes that actually appear as <option value="…"> in the GT widget
 *     are used as translateCode.
 *   - Codes that don't exist in GT are mapped to the closest official equivalent.
 *   - The app-level "code" (stored in localStorage) is NEVER changed; only the
 *     translateCode is adjusted.
 */

// ─── Country → language mapping (used for the country quick-filter) ──────────
export const EUROPE_COUNTRIES = [
  { country: "Albania",                 languages: ["sq"] },
  { country: "Andorra",                 languages: ["ca"] },
  { country: "Armenia",                 languages: ["hy"] },
  { country: "Austria",                 languages: ["de"] },
  { country: "Azerbaijan",              languages: ["az"] },
  { country: "Belarus",                 languages: ["be", "ru"] },
  { country: "Belgium",                 languages: ["nl", "fr", "de"] },
  { country: "Bosnia and Herzegovina",  languages: ["bs", "hr", "sr"] },
  { country: "Bulgaria",                languages: ["bg"] },
  { country: "Croatia",                 languages: ["hr"] },
  { country: "Cyprus",                  languages: ["el", "tr"] },
  { country: "Czech Republic",          languages: ["cs"] },
  { country: "Denmark",                 languages: ["da"] },
  { country: "Estonia",                 languages: ["et"] },
  { country: "Finland",                 languages: ["fi", "sv"] },
  { country: "France",                  languages: ["fr"] },
  { country: "Georgia",                 languages: ["ka"] },
  { country: "Germany",                 languages: ["de"] },
  { country: "Greece",                  languages: ["el"] },
  { country: "Hungary",                 languages: ["hu"] },
  { country: "Iceland",                 languages: ["is"] },
  { country: "Ireland",                 languages: ["ga", "en"] },
  { country: "Italy",                   languages: ["it"] },
  { country: "Kazakhstan",              languages: ["kk", "ru"] },
  { country: "Kosovo",                  languages: ["sq", "sr"] },
  { country: "Latvia",                  languages: ["lv"] },
  { country: "Liechtenstein",           languages: ["de"] },
  { country: "Lithuania",               languages: ["lt"] },
  { country: "Luxembourg",              languages: ["lb", "fr", "de"] },
  { country: "Malta",                   languages: ["mt", "en"] },
  { country: "Moldova",                 languages: ["ro"] },
  { country: "Monaco",                  languages: ["fr"] },
  { country: "Montenegro",              languages: ["cnr"] },
  { country: "Netherlands",             languages: ["nl"] },
  { country: "North Macedonia",         languages: ["mk", "sq"] },
  { country: "Norway",                  languages: ["no", "nn", "se"] },
  { country: "Poland",                  languages: ["pl"] },
  { country: "Portugal",                languages: ["pt"] },
  { country: "Romania",                 languages: ["ro"] },
  { country: "Russia",                  languages: ["ru"] },
  { country: "San Marino",              languages: ["it"] },
  { country: "Serbia",                  languages: ["sr"] },
  { country: "Slovakia",                languages: ["sk"] },
  { country: "Slovenia",                languages: ["sl"] },
  { country: "Spain",                   languages: ["es", "ca", "gl", "eu", "ca-valencia", "oc"] },
  { country: "Sweden",                  languages: ["sv"] },
  { country: "Switzerland",             languages: ["de", "fr", "it", "rm"] },
  { country: "Türkiye",                 languages: ["tr"] },
  { country: "Ukraine",                 languages: ["uk"] },
  { country: "United Kingdom",          languages: ["en", "cy", "gd", "ga"] },
  { country: "Vatican City",            languages: ["it", "la"] },
  { country: "India",                   languages: ["ta", "hi", "en"] },
];

// ─── Language list ─────────────────────────────────────────────────────────────
// translateCode = the value that actually works in Google Translate's combo <select>.
// code          = what we store in localStorage and show in the UI.
export const LANGUAGES = [
  // ── Common / Global ──────────────────────────────────────────────────────────
  { code: "en",          translateCode: "en", label: "English",           native: "English",             countries: ["United Kingdom", "Ireland", "Malta", "India"] },
  // { code: "ta",          translateCode: "ta", label: "Tamil",             native: "தமிழ்",               countries: ["India", "Singapore", "Sri Lanka", "Malaysia"] },
  // { code: "hi",          translateCode: "hi", label: "Hindi",             native: "हिन्दी",              countries: ["India"] },

  // ── European ─────────────────────────────────────────────────────────────────
  { code: "sq",          translateCode: "sq", label: "Albanian",          native: "Shqip",               countries: ["Albania", "Kosovo", "North Macedonia"] },
  { code: "ca",          translateCode: "ca", label: "Catalan",           native: "Català",              countries: ["Andorra", "Spain"] },
  { code: "hy",          translateCode: "hy", label: "Armenian",          native: "Հայերեն",             countries: ["Armenia"] },
  { code: "de",          translateCode: "de", label: "German",            native: "Deutsch",             countries: ["Germany", "Austria", "Switzerland", "Belgium", "Liechtenstein", "Luxembourg"] },
  { code: "az",          translateCode: "az", label: "Azerbaijani",       native: "Azərbaycan",          countries: ["Azerbaijan"] },
  { code: "be",          translateCode: "be", label: "Belarusian",        native: "Беларуская",          countries: ["Belarus"] },
  { code: "ru",          translateCode: "ru", label: "Russian",           native: "Русский",             countries: ["Russia", "Belarus", "Kazakhstan"] },
  { code: "nl",          translateCode: "nl", label: "Dutch",             native: "Nederlands",          countries: ["Netherlands", "Belgium"] },
  { code: "fr",          translateCode: "fr", label: "French",            native: "Français",            countries: ["France", "Belgium", "Luxembourg", "Monaco", "Switzerland"] },
  { code: "bs",          translateCode: "bs", label: "Bosnian",           native: "Bosanski",            countries: ["Bosnia and Herzegovina"] },
  { code: "hr",          translateCode: "hr", label: "Croatian",          native: "Hrvatski",            countries: ["Croatia", "Bosnia and Herzegovina"] },
  { code: "sr",          translateCode: "sr", label: "Serbian",           native: "Српски",              countries: ["Serbia", "Bosnia and Herzegovina", "Kosovo"] },
  { code: "bg",          translateCode: "bg", label: "Bulgarian",         native: "Български",           countries: ["Bulgaria"] },
  { code: "el",          translateCode: "el", label: "Greek",             native: "Ελληνικά",            countries: ["Greece", "Cyprus"] },
  { code: "tr",          translateCode: "tr", label: "Turkish",           native: "Türkçe",              countries: ["Türkiye", "Cyprus"] },
  { code: "cs",          translateCode: "cs", label: "Czech",             native: "Čeština",             countries: ["Czech Republic"] },
  { code: "da",          translateCode: "da", label: "Danish",            native: "Dansk",               countries: ["Denmark"] },
  { code: "et",          translateCode: "et", label: "Estonian",          native: "Eesti",               countries: ["Estonia"] },
  { code: "fi",          translateCode: "fi", label: "Finnish",           native: "Suomi",               countries: ["Finland"] },
  { code: "sv",          translateCode: "sv", label: "Swedish",           native: "Svenska",             countries: ["Sweden", "Finland"] },
  { code: "ka",          translateCode: "ka", label: "Georgian",          native: "ქართული",             countries: ["Georgia"] },
  { code: "hu",          translateCode: "hu", label: "Hungarian",         native: "Magyar",              countries: ["Hungary"] },
  { code: "is",          translateCode: "is", label: "Icelandic",         native: "Íslenska",            countries: ["Iceland"] },
  { code: "ga",          translateCode: "ga", label: "Irish",             native: "Gaeilge",             countries: ["Ireland", "United Kingdom"] },
  { code: "it",          translateCode: "it", label: "Italian",           native: "Italiano",            countries: ["Italy", "Switzerland", "San Marino", "Vatican City"] },
  { code: "kk",          translateCode: "kk", label: "Kazakh",            native: "Қазақша",             countries: ["Kazakhstan"] },
  { code: "lv",          translateCode: "lv", label: "Latvian",           native: "Latviešu",            countries: ["Latvia"] },
  { code: "lt",          translateCode: "lt", label: "Lithuanian",        native: "Lietuvių",            countries: ["Lithuania"] },
  { code: "lb",          translateCode: "lb", label: "Luxembourgish",     native: "Lëtzebuergesch",      countries: ["Luxembourg"] },
  { code: "mt",          translateCode: "mt", label: "Maltese",           native: "Malti",               countries: ["Malta"] },
  { code: "ro",          translateCode: "ro", label: "Romanian",          native: "Română",              countries: ["Romania", "Moldova"] },
  // cnr (Montenegrin) not in GT — nearest official equivalent is Serbian
  { code: "cnr",         translateCode: "sr", label: "Montenegrin",       native: "Crnogorski",          countries: ["Montenegro"] },
  { code: "mk",          translateCode: "mk", label: "Macedonian",        native: "Македонски",          countries: ["North Macedonia"] },
  { code: "no",          translateCode: "no", label: "Norwegian Bokmål",  native: "Norsk Bokmål",        countries: ["Norway"] },
  // nn (Nynorsk) not in GT — nearest is Norwegian Bokmål
  { code: "nn",          translateCode: "no", label: "Norwegian Nynorsk", native: "Norsk Nynorsk",       countries: ["Norway"] },
  // se (Northern Sami) not in GT — nearest is Norwegian
  { code: "se",          translateCode: "no", label: "Northern Sami",     native: "Davvisámegiella",     countries: ["Norway"] },
  { code: "pl",          translateCode: "pl", label: "Polish",            native: "Polski",              countries: ["Poland"] },
  { code: "pt",          translateCode: "pt", label: "Portuguese",        native: "Português",           countries: ["Portugal"] },
  { code: "sk",          translateCode: "sk", label: "Slovak",            native: "Slovenčina",          countries: ["Slovakia"] },
  { code: "sl",          translateCode: "sl", label: "Slovenian",         native: "Slovenščina",         countries: ["Slovenia"] },
  { code: "es",          translateCode: "es", label: "Spanish",           native: "Español",             countries: ["Spain"] },
  { code: "gl",          translateCode: "gl", label: "Galician",          native: "Galego",              countries: ["Spain"] },
  { code: "eu",          translateCode: "eu", label: "Basque",            native: "Euskara",             countries: ["Spain"] },
  // ca-valencia shown as separate dialect; GT only has 'ca' (Catalan)
  { code: "ca-valencia", translateCode: "ca", label: "Valencian",         native: "Valencià",            countries: ["Spain"] },
  { code: "oc",          translateCode: "oc", label: "Occitan/Aranese",   native: "Occitan / Aranés",    countries: ["Spain"] },
  // rm (Romansh) not in GT — nearest official equivalent is Italian
  { code: "rm",          translateCode: "it", label: "Romansh",           native: "Rumantsch",           countries: ["Switzerland"] },
  { code: "uk",          translateCode: "uk", label: "Ukrainian",         native: "Українська",          countries: ["Ukraine"] },
  { code: "cy",          translateCode: "cy", label: "Welsh",             native: "Cymraeg",             countries: ["United Kingdom"] },
  { code: "gd",          translateCode: "gd", label: "Scottish Gaelic",   native: "Gàidhlig",            countries: ["United Kingdom"] },
  { code: "la",          translateCode: "la", label: "Latin",             native: "Latina",              countries: ["Vatican City"] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Map an app language code → the verified Google Translate combo value.
 * This is the ONLY function that should be called when talking to GT.
 */
export function getTranslateCode(code) {
  if (!code || code === "en") return "en";
  const lang = LANGUAGES.find((l) => l.code === code);
  if (lang) return lang.translateCode;
  return code; // pass-through for codes not in our list
}

/** Look up a LANGUAGES entry by code; returns English entry as fallback. */
export function getLanguageByCode(code) {
  if (!code) return LANGUAGES[0];
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}

/** True if code is in our LANGUAGES list. */
export function isSupportedLanguage(code) {
  return LANGUAGES.some((l) => l.code === code);
}
