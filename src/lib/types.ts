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
