import crypto from "crypto";
import { env } from "../config/env.js";

/**
 * Deterministically hashes a visitor's identity (IP + user-agent) using a
 * server-only pepper (the JWT secret). Used to prevent duplicate votes
 * without ever storing raw IPs.
 */
export const voterHash = (ipAddress, userAgent) => {
  const seed = `${ipAddress || "unknown"}|${userAgent || ""}|${env.jwt.secret}`;
  return crypto.createHash("sha256").update(seed).digest("hex");
};

/**
 * Extracts a visitor's IP and user-agent and returns separate salted hashes
 * for each, matching the poll_votes.ip_hash / user_agent_hash columns.
 * The (ip_hash, user_agent_hash) pair is what the unique dedup index enforces.
 */
export const identityHashes = (req) => {
  const ip =
    req?.ip ||
    (typeof req?.headers?.["x-forwarded-for"] === "string"
      ? req.headers["x-forwarded-for"].split(",")[0].trim()
      : null) ||
    "unknown";
  const userAgent = req?.headers?.["user-agent"] || "";
  const hash = (input) =>
    crypto.createHash("sha256").update(`${input}|${env.jwt.secret}`).digest("hex");
  return {
    ip,
    userAgent,
    ipHash: hash(ip),
    userAgentHash: hash(userAgent),
  };
};

export default voterHash;
