-- Migration: PDF v2 additions (API keys per politician, darshan registry, ops tables)
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `temple_registry` ADD COLUMN IF NOT EXISTS `deity` VARCHAR(255) DEFAULT '';
ALTER TABLE `temple_registry` ADD COLUMN IF NOT EXISTS `trust_name` VARCHAR(255) DEFAULT '';
ALTER TABLE `temple_registry` ADD COLUMN IF NOT EXISTS `darshan_types` JSON DEFAULT NULL;
ALTER TABLE `temple_registry` ADD COLUMN IF NOT EXISTS `booking_rules` JSON DEFAULT NULL;
ALTER TABLE `temple_registry` ADD COLUMN IF NOT EXISTS `cooldown_months` INT DEFAULT 12;
ALTER TABLE `temple_registry` ADD COLUMN IF NOT EXISTS `max_group_size` INT DEFAULT 10;
ALTER TABLE `temple_registry` ADD COLUMN IF NOT EXISTS `documents_required` JSON DEFAULT NULL;
ALTER TABLE `temple_registry` ADD COLUMN IF NOT EXISTS `sms_template_telugu` TEXT DEFAULT NULL;
ALTER TABLE `temple_registry` ADD COLUMN IF NOT EXISTS `sms_template_hindi` TEXT DEFAULT NULL;
ALTER TABLE `temple_registry` ADD COLUMN IF NOT EXISTS `sms_template_english` TEXT DEFAULT NULL;

ALTER TABLE `darshan_bookings` ADD COLUMN IF NOT EXISTS `temple_id` INT UNSIGNED DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `politician_api_keys` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`   INT UNSIGNED NOT NULL,
  `key_name`        VARCHAR(120) NOT NULL,
  `encrypted_value` LONGTEXT NOT NULL,
  `iv`              VARCHAR(64) NOT NULL,
  `auth_tag`        VARCHAR(64) NOT NULL,
  `key_hint`        VARCHAR(20) DEFAULT '',
  `monthly_limit`   INT DEFAULT 0,
  `usage_count`     INT DEFAULT 0,
  `usage_month`     VARCHAR(7) DEFAULT NULL,
  `is_active`       TINYINT(1) NOT NULL DEFAULT 1,
  `is_paused`       TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_pol_key` (`politician_id`, `key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `comm_templates` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id` INT UNSIGNED DEFAULT NULL,
  `name`          VARCHAR(255) NOT NULL,
  `channel`       VARCHAR(50) DEFAULT 'SMS',
  `language`      VARCHAR(50) DEFAULT 'English',
  `content`       TEXT NOT NULL,
  `tags`          JSON DEFAULT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mplads_tracker` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`  INT UNSIGNED DEFAULT NULL,
  `fiscal_year`    VARCHAR(20) NOT NULL,
  `allocated`      DECIMAL(15,2) NOT NULL DEFAULT 0,
  `spent`          DECIMAL(15,2) NOT NULL DEFAULT 0,
  `balance`        DECIMAL(15,2) NOT NULL DEFAULT 0,
  `status`         VARCHAR(50) DEFAULT 'Active',
  `notes`          TEXT DEFAULT NULL,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `grievance_timeline` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id` INT UNSIGNED DEFAULT NULL,
  `grievance_id`  INT UNSIGNED NOT NULL,
  `status`        VARCHAR(50) NOT NULL,
  `note`          TEXT DEFAULT NULL,
  `changed_by`    VARCHAR(255) DEFAULT '',
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `villages` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id` INT UNSIGNED DEFAULT NULL,
  `mandal_name`   VARCHAR(255) DEFAULT '',
  `village_name`  VARCHAR(255) NOT NULL,
  `population`    INT DEFAULT 0,
  `households`    INT DEFAULT 0,
  `notes`         TEXT DEFAULT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
