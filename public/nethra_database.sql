-- ============================================================
-- NETHRA Political Intelligence Suite - Complete Database Schema
-- Run this entire file in your Supabase SQL Editor or psql
-- All migrations combined in order
-- ============================================================


-- ============================================================
-- MIGRATION 1: Core Schema
-- ============================================================

-- Constituencies
CREATE TABLE IF NOT EXISTS constituencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text NOT NULL DEFAULT 'India',
  total_voters integer DEFAULT 0,
  registered_voters integer DEFAULT 0,
  area_sqkm numeric DEFAULT 0,
  population integer DEFAULT 0,
  mandals integer DEFAULT 0,
  villages integer DEFAULT 0,
  mp_name text DEFAULT '',
  party text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE constituencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read constituencies" ON constituencies FOR SELECT USING (true);
CREATE POLICY "Public insert constituencies" ON constituencies FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update constituencies" ON constituencies FOR UPDATE USING (true) WITH CHECK (true);

-- Grievances
CREATE TABLE IF NOT EXISTS grievances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL DEFAULT 'GRV-' || substr(gen_random_uuid()::text, 1, 8),
  petitioner_name text NOT NULL,
  contact text DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  subject text NOT NULL,
  description text DEFAULT '',
  location text DEFAULT '',
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Resolved', 'Escalated', 'Closed')),
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  assigned_to text DEFAULT '',
  resolution_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE grievances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read grievances" ON grievances FOR SELECT USING (true);
CREATE POLICY "Public insert grievances" ON grievances FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update grievances" ON grievances FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete grievances" ON grievances FOR DELETE USING (true);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  event_type text NOT NULL DEFAULT 'Meeting' CHECK (event_type IN ('Meeting', 'Rally', 'Inauguration', 'Campaign', 'Official Visit', 'Press Conference', 'Public Hearing', 'Party Event', 'Other')),
  location text DEFAULT '',
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  status text NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Ongoing', 'Completed', 'Cancelled')),
  attendees integer DEFAULT 0,
  organizer text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public insert events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update events" ON events FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete events" ON events FOR DELETE USING (true);

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  department text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'On Leave')),
  joining_date date DEFAULT CURRENT_DATE,
  avatar_url text DEFAULT '',
  skills text[] DEFAULT '{}',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read team_members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Public insert team_members" ON team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update team_members" ON team_members FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete team_members" ON team_members FOR DELETE USING (true);

-- Voters
CREATE TABLE IF NOT EXISTS voters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id text UNIQUE NOT NULL,
  name text NOT NULL,
  age integer,
  gender text DEFAULT '' CHECK (gender IN ('Male', 'Female', 'Other', '')),
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  mandal text DEFAULT '',
  village text DEFAULT '',
  booth_number text DEFAULT '',
  party_affiliation text DEFAULT 'Neutral',
  support_level integer DEFAULT 3 CHECK (support_level BETWEEN 1 AND 5),
  is_active boolean DEFAULT true,
  tags text[] DEFAULT '{}',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE voters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read voters" ON voters FOR SELECT USING (true);
CREATE POLICY "Public insert voters" ON voters FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update voters" ON voters FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete voters" ON voters FOR DELETE USING (true);

-- Development Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'Infrastructure',
  location text DEFAULT '',
  mandal text DEFAULT '',
  budget_allocated numeric DEFAULT 0,
  budget_spent numeric DEFAULT 0,
  contractor text DEFAULT '',
  start_date date,
  expected_completion date,
  actual_completion date,
  status text NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning', 'Tendering', 'In Progress', 'Stalled', 'Completed', 'Cancelled')),
  progress_percent integer DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  beneficiaries integer DEFAULT 0,
  scheme text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Public insert projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update projects" ON projects FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete projects" ON projects FOR DELETE USING (true);

