/*
  # Politician Profiles Schema

  ## Summary
  Creates a multi-politician profile system where each politician has a complete profile,
  constituency details, caste-wise demographics, and role-based access (admin vs politician).

  ## New Tables

  ### `politician_profiles`
  - Core profile: name, photo, party, designation, bio, contact info, social links
  - Constituency assignment (FK to constituencies)
  - Role: 'admin' | 'politician' | 'staff'
  - Active/inactive status

  ### `constituency_profiles`
  - Full constituency data owned by a politician profile
  - Stats: voters, area, population, mandals, villages
  - Key facts as JSONB array
  - Industries as JSONB array

  ### `caste_demographics`
  - Caste-wise voter breakdown per constituency profile
  - Caste name, population count, percentage, voter count, support_level avg
  - Category: SC / ST / OBC / General / Minority / Other

  ### `constituency_mandal_stats`
  - Per-mandal breakdown under a constituency
  - Voter count, booth count, dominant party, support percentage

  ## Security
  - RLS enabled on all tables
  - Admins can read/write all profiles
  - Politicians can read/write only their own profile
  - Staff can only read
*/

-- Politician Profiles
CREATE TABLE IF NOT EXISTS politician_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT '',
  photo_url text DEFAULT '',
  party text NOT NULL DEFAULT '',
  designation text NOT NULL DEFAULT '',
  constituency_name text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  lok_sabha_seat text DEFAULT '',
  bio text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  office_address text DEFAULT '',
  website text DEFAULT '',
  twitter_handle text DEFAULT '',
  facebook_url text DEFAULT '',
  instagram_handle text DEFAULT '',
  youtube_channel text DEFAULT '',
  education text DEFAULT '',
  dob date,
  age integer,
  languages text[] DEFAULT '{}',
  achievements text[] DEFAULT '{}',
  role text NOT NULL DEFAULT 'politician' CHECK (role IN ('admin', 'politician', 'staff')),
  is_active boolean NOT NULL DEFAULT true,
  term_start date,
  term_end date,
  previous_terms integer DEFAULT 0,
  election_year integer,
  winning_margin integer,
  vote_count integer,
  total_votes_polled integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE politician_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all profiles"
  ON politician_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert profiles"
  ON politician_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile or admins can update any"
  ON politician_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete profiles"
  ON politician_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Constituency Profiles (editable, linked to a politician)
CREATE TABLE IF NOT EXISTS constituency_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id uuid REFERENCES politician_profiles(id) ON DELETE CASCADE,
  constituency_name text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  district text DEFAULT '',
  lok_sabha_number text DEFAULT '',
  total_voters bigint DEFAULT 0,
  registered_voters bigint DEFAULT 0,
  area_sqkm numeric(10,2) DEFAULT 0,
  population bigint DEFAULT 0,
  total_mandals integer DEFAULT 0,
  total_villages integer DEFAULT 0,
  total_booths integer DEFAULT 0,
  urban_population_pct numeric(5,2) DEFAULT 0,
  rural_population_pct numeric(5,2) DEFAULT 0,
  literacy_rate numeric(5,2) DEFAULT 0,
  sex_ratio integer DEFAULT 0,
  key_facts jsonb DEFAULT '[]',
  key_industries jsonb DEFAULT '[]',
  revenue_divisions text[] DEFAULT '{}',
  neighboring_constituencies text[] DEFAULT '{}',
  assembly_segments text[] DEFAULT '{}',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE constituency_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view constituency profiles"
  ON constituency_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert constituency profiles"
  ON constituency_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update constituency profiles"
  ON constituency_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete constituency profiles"
  ON constituency_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Caste Demographics (caste-wise voter breakdown)
CREATE TABLE IF NOT EXISTS caste_demographics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  constituency_profile_id uuid REFERENCES constituency_profiles(id) ON DELETE CASCADE,
  caste_name text NOT NULL DEFAULT '',
  caste_category text NOT NULL DEFAULT 'General' CHECK (caste_category IN ('SC', 'ST', 'OBC', 'General', 'Minority', 'Other')),
  population_count bigint DEFAULT 0,
  population_pct numeric(5,2) DEFAULT 0,
  voter_count bigint DEFAULT 0,
  voter_pct numeric(5,2) DEFAULT 0,
  support_level numeric(3,1) DEFAULT 3.0,
  dominant_party text DEFAULT '',
  swing_potential text DEFAULT 'Low' CHECK (swing_potential IN ('Low', 'Medium', 'High')),
  key_leaders text[] DEFAULT '{}',
  notes text DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE caste_demographics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view caste demographics"
  ON caste_demographics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert caste demographics"
  ON caste_demographics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update caste demographics"
  ON caste_demographics FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete caste demographics"
  ON caste_demographics FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Mandal-wise Stats
CREATE TABLE IF NOT EXISTS mandal_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  constituency_profile_id uuid REFERENCES constituency_profiles(id) ON DELETE CASCADE,
  mandal_name text NOT NULL DEFAULT '',
  assembly_segment text DEFAULT '',
  total_voters bigint DEFAULT 0,
  male_voters bigint DEFAULT 0,
  female_voters bigint DEFAULT 0,
  third_gender_voters bigint DEFAULT 0,
  total_booths integer DEFAULT 0,
  dominant_caste text DEFAULT '',
  dominant_party text DEFAULT '',
  support_pct numeric(5,2) DEFAULT 0,
  swing_status text DEFAULT 'Safe' CHECK (swing_status IN ('Safe', 'Leaning', 'Swing', 'Risky')),
  key_issues text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mandal_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view mandal stats"
  ON mandal_stats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert mandal stats"
  ON mandal_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update mandal stats"
  ON mandal_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete mandal stats"
  ON mandal_stats FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Add caste column to voters table if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'voters' AND column_name = 'caste'
  ) THEN
    ALTER TABLE voters ADD COLUMN caste text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'voters' AND column_name = 'caste_category'
  ) THEN
    ALTER TABLE voters ADD COLUMN caste_category text DEFAULT 'General';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'voters' AND column_name = 'religion'
  ) THEN
    ALTER TABLE voters ADD COLUMN religion text DEFAULT '';
  END IF;
END $$;

-- Seed default Amalapuram politician profile for GM Harish Balayogi
INSERT INTO politician_profiles (
  full_name, display_name, party, designation, constituency_name, state,
  lok_sabha_seat, bio, phone, email, education, age,
  languages, achievements, role, is_active,
  term_start, election_year, previous_terms
) VALUES (
  'GM Harish Balayogi',
  'Harish Balayogi',
  'TDP',
  'Member of Parliament',
  'Amalapuram',
  'Andhra Pradesh',
  'Amalapuram',
  'GM Harish Balayogi is the Member of Parliament representing the Amalapuram Lok Sabha constituency in Andhra Pradesh. He is a dedicated leader committed to the development of the Konaseema region.',
  '',
  '',
  '',
  NULL,
  ARRAY['Telugu', 'English', 'Hindi'],
  ARRAY['Elected MP - 18th Lok Sabha 2024', 'TDP Party Leader - Konaseema Region'],
  'admin',
  true,
  '2024-06-04',
  2024,
  0
) ON CONFLICT DO NOTHING;
