import bcrypt from "bcrypt";
import { getPool } from "./pool.js";
import { env } from "../config/env.js";

/**
 * Seeds an initial admin user from the ADMIN_INITIAL_* environment
 * variables. By default the admin is only created when it does not exist,
 * so credentials changed later from the CMS are preserved across restarts.
 * Set ADMIN_FORCE_RESET=1 to re-apply the env-controlled password/role/name
 * on every boot (useful for deployments where the env is the source of
 * truth). Also seeds default site settings the public frontend relies on
 * (social links).
 */
export const seed = async () => {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    const admin = env.initialAdmin;
    if (admin.password) {
      const [rows] = await connection.query(
        "SELECT id, email FROM admin_users WHERE email = ? LIMIT 1",
        [admin.email],
      );
      const passwordHash = await bcrypt.hash(admin.password, 12);
      if (rows.length === 0) {
        await connection.query(
          `INSERT INTO admin_users (email, password_hash, role, display_name, is_active)
           VALUES (?, ?, ?, ?, 1)`,
          [admin.email, passwordHash, admin.role, admin.name],
        );
        console.log(`✓ Seeded initial admin account: ${admin.email}`);
      } else if (admin.resetOnBoot) {
        await connection.query(
          `UPDATE admin_users
           SET password_hash = ?, role = ?, display_name = ?, is_active = 1
           WHERE email = ?`,
          [passwordHash, admin.role, admin.name, admin.email],
        );
        console.log(`✓ Synced initial admin credentials for ${admin.email} (ADMIN_FORCE_RESET=1)`);
      }
    }

    // Ensure default social settings exist (idempotent).
    const socialDefaults = {
      youtube: env.social.youtube,
      facebook: env.social.facebook,
      x: env.social.x,
      instagram: env.social.instagram,
      whatsapp: env.social.whatsapp,
      tiktok: env.social.tiktok,
      gmail: env.social.gmail,
    };
    const [existing] = await connection.query(
      "SELECT `key` FROM site_settings WHERE `key` = 'social_links'",
    );
    if (existing.length === 0) {
      await connection.query(
        "INSERT INTO site_settings (`key`, `value`) VALUES ('social_links', ?)",
        [JSON.stringify(socialDefaults)],
      );
    }
  } finally {
    connection.release();
  }
};

export default seed;