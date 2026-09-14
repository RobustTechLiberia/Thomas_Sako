import { getPool } from "./pool.js";
import { env } from "../config/env.js";

/**
 * Idempotent migration against the existing `db_poll` database.
 * Ensures every table used by the CMS exists, adding only what is missing
 * so existing data (poll_votes, admin_users, site_settings, ...) is
 * always preserved.
 */
const MIGRATIONS = [
  // ---- Legacy schema (existing `db_poll` database). Created only when the
  // database is fresh (e.g. Aiven/RDS); on an existing database these
  // statements are no-ops. Order matters for the foreign keys below.
  `CREATE TABLE IF NOT EXISTS admin_users (
    id INT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(120) DEFAULT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','editor') DEFAULT 'editor',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL DEFAULT NULL,
    is_active TINYINT(1) DEFAULT '1',
    PRIMARY KEY (id),
    UNIQUE KEY email (email),
    KEY idx_email (email),
    KEY idx_role (role)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  `CREATE TABLE IF NOT EXISTS poll_questions (
    id INT NOT NULL AUTO_INCREMENT,
    question_text VARCHAR(500) NOT NULL,
    options JSON NOT NULL COMMENT 'Array of option strings',
    status ENUM('draft','active','archived') DEFAULT 'draft',
    created_by INT DEFAULT NULL,
    published_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY created_by (created_by),
    KEY idx_status (status),
    KEY idx_published (published_at),
    CONSTRAINT poll_questions_ibfk_1 FOREIGN KEY (created_by) REFERENCES admin_users (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  `CREATE TABLE IF NOT EXISTS poll_votes (
    id INT NOT NULL AUTO_INCREMENT,
    poll_question_id INT NOT NULL,
    question_text VARCHAR(500) DEFAULT NULL,
    answer_text VARCHAR(500) DEFAULT NULL,
    ip_hash VARCHAR(64) DEFAULT NULL,
    user_agent_hash VARCHAR(64) DEFAULT NULL,
    votes INT DEFAULT '1',
    voted_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_poll_vote_dedup (poll_question_id, ip_hash, user_agent_hash),
    KEY idx_poll (poll_question_id),
    KEY idx_voted (voted_at),
    KEY idx_dedup (poll_question_id, ip_hash, user_agent_hash),
    CONSTRAINT poll_votes_ibfk_1 FOREIGN KEY (poll_question_id) REFERENCES poll_questions (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  `CREATE TABLE IF NOT EXISTS site_settings (
    id INT NOT NULL AUTO_INCREMENT,
    \`key\` VARCHAR(255) NOT NULL,
    \`value\` JSON DEFAULT NULL,
    updated_by INT DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY \`key\` (\`key\`),
    KEY updated_by (updated_by),
    KEY idx_key (\`key\`),
    CONSTRAINT site_settings_ibfk_1 FOREIGN KEY (updated_by) REFERENCES admin_users (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  `CREATE TABLE IF NOT EXISTS media_assets (
    id INT NOT NULL AUTO_INCREMENT,
    cloudinary_public_id VARCHAR(500) NOT NULL,
    cloudinary_url VARCHAR(500) NOT NULL,
    filename VARCHAR(255) DEFAULT NULL,
    file_type VARCHAR(100) DEFAULT NULL,
    file_size INT DEFAULT NULL,
    width INT DEFAULT NULL,
    height INT DEFAULT NULL,
    uploaded_by INT DEFAULT NULL,
    uploaded_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY cloudinary_public_id (cloudinary_public_id),
    KEY uploaded_by (uploaded_by),
    KEY idx_public_id (cloudinary_public_id),
    KEY idx_uploaded (uploaded_at),
    CONSTRAINT media_assets_ibfk_1 FOREIGN KEY (uploaded_by) REFERENCES admin_users (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  `CREATE TABLE IF NOT EXISTS audit_log (
    id INT NOT NULL AUTO_INCREMENT,
    actor_id INT DEFAULT NULL,
    action VARCHAR(50) NOT NULL COMMENT 'create, update, delete, publish, unpublish',
    entity_type VARCHAR(50) NOT NULL COMMENT 'poll_question, podcast, cartoon, etc',
    entity_id INT DEFAULT NULL,
    old_values JSON DEFAULT NULL,
    new_values JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_actor (actor_id),
    KEY idx_entity (entity_type, entity_id),
    KEY idx_created (created_at),
    CONSTRAINT audit_log_ibfk_1 FOREIGN KEY (actor_id) REFERENCES admin_users (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

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