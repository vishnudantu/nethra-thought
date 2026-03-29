/*
  # Multi-Politician Auth & Deployment System

  Adds complete authentication and multi-tenant system.
*/

-- Step 1: Add new columns to politician_profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'politician_profiles' AND column_name = 'slug') THEN
    ALTER TABLE politician_profiles ADD COLUMN slug text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'politician_profiles' AND column_name = 'auth_user_id') THEN
    ALTER TABLE politician_profiles ADD COLUMN auth_user_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'politician_profiles' AND column_name = 'subscription_status') THEN
    ALTER TABLE politician_profiles ADD COLUMN subscription_status text DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'politician_profiles' AND column_name = 'deployed_at') THEN
    ALTER TABLE politician_profiles ADD COLUMN deployed_at timestamptz DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'politician_profiles' AND column_name = 'color_primary') THEN
    ALTER TABLE politician_profiles ADD COLUMN color_primary text DEFAULT '#00d4aa';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'politician_profiles' AND column_name = 'color_secondary') THEN
    ALTER TABLE politician_profiles ADD COLUMN color_secondary text DEFAULT '#1e88e5';
  END IF;
END $$;

-- Step 2: Create user_roles table with politician_id column
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin', 'politician_admin', 'staff')),
  politician_id uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Platform settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name text DEFAULT 'NETHRA Political Intelligence',
  support_email text DEFAULT 'support@nethra.ai',
  max_politicians integer DEFAULT 100,
  allow_self_register boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO platform_settings (platform_name, support_email)
SELECT 'NETHRA Political Intelligence', 'support@nethra.ai'
WHERE NOT EXISTS (SELECT 1 FROM platform_settings);

-- Step 4: Helper functions (created AFTER tables exist)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
  RETURN v_role;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_politician_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT politician_id INTO v_id FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
  RETURN v_id;
END;
$$;

-- Step 5: RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR get_user_role() = 'super_admin');

CREATE POLICY "Super admins can insert user roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'super_admin');

CREATE POLICY "Super admins can update user roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

CREATE POLICY "Super admins can delete user roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (get_user_role() = 'super_admin');

-- Step 6: RLS Policies for platform_settings
CREATE POLICY "Authenticated users can view platform settings"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can update platform settings"
  ON platform_settings FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

-- Step 7: Update politician_profiles RLS policies
DO $$
DECLARE
  pol_name text;
BEGIN
  FOR pol_name IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'politician_profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON politician_profiles', pol_name);
  END LOOP;
END $$;

CREATE POLICY "Users can view their politician profiles"
  ON politician_profiles FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'super_admin'
    OR get_user_politician_id() = id
  );

CREATE POLICY "Super admins can insert politician profiles"
  ON politician_profiles FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'super_admin');

CREATE POLICY "Admins can update their politician profile"
  ON politician_profiles FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'super_admin'
    OR (get_user_role() = 'politician_admin' AND get_user_politician_id() = id)
  )
  WITH CHECK (
    get_user_role() = 'super_admin'
    OR (get_user_role() = 'politician_admin' AND get_user_politician_id() = id)
  );

CREATE POLICY "Super admins can delete politician profiles"
  ON politician_profiles FOR DELETE
  TO authenticated
  USING (get_user_role() = 'super_admin');

-- Step 8: Indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_politician_profiles_slug ON politician_profiles(slug);
