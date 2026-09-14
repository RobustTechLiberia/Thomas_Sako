import { AppError } from "../lib/errors.js";
import { normalizeEmail, sanitizeText, sanitizeLongText, isValidEmail } from "../lib/validate.js";
import { env } from "../config/env.js";
import {
  sendBookingConfirmation,
  sendBookingNotification,
} from "../lib/mailer.js";

export const createBookingService = ({ leadRepo, mailer }) => {
  const validatePayload = (body = {}) => {
    const name = sanitizeText(body.name, 120);
    if (!name) throw new AppError(400, "Name is required");
    const email = normalizeEmail(body.email);
    if (!email) throw new AppError(400, "A valid email address is required");
    const eventType = sanitizeText(body.eventType ?? body.event_type, 120) || "";
    const eventDate = sanitizeText(body.eventDate ?? body.event_date, 20) || "";
    return {
      name,
      email,
      phone: sanitizeText(body.phone, 40) || "",
      organization: sanitizeText(body.organization, 120) || "",
      eventType,
      eventDate,
      eventTime: sanitizeText(body.eventTime ?? body.event_time, 20) || "",
      eventLocation: sanitizeText(body.eventLocation ?? body.event_location, 255) || "",
      message: sanitizeLongText(body.message, 4000) || "",
    };
  };

  return {
    /**
     * Records a booking request in the `leads` table, emails a confirmation
     * to the visitor and an admin notification to the team. Email failures
     * never prevent the lead from being stored.
     */
    async submit(raw) {
      const data = validatePayload(raw);
      const lead = await leadRepo.create({ source: "booking", ...data });

      const notification = {
        ...data,
        id: lead.id,
      };
      // Fire the user confirmation and the admin notification in parallel.
      const confirmPromise = sendBookingConfirmation(mailer, { booking: notification });
      const notifyTo = env.email.notifyTo;
      const teamPromise = notifyTo
        ? sendBookingNotification(mailer, { booking: notification, to: notifyTo })
        : Promise.resolve(false);

      const [confirmationSent, teamSent] = await Promise.all([
        confirmPromise,
        teamPromise,
      ]);

      return { lead, confirmationSent, teamSent };
    },

    async list(params) {
      return leadRepo.list(params);
    },

    async stats() {
      return leadRepo.countByStatus();
    },

    async setStatus(id, status) {
      const lead = await leadRepo.getById(id);
      if (!lead) throw new AppError(404, "Booking not found");
      return leadRepo.setStatus(id, status);
    },

    async remove(id) {
      const lead = await leadRepo.getById(id);
      if (!lead) throw new AppError(404, "Booking not found");
      await leadRepo.remove(id);
      return lead;
    },
  };
};

// Re-export the validator for the admin routes.
export { isValidEmail };
export default createBookingService;