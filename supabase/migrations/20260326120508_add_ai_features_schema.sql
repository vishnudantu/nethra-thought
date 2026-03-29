/*
  # AI Features Schema

  ## New Tables

  ### 1. `ai_conversations`
  Stores AI chat conversations per politician.
  - `id` - primary key
  - `politician_id` - FK to politician_profiles
  - `title` - conversation title (auto-generated from first message)
  - `created_at` / `updated_at`

  ### 2. `ai_messages`
  Individual messages within AI conversations.
  - `id` - primary key
  - `conversation_id` - FK to ai_conversations
  - `role` - 'user' or 'assistant'
  - `content` - message text
  - `created_at`

  ### 3. `ai_generated_content`
  Stores AI-generated drafts (speeches, briefings, replies).
  - `id` - primary key
  - `politician_id` - FK
  - `content_type` - 'speech', 'briefing', 'grievance_reply', 'social_post', 'press_release'
  - `prompt` - what was asked
  - `content` - generated text
  - `is_saved` - whether user kept it
  - `created_at`

  ## Security
  - RLS on all tables using role-based access
*/

CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id uuid REFERENCES politician_profiles(id) ON DELETE CASCADE,
  title text DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS ai_generated_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id uuid REFERENCES politician_profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('speech', 'briefing', 'grievance_reply', 'social_post', 'press_release', 'talking_points', 'analysis')),
  prompt text NOT NULL,
  content text NOT NULL,
  is_saved boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations
CREATE POLICY "Users can view their AI conversations"
  ON ai_conversations FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'super_admin'
    OR get_user_politician_id() = politician_id
  );

CREATE POLICY "Users can insert AI conversations"
  ON ai_conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() = 'super_admin'
    OR get_user_politician_id() = politician_id
  );

CREATE POLICY "Users can update their AI conversations"
  ON ai_conversations FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'super_admin'
    OR get_user_politician_id() = politician_id
  )
  WITH CHECK (
    get_user_role() = 'super_admin'
    OR get_user_politician_id() = politician_id
  );

CREATE POLICY "Users can delete their AI conversations"
  ON ai_conversations FOR DELETE
  TO authenticated
  USING (
    get_user_role() = 'super_admin'
    OR get_user_politician_id() = politician_id
  );

-- RLS Policies for ai_messages
CREATE POLICY "Users can view their AI messages"
  ON ai_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations c
      WHERE c.id = ai_messages.conversation_id
      AND (get_user_role() = 'super_admin' OR get_user_politician_id() = c.politician_id)
    )
  );

CREATE POLICY "Users can insert AI messages"
  ON ai_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations c
      WHERE c.id = ai_messages.conversation_id
      AND (get_user_role() = 'super_admin' OR get_user_politician_id() = c.politician_id)
    )
  );

-- RLS Policies for ai_generated_content
CREATE POLICY "Users can view their generated content"
  ON ai_generated_content FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'super_admin'
    OR get_user_politician_id() = politician_id
  );

CREATE POLICY "Users can insert generated content"
  ON ai_generated_content FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() = 'super_admin'
    OR get_user_politician_id() = politician_id
  );

CREATE POLICY "Users can update their generated content"
  ON ai_generated_content FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'super_admin'
    OR get_user_politician_id() = politician_id
  )
  WITH CHECK (
    get_user_role() = 'super_admin'
    OR get_user_politician_id() = politician_id
  );

CREATE POLICY "Users can delete their generated content"
  ON ai_generated_content FOR DELETE
  TO authenticated
  USING (
    get_user_role() = 'super_admin'
    OR get_user_politician_id() = politician_id
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_politician ON ai_conversations(politician_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_politician ON ai_generated_content(politician_id);
