import { AppError } from "../lib/errors.js";
import { validateBlocks, validateSlug, sanitizeText, sanitizeLongText } from "../lib/validate.js";

const DEFAULT_PAGES = [
  {
    slug: "about",
    title: "About",
    blocks: [
      { type: "heading", text: "Thomas Sako" },
      { type: "subtitle", text: "Host of the 1847 Liberty Show" },
      {
        type: "paragraph",
        text: "Welcome to 1847 Liberty — the daily podcast where balanced news meets big conversations. Join us every morning for independent takes on politics, business, and the stories shaping our world.",
      },
      { type: "card", key: "team", title: "Thomas Sako", role: "Host & Founder", text: "Leads the daily conversation: interviews, analysis, and the headlines that matter, delivered with a straight-shooting, independent point of view." },
      { type: "card", key: "team", title: "Executive Producer", role: "Production", text: "Organizes the newsroom day, books guests, and keeps every episode tight, fair, and on schedule." },
      { type: "card", key: "team", title: "News & Research Desk", role: "Editorial", text: "Digs through sources, verifies the facts, and turns the day's noise into the stories our listeners actually want." },
      { type: "card", key: "guest-host", title: "Politics Desk", role: "Guest Host", text: "Regular guest voices from across the aisle join the show to debate policy, elections, and the latest in Washington." },
      { type: "card", key: "guest-host", title: "Business Desk", role: "Guest Host", text: "Markets, money, and the economy — expert guests break down what the numbers mean for everyday Americans." },
      { type: "card", key: "guest-host", title: "Culture Desk", role: "Guest Host", text: "From music to media to the ideas driving the culture wars, guests bring fresh perspective to the national conversation." },
    ],
  },
  {
    slug: "book",
    title: "Book Thomas",
    blocks: [{ type: "heading", text: "Book Thomas" }],
  },
  {
    slug: "contact",
    title: "Contact",
    blocks: [{ type: "heading", text: "Contact" }],
  },
  {
    slug: "podcast",
    title: "Podcast",
    blocks: [{ type: "heading", text: "The 1847 Liberty Show" }],
  },
  {
    slug: "playlist",
    title: "Playlist",
    blocks: [{ type: "heading", text: "Playlist" }],
  },
  {
    slug: "advertising",
    title: "Advertising",
    blocks: [{ type: "heading", text: "Advertising" }],
  },
  {
    slug: "home",
    title: "Home",
    blocks: [
      { type: "heading", text: "Sign up for daily updates" },
      { type: "paragraph", text: "Balanced news, independent perspectives. Delivered every morning." },
    ],
  },
];