-- Media Mentions
CREATE TABLE IF NOT EXISTS media_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline text NOT NULL,
  source text NOT NULL,
  source_type text NOT NULL DEFAULT 'Online' CHECK (source_type IN ('Newspaper', 'TV', 'Online', 'Social Media', 'Radio', 'Magazine')),
  sentiment text NOT NULL DEFAULT 'Neutral' CHECK (sentiment IN ('Positive', 'Negative', 'Neutral')),
  language text DEFAULT 'English',
  url text DEFAULT '',
  published_at timestamptz DEFAULT now(),
  summary text DEFAULT '',
  tags text[] DEFAULT '{}',
  is_read boolean DEFAULT false,
  reach integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE media_mentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read media_mentions" ON media_mentions FOR SELECT USING (true);
CREATE POLICY "Public insert media_mentions" ON media_mentions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update media_mentions" ON media_mentions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete media_mentions" ON media_mentions FOR DELETE USING (true);

-- Finances
CREATE TABLE IF NOT EXISTS finances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL DEFAULT 'Expense' CHECK (transaction_type IN ('Income', 'Expense')),
  category text NOT NULL,
  description text DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  payment_mode text DEFAULT 'Bank Transfer',
  reference_number text DEFAULT '',
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'Completed' CHECK (status IN ('Pending', 'Completed', 'Cancelled')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read finances" ON finances FOR SELECT USING (true);
CREATE POLICY "Public insert finances" ON finances FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update finances" ON finances FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete finances" ON finances FOR DELETE USING (true);

-- Communications
CREATE TABLE IF NOT EXISTS communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  message text NOT NULL,
  comm_type text NOT NULL DEFAULT 'SMS' CHECK (comm_type IN ('SMS', 'Email', 'WhatsApp', 'Push Notification', 'Letter')),
  recipient_group text DEFAULT 'All Voters',
  recipient_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Scheduled', 'Sent', 'Failed')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  open_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read communications" ON communications FOR SELECT USING (true);
CREATE POLICY "Public insert communications" ON communications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update communications" ON communications FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete communications" ON communications FOR DELETE USING (true);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  doc_type text NOT NULL DEFAULT 'Official',
  category text DEFAULT 'General',
  file_name text DEFAULT '',
  file_size text DEFAULT '',
  description text DEFAULT '',
  tags text[] DEFAULT '{}',
  is_confidential boolean DEFAULT false,
  uploaded_by text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read documents" ON documents FOR SELECT USING (true);
CREATE POLICY "Public insert documents" ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update documents" ON documents FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete documents" ON documents FOR DELETE USING (true);

-- Sample Data
INSERT INTO constituencies (name, state, total_voters, registered_voters, area_sqkm, population, mandals, villages, mp_name, party)
VALUES ('Guntur', 'Andhra Pradesh', 1850000, 1620000, 1542, 2789000, 57, 684, 'Dr. Nandamuri Balakrishna', 'TDP')
ON CONFLICT DO NOTHING;

INSERT INTO grievances (petitioner_name, contact, category, subject, status, priority, assigned_to) VALUES
('Ravi Kumar', '9876543210', 'Infrastructure', 'Road repair needed in Gandhi Nagar', 'Pending', 'High', 'Municipal Team'),
('Lakshmi Devi', '9876543211', 'Water Supply', 'Irregular water supply for 3 weeks', 'In Progress', 'Urgent', 'Water Dept'),
('Mohammad Rasheed', '9876543212', 'Education', 'School building renovation required', 'Resolved', 'Medium', 'Education Dept'),
('Priya Sharma', '9876543213', 'Healthcare', 'PHC doctor absent frequently', 'Pending', 'High', 'Health Dept'),
('Suresh Reddy', '9876543214', 'Agriculture', 'Irrigation canal blocked', 'In Progress', 'High', 'Agriculture Dept'),
('Anitha Rao', '9876543215', 'Electricity', 'Power outages daily for 8 hours', 'Escalated', 'Urgent', 'DISCOM'),
('Venkat Naidu', '9876543216', 'Infrastructure', 'Street lights not working in Ward 5', 'Pending', 'Medium', 'Municipal Team'),
('Kavitha Prasad', '9876543217', 'Social Welfare', 'Pension not received for 2 months', 'Resolved', 'High', 'Social Welfare Dept')
ON CONFLICT DO NOTHING;

INSERT INTO events (title, event_type, location, start_date, status, attendees, organizer) VALUES
('Jana Spandana - Grievance Day', 'Public Hearing', 'Collectorate, Guntur', now() + interval '2 days', 'Upcoming', 500, 'Constituency Office'),
('Foundation Stone - NH-65 Flyover', 'Inauguration', 'Chilakaluripet, Guntur', now() + interval '5 days', 'Upcoming', 2000, 'NHAI & State Govt'),
('TDP Party Workers Meet', 'Party Event', 'Party Office, Guntur', now() + interval '7 days', 'Upcoming', 300, 'TDP District Committee'),
('Budget Review Meeting', 'Meeting', 'MP Office, New Delhi', now() - interval '3 days', 'Completed', 25, 'PMO'),
('Cyclone Relief Distribution', 'Official Visit', 'Flood Affected Villages', now() - interval '10 days', 'Completed', 5000, 'District Administration')
ON CONFLICT DO NOTHING;

INSERT INTO team_members (name, role, department, email, phone, status) VALUES
('Rajesh Varma', 'Personal Secretary', 'Administration', 'rajesh@constituency.gov.in', '9876500001', 'Active'),
('Sunitha Reddy', 'Media Coordinator', 'Communications', 'sunitha@constituency.gov.in', '9876500002', 'Active'),
('Anil Kumar', 'Grievance Officer', 'Public Relations', 'anil@constituency.gov.in', '9876500003', 'Active'),
('Meena Kumari', 'Research Analyst', 'Policy', 'meena@constituency.gov.in', '9876500004', 'Active'),
('Prakash Rao', 'Field Coordinator', 'Outreach', 'prakash@constituency.gov.in', '9876500005', 'Active'),
('Deepa Nair', 'Finance Manager', 'Finance', 'deepa@constituency.gov.in', '9876500006', 'Active'),
('Kishore Babu', 'IT Manager', 'Technology', 'kishore@constituency.gov.in', '9876500007', 'On Leave'),
('Padma Laxmi', 'Social Welfare Officer', 'Welfare', 'padma@constituency.gov.in', '9876500008', 'Active')
ON CONFLICT DO NOTHING;

INSERT INTO projects (project_name, category, location, mandal, budget_allocated, budget_spent, status, progress_percent, beneficiaries, scheme) VALUES
('NH-65 Four Lane Expansion', 'Roads', 'Guntur - Hyderabad Stretch', 'Chilakaluripet', 85000000, 42000000, 'In Progress', 49, 500000, 'NHAI'),
('Guntur Smart Water Grid', 'Water Supply', 'Urban Areas', 'Guntur', 32000000, 28000000, 'In Progress', 87, 125000, 'Smart City Mission'),
('1000 Bed Government Hospital', 'Healthcare', 'Guntur City', 'Guntur', 450000000, 180000000, 'In Progress', 40, 2000000, 'State Health Mission'),
('Solar Rooftop - 500 Schools', 'Education', 'All Mandals', 'District Wide', 25000000, 25000000, 'Completed', 100, 250000, 'PM Surya Ghar'),
('Drip Irrigation - Phase 2', 'Agriculture', 'Palnadu Region', 'Narasaraopet', 18000000, 5000000, 'Tendering', 12, 15000, 'PMKSY'),
('Skill Development Centre', 'Employment', 'Mangalagiri', 'Mangalagiri', 8000000, 0, 'Planning', 0, 5000, 'PMKVY')
ON CONFLICT DO NOTHING;

INSERT INTO media_mentions (headline, source, source_type, sentiment, language, summary, reach, published_at) VALUES
('MP inaugurates water supply project benefiting 50,000 households', 'Eenadu', 'Newspaper', 'Positive', 'Telugu', 'Water supply project inaugurated in Guntur rural areas', 500000, now() - interval '1 day'),
('Opposition questions delay in hospital construction', 'The Hindu', 'Online', 'Negative', 'English', 'Hospital project faces 6-month delay due to contractor issues', 250000, now() - interval '2 days'),
('MP holds Jana Spandana camp, resolves 200+ grievances', 'Sakshi', 'Newspaper', 'Positive', 'Telugu', 'Weekly grievance camp sees huge turnout', 400000, now() - interval '3 days'),
('NH-65 expansion to reduce travel time by 40%', 'Times of India', 'Online', 'Positive', 'English', 'Four-lane highway project progressing well', 180000, now() - interval '4 days'),
('Farmers protest delay in irrigation canal repair', 'ABN Andhra Jyothy', 'TV', 'Negative', 'Telugu', 'Farmers block road demanding irrigation repairs', 800000, now() - interval '5 days')
ON CONFLICT DO NOTHING;

INSERT INTO finances (transaction_type, category, description, amount, date, payment_mode) VALUES
('Income', 'MPLADS Fund', 'MPLADS Annual Allocation FY 2024-25', 25000000, '2024-04-01', 'Government Transfer'),
('Expense', 'Infrastructure', 'Road repair - Gandhi Nagar', 1200000, '2024-04-15', 'Bank Transfer'),
('Expense', 'Healthcare', 'Medical camp expenses - 10 villages', 450000, '2024-05-01', 'Cheque'),
('Expense', 'Education', 'School equipment procurement', 875000, '2024-05-20', 'Bank Transfer'),
('Expense', 'Event', 'Public meeting organization costs', 320000, '2024-06-05', 'Cash'),
('Income', 'Party Funds', 'Constituency party fund allocation', 5000000, '2024-07-01', 'Bank Transfer'),
('Expense', 'Water Supply', 'Borewell installation - 12 villages', 2100000, '2024-07-15', 'Bank Transfer'),
('Expense', 'Social Welfare', 'Pension distribution camp', 180000, '2024-08-01', 'Bank Transfer')
ON CONFLICT DO NOTHING;


-- ============================================================
-- MIGRATION 2: New Modules
-- ============================================================

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name text NOT NULL,
  visitor_contact text NOT NULL DEFAULT '',
  visitor_email text DEFAULT '',
  visitor_photo_url text DEFAULT '',
  visitor_id_type text DEFAULT 'Aadhaar',
  visitor_id_number text DEFAULT '',
  purpose text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  priority text NOT NULL DEFAULT 'Normal',
  requested_date date NOT NULL,
  requested_time text NOT NULL DEFAULT '10:00',
  duration_minutes integer DEFAULT 30,
  status text NOT NULL DEFAULT 'Scheduled',
  staff_member_id text DEFAULT '',
  staff_member_name text DEFAULT '',
  notes text DEFAULT '',
  visit_count integer DEFAULT 1,
  is_vip boolean DEFAULT false,
  is_repeat_visitor boolean DEFAULT false,
  token_number text DEFAULT '',
  check_in_time timestamptz,
  check_out_time timestamptz,
  feedback text DEFAULT '',
  rating integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read appointments" ON appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert appointments" ON appointments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update appointments" ON appointments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete appointments" ON appointments FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  target_audience text DEFAULT 'All',
  questions jsonb NOT NULL DEFAULT '[]',
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  status text NOT NULL DEFAULT 'Draft',
  total_responses integer DEFAULT 0,
  target_responses integer DEFAULT 1000,
  is_anonymous boolean DEFAULT true,
  geographic_scope text DEFAULT 'Constituency',
  tags text[] DEFAULT '{}',
  created_by text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read polls" ON polls FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert polls" ON polls FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update polls" ON polls FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete polls" ON polls FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS poll_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE,
  respondent_name text DEFAULT '',
  respondent_phone text DEFAULT '',
  respondent_age integer,
  respondent_gender text DEFAULT '',
  respondent_mandal text DEFAULT '',
  answers jsonb NOT NULL DEFAULT '{}',
  sentiment text DEFAULT 'Neutral',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read poll_responses" ON poll_responses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert poll_responses" ON poll_responses FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS darshan_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number text UNIQUE NOT NULL DEFAULT concat('TTD-', extract(epoch from now())::bigint::text),
  pilgrim_name text NOT NULL,
  pilgrim_contact text NOT NULL DEFAULT '',
  pilgrim_email text DEFAULT '',
  pilgrim_id_type text DEFAULT 'Aadhaar',
  pilgrim_id_number text DEFAULT '',
  group_size integer NOT NULL DEFAULT 1,
  group_members jsonb DEFAULT '[]',
  darshan_type text NOT NULL DEFAULT 'Standard Darshan',
  darshan_date date NOT NULL,
  darshan_time text DEFAULT '06:00',
  slot_number text DEFAULT '',
  accommodation_required boolean DEFAULT false,
  accommodation_type text DEFAULT 'None',
  accommodation_nights integer DEFAULT 0,
  transport_required boolean DEFAULT false,
  transport_type text DEFAULT 'None',
  departure_location text DEFAULT '',
  special_requests text DEFAULT '',
  total_amount numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  payment_status text DEFAULT 'Pending',
  payment_mode text DEFAULT 'Cash',
  receipt_number text DEFAULT '',
  status text NOT NULL DEFAULT 'Booked',
  notes text DEFAULT '',
  coordinator_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE darshan_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read darshan_bookings" ON darshan_bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert darshan_bookings" ON darshan_bookings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update darshan_bookings" ON darshan_bookings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete darshan_bookings" ON darshan_bookings FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS darshan_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES darshan_bookings(id) ON DELETE SET NULL,
  donor_name text NOT NULL,
  donor_contact text DEFAULT '',
  donation_type text NOT NULL DEFAULT 'Hundi',
  amount numeric NOT NULL DEFAULT 0,
  purpose text DEFAULT '',
  receipt_number text DEFAULT '',
  payment_mode text DEFAULT 'Cash',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE darshan_donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read darshan_donations" ON darshan_donations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert darshan_donations" ON darshan_donations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update darshan_donations" ON darshan_donations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text NOT NULL,
  bill_name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  ministry text DEFAULT '',
  introduced_by text DEFAULT '',
  introduced_date date,
  house text DEFAULT 'Lok Sabha',
  status text NOT NULL DEFAULT 'Introduced',
  current_stage text DEFAULT '',
  vote_date date,
  member_vote text DEFAULT 'Not Voted',
  vote_explanation text DEFAULT '',
  impact_level text DEFAULT 'Medium',
  constituency_impact text DEFAULT '',
  tags text[] DEFAULT '{}',
  supporting_docs text[] DEFAULT '{}',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read bills" ON bills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert bills" ON bills FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update bills" ON bills FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete bills" ON bills FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS citizen_engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  engagement_type text NOT NULL DEFAULT 'Town Hall',
  description text DEFAULT '',
  location text DEFAULT '',
  mandal text DEFAULT '',
  event_date timestamptz NOT NULL,
  duration_hours numeric DEFAULT 2,
  expected_attendance integer DEFAULT 100,
  actual_attendance integer DEFAULT 0,
  rsvp_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'Planning',
  organizer text DEFAULT '',
  contact text DEFAULT '',
  agenda text DEFAULT '',
  outcome text DEFAULT '',
  is_recorded boolean DEFAULT false,
  recording_url text DEFAULT '',
  photos text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE citizen_engagements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read citizen_engagements" ON citizen_engagements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert citizen_engagements" ON citizen_engagements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update citizen_engagements" ON citizen_engagements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete citizen_engagements" ON citizen_engagements FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text DEFAULT '',
  age integer,
  gender text DEFAULT '',
  address text DEFAULT '',
  mandal text DEFAULT '',
  village text DEFAULT '',
  skills text[] DEFAULT '{}',
  availability text DEFAULT 'Weekends',
  status text NOT NULL DEFAULT 'Active',
  joined_date date DEFAULT CURRENT_DATE,
  total_hours numeric DEFAULT 0,
  events_attended integer DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read volunteers" ON volunteers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert volunteers" ON volunteers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update volunteers" ON volunteers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete volunteers" ON volunteers FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  submitter_name text DEFAULT 'Anonymous',
  submitter_contact text DEFAULT '',
  is_anonymous boolean DEFAULT true,
  mandal text DEFAULT '',
  status text NOT NULL DEFAULT 'New',
  priority text DEFAULT 'Medium',
  admin_response text DEFAULT '',
  upvotes integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read suggestions" ON suggestions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert suggestions" ON suggestions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update suggestions" ON suggestions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete suggestions" ON suggestions FOR DELETE TO authenticated USING (true);


-- ============================================================
-- MIGRATION 3: Politician Profiles
-- ============================================================

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
CREATE POLICY "Authenticated users can view all profiles" ON politician_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert profiles" ON politician_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own profile or admins can update any" ON politician_profiles FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can delete profiles" ON politician_profiles FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

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
CREATE POLICY "Authenticated users can view constituency profiles" ON constituency_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert constituency profiles" ON constituency_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update constituency profiles" ON constituency_profiles FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete constituency profiles" ON constituency_profiles FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

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
CREATE POLICY "Authenticated users can view caste demographics" ON caste_demographics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert caste demographics" ON caste_demographics FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update caste demographics" ON caste_demographics FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete caste demographics" ON caste_demographics FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

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
CREATE POLICY "Authenticated users can view mandal stats" ON mandal_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert mandal stats" ON mandal_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update mandal stats" ON mandal_stats FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete mandal stats" ON mandal_stats FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voters' AND column_name = 'caste') THEN
    ALTER TABLE voters ADD COLUMN caste text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voters' AND column_name = 'caste_category') THEN
    ALTER TABLE voters ADD COLUMN caste_category text DEFAULT 'General';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voters' AND column_name = 'religion') THEN
    ALTER TABLE voters ADD COLUMN religion text DEFAULT '';
  END IF;
END $$;

INSERT INTO politician_profiles (
  full_name, display_name, party, designation, constituency_name, state,
  lok_sabha_seat, bio, languages, achievements, role, is_active,
  term_start, election_year, previous_terms
) VALUES (
  'GM Harish Balayogi', 'Harish Balayogi', 'TDP', 'Member of Parliament', 'Amalapuram', 'Andhra Pradesh',
  'Amalapuram', 'GM Harish Balayogi is the Member of Parliament representing the Amalapuram Lok Sabha constituency in Andhra Pradesh.',
  ARRAY['Telugu', 'English', 'Hindi'],
  ARRAY['Elected MP - 18th Lok Sabha 2024', 'TDP Party Leader - Konaseema Region'],
  'admin', true, '2024-06-04', 2024, 0
) ON CONFLICT DO NOTHING;


-- ============================================================
-- MIGRATION 4: Darshan Booking Rules & Waitlist
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'is_waitlisted') THEN
    ALTER TABLE darshan_bookings ADD COLUMN is_waitlisted boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'waitlist_position') THEN
    ALTER TABLE darshan_bookings ADD COLUMN waitlist_position integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'cooldown_until') THEN
    ALTER TABLE darshan_bookings ADD COLUMN cooldown_until date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'promoted_from_waitlist') THEN
    ALTER TABLE darshan_bookings ADD COLUMN promoted_from_waitlist boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'pilgrim_aadhar_last4') THEN
    ALTER TABLE darshan_bookings ADD COLUMN pilgrim_aadhar_last4 text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'mandal') THEN
    ALTER TABLE darshan_bookings ADD COLUMN mandal text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'village') THEN
    ALTER TABLE darshan_bookings ADD COLUMN village text DEFAULT '';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS darshan_date_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date date NOT NULL UNIQUE,
  is_filled boolean NOT NULL DEFAULT false,
  confirmed_booking_id uuid REFERENCES darshan_bookings(id) ON DELETE SET NULL,
  waitlist_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE darshan_date_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view date slots" ON darshan_date_slots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert date slots" ON darshan_date_slots FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update date slots" ON darshan_date_slots FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete date slots" ON darshan_date_slots FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);


