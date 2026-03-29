
/*
  # NETHRA Political Intelligence Suite - Database Schema

  ## Overview
  Comprehensive schema for Indian MP/MLA political management platform.

  ## Tables Created

  ### Core Tables
  1. `constituencies` - Constituency details and stats
  2. `grievances` - Citizen grievances and complaints
  3. `events` - Political events and appointments
  4. `team_members` - Staff and team management
  5. `voters` - Voter database records
  6. `projects` - Development projects tracking
  7. `media_mentions` - Media monitoring entries
  8. `finances` - Budget and finance records
  9. `documents` - Document management
  10. `communications` - Communication logs

  ## Security
  - RLS enabled on all tables
  - Public read/write for demo purposes (no auth required for this app)
*/

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

-- Insert sample constituency data
INSERT INTO constituencies (name, state, total_voters, registered_voters, area_sqkm, population, mandals, villages, mp_name, party)
VALUES ('Guntur', 'Andhra Pradesh', 1850000, 1620000, 1542, 2789000, 57, 684, 'Dr. Nandamuri Balakrishna', 'TDP')
ON CONFLICT DO NOTHING;

-- Insert sample grievances
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

-- Insert sample events
INSERT INTO events (title, event_type, location, start_date, status, attendees, organizer) VALUES
('Jana Spandana - Grievance Day', 'Public Hearing', 'Collectorate, Guntur', now() + interval '2 days', 'Upcoming', 500, 'Constituency Office'),
('Foundation Stone - NH-65 Flyover', 'Inauguration', 'Chilakaluripet, Guntur', now() + interval '5 days', 'Upcoming', 2000, 'NHAI & State Govt'),
('TDP Party Workers Meet', 'Party Event', 'Party Office, Guntur', now() + interval '7 days', 'Upcoming', 300, 'TDP District Committee'),
('Budget Review Meeting', 'Meeting', 'MP Office, New Delhi', now() - interval '3 days', 'Completed', 25, 'PMO'),
('Cyclone Relief Distribution', 'Official Visit', 'Flood Affected Villages', now() - interval '10 days', 'Completed', 5000, 'District Administration')
ON CONFLICT DO NOTHING;

-- Insert sample team members
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

-- Insert sample projects
INSERT INTO projects (project_name, category, location, mandal, budget_allocated, budget_spent, status, progress_percent, beneficiaries, scheme) VALUES
('NH-65 Four Lane Expansion', 'Roads', 'Guntur - Hyderabad Stretch', 'Chilakaluripet', 85000000, 42000000, 'In Progress', 49, 500000, 'NHAI'),
('Guntur Smart Water Grid', 'Water Supply', 'Urban Areas', 'Guntur', 32000000, 28000000, 'In Progress', 87, 125000, 'Smart City Mission'),
('1000 Bed Government Hospital', 'Healthcare', 'Guntur City', 'Guntur', 450000000, 180000000, 'In Progress', 40, 2000000, 'State Health Mission'),
('Solar Rooftop - 500 Schools', 'Education', 'All Mandals', 'District Wide', 25000000, 25000000, 'Completed', 100, 250000, 'PM Surya Ghar'),
('Drip Irrigation - Phase 2', 'Agriculture', 'Palnadu Region', 'Narasaraopet', 18000000, 5000000, 'Tendering', 12, 15000, 'PMKSY'),
('Skill Development Centre', 'Employment', 'Mangalagiri', 'Mangalagiri', 8000000, 0, 'Planning', 0, 5000, 'PMKVY')
ON CONFLICT DO NOTHING;

-- Insert sample media mentions
INSERT INTO media_mentions (headline, source, source_type, sentiment, language, summary, reach, published_at) VALUES
('MP inaugurates water supply project benefiting 50,000 households', 'Eenadu', 'Newspaper', 'Positive', 'Telugu', 'Water supply project inaugurated in Guntur rural areas', 500000, now() - interval '1 day'),
('Opposition questions delay in hospital construction', 'The Hindu', 'Online', 'Negative', 'English', 'Hospital project faces 6-month delay due to contractor issues', 250000, now() - interval '2 days'),
('MP holds Jana Spandana camp, resolves 200+ grievances', 'Sakshi', 'Newspaper', 'Positive', 'Telugu', 'Weekly grievance camp sees huge turnout', 400000, now() - interval '3 days'),
('NH-65 expansion to reduce travel time by 40%', 'Times of India', 'Online', 'Positive', 'English', 'Four-lane highway project progressing well', 180000, now() - interval '4 days'),
('Farmers protest delay in irrigation canal repair', 'ABN Andhra Jyothy', 'TV', 'Negative', 'Telugu', 'Farmers block road demanding irrigation repairs', 800000, now() - interval '5 days')
ON CONFLICT DO NOTHING;

-- Insert sample finances
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
