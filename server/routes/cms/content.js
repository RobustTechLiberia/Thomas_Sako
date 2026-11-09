"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const { getCmsSheetClient, ensureCmsSheets, getSheetRows, spreadsheetId } = require("./sheets");
const { requireCmsAuth } = require("./Auth/login");

const router = express.Router();
const imageDirectory = path.resolve(__dirname, "../../cms/images");
fs.mkdirSync(imageDirectory, { recursive: true });

const clean = (value, max = 10000) => String(value || "").trim().slice(0, max);
const slugify = (value) => clean(value, 180).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "untitled";
const contentFromRow = (row) => ({ id: row[0] || "", title: row[1] || "", slug: row[2] || "", category: row[3] || "", body: row[4] || "", image: row[5] || "", status: row[6] || "Draft", updatedAt: row[7] || "", author: row[8] || "" });

async function cmsSheets() {
  const sheets = getCmsSheetClient();
  await ensureCmsSheets(sheets);
  return sheets;
}

router.get("/", requireCmsAuth, async (req, res, next) => {
  try {
    const rows = await getSheetRows(await cmsSheets(), "CMS_Content!A2:I");
    return res.json({ success: true, contents: rows.filter((row) => row[0]).map(contentFromRow).reverse() });
  } catch (error) { return next(error); }
});

router.post("/", requireCmsAuth, async (req, res, next) => {
  try {
    const title = clean(req.body?.title, 180);
    if (!title) return res.status(400).json({ success: false, error: "A content title is required." });
    const item = { id: crypto.randomUUID(), title, slug: slugify(req.body?.slug || title), category: clean(req.body?.category, 80) || "General", body: clean(req.body?.body), image: clean(req.body?.image, 500), status: req.body?.status === "Published" ? "Published" : "Draft", updatedAt: new Date().toISOString(), author: req.cmsUser };
    const sheets = await cmsSheets();
    await sheets.spreadsheets.values.append({ spreadsheetId, range: "CMS_Content!A:I", valueInputOption: "RAW", insertDataOption: "INSERT_ROWS", requestBody: { values: [[item.id, item.title, item.slug, item.category, item.body, item.image, item.status, item.updatedAt, item.author]] } });
    return res.status(201).json({ success: true, content: item });
  } catch (error) { return next(error); }
});

router.put("/:id", requireCmsAuth, async (req, res, next) => {
  try {
    const sheets = await cmsSheets();
    const rows = await getSheetRows(sheets, "CMS_Content!A2:I");
    const index = rows.findIndex((row) => row[0] === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: "Content was not found." });
    const old = contentFromRow(rows[index]);
    const title = clean(req.body?.title, 180) || old.title;
    const item = { ...old, title, slug: slugify(req.body?.slug || title), category: clean(req.body?.category, 80) || old.category, body: clean(req.body?.body), image: clean(req.body?.image, 500), status: req.body?.status === "Published" ? "Published" : "Draft", updatedAt: new Date().toISOString(), author: req.cmsUser };
    const rowNumber = index + 2;
    await sheets.spreadsheets.values.update({ spreadsheetId, range: `CMS_Content!A${rowNumber}:I${rowNumber}`, valueInputOption: "RAW", requestBody: { values: [[item.id, item.title, item.slug, item.category, item.body, item.image, item.status, item.updatedAt, item.author]] } });
    return res.json({ success: true, content: item });
  } catch (error) { return next(error); }
});

router.delete("/:id", requireCmsAuth, async (req, res, next) => {
  try {
    const sheets = await cmsSheets();
    const rows = await getSheetRows(sheets, "CMS_Content!A2:I");
    const index = rows.findIndex((row) => row[0] === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: "Content was not found." });
    const rowNumber = index + 2;
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: `CMS_Content!A${rowNumber}:I${rowNumber}` });
    return res.json({ success: true });
  } catch (error) { return next(error); }
});

router.post("/image", requireCmsAuth, (req, res) => {
  const dataUrl = clean(req.body?.image, 7 * 1024 * 1024);
  const match = dataUrl.match(/^data:image\/(png|jpe?g|webp|gif);base64,([a-zA-Z0-9+/=]+)$/);
  if (!match) return res.status(400).json({ success: false, error: "Upload a PNG, JPG, WEBP, or GIF image smaller than 5 MB." });
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > 5 * 1024 * 1024) return res.status(400).json({ success: false, error: "Image must be smaller than 5 MB." });
  const extension = match[1] === "jpeg" ? "jpg" : match[1];
  const filename = `${Date.now()}-${crypto.randomBytes(5).toString("hex")}.${extension}`;
  fs.writeFileSync(path.join(imageDirectory, filename), buffer, { flag: "wx" });
  return res.status(201).json({ success: true, image: `/cms/images/${filename}` });
});

module.exports = router;
