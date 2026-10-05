import { getDocTranslation, translateDocValue } from "../../data/languages.js";
import { getTranslateCode as getHomepageTranslateCode } from "../../../../Frontend/src/data/languages.js";

export const getLabelTranslationCode = (language) =>
  getHomepageTranslateCode(language?.code || language?.translateCode || "en");

export const newRow = () => ({ id: crypto.randomUUID(), key: "", value: "" });
export const newSection = () => ({
  id: crypto.randomUUID(),
  heading: "",
  fontSizePx: 32,
  subHeading: "",
  subFontSizePx: 20,
  logoPath: null,
  rightLogoPath: null,
  rows: [newRow()],
});
export const newLabel = () => ({ title: "", sections: [newSection()] });

export const imageUrl = (value) => {
  if (!value) return "";
  const base = new URL(import.meta.env.VITE_ADMIN_API_URL || "http://localhost:3000/api", window.location.origin);
  return new URL(value, base.origin).href;
};

const normalize = (value) => String(value).trim().toLowerCase().replace(/[:\s]+$/g, "");
const english = getDocTranslation("en");
const fieldKeys = new Map(
  Object.entries(english)
    .filter(([, value]) => typeof value === "string")
    .map(([key, value]) => [normalize(value), key])
);

export const LABEL_HEADER_TRANSLATIONS = {
  en: { no: "S.NO", field: "FIELD", detail: "DETAIL" },
  sq: { no: "Nr.", field: "FUSHË", detail: "HOLLËSI" },
  ca: { no: "Núm.", field: "CAMP", detail: "DETALL" },
  hy: { no: "Հ/Հ", field: "ԴԱՇՏ", detail: "ՄԱՆՐԱՄԱՍՆ" },
  de: { no: "Nr.", field: "FELD", detail: "DETAILS" },
  az: { no: "№", field: "SAHƏ", detail: "TƏFƏRRÜAT" },
  be: { no: "№", field: "ПОЛЕ", detail: "ДЭТАЛІ" },
  ru: { no: "№", field: "ПОЛЕ", detail: "ДЕТАЛИ" },
  nl: { no: "Nr.", field: "VELD", detail: "DETAIL" },
  fr: { no: "N°", field: "CHAMP", detail: "DÉTAIL" },
  bs: { no: "Br.", field: "POLJE", detail: "DETALJ" },
  hr: { no: "Br.", field: "POLJE", detail: "POJEDINOST" },
  sr: { no: "Бр.", field: "ПОЉЕ", detail: "ДЕТАЉ" },
  bg: { no: "№", field: "ПОЛЕ", detail: "ПОДРОБНОСТ" },
  el: { no: "Αρ.", field: "ΠΕΔΙΟ", detail: "ΛΕΠΤΟΜΕΡΕΙΑ" },
  tr: { no: "No", field: "ALAN", detail: "AYRINTI" },
  cs: { no: "Č.", field: "POLE", detail: "PODROBNOST" },
  da: { no: "Nr.", field: "FELT", detail: "DETALJE" },
  et: { no: "Nr", field: "VÄLI", detail: "ÜKSIKASI" },
  fi: { no: "Nro", field: "KENTTÄ", detail: "TIEDOT" },
  sv: { no: "Nr", field: "FÄLT", detail: "DETALJ" },
  ka: { no: "№", field: "ველი", detail: "დეტალი" },
  hu: { no: "Sz.", field: "MEZŐ", detail: "RÉSZLETEK" },
  is: { no: "Nr.", field: "REITUR", detail: "NÁNAR" },
  ga: { no: "Uimh.", field: "RÉIMSE", detail: "SONRAÍ" },
  it: { no: "N.", field: "CAMPO", detail: "DETTAGLIO" },
  kk: { no: "№", field: "ӨРІС", detail: "МӘЛІМЕТ" },
  lv: { no: "Nr.", field: "LAUKS", detail: "DETAĻA" },
  lt: { no: "Nr.", field: "LAUKAS", detail: "DETALĖ" },
  lb: { no: "Nr.", field: "FELD", detail: "DETAIL" },
  mt: { no: "Nru", field: "QASAM", detail: "DETTALJ" },
  ro: { no: "Nr.", field: "CÂMP", detail: "DETALII" },
  cnr: { no: "Br.", field: "POLJE", detail: "DETALJ" },
  mk: { no: "Бр.", field: "ПОЛЕ", detail: "ДЕТАЛ" },
  no: { no: "Nr.", field: "FELT", detail: "DETALJ" },
  nn: { no: "Nr.", field: "FELT", detail: "DETALJ" },
  se: { no: "Nr.", field: "GIELDA", detail: "DIEHTU" },
  pl: { no: "Nr", field: "POLE", detail: "SZCZEGÓŁ" },
  pt: { no: "N.º", field: "CAMPO", detail: "DETALHE" },
  sk: { no: "Č.", field: "POLE", detail: "PODROBNOSŤ" },
  sl: { no: "Št.", field: "POLJE", detail: "PODROBNOST" },
  es: { no: "Nº", field: "CAMPO", detail: "DETALLE" },
  gl: { no: "N.º", field: "CAMPO", detail: "DETALLE" },
  eu: { no: "Zk.", field: "EREMUA", detail: "XEHETASUNA" },
  "ca-valencia": { no: "Núm.", field: "CAMP", detail: "DETALL" },
  oc: { no: "N°", field: "CAMP", detail: "DETALH" },
  rm: { no: "Nr.", field: "CHAMP", detail: "DETAGL" },
  uk: { no: "№", field: "ПОЛЕ", detail: "ДЕТАЛІ" },
  cy: { no: "Rhif", field: "MAES", detail: "MANYLION" },
  gd: { no: "Àir.", field: "RAON", detail: "MION-FHIOS" },
  la: { no: "No.", field: "CAMPUS", detail: "SINGULA" },
};

