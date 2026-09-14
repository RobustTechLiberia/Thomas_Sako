import nodemailer from "nodemailer";
import { env } from "../config/env.js";

/**
 * Escapes HTML-sensitive characters in user-supplied content that is
 * interpolated into email templates.
 */
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Shared visual shell for every email the site sends. Keeps the branding
 * and footer consistent across subscription, booking, and update emails.
 */
export const renderLayout = (title, innerHtml) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f3f1f9;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f1f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e1f0;">
            <tr>
              <td style="background:linear-gradient(135deg,#312252 0%,#120a21 100%);padding:28px 32px;text-align:center;">
                <div style="font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:0.5px;">1847 LIBERTY</div>
                <div style="font-size:12px;color:#b9a8e0;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">with Thomas Sako</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 24px;">
                ${innerHtml}
              </td>
            </tr>
            <tr>
              <td style="background-color:#f7f5fc;padding:20px 32px;border-top:1px solid #e5e1f0;text-align:center;">
                <div style="font-size:12px;color:#7a6fa6;line-height:1.6;">
                  © ${new Date().getFullYear()} 1847 Liberty — Balanced news, independent perspectives.<br />
                  <a href="${escapeHtml(env.social.youtube || "https://www.youtube.com")}" style="color:#7a6fa6;">YouTube</a>
                  &nbsp;•&nbsp; <a href="${escapeHtml(env.publicUrl)}" style="color:#7a6fa6;">1847Liberty.com</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

/** Yields an accented call-to-action button. */
const ctaButton = (href, label) => `
  <a href="${escapeHtml(href)}" style="display:inline-block;background-color:#cc0000;color:#ffffff;padding:14px 28px;text-decoration:none;font-weight:bold;border-radius:6px;font-size:14px;">
    ${escapeHtml(label)}
  </a>
`;

const fieldRow = (label, value) => `
  <tr>
    <td style="padding:8px 12px;background-color:#f7f5fc;width:38%;font-size:13px;color:#555086;font-weight:bold;border-top:1px solid #e5e1f0;">${escapeHtml(label)}</td>
    <td style="padding:8px 12px;font-size:14px;color:#312252;border-top:1px solid #e5e1f0;">${escapeHtml(value) || "—"}</td>
  </tr>
`;

/** Creates a nodemailer transporter from environment config. */
export const createMailer = () => {
  if (!env.email.user || !env.email.pass) return null;
  return nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.secure,
    auth: {
      user: env.email.user,
      pass: env.email.pass,
    },
  });
};

/** Builds the unsubscribe URL for a subscriber. */
export const buildUnsubscribeUrl = (token) => {
  const baseUrl = env.publicUrl;
  return `${baseUrl}/api/subscribe/unsubscribe?token=${encodeURIComponent(token || "")}`;
};

const safeSend = async (mailer, options) => {
  if (!mailer) return false;
  try {
    await mailer.sendMail(options);
    return true;
  } catch (error) {
    console.error("Email send failed:", error.message);
    return false;
  }
};

/**
 * Sends a polished subscription confirmation email. Returns true on
 * success, false when mail is not configured (dev mode) or on provider
 * failure (caller decides how to treat mail failures vs saving subscriber).
 */
export const sendSubscriptionEmail = async (mailer, { email, token }) => {
  const unsubscribeUrl = buildUnsubscribeUrl(token);
  const youtubeUrl = env.social.youtube || "https://www.youtube.com";
  const innerHtml = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#312252;">Welcome to 1847 Liberty! 🎙️</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#5a5480;line-height:1.6;">
      Thanks for subscribing. You'll now get notified the moment new episodes,
      playlists, and polls go live — straight from our channel, no noise.
    </p>
    <div style="background-color:#faf7fc;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
      <h3 style="margin:0 0 6px;color:#312252;font-size:16px;">Follow the show on YouTube</h3>
      <p style="margin:0 0 16px;font-size:13px;color:#8880ad;line-height:1.5;">
        Podcast episodes and playlists premiere first on our channel.
      </p>
      ${ctaButton(youtubeUrl, "Watch on YouTube")}
    </div>
    <p style="margin:24px 0 0;font-size:14px;color:#5a5480;line-height:1.6;">
      See you on the next stream,<br /><strong style="color:#312252;">The 1847 Liberty Team</strong>
    </p>
    <p style="margin:20px 0 0;font-size:11px;color:#a09ac2;">
      Change your mind later? <a href="${unsubscribeUrl}" style="color:#7a6fa6;">Unsubscribe from updates</a> anytime.
    </p>
  `;
  return safeSend(mailer, {
    from: env.email.user,
    to: email,
    subject: "1847 Liberty — You're subscribed!",
    html: renderLayout("You're subscribed to 1847 Liberty", innerHtml),
  });
};

/**
 * Sends a booking confirmation to the person who submitted the form.
 */
export const sendBookingConfirmation = async (mailer, { booking }) => {
  const innerHtml = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#312252;">Booking request received</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#5a5480;line-height:1.6;">
      Hi ${escapeHtml(booking.name || "there")}, thanks for reaching out. Your
      request to book Thomas has been received and is being reviewed — we aim
      to reply within 1–2 business days.
    </p>
    <div style="border-radius:8px;border:1px solid #e5e1f0;margin:24px 0;overflow:hidden;">
      <div style="background:#faf7fc;padding:12px 16px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#7a6fa6;font-weight:bold;">Your details</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">
        ${fieldRow("Name", booking.name)}
        ${fieldRow("Email", booking.email)}
        ${fieldRow("Phone", booking.phone)}
        ${fieldRow("Organization", booking.organization)}
        ${fieldRow("Event type", booking.eventType)}
        ${fieldRow("Event date", booking.eventDate)}
        ${fieldRow("Event time", booking.eventTime)}
        ${fieldRow("Location", booking.eventLocation)}
      </table>
    </div>
    ${booking.message ? `<p style="margin:0 0 20px;font-size:14px;color:#5a5480;line-height:1.6;white-space:pre-wrap;">${escapeHtml(booking.message)}</p>` : ""}
    ${ctaButton(`${env.publicUrl}/`, "Explore 1847 Liberty")}
  `;
  return safeSend(mailer, {
    from: `"1847 Liberty" <${env.email.user}>`,
    to: booking.email,
    subject: "1847 Liberty — We received your booking request",
    html: renderLayout("Booking request received", innerHtml),
  });
};

