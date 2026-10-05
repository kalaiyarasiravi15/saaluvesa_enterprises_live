const fail = (message) => { throw Object.assign(new Error(message), { status: 422 }); };
const text = (value, name, max, required = true) => {
  if (typeof value !== "string") fail(`${name} must be text.`);
  const result = value.trim();
  if ((required && !result) || result.length > max) fail(`${name} is required and must be at most ${max} characters.`);
  return result;
};
export function cleanLabel(body) {
  const title = text(body?.title, "Label name", 200);
  if (!Array.isArray(body.sections) || !body.sections.length) fail("Add at least one heading section.");
  const ids = new Set();
  const id = (value) => {
    if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(value) || ids.has(value)) fail("Sections and rows need unique IDs.");
    ids.add(value);
    return value;
  };
  const sections = body.sections.map((section, index) => {
    if (!section || typeof section !== "object") fail("Invalid section.");
    const heading = text(section.heading, `Section ${index + 1} heading`, 500);
    const fontSizePx = section.fontSizePx;
    if (typeof fontSizePx !== "number" || !Number.isFinite(fontSizePx) || fontSizePx < 8 || fontSizePx > 200) fail("Heading font size must be between 8 and 200 px.");
    const logoPath = section.logoPath || null;
    if (logoPath !== null && (typeof logoPath !== "string" || !/^\/uploads\/label-[a-f0-9-]+\.(png|jpg|webp)$/.test(logoPath))) fail("Invalid label logo.");
    const rightLogoPath = section.rightLogoPath || null;
    if (rightLogoPath !== null && (typeof rightLogoPath !== "string" || !/^\/uploads\/label-[a-f0-9-]+\.(png|jpg|webp)$/.test(rightLogoPath))) fail("Invalid right logo.");
    if (!Array.isArray(section.rows)) fail("Section rows must be an array.");
    const subHeading = typeof section.subHeading === "string" ? section.subHeading.slice(0, 500) : "";
    const subFontSizePx = typeof section.subFontSizePx === "number" && Number.isFinite(section.subFontSizePx) ? section.subFontSizePx : 20;
    return {
      id: id(section.id), heading, fontSizePx, subHeading, subFontSizePx, logoPath, rightLogoPath,
      rows: section.rows.map((row) => {
        if (!row || typeof row !== "object") fail("Invalid row.");
        return { id: id(row.id), key: text(row.key, "Row key", 300, false), value: text(row.value, "Row value", 4000, false) };
      }).filter((row) => row.key || row.value).map((row) => {
        if (!row.key || !row.value) fail(`Complete both key and value in section ${index + 1}.`);
        return row;
      }),
    };
  });
  return { title, sections };
}

export function labelRevision(value) {
  if (!Number.isSafeInteger(value) || value < 1) fail("A valid saved revision is required. Reload the label.");
  return value;
}