const TRANSLATION_CACHE = new Map();
const ARMENIAN_FALLBACK = { a: "ա", b: "բ", c: "կ", d: "դ", e: "ե", f: "ֆ", g: "գ", h: "հ", i: "ի", j: "ջ", k: "կ", l: "լ", m: "մ", n: "ն", o: "ո", p: "պ", q: "ք", r: "ր", s: "ս", t: "տ", u: "ու", v: "վ", w: "վ", x: "քս", y: "յ", z: "զ" };
const CYRILLIC_FALLBACK = { a: "а", b: "б", c: "ц", d: "д", e: "е", f: "ф", g: "г", h: "х", i: "и", j: "ј", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", q: "к", r: "р", s: "с", t: "т", u: "у", v: "в", w: "в", x: "кс", y: "ј", z: "з" };
const GREEK_FALLBACK = { a: "α", b: "β", c: "κ", d: "δ", e: "ε", f: "φ", g: "γ", h: "η", i: "ι", j: "τζ", k: "κ", l: "λ", m: "μ", n: "ν", o: "ο", p: "π", q: "κ", r: "ρ", s: "σ", t: "τ", u: "υ", v: "β", w: "ω", x: "ξ", y: "υ", z: "ζ" };
const GEORGIAN_FALLBACK = { a: "ა", b: "ბ", c: "ც", d: "დ", e: "ე", f: "ფ", g: "გ", h: "ჰ", i: "ი", j: "ჯ", k: "კ", l: "ლ", m: "მ", n: "ნ", o: "ო", p: "პ", q: "ქ", r: "რ", s: "ს", t: "ტ", u: "უ", v: "ვ", w: "ვ", x: "ქს", y: "ი", z: "ზ" };
const transliterateArmenian = (value) => Array.from(value).map((char) => {
  const converted = ARMENIAN_FALLBACK[char.toLowerCase()];
  return converted ? (char === char.toUpperCase() ? converted.toUpperCase() : converted) : char;
}).join("");
const transliterateCyrillic = (value) => Array.from(value).map((char) => {
  const converted = CYRILLIC_FALLBACK[char.toLowerCase()];
  return converted ? (char === char.toUpperCase() ? converted.toUpperCase() : converted) : char;
}).join("");
const transliterateWith = (value, alphabet) => Array.from(value).map((char) => {
  const converted = alphabet[char.toLowerCase()];
  return converted ? (char === char.toUpperCase() ? converted.toUpperCase() : converted) : char;
}).join("");
const transliterateForLanguage = (value, targetLang) => {
  if (targetLang === "hy") return transliterateArmenian(value);
  if (["sr", "ru", "uk", "bg", "mk", "be", "kk"].includes(targetLang)) return transliterateCyrillic(value);
  if (targetLang === "el") return transliterateWith(value, GREEK_FALLBACK);
  if (targetLang === "ka") return transliterateWith(value, GEORGIAN_FALLBACK);
  return value;
};

export async function fetchTranslation(text, targetLang) {
  if (!text || !text.trim() || targetLang === "en") return text;
  const clean = text.trim();
  const key = `${targetLang}:${clean}`;
  if (TRANSLATION_CACHE.has(key)) return TRANSLATION_CACHE.get(key);

  const field = fieldKeys.get(normalize(clean));
  const localTrans = (field && getDocTranslation(targetLang)[field]) || translateDocValue(clean, targetLang);
  if (localTrans && localTrans.toLowerCase() !== clean.toLowerCase()) {
    TRANSLATION_CACHE.set(key, localTrans);
    return localTrans;
  }

  // Split long values without dropping whitespace or exceeding a small request budget.
  const chunks = [];
  let chunk = "";
  let bytes = 0;
  for (const char of clean) {
    const length = new TextEncoder().encode(char).length;
    if (bytes + length > 450) {
      const boundary = Math.max(chunk.lastIndexOf(" "), chunk.lastIndexOf("\n"));
      const split = boundary >= chunk.length / 2 ? boundary + 1 : chunk.length;
      chunks.push(chunk.slice(0, split));
      chunk = chunk.slice(split);
      bytes = new TextEncoder().encode(chunk).length;
    }
    chunk += char; bytes += length;
  }
  if (chunk) chunks.push(chunk);
  try {
    const translatedChunks = [];
    for (const part of chunks) {
      if (!part.trim()) { translatedChunks.push(part); continue; }
      let translated = "";
      try {
        const googleResponse = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(part.trim())}`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (googleResponse.ok) {
          const payload = await googleResponse.json();
          translated = Array.isArray(payload?.[0]) ? payload[0].map((segment) => segment?.[0] || "").join("").trim() : "";
        }
      } catch {
        // Use the existing provider below if Google is unavailable.
      }
      if (translated && translated.toLocaleLowerCase() !== part.trim().toLocaleLowerCase()) {
        translatedChunks.push((part.match(/^\s*/)?.[0] || "") + translated + (part.match(/\s*$/)?.[0] || ""));
        continue;
      }
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(part.trim())}&langpair=en|${encodeURIComponent(targetLang)}&de=support@saaluvesa.com`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const data = await res.json();
        const resultText = data?.responseData?.translatedText;
        if (Number(data.responseStatus) === 200 && !data.quotaFinished && typeof resultText === "string" && resultText.trim() && !resultText.startsWith("MYMEMORY WARNING")) {
          const fallbackText = resultText.trim();
          const unchanged = fallbackText.toLocaleLowerCase() === part.trim().toLocaleLowerCase();
          translatedChunks.push((part.match(/^\s*/)?.[0] || "") + (unchanged ? transliterateForLanguage(part.trim(), targetLang) : fallbackText) + (part.match(/\s*$/)?.[0] || ""));
          continue;
        }
      }
      throw new Error("Translation unavailable");
    }
    const result = translatedChunks.join("");
    TRANSLATION_CACHE.set(key, result);
    return result;
  } catch {
    const fallback = transliterateForLanguage(clean, targetLang);
    TRANSLATION_CACHE.set(key, fallback);
    return fallback;
  }
}

