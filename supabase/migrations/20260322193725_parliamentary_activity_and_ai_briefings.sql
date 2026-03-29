/*
  # Parliamentary Activity & AI Briefings Schema

  ## Summary
  Adds two new power modules to the Nethra Political Intelligence Suite:

  1. **Parliamentary Activity** — Tracks all parliamentary work: questions raised in Lok Sabha / Rajya Sabha
     (starred, unstarred, short notice), debates participated in, bills supported/opposed, private member bills,
     and voting records. Data can be manually entered by staff or synced from Sansad.in.

  2. **AI Daily Briefings** — Stores AI-generated daily political briefings: news digests, speech drafts,
     talking points, constituency risk alerts, opposition trackers, and sentiment summaries.

  ## New Tables

  ### `parliamentary_questions`
  - `id` — UUID primary key
  - `question_number` — Official question number from Sansad
  - `session_number` — Parliament session (e.g., "Budget Session 2024")
  - `house` — 'Lok Sabha' | 'Rajya Sabha'
  - `question_type` — 'Starred' | 'Unstarred' | 'Short Notice' | 'Private Member'
  - `subject` — Subject/title of question
  - `ministry` — Ministry to which question is addressed
  - `question_text` — Full text of the question
  - `answer_text` — Ministry's answer (if available)
  - `date_asked` — Date question was asked/listed
  - `status` — 'Scheduled' | 'Asked' | 'Answered' | 'Lapsed'
  - `sansad_url` — Direct URL to Sansad.in page
  - `tags` — Array of topic tags
  - `notes` — Internal notes
  - `created_at`, `updated_at`

  ### `parliamentary_debates`
  - `id` — UUID primary key
  - `session_number`, `house`, `date_of_debate`
  - `debate_type` — 'Zero Hour' | 'Question Hour' | 'Calling Attention' | 'Adjournment Motion' | 'Budget Discussion' | 'Bill Discussion' | 'Special Mention'
  - `topic` — Topic of debate
  - `our_stance` — Politician's stance / summary of participation
  - `speech_excerpt` — Key excerpt from speech
  - `duration_minutes` — Time spoken
  - `sansad_url`
  - `tags`, `notes`
  - `created_at`

  ### `parliamentary_bills`
  - `id` — UUID primary key
  - `bill_number`, `bill_name`, `bill_type` — 'Government Bill' | 'Private Member Bill' | 'Amendment'
  - `ministry`, `introduced_by`, `introduced_date`
  - `our_vote` — 'Aye' | 'Noe' | 'Abstain' | 'Absent' | 'Not Applicable'
  - `our_stance` — Text summary of our position
  - `status` — 'Introduced' | 'Committee' | 'Passed' | 'Rejected' | 'Lapsed' | 'Withdrawn'
  - `sansad_url`, `tags`, `notes`
  - `created_at`

  ### `ai_briefings`
  - `id` — UUID primary key
  - `briefing_date` — Date the briefing covers
  - `briefing_type` — 'Daily Digest' | 'Speech Draft' | 'Talking Points' | 'Risk Alert' | 'Opportunity Alert' | 'Opposition Tracker' | 'Constituency Pulse'
  - `title`, `summary`, `content` — Full briefing content
  - `priority` — 'Low' | 'Medium' | 'High' | 'Critical'
  - `is_read` — boolean
  - `tags`, `source_refs` — References used to generate
  - `created_at`

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read and write all records (single-user political office system)
*/

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

CREATE POLICY "Authenticated users can read parliamentary questions"
  ON parliamentary_questions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert parliamentary questions"
  ON parliamentary_questions FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update parliamentary questions"
  ON parliamentary_questions FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete parliamentary questions"
  ON parliamentary_questions FOR DELETE TO authenticated
  USING (true);

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

CREATE POLICY "Authenticated users can read parliamentary debates"
  ON parliamentary_debates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert parliamentary debates"
  ON parliamentary_debates FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update parliamentary debates"
  ON parliamentary_debates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete parliamentary debates"
  ON parliamentary_debates FOR DELETE TO authenticated USING (true);

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

CREATE POLICY "Authenticated users can read parliamentary bills"
  ON parliamentary_bills FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert parliamentary bills"
  ON parliamentary_bills FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update parliamentary bills"
  ON parliamentary_bills FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete parliamentary bills"
  ON parliamentary_bills FOR DELETE TO authenticated USING (true);

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

CREATE POLICY "Authenticated users can read ai briefings"
  ON ai_briefings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert ai briefings"
  ON ai_briefings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update ai briefings"
  ON ai_briefings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete ai briefings"
  ON ai_briefings FOR DELETE TO authenticated USING (true);
