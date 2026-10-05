const HEADERS = {
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

const GT_CODE_MAP = {
  "ca-valencia": "ca",
  cnr: "sr",
  nn: "no",
  se: "no",
  rm: "it",
};

const ARMENIAN = {
  a: "ա", b: "բ", c: "կ", d: "դ", e: "ե", f: "ֆ", g: "գ", h: "հ", i: "ի", j: "ջ",
  k: "կ", l: "լ", m: "մ", n: "ն", o: "ո", p: "պ", q: "ք", r: "ր", s: "ս", t: "տ",
  u: "ու", v: "վ", w: "վ", x: "քս", y: "յ", z: "զ",
};
const CYRILLIC = {
  a: "а", b: "б", c: "ц", d: "д", e: "е", f: "ф", g: "г", h: "х", i: "и", j: "ј",
  k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", q: "к", r: "р", s: "с", t: "т",
  u: "у", v: "в", w: "в", x: "кс", y: "ј", z: "з",
};
const GREEK = {
  a: "α", b: "β", c: "κ", d: "δ", e: "ε", f: "φ", g: "γ", h: "η", i: "ι", j: "τζ",
  k: "κ", l: "λ", m: "μ", n: "ν", o: "ο", p: "π", q: "κ", r: "ρ", s: "σ", t: "τ",
  u: "υ", v: "β", w: "ω", x: "ξ", y: "υ", z: "ζ",
};
const GEORGIAN = {
  a: "ა", b: "ბ", c: "ც", d: "დ", e: "ე", f: "ფ", g: "გ", h: "ჰ", i: "ი", j: "ჯ",
  k: "კ", l: "ლ", m: "მ", n: "ნ", o: "ო", p: "პ", q: "ქ", r: "რ", s: "ს", t: "ტ",
  u: "უ", v: "ვ", w: "ვ", x: "ქს", y: "ი", z: "ზ",
};

const cache = new Map();
const resolveCode = (value) => {
  const clean = String(value || "en").trim().toLowerCase();
  return GT_CODE_MAP[clean] || clean.split("-")[0] || "en";
};
const plainText = (value, max = 4000) => typeof value === "string" && value.length <= max;
const hasLetters = (value) => /\p{L}/u.test(value);

function transliterateArmenian(value) {
  return Array.from(value).map((char) => {
    const lower = char.toLowerCase();
    const replacement = ARMENIAN[lower];
    if (!replacement) return char;
    return char === char.toUpperCase() ? replacement.toUpperCase() : replacement;
  }).join("");
}
function transliterateCyrillic(value) {
  return Array.from(value).map((char) => {
    const replacement = CYRILLIC[char.toLowerCase()];
    if (!replacement) return char;
    return char === char.toUpperCase() ? replacement.toUpperCase() : replacement;
  }).join("");
}
function transliterateWith(value, alphabet) {
  return Array.from(value).map((char) => {
    const replacement = alphabet[char.toLowerCase()];
    if (!replacement) return char;
    return char === char.toUpperCase() ? replacement.toUpperCase() : replacement;
  }).join("");
}
function transliterateForLanguage(value, target) {
  if (target === "hy") return transliterateArmenian(value);
  if (["sr", "ru", "uk", "bg", "mk", "be", "kk"].includes(target)) return transliterateCyrillic(value);
  if (target === "el") return transliterateWith(value, GREEK);
  if (target === "ka") return transliterateWith(value, GEORGIAN);
  return value;
}

function preserveEdges(source, translated) {
  const start = source.match(/^\s*/)?.[0] || "";
  const end = source.match(/\s*$/)?.[0] || "";
  return `${start}${translated.trim()}${end}`;
}

async function translateChunk(value, target) {
  let result = "";
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(value.trim())}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (response.ok) {
      const body = await response.json();
      const candidate = Array.isArray(body?.[0]) ? body[0].map((part) => part?.[0] || "").join("") : "";
      if (candidate.trim()) result = candidate.trim();
    }
  } catch {
    // Try the secondary provider below.
  }
  if (!result || result.toLocaleLowerCase() === value.trim().toLocaleLowerCase()) {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(value.trim())}&langpair=en|${encodeURIComponent(target)}&de=support@saaluvesa.com`;
      const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { Accept: "application/json" } });
      if (response.ok) {
        const body = await response.json();
        const candidate = body?.responseStatus === 200 && !body?.quotaFinished ? body?.responseData?.translatedText : "";
        if (typeof candidate === "string" && candidate.trim() && !candidate.startsWith("MYMEMORY WARNING")) result = candidate.trim();
      }
    } catch {
      // Both providers can be temporarily unavailable.
    }
  }
  return result && result.toLocaleLowerCase() !== value.trim().toLocaleLowerCase()
    ? result
    : transliterateForLanguage(value, target);
}

async function translateText(value, target) {
  if (!plainText(value) || !value.trim() || !hasLetters(value) || target === "en") return value;
  const key = `${target}:${value.trim()}`;
  if (cache.has(key)) return cache.get(key);

  const chunks = [];
  let chunk = "";
  let bytes = 0;
  for (const char of value) {
    const size = Buffer.byteLength(char, "utf8");
    if (bytes + size > 450 && chunk) {
      const boundary = Math.max(chunk.lastIndexOf(" "), chunk.lastIndexOf("\n"));
      const split = boundary >= chunk.length / 2 ? boundary + 1 : chunk.length;
      chunks.push(chunk.slice(0, split));
      chunk = chunk.slice(split);
      bytes = Buffer.byteLength(chunk, "utf8");
    }
    chunk += char;
    bytes += size;
  }
  if (chunk) chunks.push(chunk);
  const result = (await Promise.all(chunks.map(async (part) => {
    if (!part.trim()) return part;
    return preserveEdges(part, await translateChunk(part, target));
  }))).join("");
  cache.set(key, result);
  return result;
}

function normalizeLabel(input) {
  if (!input || typeof input !== "object" || !plainText(input.title, 200) || !Array.isArray(input.sections)) {
    throw Object.assign(new Error("A valid label is required for translation."), { status: 422 });
  }
  return {
    ...input,
    sections: input.sections.map((section) => {
      if (!section || !plainText(section.heading, 500) || !plainText(section.subHeading || "", 500) || !Array.isArray(section.rows)) {
        throw Object.assign(new Error("The label contains invalid content."), { status: 422 });
      }
      return {
        ...section,
        rows: section.rows.map((row) => {
          if (!row || !plainText(row.key || "", 300) || !plainText(row.value || "", 4000)) {
            throw Object.assign(new Error("The label contains invalid row content."), { status: 422 });
          }
          return { ...row, key: row.key || "", value: row.value || "" };
        }),
      };
    }),
  };
}

export async function translateLabel(input, languageCode) {
  const label = normalizeLabel(input);
  const rawCode = String(languageCode || "en").trim().toLowerCase();
  const target = resolveCode(rawCode);
  const headerKey = HEADERS[rawCode] ? rawCode : HEADERS[target] ? target : "en";
  const headers = HEADERS[headerKey] || HEADERS.en;

  if (target === "en") {
    return {
      ...label,
      tableHeaderNo: "S.NO",
      tableHeaderField: "FIELD",
      tableHeaderDetail: "DETAIL",
    };
  }

  const distinctTexts = new Set();
  ["Serial number", "Field", "Detail"].forEach((text) => distinctTexts.add(text));
  if (label.title && label.title.trim()) distinctTexts.add(label.title.trim());
  label.sections.forEach((sec) => {
    if (sec.heading && sec.heading.trim()) distinctTexts.add(sec.heading.trim());
    if (sec.subHeading && sec.subHeading.trim()) distinctTexts.add(sec.subHeading.trim());
    sec.rows.forEach((row) => {
      if (row.key.trim()) distinctTexts.add(row.key.trim());
      if (row.value.trim()) distinctTexts.add(row.value.trim());
    });
  });

  const textArray = Array.from(distinctTexts);
  const translationPairs = [];
  for (let index = 0; index < textArray.length; index += 4) {
    translationPairs.push(...await Promise.all(textArray.slice(index, index + 4).map(async (text) => [text, await translateText(text, target)])));
  }
  const transMap = new Map(translationPairs);
  const getTrans = (val) => (val && val.trim() ? transMap.get(val.trim()) || val : val);

  return {
    ...label,
    title: getTrans(label.title),
    sections: label.sections.map((section) => ({
      ...section,
      heading: getTrans(section.heading),
      subHeading: getTrans(section.subHeading),
      // Rows are kept untouched:
      rows: section.rows.map((row) => ({
        ...row,
        key: getTrans(row.key),
        value: getTrans(row.value),
      })),
    })),
    tableHeaderNo: getTrans("Serial number") || headers.no,
    tableHeaderField: getTrans("Field") || headers.field,
    tableHeaderDetail: getTrans("Detail") || headers.detail,
  };
}