export function translateLabel(label, language = { code: "en" }) {
  if (!label || typeof label !== "object") {
    return { title: "", sections: [] };
  }

  const code = getLabelTranslationCode(language);
  const dictionary = getDocTranslation(code) || {};
  const headerTrans = LABEL_HEADER_TRANSLATIONS[code] || LABEL_HEADER_TRANSLATIONS.en;

  const translate = (value) => {
    if (code === "en" || !value) return value;
    const field = fieldKeys.get(normalize(value));
    return (field && dictionary[field]) || translateDocValue(value, code) || value;
  };

  let rawSections = label.sections;
  if (typeof rawSections === "string") {
    try {
      rawSections = JSON.parse(rawSections);
    } catch {
      rawSections = [];
    }
  }
  const safeSections = Array.isArray(rawSections) ? rawSections : [];

  return {
    ...label,
    tableHeaderNo: headerTrans.no,
    tableHeaderField: headerTrans.field,
    tableHeaderDetail: headerTrans.detail,
    title: translate(label.title || ""),
    sections: safeSections.map((section) => {
      let rawRows = section?.rows;
      if (typeof rawRows === "string") {
        try {
          rawRows = JSON.parse(rawRows);
        } catch {
          rawRows = [];
        }
      }
      const safeRows = Array.isArray(rawRows) ? rawRows : [];

      return {
        ...section,
        heading: translate(section?.heading || ""),
        subHeading: translate(section?.subHeading || ""),
        rows: safeRows
          .filter((row) => row && (Boolean(row.key?.trim()) || Boolean(row.value?.trim())))
          .map((row) => ({
            ...row,
            key: translate(row.key || ""),
            value: translate(row.value || ""),
          })),
      };
    }),
  };
}

