-- Migration: 2026-03-31 Founder profile display name
ALTER TABLE `users`
  ADD COLUMN `display_name` VARCHAR(255) DEFAULT NULL AFTER `email`;