/**
 * Notifies the team (EMAIL_NOTIFY_TO) about a new booking so it can be
 * actioned in the CMS.
 */
export const sendBookingNotification = async (mailer, { booking, to }) => {
  const innerHtml = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#312252;">New booking request</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#5a5480;line-height:1.6;">
      A visitor submitted a booking request on the public site. Review it in the
      CMS under <strong>Bookings</strong>.
    </p>
    <div style="border-radius:8px;border:1px solid #e5e1f0;margin:24px 0;overflow:hidden;">
      <div style="background:#faf7fc;padding:12px 16px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#7a6fa6;font-weight:bold;">Request</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">
        ${fieldRow("Name", booking.name)}
        ${fieldRow("Email", booking.email)}
        ${fieldRow("Phone", booking.phone)}
        ${fieldRow("Organization", booking.organization)}
        ${fieldRow("Event type", booking.eventType)}
        ${fieldRow("Event date", booking.eventDate)}
        ${fieldRow("Event time", booking.eventTime)}
        ${fieldRow("Location", booking.eventLocation)}
        ${fieldRow("Submitted", new Date().toLocaleString())}
      </table>
    </div>
    ${booking.message ? `<p style="margin:0 0 20px;font-size:14px;color:#5a5480;line-height:1.6;white-space:pre-wrap;">${escapeHtml(booking.message)}</p>` : ""}
    <p style="margin:0;font-size:12px;color:#a09ac2;">This is an automated notification from the CMS.</p>
  `;
  return safeSend(mailer, {
    from: `"1847 Liberty CMS" <${env.email.user}>`,
    to,
    subject: "New booking request — 1847 Liberty",
    html: renderLayout("New booking request", innerHtml),
  });
};

/**
 * Sends a single "new content available" update email to one subscriber.
 * `item` carries { type, title, description, url } where type is one of
 * "podcast" | "playlist" | "poll".
 */
export const sendUpdateNotification = async (mailer, { email, token, item }) => {
  const unsubscribeUrl = buildUnsubscribeUrl(token);
  const typeLabels = {
    podcast: "New Podcast Episode",
    playlist: "New Playlist",
    poll: "New Poll — Have Your Say",
  };
  const heroTexts = {
    podcast: "A brand-new episode is live.",
    playlist: "A fresh playlist is ready to watch.",
    poll: "A new poll is open — cast your vote now.",
  };
  const label = typeLabels[item.type] || "New Content";
  const innerHtml = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#312252;">${escapeHtml(label)}</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#5a5480;line-height:1.6;">
      ${heroTexts[item.type] || "New content is live on 1847 Liberty."}
    </p>
    <h2 style="margin:0 0 8px;font-size:19px;color:#7c3aed;">${escapeHtml(item.title)}</h2>
    ${item.description ? `<p style="margin:0 0 20px;font-size:14px;color:#5a5480;line-height:1.6;">${escapeHtml(item.description)}</p>` : ""}
    ${item.thumbnailUrl ? `<div style="text-align:center;margin:0 0 20px;"><img src="${escapeHtml(item.thumbnailUrl)}" alt="" style="width:100%;max-width:480px;height:auto;border-radius:8px;border:1px solid #e5e1f0;" /></div>` : ""}
    <div style="text-align:center;margin:24px 0;">
      ${ctaButton(item.url || env.publicUrl, item.type === "poll" ? "Cast your vote" : "Watch now")}
    </div>
    <p style="margin:20px 0 0;font-size:11px;color:#a09ac2;">
      You're receiving this because you subscribed on 1847 Liberty.
      <a href="${unsubscribeUrl}" style="color:#7a6fa6;">Unsubscribe</a>.
    </p>
  `;
  return safeSend(mailer, {
    from: `"1847 Liberty" <${env.email.user}>`,
    to: email,
    subject: `${label}: ${item.title}`,
    html: renderLayout(label, innerHtml),
  });
};

export default createMailer;