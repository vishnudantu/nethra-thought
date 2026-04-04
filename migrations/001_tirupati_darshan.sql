-- Tirupati Darshan Module - Database Schema
-- Run this SQL to create the required tables

-- Main bookings table
CREATE TABLE IF NOT EXISTS darshan_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  politician_id INT NOT NULL,
  booking_ref VARCHAR(30) UNIQUE NOT NULL,
  booking_date DATE NOT NULL,
  letter_date DATE NOT NULL,
  total_pilgrims INT NOT NULL DEFAULT 1,
  status ENUM('pending','approved','rejected','completed') DEFAULT 'pending',
  approved_by INT,
  approved_at DATETIME,
  sms_sent TINYINT DEFAULT 0,
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  INDEX idx_politician (politician_id),
  INDEX idx_booking_date (booking_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Each pilgrim in a booking (1-6 rows per booking)
CREATE TABLE IF NOT EXISTS darshan_pilgrims (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  politician_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  aadhaar VARCHAR(12) NOT NULL,
  aadhaar_hash VARCHAR(64) NOT NULL,
  age INT,
  gender ENUM('male','female','other'),
  address TEXT,
  darshan_type VARCHAR(50) DEFAULT 'SSD',
  visit_date DATE NOT NULL,
  validation_status ENUM('valid','blocked','already_visited') DEFAULT 'valid',
  last_visit_date DATE,
  sms_sent TINYINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES darshan_bookings(id) ON DELETE CASCADE,
  INDEX idx_aadhaar_hash (aadhaar_hash),
  INDEX idx_phone (phone),
  INDEX idx_visit_date (visit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Daily quota tracker
CREATE TABLE IF NOT EXISTS darshan_daily_quota (
  id INT AUTO_INCREMENT PRIMARY KEY,
  politician_id INT NOT NULL,
  letter_date DATE NOT NULL,
  pilgrims_used INT DEFAULT 0,
  max_pilgrims INT DEFAULT 6,
  letter_issued TINYINT DEFAULT 0,
  UNIQUE KEY uniq_pol_date (politician_id, letter_date),
  INDEX idx_letter_date (letter_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add darshan module to feature modules
INSERT INTO feature_modules (module_key, label, category, description, is_active, is_future) 
VALUES ('darshan-new', 'Tirupati Darshan V2', 'Services', 'New Tirupati Darshan booking system with quota management', 1, 0)
ON DUPLICATE KEY UPDATE label = VALUES(label), description = VALUES(description);
