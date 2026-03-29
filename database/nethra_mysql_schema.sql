-- =============================================================
-- NETHRA Political Intelligence Suite — MySQL Schema
-- =============================================================
-- Run this ONCE in your Hostinger MySQL database
-- phpMyAdmin → Select your database → SQL tab → paste → Go
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

-- ======================
-- USERS (Auth)
-- ======================
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email`         VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role`          ENUM('super_admin','politician_admin','staff') NOT NULL DEFAULT 'staff',
  `politician_id` INT UNSIGNED DEFAULT NULL,
  `is_active`     TINYINT(1) NOT NULL DEFAULT 1,
  `two_factor_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `two_factor_code_hash` VARCHAR(255) DEFAULT NULL,
  `two_factor_expires` DATETIME DEFAULT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- POLITICIAN PROFILES
-- ======================
CREATE TABLE IF NOT EXISTS `politician_profiles` (
  `id`                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `full_name`           VARCHAR(255) NOT NULL DEFAULT '',
  `display_name`        VARCHAR(255) DEFAULT '',
  `slug`                VARCHAR(255) DEFAULT NULL,
  `photo_url`           TEXT DEFAULT NULL,
  `party`               VARCHAR(100) NOT NULL DEFAULT '',
  `designation`         VARCHAR(255) NOT NULL DEFAULT '',
  `constituency_name`   VARCHAR(255) NOT NULL DEFAULT '',
  `state`               VARCHAR(100) NOT NULL DEFAULT '',
  `lok_sabha_seat`      VARCHAR(255) DEFAULT '',
  `bio`                 TEXT DEFAULT NULL,
  `phone`               VARCHAR(20) DEFAULT '',
  `email`               VARCHAR(255) DEFAULT '',
  `office_address`      TEXT DEFAULT NULL,
  `website`             VARCHAR(255) DEFAULT '',
  `twitter_handle`      VARCHAR(100) DEFAULT '',
  `facebook_url`        VARCHAR(255) DEFAULT '',
  `instagram_handle`    VARCHAR(100) DEFAULT '',
  `youtube_channel`     VARCHAR(255) DEFAULT '',
  `education`           TEXT DEFAULT NULL,
  `dob`                 DATE DEFAULT NULL,
  `age`                 INT DEFAULT NULL,
  `languages`           JSON DEFAULT NULL,
  `achievements`        JSON DEFAULT NULL,
  `role`                ENUM('admin','politician','staff') NOT NULL DEFAULT 'politician',
  `is_active`           TINYINT(1) NOT NULL DEFAULT 1,
  `term_start`          DATE DEFAULT NULL,
  `term_end`            DATE DEFAULT NULL,
  `previous_terms`      INT DEFAULT 0,
  `election_year`       INT DEFAULT NULL,
  `winning_margin`      INT DEFAULT NULL,
  `vote_count`          INT DEFAULT NULL,
  `total_votes_polled`  INT DEFAULT NULL,
  `subscription_status` VARCHAR(50) DEFAULT 'active',
  `deployed_at`         DATETIME DEFAULT CURRENT_TIMESTAMP,
  `color_primary`       VARCHAR(20) DEFAULT '#00d4aa',
  `color_secondary`     VARCHAR(20) DEFAULT '#1e88e5',
  `auth_user_id`        INT UNSIGNED DEFAULT NULL,
  `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- CONSTITUENCIES
