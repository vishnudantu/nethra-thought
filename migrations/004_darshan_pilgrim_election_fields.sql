-- Migration 004: Add election intelligence fields to darshan_pilgrims
-- These fields capture constituency data at point of darshan booking
-- which becomes a valuable voter database over time

ALTER TABLE darshan_pilgrims
  ADD COLUMN IF NOT EXISTS mandal VARCHAR(100) DEFAULT NULL COMMENT 'Mandal/Tehsil of pilgrim',
  ADD COLUMN IF NOT EXISTS village VARCHAR(100) DEFAULT NULL COMMENT 'Village of pilgrim',
  ADD COLUMN IF NOT EXISTS town VARCHAR(100) DEFAULT NULL COMMENT 'Nearest town',
  ADD COLUMN IF NOT EXISTS assembly_segment VARCHAR(100) DEFAULT NULL COMMENT 'Assembly constituency segment',
  ADD COLUMN IF NOT EXISTS voter_id VARCHAR(20) DEFAULT NULL COMMENT 'Voter ID card number (optional)',
  ADD COLUMN IF NOT EXISTS party_connection ENUM('party_worker','voter','general_public','referred') DEFAULT 'general_public' COMMENT 'Relationship to politician',
  ADD COLUMN IF NOT EXISTS referral_name VARCHAR(100) DEFAULT NULL COMMENT 'Name of referring karyakarta if referred',
  ADD COLUMN IF NOT EXISTS is_constituency_voter TINYINT(1) DEFAULT NULL COMMENT '1=yes, 0=no, NULL=unknown',
  ADD COLUMN IF NOT EXISTS occupation VARCHAR(100) DEFAULT NULL COMMENT 'Occupation of pilgrim',
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL COMMENT 'Staff notes';

-- Index for election analytics queries
CREATE INDEX IF NOT EXISTS idx_dp_mandal ON darshan_pilgrims(mandal);
CREATE INDEX IF NOT EXISTS idx_dp_party_connection ON darshan_pilgrims(party_connection);
CREATE INDEX IF NOT EXISTS idx_dp_constituency_voter ON darshan_pilgrims(is_constituency_voter);
CREATE INDEX IF NOT EXISTS idx_dp_politician ON darshan_pilgrims(politician_id);

SELECT 'darshan_pilgrims election fields added' as result;
