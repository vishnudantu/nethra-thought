import { getApiKey } from './secretStore.js';
import pool from '../db.js';

function classifyTranscript(text) {
  const t = text.toLowerCase();
  if (t.includes('grievance') || t.includes('complaint') || t.includes('water') || t.includes('road')) return 'Grievance';
  if (t.includes('project') || t.includes('progress') || t.includes('site')) return 'Project Update';
  if (t.includes('media') || t.includes('press') || t.includes('coverage')) return 'Media Report';
  if (t.includes('opposition') || t.includes('attack')) return 'Field Intelligence';
  return 'General';
}

export async function transcribeAudio({ audioBase64, filename, mimeType = 'audio/webm' }) {
  const apiKey = await getApiKey('OPENAI_API_KEY');
  if (!apiKey) return null;
  const buffer = Buffer.from(audioBase64, 'base64');
  const blob = new Blob([buffer], { type: mimeType });
  const form = new FormData();
  form.append('file', blob, filename || 'audio.webm');
  form.append('model', 'whisper-1');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.text || null;
}

export async function createVoiceReport({
  politician_id,
  reporter_name,
  reporter_role,
  transcript,
  classification,
  language,
  location,
  gps_lat,
  gps_lng,
  attachments,
}) {
  const cls = classification || classifyTranscript(transcript || '');
  const [res] = await pool.query(
    `INSERT INTO voice_reports (politician_id, reporter_name, reporter_role, transcript, classification, language, location, gps_lat, gps_lng, attachments)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      politician_id || null,
      reporter_name || '',
      reporter_role || '',
      transcript || '',
      cls,
      language || 'Unknown',
      location || '',
      gps_lat || null,
      gps_lng || null,
      attachments ? JSON.stringify(attachments) : null,
    ]
  );

  if (cls === 'Grievance') {
    await pool.query(
      `INSERT INTO grievances (ticket_number, petitioner_name, contact, category, subject, description, status, priority, location)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [`VR-${Date.now().toString().slice(-8)}`, reporter_name || 'Voice Report', '', 'Voice', transcript?.slice(0, 120) || 'Voice grievance', transcript, 'Pending', 'Medium', location || '']
    );
  }

  if (cls === 'Project Update') {
    await pool.query(
      `INSERT INTO projects (project_name, description, category, status, notes)
       VALUES (?,?,?,?,?)`,
      [`Field Update ${new Date().toLocaleDateString('en-IN')}`, transcript?.slice(0, 500) || '', 'Field Update', 'In Progress', transcript || '']
    );
  }

  if (cls === 'Media Report') {
    await pool.query(
      `INSERT INTO media_mentions (headline, source, source_type, sentiment, language, published_at, summary, tags, is_read, reach)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [transcript?.slice(0, 140) || 'Field media report', 'Field Report', 'Online', 'Neutral', language || 'Unknown', new Date(), transcript || '', JSON.stringify(['voice']), 0, 0]
    );
  }

  return res?.insertId;
}
