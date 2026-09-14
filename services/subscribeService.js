import crypto from "crypto";
import { AppError } from "../lib/errors.js";
import { normalizeEmail } from "../lib/validate.js";
import { buildUnsubscribeUrl } from "../lib/mailer.js";

export const createSubscribeService = ({ subscriberRepo, mailer, sendEmail }) => {
  const notify = (subscriber) =>
    sendEmail
      ? sendEmail({ email: subscriber.email, token: subscriber.unsubscribeToken })
      : Promise.resolve(false);

  return {
    /**
     * Subscribes an email. Idempotent: an already-subscribed address returns
     * without sending another confirmation; an unsubscribed address is
     * re-activated. Persists to the newsletter_subscribers table.
     */
    async subscribe(rawEmail, { retryDuplicate = true } = {}) {
      const email = normalizeEmail(rawEmail);
      if (!email) throw new AppError(400, "A valid email address is required");

      let subscriber = await subscriberRepo.findByEmail(email);
      if (subscriber && subscriber.isActive) {
        return {
          subscriber,
          message: "already_subscribed",
          emailSent: false,
unsubscribeUrl: buildUnsubscribeUrl(subscriber.unsubscribeToken),
        };
      }

      if (!subscriber) {
        const token = crypto.randomBytes(20).toString("hex");
        try {
          subscriber = await subscriberRepo.create({ email, token });
        } catch (err) {
          // Concurrent duplicate from another request -> retry once.
          if (retryDuplicate && ["ER_DUP_ENTRY", "DUPLICATE_ENTRY"].includes(err?.code)) {
            return this.subscribe(email, { retryDuplicate: false });
          }
          throw err;
        }
      } else {
        subscriber = await subscriberRepo.setStatus(subscriber.id, "subscribed");
      }

      const emailSent = await notify(subscriber);
      return {
        subscriber,
        message: "subscribed",
        emailSent,
        unsubscribeUrl: buildUnsubscribeUrl(subscriber.unsubscribeToken),
      };
    },

    async unsubscribeByToken(token) {
      if (!token || typeof token !== "string" || token.length > 40) {
        throw new AppError(400, "Invalid unsubscribe token");
      }
      const subscriber = await subscriberRepo.setStatusByToken(token, "unsubscribed");
      if (!subscriber) throw new AppError(404, "Subscriber not found");
      return { subscriber, message: "unsubscribed" };
    },

    async list(params) {
      return subscriberRepo.list(params);
    },

    async setStatus(id, status) {
      if (!["subscribed", "unsubscribed"].includes(status)) {
        throw new AppError(400, "Invalid subscriber status");
      }
      const subscriber = await subscriberRepo.getById(id);
      if (!subscriber) throw new AppError(404, "Subscriber not found");
      return subscriberRepo.setStatus(id, status);
    },

    async remove(id) {
      const subscriber = await subscriberRepo.getById(id);
      if (!subscriber) throw new AppError(404, "Subscriber not found");
      await subscriberRepo.remove(id);
    },

    async stats() {
      return subscriberRepo.countByStatus();
    },
  };
};

export default createSubscribeService;
