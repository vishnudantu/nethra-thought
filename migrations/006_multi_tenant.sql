-- ═══════════════════════════════════════════════════════════════
-- MULTI-TENANT ARCHITECTURE MIGRATION
-- Allows multiple parties (TDP, YSRCP, BJP, etc.) on same instance
-- ═══════════════════════════════════════════════════════════════

-- 1. Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url VARCHAR(500) DEFAULT NULL,
  primary_color VARCHAR(20) DEFAULT '#00d4aa',
  secondary_color VARCHAR(20) DEFAULT '#1e88e5',
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Add tenant_id to core tables
ALTER TABLE politician_profiles ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE users ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE grievances ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE darshan_bookings ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE media_mentions ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE ai_context_profiles ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE ai_feedback ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE events ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE appointments ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE platform_settings ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE politician_module_access ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE politician_keywords ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE opposition_intelligence ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id;

-- 3. Add indexes for performance
ALTER TABLE politician_profiles ADD INDEX idx_tenant (tenant_id);
ALTER TABLE users ADD INDEX idx_tenant (tenant_id);
ALTER TABLE grievances ADD INDEX idx_tenant (tenant_id);
ALTER TABLE darshan_bookings ADD INDEX idx_tenant (tenant_id);
ALTER TABLE media_mentions ADD INDEX idx_tenant (tenant_id);
ALTER TABLE ai_context_profiles ADD INDEX idx_tenant (tenant_id);
ALTER TABLE ai_feedback ADD INDEX idx_tenant (tenant_id);
ALTER TABLE events ADD INDEX idx_tenant (tenant_id);
ALTER TABLE appointments ADD INDEX idx_tenant (tenant_id);
ALTER TABLE platform_settings ADD INDEX idx_tenant (tenant_id);
ALTER TABLE politician_module_access ADD INDEX idx_tenant (tenant_id);
ALTER TABLE politician_keywords ADD INDEX idx_tenant (tenant_id);
ALTER TABLE opposition_intelligence ADD INDEX idx_tenant (tenant_id);

-- 4. Seed default tenant (Tenant 1 = Original/Platform data)
INSERT INTO tenants (id, name, slug, primary_color, secondary_color, is_active) 
VALUES (1, 'Default Party', 'default', '#00d4aa', '#1e88e5', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 5. Update existing data to tenant 1
UPDATE politician_profiles SET tenant_id = 1;
UPDATE users SET tenant_id = 1;
UPDATE grievances SET tenant_id = 1;
UPDATE darshan_bookings SET tenant_id = 1;
UPDATE media_mentions SET tenant_id = 1;
UPDATE ai_context_profiles SET tenant_id = 1;
UPDATE ai_feedback SET tenant_id = 1;
UPDATE events SET tenant_id = 1;
UPDATE appointments SET tenant_id = 1;
UPDATE platform_settings SET tenant_id = 1;
UPDATE politician_module_access SET tenant_id = 1;
UPDATE politician_keywords SET tenant_id = 1;
UPDATE opposition_intelligence SET tenant_id = 1;

SELECT '✅ Multi-tenant migration complete!' as status;
