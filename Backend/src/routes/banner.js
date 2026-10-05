import { Router } from "express";
import { SiteSetting } from "../models/index.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { uploadImage, removeUploadedFile } from "../utils/upload.js";

const DEFAULT_BANNER = {
  eyebrow: "WELCOME TO SAALUVESA ENTERPRISES PRIVATE LIMITED",
  headline: "Crafting Custom Apparel",
  headline_highlight: "for the World.",
  sub: "Now we concentrate on the textile and garment sector, with a strategic focus on the export of custom-printed T-shirts and apparel. Our mission is to deliver high-quality, tailor-made clothing solutions that meet diverse customer requirements across global markets.",
  notice_text_before: "Requested to proceed with our Integrated Customer-friendly Apparel Brand Website, ",
  notice_link_url: "https://castbull.co.in/",
  notice_link_text: "https://castbull.co.in/",
  notice_text_after: ", to place all your plain apparel, custom printing, and private label branding requirements.",
  links: [
    {
      id: "default-1",
      type: "external",
      url: "https://castbull.co.in/",
      text: "https://castbull.co.in/",
    },
  ],
  badge1_num: "100%",
  badge1_label: "Tailor-Made Solutions",
  badge2_num: "Global",
  badge2_label: "Export & Delivery",
  image_url: "",
};

export async function getBannerData() {
  try {
    const row = await SiteSetting.findOne({ where: { key: "home_banner" } });
    if (row && row.value) {
      const parsed = JSON.parse(row.value);
      const links = Array.isArray(parsed.links) && parsed.links.length > 0
        ? parsed.links
        : (parsed.notice_link_url
          ? [{ id: "link-1", type: "external", url: parsed.notice_link_url, text: parsed.notice_link_text || parsed.notice_link_url }]
          : DEFAULT_BANNER.links);

      return {
        ...DEFAULT_BANNER,
        ...parsed,
        links,
      };
    }
  } catch (err) {
    console.error("Failed to read home_banner setting:", err);
  }
  return { ...DEFAULT_BANNER };
}

// ── Public Router (GET /api/banner) ─────────────────────────
export const publicBanner = Router();

publicBanner.get("/", async (_req, res, next) => {
  try {
    const banner = await getBannerData();
    res.json(banner);
  } catch (err) {
    next(err);
  }
});

// ── Admin Router (PUT /api/admin/banner) ─────────────────────
export const adminBanner = Router();

adminBanner.use(authenticate, requireRole("admin"));

adminBanner.get("/", async (_req, res, next) => {
  try {
    const banner = await getBannerData();
    res.json(banner);
  } catch (err) {
    next(err);
  }
});

adminBanner.put("/", (req, res, next) => {
  uploadImage(req, res, async (err) => {
    if (err) return next(err);

    try {
      const current = await getBannerData();
      const body = req.body || {};

      let newImageUrl = current.image_url || "";
      if (req.file) {
        if (current.image_url) {
          removeUploadedFile(current.image_url);
        }
        newImageUrl = `/uploads/${req.file.filename}`;
      } else if (body.remove_image === "true" || body.remove_image === true) {
        if (current.image_url) {
          removeUploadedFile(current.image_url);
        }
        newImageUrl = "";
      }

      // Parse links array
      let links = [];
      if (body.links) {
        if (typeof body.links === "string") {
          try {
            links = JSON.parse(body.links);
          } catch {
            links = [];
          }
        } else if (Array.isArray(body.links)) {
          links = body.links;
        }
      }

      if (!Array.isArray(links) || !links.length) {
        if (body.notice_link_url) {
          links = [
            {
              id: "link-1",
              type: String(body.notice_link_url).startsWith("http") ? "external" : "internal",
              url: String(body.notice_link_url).trim(),
              text: String(body.notice_link_text || body.notice_link_url).trim(),
            },
          ];
        } else {
          links = current.links || DEFAULT_BANNER.links;
        }
      }

      // Sanitize each link
      links = links
        .filter((l) => l && (l.url || l.text))
        .map((l, idx) => ({
          id: l.id || `link-${Date.now()}-${idx}`,
          type: l.type || (l.url?.startsWith("http") ? "external" : "internal"),
          url: String(l.url || "").trim(),
          text: String(l.text || l.url || "").trim(),
        }));

      const primaryLink = links[0] || {};

      const updated = {
        eyebrow: String(body.eyebrow ?? current.eyebrow).trim(),
        headline: String(body.headline ?? current.headline).trim(),
        headline_highlight: String(body.headline_highlight ?? current.headline_highlight).trim(),
        sub: String(body.sub ?? current.sub).trim(),
        notice_text_before: String(body.notice_text_before ?? current.notice_text_before),
        notice_link_url: primaryLink.url || String(body.notice_link_url ?? current.notice_link_url).trim(),
        notice_link_text: primaryLink.text || String(body.notice_link_text ?? current.notice_link_text).trim(),
        notice_text_after: String(body.notice_text_after ?? current.notice_text_after),
        links,
        badge1_num: String(body.badge1_num ?? current.badge1_num).trim(),
        badge1_label: String(body.badge1_label ?? current.badge1_label).trim(),
        badge2_num: String(body.badge2_num ?? current.badge2_num).trim(),
        badge2_label: String(body.badge2_label ?? current.badge2_label).trim(),
        image_url: newImageUrl,
      };

      await SiteSetting.upsert({
        key: "home_banner",
        value: JSON.stringify(updated),
      });

      res.json(updated);
    } catch (saveErr) {
      next(saveErr);
    }
  });
});

export default publicBanner;