export const createContentService = ({ pageRepo, settingsRepo, socialDefaults = {} }) => {
  /** Normalizes "YYYY-MM-DD" or ISO date strings; returns YYYY-MM-DD or null. */
  const normalizeDate = (value) => {
    if (typeof value !== "string" || !value.trim()) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  };

  const asOrder = (value) => {
    const n = Number(value);
    return Number.isInteger(n) && n >= 0 ? n : 0;
  };

  const cleanSponsors = (value) => {
    if (!Array.isArray(value)) return [];
    return value
      .filter((s) => s && typeof s === "object")
      .slice(0, 30)
      .map((s) => ({
        name: sanitizeText(s.name, 120) || "",
        image: sanitizeText(s.image, 500) || "",
        link: sanitizeText(s.link, 500) || "",
        order: asOrder(s.order),
        visible: s.visible !== false,
      }))
      .filter((s) => s.name && s.image);
  };

  const cleanAdverts = (value) => {
    if (!Array.isArray(value)) return [];
    return value
      .filter((a) => a && typeof a === "object")
      .slice(0, 20)
      .map((a) => ({
        title: sanitizeText(a.title, 120) || "",
        image: sanitizeText(a.image, 500) || "",
        link: sanitizeText(a.link, 500) || "",
        visible: a.visible !== false,
        order: asOrder(a.order),
        startDate: normalizeDate(a.startDate),
        endDate: normalizeDate(a.endDate),
      }))
      .filter((a) => a.title && a.image);
  };

  /** Only currently-active adverts, ordered by the CMS `order` field. */
  const activeAdverts = (adverts) => {
    const today = new Date().toISOString().slice(0, 10);
    return adverts
      .filter((a) => a.visible !== false)
      .filter((a) => !a.startDate || a.startDate <= today)
      .filter((a) => !a.endDate || a.endDate >= today)
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  };

  /** Only visible sponsors, ordered by the CMS `order` field. */
  const visibleSponsors = (sponsors) =>
    sponsors
      .filter((s) => s.visible !== false)
      .slice()
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  const cleanSponsorBanner = (value) => {
    const v = value && typeof value === "object" ? value : {};
    return {
      text: sanitizeText(v.text, 300) || "",
      link: sanitizeText(v.link, 500) || "",
      image: sanitizeText(v.image, 500) || "",
      visible: Boolean(v.visible),
    };
  };

  const buildPublicSettings = async () => {
    const [socialSetting, footerSetting, sponsorsSetting, advertsSetting, bannerSetting] =
      await Promise.all([
        settingsRepo.get("social_links"),
        settingsRepo.get("footer"),
        settingsRepo.get("sponsors"),
        settingsRepo.get("adverts"),
        settingsRepo.get("sponsor_banner"),
      ]);
    const social = {
      youtube: "",
      facebook: "",
      x: "",
      instagram: "",
      whatsapp: "",
      tiktok: "",
      gmail: "",
      ...socialDefaults,
      ...(socialSetting?.value || {}),
    };
    return {
      social,
      footer: footerSetting?.value || {},
      sponsors: visibleSponsors(cleanSponsors(sponsorsSetting?.value)),
      adverts: activeAdverts(cleanAdverts(advertsSetting?.value)),
      sponsorBanner: cleanSponsorBanner(bannerSetting?.value),
    };
  };

  return {
    /** Ensures default pages exist (idempotent, on first boot). */
    async seedDefaults(updatedBy = null) {
      for (const page of DEFAULT_PAGES) {
        const existing = await pageRepo.getBySlug(page.slug);
        if (!existing) {
          await pageRepo.create({
            slug: page.slug,
            title: page.title,
            description: "",
            body: page.blocks,
            status: "published",
            updatedBy,
          });
        } else if (page.slug === "about") {
          // Enrich an existing about page that has no team/guest-host cards yet
          // (so the About page shows meaningful content out of the box). Once
          // cards exist — from the seed or later admin edits — this is a no-op.
          const hasTeamCards = (Array.isArray(existing.body) ? existing.body : []).some(
            (b) => b?.type === "card" && b.key === "team",
          );
          if (!hasTeamCards) {
            await pageRepo.update(existing.id, { body: page.blocks, updatedBy });
          }
        }
      }
      return { seeded: DEFAULT_PAGES.length };
    },

    // ---- Public ----
    async getPublicPage(slug) {
      const page = await pageRepo.getBySlug(slug, "published");
      return page;
    },

    async getPublicSettings() {
      return buildPublicSettings();
    },

    async getSocialLinks() {
      const settings = await buildPublicSettings();
      return settings.social;
    },

    // ---- Admin ----
    async listPages(params) {
      return pageRepo.list(params);
    },

    async getAdminPage(slug) {
      const page = await pageRepo.getBySlug(slug);
      return page;
    },

    async getAdminPageById(id) {
      const page = await pageRepo.getById(id);
      if (!page) throw new AppError(404, "Page not found");
      return page;
    },

    async createPage(data, actorId) {
      const slug = validateSlug(data.slug);
      if (!slug) throw new AppError(400, "A valid slug (lowercase letters, numbers, dashes) is required");
      const existing = await pageRepo.getBySlug(slug);
      if (existing) throw new AppError(409, "A page with this slug already exists");
      const title = sanitizeText(data.title, 255);
      if (!title) throw new AppError(400, "Title is required");
      const blocksResult = validateBlocks(data.body);
      if (blocksResult.error) throw new AppError(400, blocksResult.error);
      const status = data.status === "draft" ? "draft" : "published";
      return pageRepo.create({
        slug,
        title,
        description: sanitizeText(data.description, 500) || "",
        body: blocksResult.value,
        status,
        updatedBy: actorId,
      });
    },

    async updatePage(id, data, actorId) {
      const existing = await pageRepo.getById(id);
      if (!existing) throw new AppError(404, "Page not found");

      const fields = {};
      if (data.slug !== undefined) {
        const slug = validateSlug(data.slug);
        if (!slug) throw new AppError(400, "A valid slug is required");
        const clash = await pageRepo.findBySlugExcluding(slug, existing.id);
        if (clash) throw new AppError(409, "A page with this slug already exists");
        fields.slug = slug;
      }
      if (data.title !== undefined) {
        const title = sanitizeText(data.title, 255);
        if (!title) throw new AppError(400, "Title is required");
        fields.title = title;
      }
      if (data.description !== undefined) {
        fields.description = sanitizeLongText(data.description, 500) || "";
      }
      if (data.body !== undefined) {
        const blocksResult = validateBlocks(data.body);
        if (blocksResult.error) throw new AppError(400, blocksResult.error);
        fields.body = blocksResult.value;
      }
      if (data.status !== undefined) {
        if (!["draft", "published"].includes(data.status)) {
          throw new AppError(400, "Invalid status");
        }
        fields.status = data.status;
      }
      fields.updatedBy = actorId;
      return pageRepo.update(id, fields);
    },

    async deletePage(id, actorId) {
      const existing = await pageRepo.getById(id);
      if (!existing) throw new AppError(404, "Page not found");
      await pageRepo.remove(id);
      return existing;
    },

    async getSettings() {
      const list = await settingsRepo.list();
      const settings = {};
      for (const item of list) settings[item.key] = item.value;
      if (!settings.social_links) {
        settings.social_links = { ...socialDefaults };
      }
      return settings;
    },

    async updateSetting(key, value, actorId) {
      const allowed = new Set([
        "social_links",
        "footer",
        "hero",
        "subscribe",
        "seo",
        "sponsors",
        "adverts",
        "sponsor_banner",
      ]);
      const safeKey = sanitizeText(key, 255);
      if (!safeKey || !allowed.has(safeKey)) {
        throw new AppError(400, `Unknown setting key: ${key}`);
      }
      if (safeKey === "social_links") {
        const social = typeof value === "object" && value !== null ? value : {};
        const cleaned = {
          youtube: sanitizeText(social.youtube, 500) || "",
          facebook: sanitizeText(social.facebook, 500) || "",
          x: sanitizeText(social.x, 500) || "",
          instagram: sanitizeText(social.instagram, 500) || "",
          whatsapp: sanitizeText(social.whatsapp, 500) || "",
          tiktok: sanitizeText(social.tiktok, 500) || "",
          gmail: sanitizeText(social.gmail, 500) || "",
        };
        return settingsRepo.set(safeKey, cleaned, actorId);
      }
      if (safeKey === "sponsors") {
        return settingsRepo.set(safeKey, cleanSponsors(value), actorId);
      }
      if (safeKey === "adverts") {
        return settingsRepo.set(safeKey, cleanAdverts(value), actorId);
      }
      if (safeKey === "sponsor_banner") {
        return settingsRepo.set(safeKey, cleanSponsorBanner(value), actorId);
      }
      return settingsRepo.set(safeKey, value, actorId);
    },
  };
};

export default createContentService;
