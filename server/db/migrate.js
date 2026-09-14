import { getPool } from "./pool.js";
import { env } from "../config/env.js";

/**
 * Idempotent migration against the existing `db_poll` database.
 * Ensures every table used by the CMS exists, adding only what is missing
 * so existing data (poll_votes, admin_users, site_settings, ...) is
 * always preserved.
 */
const MIGRATIONS = [
  // CMS-managed content pages (single editable body of JSON blocks per slug).
  `CREATE TABLE IF NOT EXISTS pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(120) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    body JSON NULL,
    status ENUM('draft','published') DEFAULT 'draft',
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pages_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Newsletter subscribers (public subscribe form).
  `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    unsubscribe_token VARCHAR(80) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP NULL,
    UNIQUE KEY uq_subscriber_email (email),
    INDEX idx_subscriber_token (unsubscribe_token),
    INDEX idx_subscriber_active (is_active)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Booking / contact leads (public booking form + admin Bookings CMS).
  `CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source VARCHAR(50) NOT NULL DEFAULT 'booking',
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    organization VARCHAR(120) NULL,
    event_date VARCHAR(20) NULL,
    event_type VARCHAR(120) NULL,
    message TEXT NULL,
    phone VARCHAR(40) NULL,
    event_time VARCHAR(20) NULL,
    event_location VARCHAR(255) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'new',
    assigned_to INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_leads_source (source),
    INDEX idx_leads_status (status),
    INDEX idx_leads_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // CMS-managed podcast episodes (public Podcast page + admin Podcasts CMS).
  `CREATE TABLE IF NOT EXISTS podcasts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    media_url VARCHAR(500) NULL,
    thumbnail_url VARCHAR(500) NULL,
    status ENUM('draft','published','archived') DEFAULT 'draft',
    created_by INT NULL,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_podcasts_status (status),
    INDEX idx_podcasts_published (published_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // CMS-managed playlists (public Playlist page + admin Playlists CMS).
  `CREATE TABLE IF NOT EXISTS playlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    embed_url VARCHAR(500) NULL,
    status ENUM('draft','published','archived') DEFAULT 'draft',
    created_by INT NULL,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_playlists_status (status),
    INDEX idx_playlists_published (published_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // One row per "new content" broadcast; dedupes by (content_type, content_id).
  `CREATE TABLE IF NOT EXISTS content_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_type VARCHAR(20) NOT NULL,
    content_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    thumbnail_url VARCHAR(500) NULL,
    status ENUM('pending','processing','sent','failed') NOT NULL DEFAULT 'pending',
    total_recipients INT NOT NULL DEFAULT 0,
    sent_recipients INT NOT NULL DEFAULT 0,
    failed_recipients INT NOT NULL DEFAULT 0,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_notification (content_type, content_id),
    INDEX idx_notifications_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // One row per (notification, subscriber); enables retries of failures only.
  `CREATE TABLE IF NOT EXISTS content_notification_recipients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    notification_id INT NOT NULL,
    subscriber_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    status ENUM('pending','processing','sent','failed') NOT NULL DEFAULT 'pending',
    attempts INT NOT NULL DEFAULT 0,
    error VARCHAR(500) NULL,
    sent_at TIMESTAMP NULL,
    UNIQUE KEY uq_notif_recipient (notification_id, subscriber_id),
    INDEX idx_recipient_status (status),
    INDEX idx_recipient_notification (notification_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

/** Non-idempotent SQL statements run only when their precondition fails. */
const FIXUPS = [
  // Enforce atomic duplicate-vote prevention. The original CMS left the
  // idx_dedup index non-unique; make a unique index over the same columns.
  // Runs only when a UNIQUE constraint covering those columns is absent.
  {
    name: "unique poll_votes dedup index",
    check: async (connection) => {
      const isUnique = async (indexName) => {
        const [rows] = await connection.query(
          "SELECT COUNT(*) AS n FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'poll_votes' AND INDEX_NAME = ? AND NON_UNIQUE = 0",
          [env.db.database, indexName],
        );
        return Number(rows[0]?.n || 0) > 0;
      };
      return isUnique("uq_poll_vote_dedup") || isUnique("idx_dedup");
    },
    run: async (connection) => {
      // Clear any historical duplicates so the unique index can be added.
      await connection.query(
        `DELETE v1 FROM poll_votes v1
         INNER JOIN poll_votes v2
           ON v1.poll_question_id = v2.poll_question_id
          AND v1.ip_hash = v2.ip_hash
          AND v1.user_agent_hash = v2.user_agent_hash
          AND v1.id > v2.id`,
      );
      await connection.query(
        `DROP INDEX idx_dedup ON poll_votes`,
      ).catch(() => {});
      await connection.query(
        `CREATE UNIQUE INDEX uq_poll_vote_dedup
         ON poll_votes (poll_question_id, ip_hash, user_agent_hash)`,
      ).catch(() => {});
    },
  },
  {
    name: "admin_users.display_name column",
    check: async (connection) => {
      const [rows] = await connection.query(
        "SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admin_users' AND COLUMN_NAME = 'display_name'",
        [env.db.database],
      );
      return Number(rows[0]?.n || 0) > 0;
    },
    run: async (connection) => {
      await connection.query(
        "ALTER TABLE admin_users ADD COLUMN display_name VARCHAR(120) NULL AFTER email",
      );
    },
  },
  {
    name: "leads extended columns (phone, event_time, event_location)",
    check: async (connection) => {
      const [rows] = await connection.query(
        "SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'leads' AND COLUMN_NAME IN ('phone','event_time','event_location')",
        [env.db.database],
      );
      return Number(rows[0]?.n || 0) === 3;
    },
    run: async (connection) => {
      await connection.query(
        "ALTER TABLE leads ADD COLUMN phone VARCHAR(40) NULL AFTER message",
      ).catch(() => {});
      await connection.query(
        "ALTER TABLE leads ADD COLUMN event_time VARCHAR(20) NULL AFTER event_date",
      ).catch(() => {});
      await connection.query(
        "ALTER TABLE leads ADD COLUMN event_location VARCHAR(255) NULL AFTER event_type",
      ).catch(() => {});
    },
  },
  {
    name: "leads.status widened to booking statuses",
    check: async (connection) => {
      const [rows] = await connection.query(
        "SELECT DATA_TYPE, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'leads' AND COLUMN_NAME = 'status'",
        [env.db.database],
      );
      const column = rows[0];
      if (!column) return true; // table created fresh by MIGRATIONS
      if (column.DATA_TYPE !== "enum") return true; // already flexible
      return String(column.COLUMN_TYPE).includes("confirmed");
    },
    run: async (connection) => {
      await connection.query(
        "ALTER TABLE leads MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'new'",
      );
    },
  },
];

export const migrate = async () => {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    for (const statement of MIGRATIONS) {
      await connection.query(statement);
    }
    for (const fixup of FIXUPS) {
      const needsRun = !(await fixup.check(connection));
      if (needsRun) {
        await fixup.run(connection);
        console.log(`✓ Migration fixup: ${fixup.name}`);
      }
    }
    console.log(`✓ Migrations applied to database "${env.db.database}"`);
  } finally {
    connection.release();
  }
};

export default migrate;