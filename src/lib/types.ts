export interface Grievance {
  id: string;
  ticket_number: string;
  petitioner_name: string;
  contact: string;
  category: string;
  subject: string;
  description: string;
  location: string;
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Escalated' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assigned_to: string;
  resolution_notes: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  location: string;
  start_date: string;
  end_date: string | null;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
  attendees: number;
  organizer: string;
  notes: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  joining_date: string;
  avatar_url: string;
  skills: string[];
  notes: string;
  created_at: string;
}

export interface Project {
  id: string;
  project_name: string;
  description: string;
  category: string;
  location: string;
  mandal: string;
  budget_allocated: number;
  budget_spent: number;
  contractor: string;
  start_date: string;
  expected_completion: string;
  actual_completion: string | null;
  status: 'Planning' | 'Tendering' | 'In Progress' | 'Stalled' | 'Completed' | 'Cancelled';
  progress_percent: number;
  beneficiaries: number;
  scheme: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface MediaMention {
  id: string;
  headline: string;
  source: string;
  source_type: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  language: string;
  url: string;
  published_at: string;
  summary: string;
  tags: string[];
  is_read: boolean;
  reach: number;
  created_at: string;
}

export interface Finance {
  id: string;
  transaction_type: 'Income' | 'Expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  payment_mode: string;
  reference_number: string;
  project_id: string | null;
  status: 'Pending' | 'Completed' | 'Cancelled';
  notes: string;
  created_at: string;
}

export interface Communication {
  id: string;
  subject: string;
  message: string;
  comm_type: string;
  recipient_group: string;
  recipient_count: number;
  status: 'Draft' | 'Scheduled' | 'Sent' | 'Failed';
  scheduled_at: string | null;
  sent_at: string | null;
  open_rate: number;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  doc_type: string;
  category: string;
  file_name: string;
  file_size: string;
  description: string;
  tags: string[];
  is_confidential: boolean;
  uploaded_by: string;
  created_at: string;
}

export interface Voter {
  id: string;
  voter_id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  mandal: string;
  village: string;
  booth_number: string;
  party_affiliation: string;
  support_level: number;
  is_active: boolean;
  tags: string[];
  notes: string;
  created_at: string;
}

export interface Constituency {
  id: string;
  name: string;
  state: string;
  total_voters: number;
  registered_voters: number;
  area_sqkm: number;
  population: number;
  mandals: number;
  villages: number;
  mp_name: string;
  party: string;
  created_at: string;
}

export interface SentimentScore {
  id: string;
  score_date: string;
  overall_score: number;
  news_score: number;
  social_score: number;
  whatsapp_score: number;
  grievance_score: number;
  ground_score: number;
  channel_breakdown: Record<string, number> | null;
  issue_breakdown: Record<string, number> | null;
  created_at: string;
}

export interface OppositionIntel {
  id: string;
  opponent_name: string;
  opponent_party: string;
  opponent_constituency: string;
  activity_type: string;
  description: string;
  source: string;
  detected_at: string;
  sentiment_toward_us: string;
  threat_level: number;
  ai_analysis: string;
  created_at: string;
}

export interface VoiceReport {
  id: string;
  reporter_name: string;
  reporter_role: string;
  transcript: string;
  classification: string;
  language: string;
  location: string;
  gps_lat: number | null;
  gps_lng: number | null;
  attachments: string[] | null;
  created_at: string;
}

export interface FeatureModule {
  id: string;
  module_key: string;
  label: string;
  category: string;
  description: string;
  is_active: number;
  is_future: number;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlag {
  id: string;
  feature_key: string;
  module_key: string;
  label: string;
  description: string;
  is_active: number;
  is_future: number;
  created_at: string;
  updated_at: string;
}

export interface ModuleAccess {
  id: string;
  politician_id?: string;
  role?: string;
  module_key: string;
  is_enabled: number;
  updated_at: string;
}

export interface FeatureAccess {
  id: string;
  politician_id?: string;
  role?: string;
  feature_key: string;
  is_enabled: number;
  updated_at: string;
}

export interface AdminReport {
  id: string;
  politician_id: string | null;
  report_type: string;
  title: string;
  summary: string;
  content: string;
  created_by: string | null;
  created_at: string;
}

export interface PromiseItem {
  id: string;
  promise_text: string;
  made_at: string | null;
  location: string;
  category: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  linked_project_id: string | null;
  deadline: string | null;
  completion_date: string | null;
  notes: string;
  source: string;
  created_at: string;
}

export interface AiGeneratedContent {
  id: string;
  content_type: string;
  prompt: string;
  content: string;
  is_saved: number;
  tags: string[] | null;
  created_at: string;
}

export interface ContentCalendarItem {
  id: string;
  content_id: string | null;
  scheduled_date: string | null;
  platform: string;
  status: string;
  notes: string;
  created_at: string;
}

export interface WhatsappIntel {
  id: string;
  received_at: string;
  sender_phone: string;
  message_type: string;
  content: string;
  transcription: string;
  classification: string;
  sentiment: string;
  urgency_score: number;
  is_viral: number;
  viral_count: number;
  is_misinformation: number;
  routed_to: string;
  action_taken: string;
  processed_at: string | null;
  created_at: string;
}

export interface VisitPlan {
  id: string;
  mandal: string;
  village: string;
  priority: number;
  reasoning: string;
  recommended_date: string | null;
  status: string;
  last_visit_date: string | null;
  notes: string;
  created_at: string;
}

export interface Booth {
  id: string;
  booth_number: string;
  booth_name: string;
  location: string;
  mandal: string;
  total_voters: number;
  expected_turnout: number;
  agent_name: string;
  historical_vote_percentage: Record<string, number> | null;
  coordinates: { lat: number; lng: number } | null;
  created_at: string;
}

export interface PredictiveAlert {
  id: string;
  alert_type: string;
  probability: number;
  description: string;
  recommended_action: string;
  timeframe_days: number;
  status: string;
  created_at: string;
}

export interface AgentTask {
  id: string;
  agent_type: string;
  task_type: string;
  description: string;
  status: string;
  result: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
}

export interface DeepfakeIncident {
  id: string;
  platform: string;
  content_url: string;
  detected_at: string;
  confidence: number;
  status: string;
  response_plan: string;
  notes: string;
  created_at: string;
}

export interface Relationship {
  id: string;
  entity_name: string;
  entity_type: string;
  relationship_type: string;
  influence_score: number;
  alignment: string;
  last_contact_at: string | null;
  notes: string;
  created_at: string;
}

export interface EconomicIndicator {
  id: string;
  indicator_type: string;
  mandal: string;
  value: number;
  unit: string;
  recorded_date: string | null;
  trend: string;
  source: string;
  notes: string;
  created_at: string;
}

export interface CitizenServiceRequest {
  id: string;
  requester_name: string;
  request_type: string;
  status: string;
  description: string;
  source: string;
  created_at: string;
}

export interface ElectionUpdate {
  id: string;
  booth_id: string | null;
  update_type: string;
  description: string;
  reported_at: string;
  status: string;
  created_at: string;
}

export interface FinanceComplianceReport {
  id: string;
  report_type: string;
  summary: string;
  status: string;
  alerts: string[] | null;
  created_at: string;
}

export interface PartyIntegration {
  id: string;
  party_name: string;
  integration_type: string;
  status: string;
  last_sync_at: string | null;
  notes: string;
  created_at: string;
}

export interface DigitalTwinRun {
  id: string;
  scenario_name: string;
  input_summary: string;
  output_summary: string;
  status: string;
  created_at: string;
}