-- ======================
CREATE TABLE IF NOT EXISTS `constituencies` (
  `id`                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`                VARCHAR(255) NOT NULL,
  `state`               VARCHAR(100) NOT NULL DEFAULT 'India',
  `total_voters`        INT DEFAULT 0,
  `registered_voters`   INT DEFAULT 0,
  `area_sqkm`           DECIMAL(10,2) DEFAULT 0,
  `population`          INT DEFAULT 0,
  `mandals`             INT DEFAULT 0,
  `villages`            INT DEFAULT 0,
  `mp_name`             VARCHAR(255) DEFAULT '',
  `party`               VARCHAR(100) DEFAULT '',
  `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- GRIEVANCES
-- ======================
CREATE TABLE IF NOT EXISTS `grievances` (
  `id`               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `ticket_number`    VARCHAR(50) NOT NULL DEFAULT '',
  `petitioner_name`  VARCHAR(255) NOT NULL,
  `contact`          VARCHAR(20) DEFAULT '',
  `category`         VARCHAR(100) NOT NULL DEFAULT 'General',
  `subject`          VARCHAR(500) NOT NULL,
  `description`      TEXT DEFAULT NULL,
  `location`         VARCHAR(255) DEFAULT '',
  `status`           ENUM('Pending','In Progress','Resolved','Escalated','Closed') NOT NULL DEFAULT 'Pending',
  `priority`         ENUM('Low','Medium','High','Urgent') NOT NULL DEFAULT 'Medium',
  `assigned_to`      VARCHAR(255) DEFAULT '',
  `resolution_notes` TEXT DEFAULT NULL,
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `resolved_at`      DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- EVENTS
-- ======================
CREATE TABLE IF NOT EXISTS `events` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title`       VARCHAR(500) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `event_type`  VARCHAR(100) NOT NULL DEFAULT 'Meeting',
  `location`    VARCHAR(255) DEFAULT '',
  `start_date`  DATETIME NOT NULL,
  `end_date`    DATETIME DEFAULT NULL,
  `status`      ENUM('Upcoming','Ongoing','Completed','Cancelled') NOT NULL DEFAULT 'Upcoming',
  `attendees`   INT DEFAULT 0,
  `organizer`   VARCHAR(255) DEFAULT '',
  `notes`       TEXT DEFAULT NULL,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- TEAM MEMBERS
-- ======================
CREATE TABLE IF NOT EXISTS `team_members` (
  `id`           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`         VARCHAR(255) NOT NULL,
  `role`         VARCHAR(255) NOT NULL,
  `department`   VARCHAR(255) DEFAULT '',
  `email`        VARCHAR(255) DEFAULT '',
  `phone`        VARCHAR(20) DEFAULT '',
  `status`       ENUM('Active','Inactive','On Leave') NOT NULL DEFAULT 'Active',
  `joining_date` DATE DEFAULT NULL,
  `avatar_url`   TEXT DEFAULT NULL,
  `skills`       JSON DEFAULT NULL,
  `notes`        TEXT DEFAULT NULL,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- VOTERS
-- ======================
CREATE TABLE IF NOT EXISTS `voters` (
  `id`                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `voter_id`           VARCHAR(100) NOT NULL UNIQUE,
  `name`               VARCHAR(255) NOT NULL,
  `age`                INT DEFAULT NULL,
  `gender`             ENUM('Male','Female','Other','') DEFAULT '',
  `phone`              VARCHAR(20) DEFAULT '',
  `email`              VARCHAR(255) DEFAULT '',
  `address`            TEXT DEFAULT NULL,
  `mandal`             VARCHAR(255) DEFAULT '',
  `village`            VARCHAR(255) DEFAULT '',
  `booth_number`       VARCHAR(50) DEFAULT '',
  `party_affiliation`  VARCHAR(100) DEFAULT 'Neutral',
  `support_level`      INT DEFAULT 3,
  `is_active`          TINYINT(1) DEFAULT 1,
  `tags`               JSON DEFAULT NULL,
  `notes`              TEXT DEFAULT NULL,
  `caste`              VARCHAR(100) DEFAULT '',
  `caste_category`     VARCHAR(50) DEFAULT 'General',
  `religion`           VARCHAR(100) DEFAULT '',
  `created_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- PROJECTS
-- ======================
CREATE TABLE IF NOT EXISTS `projects` (
  `id`                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `project_name`        VARCHAR(500) NOT NULL,
  `description`         TEXT DEFAULT NULL,
  `category`            VARCHAR(100) NOT NULL DEFAULT 'Infrastructure',
  `location`            VARCHAR(255) DEFAULT '',
  `mandal`              VARCHAR(255) DEFAULT '',
  `budget_allocated`    DECIMAL(15,2) DEFAULT 0,
  `budget_spent`        DECIMAL(15,2) DEFAULT 0,
  `contractor`          VARCHAR(255) DEFAULT '',
  `start_date`          DATE DEFAULT NULL,
  `expected_completion` DATE DEFAULT NULL,
  `actual_completion`   DATE DEFAULT NULL,
  `status`              ENUM('Planning','Tendering','In Progress','Stalled','Completed','Cancelled') NOT NULL DEFAULT 'Planning',
  `progress_percent`    INT DEFAULT 0,
  `beneficiaries`       INT DEFAULT 0,
  `scheme`              VARCHAR(255) DEFAULT '',
  `notes`               TEXT DEFAULT NULL,
  `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- MEDIA MENTIONS
-- ======================
CREATE TABLE IF NOT EXISTS `media_mentions` (
  `id`           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `headline`     VARCHAR(500) NOT NULL,
  `source`       VARCHAR(255) NOT NULL,
  `source_type`  ENUM('Newspaper','TV','Online','Social Media','Radio','Magazine') NOT NULL DEFAULT 'Online',
  `sentiment`    ENUM('Positive','Negative','Neutral') NOT NULL DEFAULT 'Neutral',
  `language`     VARCHAR(50) DEFAULT 'English',
  `url`          TEXT DEFAULT NULL,
  `published_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `summary`      TEXT DEFAULT NULL,
  `tags`         JSON DEFAULT NULL,
  `is_read`      TINYINT(1) DEFAULT 0,
  `reach`        INT DEFAULT 0,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- FINANCES
-- ======================
CREATE TABLE IF NOT EXISTS `finances` (
  `id`               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `transaction_type` ENUM('Income','Expense') NOT NULL DEFAULT 'Expense',
  `category`         VARCHAR(100) NOT NULL,
  `description`      TEXT DEFAULT NULL,
  `amount`           DECIMAL(15,2) NOT NULL DEFAULT 0,
  `date`             DATE NOT NULL DEFAULT (CURRENT_DATE),
  `payment_mode`     VARCHAR(100) DEFAULT 'Bank Transfer',
  `reference_number` VARCHAR(100) DEFAULT '',
  `project_id`       INT UNSIGNED DEFAULT NULL,
  `status`           ENUM('Pending','Completed','Cancelled') NOT NULL DEFAULT 'Completed',
  `notes`            TEXT DEFAULT NULL,
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- COMMUNICATIONS
-- ======================
CREATE TABLE IF NOT EXISTS `communications` (
  `id`               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `subject`          VARCHAR(500) NOT NULL,
  `message`          TEXT NOT NULL,
  `comm_type`        ENUM('SMS','Email','WhatsApp','Push Notification','Letter') NOT NULL DEFAULT 'SMS',
  `recipient_group`  VARCHAR(255) DEFAULT 'All Voters',
  `recipient_count`  INT DEFAULT 0,
  `status`           ENUM('Draft','Scheduled','Sent','Failed') NOT NULL DEFAULT 'Draft',
  `scheduled_at`     DATETIME DEFAULT NULL,
  `sent_at`          DATETIME DEFAULT NULL,
  `open_rate`        DECIMAL(5,2) DEFAULT 0,
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- DOCUMENTS
-- ======================
CREATE TABLE IF NOT EXISTS `documents` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title`           VARCHAR(500) NOT NULL,
  `doc_type`        VARCHAR(100) NOT NULL DEFAULT 'Official',
  `category`        VARCHAR(100) DEFAULT 'General',
  `file_name`       VARCHAR(255) DEFAULT '',
  `file_size`       VARCHAR(50) DEFAULT '',
  `description`     TEXT DEFAULT NULL,
  `tags`            JSON DEFAULT NULL,
  `is_confidential` TINYINT(1) DEFAULT 0,
  `uploaded_by`     VARCHAR(255) DEFAULT '',
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- APPOINTMENTS
-- ======================
CREATE TABLE IF NOT EXISTS `appointments` (
  `id`                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `visitor_name`        VARCHAR(255) NOT NULL,
  `visitor_contact`     VARCHAR(20) NOT NULL DEFAULT '',
  `visitor_email`       VARCHAR(255) DEFAULT '',
  `visitor_id_type`     VARCHAR(50) DEFAULT 'Aadhaar',
  `visitor_id_number`   VARCHAR(100) DEFAULT '',
  `purpose`             TEXT NOT NULL,
  `category`            VARCHAR(100) NOT NULL DEFAULT 'General',
  `priority`            VARCHAR(50) NOT NULL DEFAULT 'Normal',
  `requested_date`      DATE NOT NULL,
  `requested_time`      VARCHAR(10) NOT NULL DEFAULT '10:00',
  `duration_minutes`    INT DEFAULT 30,
  `status`              VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
  `staff_member_name`   VARCHAR(255) DEFAULT '',
  `notes`               TEXT DEFAULT NULL,
  `visit_count`         INT DEFAULT 1,
  `is_vip`              TINYINT(1) DEFAULT 0,
  `is_repeat_visitor`   TINYINT(1) DEFAULT 0,
  `token_number`        VARCHAR(50) DEFAULT '',
  `check_in_time`       DATETIME DEFAULT NULL,
  `check_out_time`      DATETIME DEFAULT NULL,
  `feedback`            TEXT DEFAULT NULL,
  `rating`              INT DEFAULT 0,
  `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- POLLS
-- ======================
CREATE TABLE IF NOT EXISTS `polls` (
  `id`               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title`            VARCHAR(500) NOT NULL,
  `description`      TEXT DEFAULT NULL,
  `category`         VARCHAR(100) NOT NULL DEFAULT 'General',
  `target_audience`  VARCHAR(100) DEFAULT 'All',
  `questions`        JSON NOT NULL,
  `start_date`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_date`         DATETIME DEFAULT NULL,
  `status`           VARCHAR(50) NOT NULL DEFAULT 'Draft',
  `total_responses`  INT DEFAULT 0,
  `target_responses` INT DEFAULT 1000,
  `is_anonymous`     TINYINT(1) DEFAULT 1,
  `tags`             JSON DEFAULT NULL,
  `created_by`       VARCHAR(255) DEFAULT '',
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- POLL RESPONSES
-- ======================
CREATE TABLE IF NOT EXISTS `poll_responses` (
  `id`                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `poll_id`            INT UNSIGNED DEFAULT NULL,
  `respondent_name`    VARCHAR(255) DEFAULT '',
  `respondent_phone`   VARCHAR(20) DEFAULT '',
  `respondent_age`     INT DEFAULT NULL,
  `respondent_gender`  VARCHAR(20) DEFAULT '',
  `respondent_mandal`  VARCHAR(255) DEFAULT '',
  `answers`            JSON NOT NULL,
  `sentiment`          VARCHAR(50) DEFAULT 'Neutral',
  `created_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`poll_id`) REFERENCES `polls`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- DARSHAN BOOKINGS
-- ======================
CREATE TABLE IF NOT EXISTS `darshan_bookings` (
  `id`                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `booking_number`          VARCHAR(50) NOT NULL UNIQUE,
  `pilgrim_name`            VARCHAR(255) NOT NULL,
  `pilgrim_contact`         VARCHAR(20) NOT NULL DEFAULT '',
  `pilgrim_email`           VARCHAR(255) DEFAULT '',
  `pilgrim_id_type`         VARCHAR(50) DEFAULT 'Aadhaar',
  `pilgrim_id_number`       VARCHAR(100) DEFAULT '',
  `pilgrim_aadhar_last4`    VARCHAR(4) DEFAULT '',
  `group_size`              INT NOT NULL DEFAULT 1,
  `group_members`           JSON DEFAULT NULL,
  `darshan_type`            VARCHAR(100) NOT NULL DEFAULT 'Standard Darshan',
  `darshan_date`            DATE NOT NULL,
  `darshan_time`            VARCHAR(10) DEFAULT '06:00',
  `slot_number`             VARCHAR(50) DEFAULT '',
  `mandal`                  VARCHAR(255) DEFAULT '',
  `village`                 VARCHAR(255) DEFAULT '',
  `accommodation_required`  TINYINT(1) DEFAULT 0,
  `accommodation_type`      VARCHAR(100) DEFAULT 'None',
  `accommodation_nights`    INT DEFAULT 0,
  `transport_required`      TINYINT(1) DEFAULT 0,
  `transport_type`          VARCHAR(100) DEFAULT 'None',
  `departure_location`      VARCHAR(255) DEFAULT '',
  `special_requests`        TEXT DEFAULT NULL,
  `status`                  VARCHAR(50) NOT NULL DEFAULT 'Booked',
  `notes`                   TEXT DEFAULT NULL,
  `coordinator_name`        VARCHAR(255) DEFAULT '',
  `is_waitlisted`           TINYINT(1) NOT NULL DEFAULT 0,
  `waitlist_position`       INT DEFAULT NULL,
  `cooldown_until`          DATE DEFAULT NULL,
  `promoted_from_waitlist`  TINYINT(1) NOT NULL DEFAULT 0,
  `approval_status`         VARCHAR(20) NOT NULL DEFAULT 'pending',
  `approved_at`             DATETIME DEFAULT NULL,
  `approved_by`             VARCHAR(255) DEFAULT '',
  `rejection_reason`        TEXT DEFAULT NULL,
  `approval_notes`          TEXT DEFAULT NULL,
  `contact_person`          VARCHAR(255) DEFAULT '',
  `contact_phone`           VARCHAR(20) DEFAULT '',
  `ticket_pickup_point`     VARCHAR(255) DEFAULT '',
  `shrine_contact_numbers`  VARCHAR(255) DEFAULT '',
  `sms_sent`                TINYINT(1) NOT NULL DEFAULT 0,
  `sms_sent_at`             DATETIME DEFAULT NULL,
  `created_at`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- DARSHAN DATE SLOTS
-- ======================
CREATE TABLE IF NOT EXISTS `darshan_date_slots` (
  `id`                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slot_date`            DATE NOT NULL UNIQUE,
  `is_filled`            TINYINT(1) NOT NULL DEFAULT 0,
  `confirmed_booking_id` INT UNSIGNED DEFAULT NULL,
  `waitlist_count`       INT NOT NULL DEFAULT 0,
  `created_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- DARSHAN DONATIONS
-- ======================
CREATE TABLE IF NOT EXISTS `darshan_donations` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `booking_id`    INT UNSIGNED DEFAULT NULL,
  `donor_name`    VARCHAR(255) NOT NULL,
  `donor_contact` VARCHAR(20) DEFAULT '',
  `donation_type` VARCHAR(100) NOT NULL DEFAULT 'Hundi',
  `amount`        DECIMAL(10,2) NOT NULL DEFAULT 0,
  `purpose`       TEXT DEFAULT NULL,
  `receipt_number`VARCHAR(100) DEFAULT '',
  `payment_mode`  VARCHAR(50) DEFAULT 'Cash',
  `notes`         TEXT DEFAULT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- OTHER TEMPLE DARSHANS
-- ======================
CREATE TABLE IF NOT EXISTS `darshans` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id` INT UNSIGNED DEFAULT NULL,
  `temple_name`   VARCHAR(255) NOT NULL,
  `darshan_date`  DATE DEFAULT NULL,
  `status`        VARCHAR(50) DEFAULT 'Requested',
  `pilgrim_name`  VARCHAR(255) DEFAULT '',
  `pilgrim_contact` VARCHAR(20) DEFAULT '',
  `location`      VARCHAR(255) DEFAULT '',
  `group_size`    INT DEFAULT 1,
  `notes`         TEXT DEFAULT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- NOTIFICATIONS
-- ======================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id` INT UNSIGNED DEFAULT NULL,
  `title`         VARCHAR(255) NOT NULL,
  `message`       TEXT DEFAULT NULL,
  `link`          VARCHAR(255) DEFAULT '',
  `is_read`       TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- WEBSITE CONTENT (CMS)
-- ======================
CREATE TABLE IF NOT EXISTS `website_content` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `page`       VARCHAR(120) NOT NULL DEFAULT 'home',
  `section`    VARCHAR(120) NOT NULL,
  `content`    JSON NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_page_section` (`page`, `section`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- BILLS (Legislative)
-- ======================
CREATE TABLE IF NOT EXISTS `bills` (
  `id`                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `bill_number`         VARCHAR(100) NOT NULL,
  `bill_name`           VARCHAR(500) NOT NULL,
  `description`         TEXT DEFAULT NULL,
  `category`            VARCHAR(100) NOT NULL DEFAULT 'General',
  `ministry`            VARCHAR(255) DEFAULT '',
  `introduced_by`       VARCHAR(255) DEFAULT '',
  `introduced_date`     DATE DEFAULT NULL,
  `house`               VARCHAR(50) DEFAULT 'Lok Sabha',
  `status`              VARCHAR(100) NOT NULL DEFAULT 'Introduced',
  `current_stage`       VARCHAR(255) DEFAULT '',
  `vote_date`           DATE DEFAULT NULL,
  `member_vote`         VARCHAR(50) DEFAULT 'Not Voted',
  `vote_explanation`    TEXT DEFAULT NULL,
  `impact_level`        VARCHAR(50) DEFAULT 'Medium',
  `constituency_impact` TEXT DEFAULT NULL,
  `tags`                JSON DEFAULT NULL,
  `notes`               TEXT DEFAULT NULL,
  `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- CITIZEN ENGAGEMENTS
-- ======================
CREATE TABLE IF NOT EXISTS `citizen_engagements` (
  `id`                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title`               VARCHAR(500) NOT NULL,
  `engagement_type`     VARCHAR(100) NOT NULL DEFAULT 'Town Hall',
  `description`         TEXT DEFAULT NULL,
  `location`            VARCHAR(255) DEFAULT '',
  `mandal`              VARCHAR(255) DEFAULT '',
  `event_date`          DATETIME NOT NULL,
  `duration_hours`      DECIMAL(4,1) DEFAULT 2,
  `expected_attendance` INT DEFAULT 100,
  `actual_attendance`   INT DEFAULT 0,
  `rsvp_count`          INT DEFAULT 0,
  `status`              VARCHAR(50) NOT NULL DEFAULT 'Planning',
  `organizer`           VARCHAR(255) DEFAULT '',
  `contact`             VARCHAR(20) DEFAULT '',
  `agenda`              TEXT DEFAULT NULL,
  `outcome`             TEXT DEFAULT NULL,
  `tags`                JSON DEFAULT NULL,
  `notes`               TEXT DEFAULT NULL,
  `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- VOLUNTEERS
-- ======================
CREATE TABLE IF NOT EXISTS `volunteers` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`            VARCHAR(255) NOT NULL,
  `phone`           VARCHAR(20) NOT NULL DEFAULT '',
  `email`           VARCHAR(255) DEFAULT '',
  `age`             INT DEFAULT NULL,
  `gender`          VARCHAR(20) DEFAULT '',
  `address`         TEXT DEFAULT NULL,
  `mandal`          VARCHAR(255) DEFAULT '',
  `village`         VARCHAR(255) DEFAULT '',
  `skills`          JSON DEFAULT NULL,
  `availability`    VARCHAR(100) DEFAULT 'Weekends',
  `status`          VARCHAR(50) NOT NULL DEFAULT 'Active',
  `joined_date`     DATE DEFAULT NULL,
  `total_hours`     DECIMAL(8,1) DEFAULT 0,
  `events_attended` INT DEFAULT 0,
  `notes`           TEXT DEFAULT NULL,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- SUGGESTIONS
-- ======================
CREATE TABLE IF NOT EXISTS `suggestions` (
  `id`               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title`            VARCHAR(500) NOT NULL,
  `description`      TEXT NOT NULL,
  `category`         VARCHAR(100) NOT NULL DEFAULT 'General',
  `submitter_name`   VARCHAR(255) DEFAULT 'Anonymous',
  `submitter_contact`VARCHAR(20) DEFAULT '',
  `is_anonymous`     TINYINT(1) DEFAULT 1,
  `mandal`           VARCHAR(255) DEFAULT '',
  `status`           VARCHAR(50) NOT NULL DEFAULT 'New',
  `priority`         VARCHAR(50) DEFAULT 'Medium',
  `admin_response`   TEXT DEFAULT NULL,
  `upvotes`          INT DEFAULT 0,
  `tags`             JSON DEFAULT NULL,
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- CONSTITUENCY PROFILES
-- ======================
CREATE TABLE IF NOT EXISTS `constituency_profiles` (
  `id`                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`           INT UNSIGNED DEFAULT NULL,
  `constituency_name`       VARCHAR(255) NOT NULL DEFAULT '',
  `state`                   VARCHAR(100) NOT NULL DEFAULT '',
  `district`                VARCHAR(255) DEFAULT '',
  `total_voters`            BIGINT DEFAULT 0,
  `registered_voters`       BIGINT DEFAULT 0,
  `area_sqkm`               DECIMAL(10,2) DEFAULT 0,
  `population`              BIGINT DEFAULT 0,
  `total_mandals`           INT DEFAULT 0,
  `total_villages`          INT DEFAULT 0,
  `total_booths`            INT DEFAULT 0,
  `urban_population_pct`    DECIMAL(5,2) DEFAULT 0,
  `rural_population_pct`    DECIMAL(5,2) DEFAULT 0,
  `literacy_rate`           DECIMAL(5,2) DEFAULT 0,
  `sex_ratio`               INT DEFAULT 0,
  `key_facts`               JSON DEFAULT NULL,
  `key_industries`          JSON DEFAULT NULL,
  `assembly_segments`       JSON DEFAULT NULL,
  `notes`                   TEXT DEFAULT NULL,
  `created_at`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- CASTE DEMOGRAPHICS
-- ======================
CREATE TABLE IF NOT EXISTS `caste_demographics` (
  `id`                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `constituency_profile_id`  INT UNSIGNED DEFAULT NULL,
  `caste_name`               VARCHAR(255) NOT NULL DEFAULT '',
  `caste_category`           ENUM('SC','ST','OBC','General','Minority','Other') NOT NULL DEFAULT 'General',
  `population_count`         BIGINT DEFAULT 0,
  `population_pct`           DECIMAL(5,2) DEFAULT 0,
  `voter_count`              BIGINT DEFAULT 0,
  `voter_pct`                DECIMAL(5,2) DEFAULT 0,
  `support_level`            DECIMAL(3,1) DEFAULT 3.0,
  `dominant_party`           VARCHAR(100) DEFAULT '',
  `swing_potential`          ENUM('Low','Medium','High') DEFAULT 'Low',
  `key_leaders`              JSON DEFAULT NULL,
  `notes`                    TEXT DEFAULT NULL,
  `sort_order`               INT DEFAULT 0,
  `created_at`               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- MANDAL STATS
-- ======================
CREATE TABLE IF NOT EXISTS `mandal_stats` (
  `id`                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `constituency_profile_id`  INT UNSIGNED DEFAULT NULL,
  `mandal_name`              VARCHAR(255) NOT NULL DEFAULT '',
  `assembly_segment`         VARCHAR(255) DEFAULT '',
  `total_voters`             BIGINT DEFAULT 0,
  `male_voters`              BIGINT DEFAULT 0,
  `female_voters`            BIGINT DEFAULT 0,
  `total_booths`             INT DEFAULT 0,
  `dominant_caste`           VARCHAR(100) DEFAULT '',
  `dominant_party`           VARCHAR(100) DEFAULT '',
  `support_pct`              DECIMAL(5,2) DEFAULT 0,
  `swing_status`             ENUM('Safe','Leaning','Swing','Risky') DEFAULT 'Safe',
  `key_issues`               JSON DEFAULT NULL,
  `created_at`               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- PARLIAMENTARY QUESTIONS
-- ======================
CREATE TABLE IF NOT EXISTS `parliamentary_questions` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `question_number` VARCHAR(50) DEFAULT '',
  `session_number`  VARCHAR(100) NOT NULL DEFAULT '',
  `house`           VARCHAR(50) NOT NULL DEFAULT 'Lok Sabha',
  `question_type`   VARCHAR(50) NOT NULL DEFAULT 'Unstarred',
  `subject`         VARCHAR(500) NOT NULL DEFAULT '',
  `ministry`        VARCHAR(255) DEFAULT '',
  `question_text`   TEXT DEFAULT NULL,
  `answer_text`     TEXT DEFAULT NULL,
  `date_asked`      DATE DEFAULT NULL,
  `status`          VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
  `sansad_url`      TEXT DEFAULT NULL,
  `tags`            JSON DEFAULT NULL,
  `notes`           TEXT DEFAULT NULL,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- PARLIAMENTARY DEBATES
-- ======================
CREATE TABLE IF NOT EXISTS `parliamentary_debates` (
  `id`               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `session_number`   VARCHAR(100) NOT NULL DEFAULT '',
  `house`            VARCHAR(50) NOT NULL DEFAULT 'Lok Sabha',
  `date_of_debate`   DATE DEFAULT NULL,
  `debate_type`      VARCHAR(100) NOT NULL DEFAULT 'Zero Hour',
  `topic`            VARCHAR(500) NOT NULL DEFAULT '',
  `our_stance`       TEXT DEFAULT NULL,
  `speech_excerpt`   TEXT DEFAULT NULL,
  `duration_minutes` INT DEFAULT 0,
  `sansad_url`       TEXT DEFAULT NULL,
  `tags`             JSON DEFAULT NULL,
  `notes`            TEXT DEFAULT NULL,
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- PARLIAMENTARY BILLS
-- ======================
CREATE TABLE IF NOT EXISTS `parliamentary_bills` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `bill_number`     VARCHAR(100) DEFAULT '',
  `bill_name`       VARCHAR(500) NOT NULL DEFAULT '',
  `bill_type`       VARCHAR(100) NOT NULL DEFAULT 'Government Bill',
  `ministry`        VARCHAR(255) DEFAULT '',
  `introduced_by`   VARCHAR(255) DEFAULT '',
  `introduced_date` DATE DEFAULT NULL,
  `our_vote`        VARCHAR(50) DEFAULT 'Not Applicable',
  `our_stance`      TEXT DEFAULT NULL,
  `status`          VARCHAR(100) NOT NULL DEFAULT 'Introduced',
  `sansad_url`      TEXT DEFAULT NULL,
  `tags`            JSON DEFAULT NULL,
  `notes`           TEXT DEFAULT NULL,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- AI BRIEFINGS
-- ======================
CREATE TABLE IF NOT EXISTS `ai_briefings` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `briefing_date`  DATE NOT NULL DEFAULT (CURRENT_DATE),
  `briefing_type`  VARCHAR(100) NOT NULL DEFAULT 'Daily Digest',
  `title`          VARCHAR(500) NOT NULL DEFAULT '',
  `summary`        TEXT DEFAULT NULL,
  `content`        LONGTEXT DEFAULT NULL,
  `priority`       VARCHAR(50) NOT NULL DEFAULT 'Medium',
  `is_read`        TINYINT(1) NOT NULL DEFAULT 0,
  `tags`           JSON DEFAULT NULL,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- AI GENERATED CONTENT
-- ======================
CREATE TABLE IF NOT EXISTS `ai_generated_content` (
  `id`           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`INT UNSIGNED DEFAULT NULL,
  `content_type` VARCHAR(100) NOT NULL,
  `prompt`       TEXT NOT NULL,
  `content`      LONGTEXT NOT NULL,
  `is_saved`     TINYINT(1) DEFAULT 0,
  `tags`         JSON DEFAULT NULL,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- SENTIMENT SCORES
-- ======================
CREATE TABLE IF NOT EXISTS `sentiment_scores` (
  `id`               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`    INT UNSIGNED DEFAULT NULL,
  `score_date`       DATE NOT NULL DEFAULT (CURRENT_DATE),
  `overall_score`    INT DEFAULT 0,
  `news_score`       INT DEFAULT 0,
  `social_score`     INT DEFAULT 0,
  `whatsapp_score`   INT DEFAULT 0,
  `grievance_score`  INT DEFAULT 0,
  `ground_score`     INT DEFAULT 0,
  `channel_breakdown` JSON DEFAULT NULL,
  `issue_breakdown`   JSON DEFAULT NULL,
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_sentiment_day` (`politician_id`, `score_date`),
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- OPPOSITION INTELLIGENCE
-- ======================
CREATE TABLE IF NOT EXISTS `opposition_intelligence` (
  `id`                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`      INT UNSIGNED DEFAULT NULL,
  `opponent_name`      VARCHAR(255) NOT NULL,
  `opponent_party`     VARCHAR(100) DEFAULT '',
  `opponent_constituency` VARCHAR(255) DEFAULT '',
  `activity_type`      VARCHAR(100) DEFAULT '',
  `description`        TEXT DEFAULT NULL,
  `source`             VARCHAR(255) DEFAULT '',
  `detected_at`        DATETIME DEFAULT CURRENT_TIMESTAMP,
  `sentiment_toward_us` VARCHAR(50) DEFAULT 'Neutral',
  `threat_level`       INT DEFAULT 5,
  `ai_analysis`        TEXT DEFAULT NULL,
  `created_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- VOICE INTELLIGENCE REPORTS
-- ======================
CREATE TABLE IF NOT EXISTS `voice_reports` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`  INT UNSIGNED DEFAULT NULL,
  `reporter_name`  VARCHAR(255) DEFAULT '',
  `reporter_role`  VARCHAR(100) DEFAULT '',
  `transcript`     LONGTEXT DEFAULT NULL,
  `classification` VARCHAR(100) DEFAULT 'General',
  `language`       VARCHAR(50) DEFAULT 'Telugu',
  `location`       VARCHAR(255) DEFAULT '',
  `gps_lat`        DECIMAL(10,7) DEFAULT NULL,
  `gps_lng`        DECIMAL(10,7) DEFAULT NULL,
  `attachments`    JSON DEFAULT NULL,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- API KEYS (ENCRYPTED)
-- ======================
CREATE TABLE IF NOT EXISTS `api_keys` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `key_name`        VARCHAR(120) NOT NULL UNIQUE,
  `encrypted_value` LONGTEXT NOT NULL,
  `iv`              VARCHAR(64) NOT NULL,
  `auth_tag`        VARCHAR(64) NOT NULL,
  `key_hint`        VARCHAR(20) DEFAULT '',
  `is_active`       TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- FEATURE MODULES & FLAGS
-- ======================
CREATE TABLE IF NOT EXISTS `feature_modules` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `module_key`  VARCHAR(120) NOT NULL UNIQUE,
  `label`       VARCHAR(255) NOT NULL,
  `category`    VARCHAR(120) DEFAULT '',
  `description` TEXT DEFAULT NULL,
  `is_active`   TINYINT(1) NOT NULL DEFAULT 1,
  `is_future`   TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `feature_flags` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `feature_key` VARCHAR(140) NOT NULL UNIQUE,
  `module_key`  VARCHAR(120) NOT NULL,
  `label`       VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `is_active`   TINYINT(1) NOT NULL DEFAULT 1,
  `is_future`   TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`module_key`) REFERENCES `feature_modules`(`module_key`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- ACCESS CONTROL
-- ======================
CREATE TABLE IF NOT EXISTS `politician_module_access` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id` INT UNSIGNED NOT NULL,
  `module_key`    VARCHAR(120) NOT NULL,
  `is_enabled`    TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_politician_module` (`politician_id`, `module_key`),
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `role_module_access` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `role`       VARCHAR(40) NOT NULL,
  `module_key` VARCHAR(120) NOT NULL,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_role_module` (`role`, `module_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `politician_feature_access` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id` INT UNSIGNED NOT NULL,
  `feature_key`   VARCHAR(140) NOT NULL,
  `is_enabled`    TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_politician_feature` (`politician_id`, `feature_key`),
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `role_feature_access` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `role`        VARCHAR(40) NOT NULL,
  `feature_key` VARCHAR(140) NOT NULL,
  `is_enabled`  TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_role_feature` (`role`, `feature_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- ADMIN REPORTS
-- ======================
CREATE TABLE IF NOT EXISTS `admin_reports` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`  INT UNSIGNED DEFAULT NULL,
  `report_type`    VARCHAR(120) NOT NULL,
  `title`          VARCHAR(255) NOT NULL,
  `summary`        TEXT DEFAULT NULL,
  `content`        LONGTEXT DEFAULT NULL,
  `created_by`     INT UNSIGNED DEFAULT NULL,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- PROMISES TRACKER
-- ======================
CREATE TABLE IF NOT EXISTS `promises` (
  `id`               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`    INT UNSIGNED DEFAULT NULL,
  `promise_text`     TEXT NOT NULL,
  `made_at`          DATETIME DEFAULT NULL,
  `location`         VARCHAR(255) DEFAULT '',
  `category`         VARCHAR(120) DEFAULT '',
  `status`           ENUM('not_started','in_progress','completed','cancelled') NOT NULL DEFAULT 'not_started',
  `linked_project_id` INT UNSIGNED DEFAULT NULL,
  `deadline`         DATE DEFAULT NULL,
  `completion_date`  DATE DEFAULT NULL,
  `notes`            TEXT DEFAULT NULL,
  `source`           VARCHAR(120) DEFAULT '',
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`linked_project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- CONTENT CALENDAR
-- ======================
CREATE TABLE IF NOT EXISTS `content_calendar` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id` INT UNSIGNED DEFAULT NULL,
  `content_id`    INT UNSIGNED DEFAULT NULL,
  `scheduled_date` DATE DEFAULT NULL,
  `platform`      VARCHAR(100) DEFAULT 'whatsapp',
  `status`        VARCHAR(50) DEFAULT 'scheduled',
  `notes`         TEXT DEFAULT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`content_id`) REFERENCES `ai_generated_content`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- WHATSAPP INTELLIGENCE
-- ======================
CREATE TABLE IF NOT EXISTS `whatsapp_intelligence` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`   INT UNSIGNED DEFAULT NULL,
  `received_at`     DATETIME DEFAULT CURRENT_TIMESTAMP,
  `sender_phone`    VARCHAR(30) DEFAULT '',
  `message_type`    VARCHAR(50) DEFAULT 'text',
  `content`         LONGTEXT DEFAULT NULL,
  `transcription`   LONGTEXT DEFAULT NULL,
  `classification`  VARCHAR(120) DEFAULT '',
  `sentiment`       VARCHAR(50) DEFAULT 'neutral',
  `urgency_score`   INT DEFAULT 0,
  `is_viral`        TINYINT(1) DEFAULT 0,
  `viral_count`     INT DEFAULT 0,
  `is_misinformation` TINYINT(1) DEFAULT 0,
  `routed_to`       VARCHAR(120) DEFAULT '',
  `action_taken`    VARCHAR(255) DEFAULT '',
  `processed_at`    DATETIME DEFAULT NULL,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- SMART VISIT PLANNER
-- ======================
CREATE TABLE IF NOT EXISTS `visit_plans` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`   INT UNSIGNED DEFAULT NULL,
  `mandal`          VARCHAR(255) DEFAULT '',
  `village`         VARCHAR(255) DEFAULT '',
  `priority`        INT DEFAULT 5,
  `reasoning`       TEXT DEFAULT NULL,
  `recommended_date` DATE DEFAULT NULL,
  `status`          VARCHAR(50) DEFAULT 'planned',
  `last_visit_date` DATE DEFAULT NULL,
  `notes`           TEXT DEFAULT NULL,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- BOOTH MANAGEMENT
-- ======================
CREATE TABLE IF NOT EXISTS `booths` (
  `id`               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`    INT UNSIGNED DEFAULT NULL,
  `booth_number`     VARCHAR(100) DEFAULT '',
  `booth_name`       VARCHAR(255) DEFAULT '',
  `location`         VARCHAR(255) DEFAULT '',
  `mandal`           VARCHAR(255) DEFAULT '',
  `total_voters`     INT DEFAULT 0,
  `expected_turnout` INT DEFAULT 0,
  `agent_name`       VARCHAR(255) DEFAULT '',
  `historical_vote_percentage` JSON DEFAULT NULL,
  `coordinates`      JSON DEFAULT NULL,
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- PREDICTIVE CRISIS ALERTS
-- ======================
CREATE TABLE IF NOT EXISTS `predictive_alerts` (
  `id`               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`    INT UNSIGNED DEFAULT NULL,
  `alert_type`       VARCHAR(120) DEFAULT '',
  `probability`      DECIMAL(5,2) DEFAULT 0,
  `description`      TEXT DEFAULT NULL,
  `recommended_action` TEXT DEFAULT NULL,
  `timeframe_days`   INT DEFAULT 0,
  `status`           VARCHAR(50) DEFAULT 'active',
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- AUTONOMOUS AGENT TASKS
-- ======================
CREATE TABLE IF NOT EXISTS `agent_tasks` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`  INT UNSIGNED DEFAULT NULL,
  `agent_type`     VARCHAR(100) DEFAULT '',
  `task_type`      VARCHAR(120) DEFAULT '',
  `description`    TEXT DEFAULT NULL,
  `status`         VARCHAR(50) DEFAULT 'pending',
  `result`         TEXT DEFAULT NULL,
  `assigned_to`    VARCHAR(255) DEFAULT '',
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- DEEPFAKE & DISINFORMATION SHIELD
-- ======================
CREATE TABLE IF NOT EXISTS `deepfake_incidents` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`  INT UNSIGNED DEFAULT NULL,
  `platform`       VARCHAR(120) DEFAULT '',
  `content_url`    TEXT DEFAULT NULL,
  `detected_at`    DATETIME DEFAULT CURRENT_TIMESTAMP,
  `confidence`     DECIMAL(5,2) DEFAULT 0,
  `status`         VARCHAR(50) DEFAULT 'open',
  `response_plan`  TEXT DEFAULT NULL,
  `notes`          TEXT DEFAULT NULL,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- POLITICAL RELATIONSHIP GRAPH
-- ======================
CREATE TABLE IF NOT EXISTS `relationships` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`  INT UNSIGNED DEFAULT NULL,
  `entity_name`    VARCHAR(255) NOT NULL,
  `entity_type`    VARCHAR(120) DEFAULT '',
  `relationship_type` VARCHAR(120) DEFAULT '',
  `influence_score` INT DEFAULT 0,
  `alignment`      VARCHAR(50) DEFAULT 'neutral',
  `last_contact_at` DATE DEFAULT NULL,
  `notes`          TEXT DEFAULT NULL,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- ECONOMIC INTELLIGENCE
-- ======================
CREATE TABLE IF NOT EXISTS `economic_indicators` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`  INT UNSIGNED DEFAULT NULL,
  `indicator_type` VARCHAR(120) DEFAULT '',
  `mandal`         VARCHAR(255) DEFAULT '',
  `value`          DECIMAL(12,2) DEFAULT 0,
  `unit`           VARCHAR(50) DEFAULT '',
  `recorded_date`  DATE DEFAULT NULL,
  `trend`          VARCHAR(50) DEFAULT 'stable',
  `source`         VARCHAR(255) DEFAULT '',
  `notes`          TEXT DEFAULT NULL,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- CITIZEN SERVICES REQUESTS
-- ======================
CREATE TABLE IF NOT EXISTS `citizen_service_requests` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`  INT UNSIGNED DEFAULT NULL,
  `requester_name` VARCHAR(255) DEFAULT '',
  `request_type`   VARCHAR(120) DEFAULT '',
  `status`         VARCHAR(50) DEFAULT 'open',
  `description`    TEXT DEFAULT NULL,
  `source`         VARCHAR(50) DEFAULT 'app',
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- ELECTION COMMAND CENTER UPDATES
-- ======================
CREATE TABLE IF NOT EXISTS `election_updates` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`  INT UNSIGNED DEFAULT NULL,
  `booth_id`       INT UNSIGNED DEFAULT NULL,
  `update_type`    VARCHAR(120) DEFAULT '',
  `description`    TEXT DEFAULT NULL,
  `reported_at`    DATETIME DEFAULT CURRENT_TIMESTAMP,
  `status`         VARCHAR(50) DEFAULT 'open',
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`booth_id`) REFERENCES `booths`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- FINANCIAL COMPLIANCE REPORTS
-- ======================
CREATE TABLE IF NOT EXISTS `finance_compliance_reports` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`  INT UNSIGNED DEFAULT NULL,
  `report_type`    VARCHAR(120) DEFAULT '',
  `summary`        TEXT DEFAULT NULL,
  `status`         VARCHAR(50) DEFAULT 'draft',
  `alerts`         JSON DEFAULT NULL,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- PARTY INTEGRATIONS
-- ======================
CREATE TABLE IF NOT EXISTS `party_integrations` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`  INT UNSIGNED DEFAULT NULL,
  `party_name`     VARCHAR(255) DEFAULT '',
  `integration_type` VARCHAR(120) DEFAULT '',
  `status`         VARCHAR(50) DEFAULT 'pending',
  `last_sync_at`   DATETIME DEFAULT NULL,
  `notes`          TEXT DEFAULT NULL,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- DIGITAL TWIN RUNS
-- ======================
CREATE TABLE IF NOT EXISTS `digital_twin_runs` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `politician_id`  INT UNSIGNED DEFAULT NULL,
  `scenario_name`  VARCHAR(255) DEFAULT '',
  `input_summary`  TEXT DEFAULT NULL,
  `output_summary` LONGTEXT DEFAULT NULL,
  `status`         VARCHAR(50) DEFAULT 'draft',
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`politician_id`) REFERENCES `politician_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================
-- INDEXES
-- ======================
CREATE INDEX idx_grievances_status   ON grievances(status);
CREATE INDEX idx_grievances_priority ON grievances(priority);
CREATE INDEX idx_voters_mandal       ON voters(mandal);
CREATE INDEX idx_voters_booth        ON voters(booth_number);
CREATE INDEX idx_projects_status     ON projects(status);
CREATE INDEX idx_events_start        ON events(start_date);
CREATE INDEX idx_darshan_date        ON darshan_bookings(darshan_date);
CREATE INDEX idx_darshan_approval    ON darshan_bookings(approval_status);
CREATE INDEX idx_users_email         ON users(email);
CREATE INDEX idx_sentiment_date      ON sentiment_scores(score_date);
CREATE INDEX idx_opposition_detected ON opposition_intelligence(detected_at);
CREATE INDEX idx_voice_created       ON voice_reports(created_at);
CREATE INDEX idx_feature_module_key  ON feature_modules(module_key);
CREATE INDEX idx_feature_flag_key    ON feature_flags(feature_key);
CREATE INDEX idx_admin_reports       ON admin_reports(report_type, created_at);
CREATE INDEX idx_darshans_date       ON darshans(darshan_date);
CREATE INDEX idx_notifications_read  ON notifications(is_read, created_at);
CREATE INDEX idx_website_page        ON website_content(page);
CREATE INDEX idx_promises_status     ON promises(status);
CREATE INDEX idx_whatsapp_received   ON whatsapp_intelligence(received_at);
CREATE INDEX idx_visit_plans_date    ON visit_plans(recommended_date);
CREATE INDEX idx_booths_mandal       ON booths(mandal);
CREATE INDEX idx_predictive_type     ON predictive_alerts(alert_type);
CREATE INDEX idx_agent_status        ON agent_tasks(status);
CREATE INDEX idx_deepfake_status     ON deepfake_incidents(status);
CREATE INDEX idx_relationship_entity ON relationships(entity_name);
CREATE INDEX idx_economic_date       ON economic_indicators(recorded_date);
CREATE INDEX idx_citizen_service     ON citizen_service_requests(status);
CREATE INDEX idx_election_updates    ON election_updates(reported_at);
CREATE INDEX idx_compliance_status   ON finance_compliance_reports(status);
CREATE INDEX idx_party_integration   ON party_integrations(status);
CREATE INDEX idx_digital_twin_status ON digital_twin_runs(status);

SET FOREIGN_KEY_CHECKS = 1;

-- ======================
-- SEED DATA
-- ======================
INSERT IGNORE INTO `constituencies` (name, state, total_voters, registered_voters, area_sqkm, population, mandals, villages, mp_name, party)
VALUES ('Amalapuram', 'Andhra Pradesh', 1850000, 1620000, 1542, 2789000, 57, 684, 'GM Harish Balayogi', 'TDP');

INSERT IGNORE INTO `grievances` (ticket_number, petitioner_name, contact, category, subject, status, priority, assigned_to) VALUES
('GRV-00000001', 'Ravi Kumar', '9876543210', 'Infrastructure', 'Road repair needed in Gandhi Nagar', 'Pending', 'High', 'Municipal Team'),
('GRV-00000002', 'Lakshmi Devi', '9876543211', 'Water Supply', 'Irregular water supply for 3 weeks', 'In Progress', 'Urgent', 'Water Dept'),
('GRV-00000003', 'Mohammad Rasheed', '9876543212', 'Education', 'School building renovation required', 'Resolved', 'Medium', 'Education Dept');

INSERT IGNORE INTO `team_members` (name, role, department, email, phone, status) VALUES
('Rajesh Varma', 'Personal Secretary', 'Administration', 'rajesh@office.in', '9876500001', 'Active'),
('Sunitha Reddy', 'Media Coordinator', 'Communications', 'sunitha@office.in', '9876500002', 'Active'),
('Anil Kumar', 'Grievance Officer', 'Public Relations', 'anil@office.in', '9876500003', 'Active');

-- ======================
-- DEFAULT SUPER ADMIN
-- Password: Admin@1234  (change immediately after first login)
-- Hash generated with bcrypt rounds=12
-- ======================
INSERT IGNORE INTO `users` (email, password_hash, role)
VALUES ('admin@nethra.app', '$2b$12$NrCPmE/ulmyRTXCnIF9wfeT/YdLt9JCg9wMmo/sUFloPp6vUlp.5a', 'super_admin');

-- ======================
-- END OF SCHEMA
-- ======================