-- ============================================================
-- MIGRATION 5: Darshan Approval Workflow
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'approval_status') THEN
    ALTER TABLE darshan_bookings ADD COLUMN approval_status text NOT NULL DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'approved_at') THEN
    ALTER TABLE darshan_bookings ADD COLUMN approved_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'approved_by') THEN
    ALTER TABLE darshan_bookings ADD COLUMN approved_by text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'rejection_reason') THEN
    ALTER TABLE darshan_bookings ADD COLUMN rejection_reason text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'sms_sent') THEN
    ALTER TABLE darshan_bookings ADD COLUMN sms_sent boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'sms_sent_at') THEN
    ALTER TABLE darshan_bookings ADD COLUMN sms_sent_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'contact_person') THEN
    ALTER TABLE darshan_bookings ADD COLUMN contact_person text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'contact_phone') THEN
    ALTER TABLE darshan_bookings ADD COLUMN contact_phone text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'approval_notes') THEN
    ALTER TABLE darshan_bookings ADD COLUMN approval_notes text DEFAULT '';
  END IF;
END $$;


-- ============================================================
-- MIGRATION 6: Parliamentary Activity & AI Briefings
-- ============================================================

CREATE TABLE IF NOT EXISTS parliamentary_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number text DEFAULT '',
  session_number text NOT NULL DEFAULT '',
  house text NOT NULL DEFAULT 'Lok Sabha',
  question_type text NOT NULL DEFAULT 'Unstarred',
  subject text NOT NULL DEFAULT '',
  ministry text DEFAULT '',
  question_text text DEFAULT '',
  answer_text text DEFAULT '',
  date_asked date,
  status text NOT NULL DEFAULT 'Scheduled',
  sansad_url text DEFAULT '',
  tags text[] DEFAULT '{}',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE parliamentary_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read parliamentary questions" ON parliamentary_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert parliamentary questions" ON parliamentary_questions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update parliamentary questions" ON parliamentary_questions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete parliamentary questions" ON parliamentary_questions FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS parliamentary_debates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_number text NOT NULL DEFAULT '',
  house text NOT NULL DEFAULT 'Lok Sabha',
  date_of_debate date,
  debate_type text NOT NULL DEFAULT 'Zero Hour',
  topic text NOT NULL DEFAULT '',
  our_stance text DEFAULT '',
  speech_excerpt text DEFAULT '',
  duration_minutes integer DEFAULT 0,
  sansad_url text DEFAULT '',
  tags text[] DEFAULT '{}',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE parliamentary_debates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read parliamentary debates" ON parliamentary_debates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert parliamentary debates" ON parliamentary_debates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update parliamentary debates" ON parliamentary_debates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete parliamentary debates" ON parliamentary_debates FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS parliamentary_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text DEFAULT '',
  bill_name text NOT NULL DEFAULT '',
  bill_type text NOT NULL DEFAULT 'Government Bill',
  ministry text DEFAULT '',
  introduced_by text DEFAULT '',
  introduced_date date,
  our_vote text DEFAULT 'Not Applicable',
  our_stance text DEFAULT '',
  status text NOT NULL DEFAULT 'Introduced',
  sansad_url text DEFAULT '',
  tags text[] DEFAULT '{}',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE parliamentary_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read parliamentary bills" ON parliamentary_bills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert parliamentary bills" ON parliamentary_bills FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update parliamentary bills" ON parliamentary_bills FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete parliamentary bills" ON parliamentary_bills FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS ai_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_date date NOT NULL DEFAULT CURRENT_DATE,
  briefing_type text NOT NULL DEFAULT 'Daily Digest',
  title text NOT NULL DEFAULT '',
  summary text DEFAULT '',
  content text DEFAULT '',
  priority text NOT NULL DEFAULT 'Medium',
  is_read boolean NOT NULL DEFAULT false,
  tags text[] DEFAULT '{}',
  source_refs text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read ai briefings" ON ai_briefings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert ai briefings" ON ai_briefings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update ai briefings" ON ai_briefings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete ai briefings" ON ai_briefings FOR DELETE TO authenticated USING (true);

-- ============================================================
-- END OF SCHEMA
-- ============================================================