export async function translateLabelAsync(label, language = { code: "en" }) {
  if (!label || typeof label !== "object") {
    return { title: "", sections: [] };
  }

  const code = getLabelTranslationCode(language);
  const baseline = translateLabel(label, language);
  if (code === "en") return baseline;

  const headerTrans = LABEL_HEADER_TRANSLATIONS[code] || LABEL_HEADER_TRANSLATIONS.en;

  let rawSections = label.sections;
  if (typeof rawSections === "string") {
    try { rawSections = JSON.parse(rawSections); } catch { rawSections = []; }
  }
  const safeSections = Array.isArray(rawSections) ? rawSections : [];

  const textsToTranslate = new Set();
  ["Serial number", "Field", "Detail"].forEach((text) => textsToTranslate.add(text));
  if (label.title && label.title.trim()) textsToTranslate.add(label.title.trim());

  safeSections.forEach((sec) => {
    if (sec?.heading && sec.heading.trim()) textsToTranslate.add(sec.heading.trim());
    if (sec?.subHeading && sec.subHeading.trim()) textsToTranslate.add(sec.subHeading.trim());
    let rows = sec?.rows;
    if (typeof rows === "string") { try { rows = JSON.parse(rows); } catch { rows = []; } }
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      if (row?.key?.trim()) textsToTranslate.add(row.key.trim());
      if (row?.value?.trim()) textsToTranslate.add(row.value.trim());
    });
  });

  const resultMap = new Map();
  const pending = Array.from(textsToTranslate);
  const warnings = [];
  await Promise.all(
    pending.map(async (str) => {
      try {
        resultMap.set(str, await fetchTranslation(str, code));
      } catch {
        warnings.push(str);
      }
    })
  );

  const getTrans = (val) => (val && val.trim() ? resultMap.get(val.trim()) || val : val);

  return {
    ...label,
    translationWarnings: warnings,
    tableHeaderNo: getTrans("Serial number") || headerTrans.no,
    tableHeaderField: getTrans("Field") || headerTrans.field,
    tableHeaderDetail: getTrans("Detail") || headerTrans.detail,
    title: getTrans(label.title || ""),
    sections: safeSections.map((sec) => {
      let rawRows = sec?.rows;
      if (typeof rawRows === "string") {
        try { rawRows = JSON.parse(rawRows); } catch { rawRows = []; }
      }
      const safeRows = Array.isArray(rawRows) ? rawRows : [];
      return {
        ...sec,
        heading: getTrans(sec?.heading || ""),
        subHeading: getTrans(sec?.subHeading || ""),
        rows: safeRows.map((r) => ({
          ...r,
          key: getTrans(r?.key || ""),
          value: getTrans(r?.value || ""),
        })),
      };
    }),
  };
}

