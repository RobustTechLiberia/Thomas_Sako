-- Liberty CMS Database Schema
-- Complete schema for Phases 1-6

-- ============================================
-- ADMIN USERS & AUTHENTICATION
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'editor') DEFAULT 'editor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- PASSWORD RESET TOKENS
-- ============================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- POLL QUESTIONS (CMS-Managed)
-- ============================================
CREATE TABLE IF NOT EXISTS poll_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_text VARCHAR(500) NOT NULL,
  options JSON NOT NULL COMMENT 'Array of option strings',
  status ENUM('draft', 'active', 'archived') DEFAULT 'draft',
  created_by INT NOT NULL,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_published (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- POLL VOTES (Keep existing, extend metadata)
-- ============================================
CREATE TABLE IF NOT EXISTS poll_votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  poll_question_id INT NOT NULL,
  question_text VARCHAR(500),
  answer_text VARCHAR(500),
  ip_hash VARCHAR(255),
  user_agent_hash VARCHAR(255),
  votes INT DEFAULT 1,
  voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (poll_question_id) REFERENCES poll_questions(id) ON DELETE CASCADE,
  INDEX idx_poll (poll_question_id),
  INDEX idx_voted (voted_at),
  INDEX idx_ip_agent (ip_hash, user_agent_hash),
  UNIQUE KEY unique_vote (poll_question_id, ip_hash, user_agent_hash, answer_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- NEWSLETTERS
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  unsubscribe_token VARCHAR(255) UNIQUE,
  INDEX idx_email (email),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- PODCASTS
-- ============================================
CREATE TABLE IF NOT EXISTS podcasts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description LONGTEXT,
  media_url VARCHAR(500) NOT NULL COMMENT 'YouTube URL or audio link',
  thumbnail_url VARCHAR(500),
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  created_by INT NOT NULL,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_published (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- CARTOONS
-- ============================================
CREATE TABLE IF NOT EXISTS cartoons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image_url VARCHAR(500) NOT NULL COMMENT 'Cloudinary URL',
  caption VARCHAR(500),
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  created_by INT NOT NULL,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_published (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- MINGLE POSTS
-- ============================================
CREATE TABLE IF NOT EXISTS mingle_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section ENUM('meetups', 'watch', 'interviews', 'news') NOT NULL,
  title VARCHAR(255) NOT NULL,
  body LONGTEXT,
  media_url VARCHAR(500),
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  created_by INT NOT NULL,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_section (section),
  INDEX idx_status (status),
  INDEX idx_published (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- PLAYLISTS / BUMPERS
-- ============================================
CREATE TABLE IF NOT EXISTS playlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  embed_url VARCHAR(500) COMMENT 'Spotify/YouTube Music embed URL',
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  created_by INT NOT NULL,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_published (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- LEADS (BOOKING / ADVERTISING / CONTACT)
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source ENUM('booking', 'advertising', 'contact') NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  organization VARCHAR(255),
  event_date DATE,
  event_type VARCHAR(255),
  message LONGTEXT NOT NULL,
  status ENUM('new', 'contacted', 'resolved', 'declined') DEFAULT 'new',
  assigned_to INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_source (source),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- LEAD NOTES
-- ============================================
CREATE TABLE IF NOT EXISTS lead_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  author_id INT NOT NULL,
  note_text LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_lead (lead_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- SITE SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(255) NOT NULL UNIQUE,
  `value` JSON,
  updated_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor_id INT,
  action VARCHAR(50) NOT NULL COMMENT 'create, update, delete, publish, unpublish',
  entity_type VARCHAR(50) NOT NULL COMMENT 'poll_question, podcast, cartoon, etc',
  entity_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_actor (actor_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- MEDIA ASSETS (FOR TRACKING)
-- ============================================
CREATE TABLE IF NOT EXISTS media_assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cloudinary_public_id VARCHAR(500) NOT NULL UNIQUE,
  cloudinary_url VARCHAR(500) NOT NULL,
  filename VARCHAR(255),
  file_type VARCHAR(100),
  file_size INT,
  width INT,
  height INT,
  uploaded_by INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_public_id (cloudinary_public_id),
  INDEX idx_uploaded (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- ABOUT PAGE CONTENT
-- ============================================
CREATE TABLE IF NOT EXISTS about_page (
  id INT INT AUTO_INCREMENT PRIMARY KEY,
  bio_text LONGTEXT,
  bio_image_url VARCHAR(500),
  status ENUM('draft', 'published') DEFAULT 'draft',
  updated_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- INITIALIZE DEFAULT SETTINGS
-- ============================================
INSERT IGNORE INTO site_settings (`key`, `value`) VALUES
('hero_title', JSON_OBJECT('text', 'Balanced. Unbiased. Independent.', 'subtitle', 'Giving Voice to the Exhausted Majority')),
('hero_video', JSON_OBJECT('url', '', 'thumbnail', '')),
('station_badges', JSON_ARRAY(
  JSON_OBJECT('text', 'SiriusXM', 'time', 'M-F 9am-12pm', 'logo', ''),
  JSON_OBJECT('text', 'CNN', 'time', 'Sat 9-10am', 'logo', '')
)),
('social_links', JSON_OBJECT(
  'twitter', 'https://twitter.com',
  'instagram', 'https://instagram.com',
  'facebook', 'https://facebook.com',
  'youtube', 'https://youtube.com',
  'tiktok', 'https://tiktok.com',
  'threads', 'https://threads.net',
  'bluesky', 'https://bsky.app'
)),
('sponsor_banner', JSON_OBJECT('visible', FALSE, 'text', '', 'link', '')),
('content_hub_tiles', JSON_ARRAY(
  JSON_OBJECT('id', 'podcasts', 'label', 'Podcasts', 'visible', TRUE, 'order', 1),
  JSON_OBJECT('id', 'mingle', 'label', 'Mingle Project', 'visible', TRUE, 'order', 2),
  JSON_OBJECT('id', 'cartoons', 'label', 'Cartoons', 'visible', TRUE, 'order', 3),
  JSON_OBJECT('id', 'playlists', 'label', 'Playlists', 'visible', TRUE, 'order', 4),
  JSON_OBJECT('id', 'booking', 'label', 'Booking', 'visible', TRUE, 'order', 5),
  JSON_OBJECT('id', 'advertising', 'label', 'Advertising', 'visible', TRUE, 'order', 6),
  JSON_OBJECT('id', 'about', 'label', 'About', 'visible', TRUE, 'order', 7),
  JSON_OBJECT('id', 'contact', 'label', 'Contact', 'visible', TRUE, 'order', 8)
));
