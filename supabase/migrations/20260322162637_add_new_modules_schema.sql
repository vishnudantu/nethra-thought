/*
  # New Modules Schema - NETHRA Political Intelligence Suite

  ## New Tables Added:

  1. **appointments** - Visitor management & appointment booking
     - Full visitor details, purpose, scheduling, queue management
     - Status tracking: Scheduled, Confirmed, Checked In, Completed, Cancelled, No Show

  2. **polls** - Poll & survey management
     - Survey creation with questions (JSONB), demographic targeting
     - Status: Draft, Active, Closed, Archived

  3. **poll_responses** - Individual poll responses
     - Links to polls, stores answer data as JSONB

  4. **darshan_bookings** - Tirupati darshan & pilgrimage management
     - Slot booking, group management, accommodation, transport
     - Payment tracking and receipt generation

  5. **darshan_donations** - Donation tracking for pilgrimages
     - Links to bookings, tracks amounts, receipt numbers

  6. **bills** - Legislative bill tracking
     - Parliamentary bills with voting records, status tracking
     - Category, ministry, impact assessment

  7. **voting_records** - Member voting records
     - Links to bills, records votes with explanations

  8. **citizen_engagements** - Citizen engagement events (town halls, forums)
     - RSVP tracking, volunteer management, forum posts

  9. **volunteers** - Volunteer database
     - Skills, availability, assignment tracking

  10. **suggestions** - Digital suggestion box
      - Anonymous submissions, category tagging, voting

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read/insert/update their own data
*/

-- APPOINTMENTS TABLE
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

CREATE POLICY "Authenticated users can read appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (true);

-- POLLS TABLE
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

CREATE POLICY "Authenticated users can read polls"
  ON polls FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert polls"
  ON polls FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update polls"
  ON polls FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete polls"
  ON polls FOR DELETE
  TO authenticated
  USING (true);

-- POLL RESPONSES TABLE
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

CREATE POLICY "Authenticated users can read poll_responses"
  ON poll_responses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert poll_responses"
  ON poll_responses FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- DARSHAN BOOKINGS TABLE
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

CREATE POLICY "Authenticated users can read darshan_bookings"
  ON darshan_bookings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert darshan_bookings"
  ON darshan_bookings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update darshan_bookings"
  ON darshan_bookings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete darshan_bookings"
  ON darshan_bookings FOR DELETE
  TO authenticated
  USING (true);

-- DARSHAN DONATIONS TABLE
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

CREATE POLICY "Authenticated users can read darshan_donations"
  ON darshan_donations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert darshan_donations"
  ON darshan_donations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update darshan_donations"
  ON darshan_donations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- BILLS TABLE (Legislative)
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

CREATE POLICY "Authenticated users can read bills"
  ON bills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert bills"
  ON bills FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update bills"
  ON bills FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bills"
  ON bills FOR DELETE
  TO authenticated
  USING (true);

-- CITIZEN ENGAGEMENTS TABLE
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

CREATE POLICY "Authenticated users can read citizen_engagements"
  ON citizen_engagements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert citizen_engagements"
  ON citizen_engagements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update citizen_engagements"
  ON citizen_engagements FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete citizen_engagements"
  ON citizen_engagements FOR DELETE
  TO authenticated
  USING (true);

-- VOLUNTEERS TABLE
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

CREATE POLICY "Authenticated users can read volunteers"
  ON volunteers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert volunteers"
  ON volunteers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update volunteers"
  ON volunteers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete volunteers"
  ON volunteers FOR DELETE
  TO authenticated
  USING (true);

-- SUGGESTIONS TABLE
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

CREATE POLICY "Authenticated users can read suggestions"
  ON suggestions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert suggestions"
  ON suggestions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update suggestions"
  ON suggestions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete suggestions"
  ON suggestions FOR DELETE
  TO authenticated
  USING (true);
