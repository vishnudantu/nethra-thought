import pool from '../db.js';
const NEGATIVE_WORDS = ['problem', 'issue', 'complaint', 'delay', 'corruption', 'protest', 'angry', 'bad'];
const POSITIVE_WORDS = ['thanks', 'thank you', 'good', 'happy', 'support', 'appreciate'];

function inferSentiment(text) {
  const t = text.toLowerCase();
  if (NEGATIVE_WORDS.some(w => t.includes(w))) return 'negative';
  if (POSITIVE_WORDS.some(w => t.includes(w))) return 'positive';
  return 'neutral';
}

function classifyMessage(text) {
  const t = text.toLowerCase();
  if (t.includes('grievance') || t.includes('complaint') || t.includes('issue')) return 'grievance';
  if (t.includes('project') || t.includes('road') || t.includes('bridge')) return 'project update';
  if (t.includes('opposition') || t.includes('attack') || t.includes('speech')) return 'field intelligence';
  return 'general';
}

export async function processWhatsappMessage({ politician_id, sender_phone, message_type = 'text', content, transcription }) {
  if (!content) return null;
  const sentiment = inferSentiment(content);
  const classification = classifyMessage(content);
  const [countRows] = await pool.query(
    'SELECT COUNT(*) as cnt FROM whatsapp_intelligence WHERE content = ? AND received_at >= DATE_SUB(NOW(), INTERVAL 2 DAY)',
    [content]
  );
  const viralCount = countRows?.[0]?.cnt || 0;
  const isViral = viralCount >= 10 ? 1 : 0;
  const isMisinformation = content.toLowerCase().includes('fake') || content.toLowerCase().includes('rumor') ? 1 : 0;

  const [res] = await pool.query(
    `INSERT INTO whatsapp_intelligence (politician_id, received_at, sender_phone, message_type, content, transcription, classification, sentiment, urgency_score, is_viral, viral_count, is_misinformation, routed_to, action_taken)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      politician_id || null,
      new Date(),
      sender_phone || '',
      message_type,
      content,
      transcription || '',
      classification,
      sentiment,
      sentiment === 'negative' ? 7 : 3,
      isViral,
      viralCount,
      isMisinformation,
      classification,
      '',
    ]
  );

  if (classification === 'grievance') {
    await pool.query(
      `INSERT INTO grievances (politician_id, ticket_number, petitioner_name, contact, category, subject, description, status, priority, location)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [politician_id || null, `WA-${Date.now().toString().slice(-8)}`, sender_phone || 'WhatsApp', sender_phone || '', 'WhatsApp', content.slice(0, 120), content, 'Pending', 'Medium', '']
    );
  }

  if (politician_id) {
    await pool.query(
      'INSERT INTO notifications (politician_id, title, message, link) VALUES (?,?,?,?)',
      [
        politician_id,
        isMisinformation ? 'Potential misinformation detected' : 'New WhatsApp intelligence',
        content.slice(0, 180),
        'whatsapp-intelligence',
      ]
    );
  }

  return res?.insertId;
}
