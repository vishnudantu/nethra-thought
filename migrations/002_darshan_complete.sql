-- Complete Tirupati Darshan Database Schema
-- Run this to create/update all required tables

-- Drop existing tables if they exist (for clean slate)
DROP TABLE IF EXISTS darshan_pilgrims;
DROP TABLE IF EXISTS darshan_daily_quota;
DROP TABLE IF EXISTS darshan_bookings;

-- TABLE 1: darshan_bookings
CREATE TABLE darshan_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  politician_id INT NOT NULL,
  booking_ref VARCHAR(30) UNIQUE NOT NULL,
  letter_date DATE NOT NULL,
  visit_date DATE NOT NULL,
  total_pilgrims INT NOT NULL DEFAULT 1,
  status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
  contact_person VARCHAR(255),
  contact_phone VARCHAR(20),
  pickup_point VARCHAR(500),
  shrine_contacts VARCHAR(500),
  notes TEXT,
  created_by INT,
  approved_by INT,
  approved_at DATETIME,
  sms_sent TINYINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_politician (politician_id),
  INDEX idx_letter_date (letter_date),
  INDEX idx_visit_date (visit_date),
  INDEX idx_status (status),
  INDEX idx_booking_ref (booking_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 2: darshan_pilgrims
CREATE TABLE darshan_pilgrims (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  politician_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  aadhaar_hash VARCHAR(64) NOT NULL,
  aadhaar_last4 VARCHAR(4) NOT NULL,
  age INT NOT NULL,
  gender ENUM('male', 'female', 'other') NOT NULL,
  darshan_type VARCHAR(100) DEFAULT 'SSD Darshan',
  address TEXT,
  visit_date DATE NOT NULL,
  validation_status ENUM('valid', 'blocked', 'duplicate') DEFAULT 'valid',
  last_visit_date DATE,
  sms_sent TINYINT DEFAULT 0,
  sms_sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES darshan_bookings(id) ON DELETE CASCADE,
  INDEX idx_booking (booking_id),
  INDEX idx_aadhaar_hash (aadhaar_hash),
  INDEX idx_phone (phone),
  INDEX idx_visit_date (visit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 3: darshan_daily_quota
CREATE TABLE darshan_daily_quota (
  id INT AUTO_INCREMENT PRIMARY KEY,
  politician_id INT NOT NULL,
  letter_date DATE NOT NULL,
  pilgrims_booked INT DEFAULT 0,
  max_pilgrims INT DEFAULT 6,
  UNIQUE KEY uniq_pol_date (politician_id, letter_date),
  INDEX idx_letter_date (letter_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add/update feature module entry
INSERT INTO feature_modules (module_key, label, category, description, is_active, is_future) 
VALUES ('darshan', 'Tirupati Darshan', 'Services', 'Complete Tirupati Darshan booking and approval system', 1, 0)
ON DUPLICATE KEY UPDATE 
  label = VALUES(label), 
  description = VALUES(description),
  is_active = 1;
