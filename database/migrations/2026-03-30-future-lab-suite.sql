-- Migration: Future Lab suite (coalition forecasting + crisis war room)
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `coalition_scenarios` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id` INT UNSIGNED DEFAULT NULL,
  `scenario_name` VARCHAR(255) NOT NULL,
  `total_seats`   INT DEFAULT 0,
  `majority_mark` INT DEFAULT 0,
  `seat_projections` JSON DEFAULT NULL,
  `alliances`     JSON DEFAULT NULL,
  `probability`   DECIMAL(5,2) DEFAULT 0,
  `risk_level`    VARCHAR(50) DEFAULT 'moderate',
  `forecast`      JSON DEFAULT NULL,
  `status`        VARCHAR(50) DEFAULT 'draft',
  `notes`         TEXT DEFAULT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `crisis_incidents` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id` INT UNSIGNED DEFAULT NULL,
  `source_alert_id` INT UNSIGNED DEFAULT NULL,
  `title`         VARCHAR(255) NOT NULL,
  `crisis_type`   VARCHAR(120) DEFAULT '',
  `severity`      INT DEFAULT 5,
  `status`        VARCHAR(50) DEFAULT 'open',
  `location`      VARCHAR(255) DEFAULT '',
  `detected_at`   DATETIME DEFAULT CURRENT_TIMESTAMP,
  `summary`       TEXT DEFAULT NULL,
  `impact_score`  DECIMAL(6,2) DEFAULT 0,
  `owner`         VARCHAR(255) DEFAULT '',
  `response_plan` TEXT DEFAULT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `warroom_actions` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id` INT UNSIGNED DEFAULT NULL,
  `incident_id`   INT UNSIGNED DEFAULT NULL,
  `action_type`   VARCHAR(120) DEFAULT '',
  `description`   TEXT DEFAULT NULL,
  `owner`         VARCHAR(255) DEFAULT '',
  `status`        VARCHAR(50) DEFAULT 'pending',
  `due_at`        DATETIME DEFAULT NULL,
  `completed_at`  DATETIME DEFAULT NULL,
  `notes`         TEXT DEFAULT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`incident_id`) REFERENCES `crisis_incidents`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
