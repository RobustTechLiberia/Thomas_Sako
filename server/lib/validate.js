const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Trims a value and returns null when empty. */
export const cleanString = (value, maxLength = 500) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
};

/** Basic input sanitization for single-line text fields. */
export const sanitizeText = (value, maxLength = 500) => {
  const cleaned = cleanString(value, maxLength);
  if (cleaned === null) return null;
  // Strip control characters (keep newlines only for multi-line handlers).
  return cleaned.replace(/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/g, "");
};

export const sanitizeLongText = (value, maxLength = 10000) => {
  const cleaned = sanitizeText(value, maxLength);
  if (cleaned === null) return null;
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
};

export const isValidEmail = (value) =>
  typeof value === "string" && EMAIL_RE.test(value.trim());

export const normalizeEmail = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return isValidEmail(trimmed) ? trimmed : null;
};

/** Validates and normalizes a poll payload (question + options). */
export const validatePollPayload = (body) => {
  const question = sanitizeText(body.question || body.question_text, 500);
  if (!question || question.length < 5) {
    return { error: "Question is required and must be at least 5 characters." };
  }

  let options = Array.isArray(body.options) ? body.options : null;
  if (!options && Array.isArray(body.answers)) options = body.answers;

  if (!Array.isArray(options) || options.length < 2) {
    return { error: "At least two answer options are required." };
  }
  if (options.length > 10) {
    return { error: "A poll can have at most 10 answer options." };
  }

  const seen = new Set();
  const cleanedOptions = [];
  for (const raw of options) {
    const option = sanitizeText(typeof raw === "string" ? raw : "", 80);
    if (!option) {
      return { error: "Each answer option must be non-empty text." };
    }
    if (seen.has(option.toLowerCase())) {
      return { error: "Answer options must be unique." };
    }
    seen.add(option.toLowerCase());
    cleanedOptions.push(option);
  }

  return { question, options: cleanedOptions };
};

/** Validates a single content block for page bodies. */
export const validateBlock = (block) => {
  if (!block || typeof block !== "object") {
    return { error: "Each content block must be an object." };
  }
  const allowedTypes = [
    "heading",
    "subtitle",
    "paragraph",
    "image",
    "card",
    "quote",
    "embed",
    "link",
  ];
  const type = sanitizeText(block.type, 20);
  if (!type || !allowedTypes.includes(type)) {
    return { error: `Unsupported block type: ${block.type}` };
  }

  const out = { type };
  if (block.key) out.key = sanitizeText(block.key, 80);
  if (block.title) out.title = sanitizeText(block.title, 300);
  if (block.text) out.text = sanitizeLongText(block.text, 10000);
  if (block.image) out.image = sanitizeText(block.image, 500);
  if (block.url) out.url = sanitizeText(block.url, 500);
  if (block.button) out.button = sanitizeText(block.button, 80);
  if (block.author) out.author = sanitizeText(block.author, 120);
  if (block.role) out.role = sanitizeText(block.role, 120);
  if (block.link) out.link = sanitizeText(block.link, 500);

  if (type === "card" && !out.title) {
    return { error: "Card blocks require a title." };
  }
  return { value: out };
};

/** Validates and normalizes a page body (array of blocks). */
export const validateBlocks = (body) => {
  if (body === undefined || body === null) return { value: [] };
  if (!Array.isArray(body)) return { error: "Page content must be an array of blocks." };
  if (body.length > 50) return { error: "A page can have at most 50 content blocks." };

  const blocks = [];
  for (const block of body) {
    const result = validateBlock(block);
    if (result.error) return result;
    blocks.push(result.value);
  }
  return { value: blocks };
};

export const validateSlug = (value) => {
  const slug = sanitizeText(value, 120);
  return slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null;
};

export default {
  cleanString,
  sanitizeText,
  sanitizeLongText,
  isValidEmail,
  normalizeEmail,
  validatePollPayload,
  validateBlocks,
  validateSlug,
};
