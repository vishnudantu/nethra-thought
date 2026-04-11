-- Migration 005: AI Training Context System
-- Stores party + politician AI context profiles
-- These are injected into every AI call automatically

CREATE TABLE IF NOT EXISTS ai_context_profiles (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scope         ENUM('platform','party','politician') NOT NULL,
  scope_id      VARCHAR(200) DEFAULT NULL,   -- party name OR politician_id (NULL for platform)
  context_type  ENUM(
    'ideology',           -- Party/politician worldview and values
    'talking_points',     -- Current approved narratives
    'communication_style',-- Tone, length, formality, language preference
    'avoid',              -- Topics/phrases/positions to never mention
    'opponent_strategy',  -- How to talk about opponents
    'constituency_context',-- Local issues, demographics, history
    'approved_phrases',   -- Phrases the politician actually uses
    'sample_content'      -- Approved past speeches/posts for tone reference
  ) NOT NULL,
  title         VARCHAR(200) NOT NULL,
  content       TEXT NOT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_by    INT UNSIGNED DEFAULT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_scope_type (scope, scope_id, is_active),
  KEY idx_politician (scope_id, scope)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- AI Feedback table — thumbs up/down on every AI output
CREATE TABLE IF NOT EXISTS ai_feedback (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  politician_id   INT UNSIGNED NOT NULL,
  endpoint        VARCHAR(120) NOT NULL,   -- e.g. 'grievance.response', 'content.social_post'
  prompt_summary  VARCHAR(500) DEFAULT NULL,
  ai_output       TEXT NOT NULL,
  feedback        ENUM('positive','negative') NOT NULL,
  feedback_note   VARCHAR(500) DEFAULT NULL,  -- optional note from reviewer
  reviewed_by     INT UNSIGNED DEFAULT NULL,  -- user_id who gave feedback
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_politician_endpoint (politician_id, endpoint),
  KEY idx_feedback_type (feedback),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed: Default platform-level context
INSERT IGNORE INTO ai_context_profiles (scope, scope_id, context_type, title, content, is_active) VALUES
('platform', NULL, 'ideology',
  'Nethra Platform Default',
  'You are Nethra, an AI political intelligence assistant built for Indian politicians. You understand Indian democracy, the parliamentary system, constituency-level politics, and the cultural nuances of political communication in India. You are professional, data-driven, and focused on helping elected representatives serve their constituents better. You understand the difference between Lok Sabha MPs, Rajya Sabha MPs, MLAs, MLCs, Mayors, and Councillors and tailor your responses accordingly.',
  1
),
('platform', NULL, 'communication_style',
  'Default Communication Style',
  'Respond in clear, professional language appropriate for Indian political contexts. When drafting content for public consumption, use respectful honorifics (Sri, Smt, Dr). When analysing data, be specific with numbers. When drafting responses to constituents, be empathetic and solution-focused. Default language is English unless a different language is specified for the politician.',
  1
);

SELECT 'Migration 005 complete' as result;