export function validateDraft(label) {
  if (!label || !label.title || !label.title.trim()) return "Enter a label name.";

  let sections = label.sections;
  if (typeof sections === "string") {
    try {
      sections = JSON.parse(sections);
    } catch {
      sections = [];
    }
  }

  if (!Array.isArray(sections) || !sections.length) return "Add at least one heading section.";

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (!section || !section.heading || !section.heading.trim()) return `Enter a heading for section ${i + 1}.`;
    if (!Number.isFinite(section.fontSizePx) || section.fontSizePx < 8 || section.fontSizePx > 200)
      return `Choose a font size from 8 to 200 px in section ${i + 1}.`;

    const rows = Array.isArray(section.rows) ? section.rows : [];
    if (rows.some((row) => row && Boolean(row.key?.trim()) !== Boolean(row.value?.trim())))
      return `Complete both key and value in section ${i + 1}, or remove the incomplete row.`;
  }
  return "";
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export const filenameFor = (title, code, extension) =>
  `${
    Array.from((title || "label").trim())
      .map((char) => (char.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(char) ? "-" : char))
      .join("")
      .slice(0, 100) || "label"
  }-${code}.${extension}`;

export async function resizeLogo(file) {
  if (!file || !["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("Choose a PNG, JPEG or WebP image.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Choose an image smaller than 10 MB.");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("This image could not be read. Choose another file.");
  });
  try {
    const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
    if (!blob || blob.size > 2 * 1024 * 1024) throw new Error("This logo is too large after resizing. Choose a smaller image.");
    return blob;
  } finally {
    bitmap.close();
  }
}

export async function exportPng(element, filename) {
  const canvas = await renderLabelCanvas(element);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Image export failed. Try a smaller label.");
  downloadBlob(blob, filename);
}

async function renderLabelCanvas(element) {
  const { default: html2canvas } = await import("html2canvas");
  await document.fonts.ready;
  await Promise.all(
    Array.from(element.querySelectorAll("img")).map((img) =>
      img.decode().catch(() => {
        throw new Error("A logo could not load. Replace it or retry before exporting.");
      })
    )
  );
  const height = element.scrollHeight;
  if (height * 2 > 16000 || height * 720 * 4 > 24000000)
    throw new Error("This label is too tall for a PNG. Export JSON or split it into smaller labels.");
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    width: 720,
    height,
    onclone: (_document, clone) => {
      clone.style.transform = "none";
      clone.style.margin = "0";
      clone.parentElement.style.height = "auto";
      clone.parentElement.style.overflow = "visible";
      clone.parentElement.style.width = "720px";
    },
  });
  return canvas;
}

export async function exportPdf(element, filename) {
  const [{ jsPDF }, canvas] = await Promise.all([import("jspdf"), renderLabelCanvas(element)]);
  const image = canvas.toDataURL("image/png");
  const widthMm = (720 * 25.4) / 96;
  const heightMm = (canvas.height * 25.4) / (96 * 2);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [widthMm, heightMm], compress: true });
  pdf.addImage(image, "PNG", 0, 0, widthMm, heightMm, undefined, "FAST");
  pdf.save(filename);
}
