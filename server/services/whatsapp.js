import pool from '../db.js';

// ── CLASSIFICATION ────────────────────────────────────────────
const CATEGORIES = {
  grievance:    ['grievance','complaint','problem','issue','not working','broken','no water','no road','no light','no electricity','bribe','corruption','delay','pending'],
  project:      ['project','road','bridge','school','hospital','construction','completed','inaugurate','building','development','work started','tender'],
  misinformation:['fake','rumor','rumour','false','lie','not true','wrong','mislead','propaganda','fabricated'],
  opposition:   ['opposition','party','rival','attack','speech','rally','protest','blame','accuse','against'],
  praise:       ['thank','thanks','thank you','great','excellent','good work','happy','satisfied','appreciate','well done','proud'],
  emergency:    ['emergency','urgent','danger','accident','death','fire','flood','attack','riot','violence','help','save'],
  darshan:      ['darshan','tirupati','temple','booking','quota','vip','pilgrimage','prasad'],
  volunteer:    ['volunteer','help','support','join','party worker','booth','election'],
};

const URGENCY = {
  emergency: 10, misinformation: 8, grievance: 7,
  opposition: 6, project: 4, darshan: 3, praise: 2, volunteer: 2, general: 1,
};

function classifyMessage(text) {
  const t = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(k => t.includes(k))) return cat;
  }
  return 'general';
}

function inferSentiment(text, classification) {
  const t = text.toLowerCase();
  if (['praise','volunteer'].includes(classification)) return 'positive';
  if (['grievance','misinformation','emergency','opposition'].includes(classification)) return 'negative';
  const positiveWords = ['good','great','excellent','happy','thank','support','love','best'];
  const negativeWords = ['bad','worst','terrible','angry','hate','problem','issue','fail','corrupt','bribe'];
  const pos = positiveWords.filter(w => t.includes(w)).length;
  const neg = negativeWords.filter(w => t.includes(w)).length;
  if (pos > neg) return 'positive';
  if (neg > pos) return 'negative';
  return 'neutral';
}

function detectViralThreshold(count) { return count >= 5; }

function extractLanguage(text) {
  // Simple Telugu detection
  if (/[\u0C00-\u0C7F]/.test(text)) return 'telugu';
  if (/[\u0900-\u097F]/.test(text)) return 'hindi';
  return 'english';
}

// ── MAIN PROCESSOR ────────────────────────────────────────────
export async function processWhatsappMessage({ politician_id, sender_phone, message_type = 'text', content, transcription }) {
  if (!content) return null;

  const classification = classifyMessage(content);
  const sentiment = inferSentiment(content, classification);
  const urgency_score = URGENCY[classification] || 1;
  const language = extractLanguage(content);

  // Check viral: same content from different senders in last 48h
  const [countRows] = await pool.query(
    'SELECT COUNT(DISTINCT sender_phone) as cnt FROM whatsapp_intelligence WHERE content = ? AND received_at >= DATE_SUB(NOW(), INTERVAL 2 DAY)',
    [content]
  );
  const viralCount = (countRows?.[0]?.cnt || 0) + 1;
  const isViral = detectViralThreshold(viralCount) ? 1 : 0;
  const isMisinformation = classification === 'misinformation' ? 1 : 0;

  const [res] = await pool.query(
    `INSERT INTO whatsapp_intelligence
     (politician_id, received_at, sender_phone, message_type, content, transcription,
      classification, sentiment, urgency_score, is_viral, viral_count, is_misinformation,
      routed_to, action_taken)
     VALUES (?,NOW(),?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      politician_id || null, sender_phone || '', message_type, content,
      transcription || '', classification, sentiment, urgency_score,
      isViral, viralCount, isMisinformation, classification, '',
    ]
  );

  const messageId = res?.insertId;

  // Auto-create grievance
  if (classification === 'grievance' && politician_id) {
    await pool.query(
      `INSERT INTO grievances (politician_id, ticket_number, petitioner_name, contact, category, subject, description, status, priority)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        politician_id,
        `WA-${Date.now().toString().slice(-8)}`,
        'WhatsApp User', sender_phone || '',
        'WhatsApp',
        content.slice(0, 120),
        content, 'Pending',
        urgency_score >= 8 ? 'Urgent' : urgency_score >= 6 ? 'High' : 'Medium',
      ]
    );
  }

  // Notifications
  if (politician_id) {
    let title = 'New WhatsApp message';
    if (isMisinformation) title = '⚠️ Misinformation detected';
    else if (isViral) title = `🔴 Viral message — ${viralCount} senders`;
    else if (classification === 'emergency') title = '🚨 Emergency reported';
    else if (classification === 'grievance') title = '📋 New grievance via WhatsApp';
    else if (classification === 'opposition') title = '🎯 Opposition intelligence';

    await pool.query(
      'INSERT INTO notifications (politician_id, title, message, link) VALUES (?,?,?,?)',
      [politician_id, title, content.slice(0, 180), 'whatsapp-intelligence']
    );
  }

  return messageId;
}

// ── AISENSY WEBHOOK PARSER ────────────────────────────────────
export function parseAiSensyWebhook(body) {
  // AiSensy payload structure
  const msg = body?.message || body?.messages?.[0] || body;
  const contact = body?.contact || body?.contacts?.[0] || {};
  const sender = contact.wa_id || msg?.from || body?.from || '';
  const type = msg?.type || body?.type || 'text';
  let content = '';
  if (type === 'text') content = msg?.text?.body || msg?.body || body?.text || '';
  else if (type === 'audio') content = msg?.audio ? '[Voice message]' : '';
  else if (type === 'image') content = msg?.image?.caption || '[Image]';
  else content = msg?.body || '';
  return { sender_phone: sender, message_type: type, content: String(content) };
}

// ── WATI WEBHOOK PARSER ───────────────────────────────────────
export function parseWatiWebhook(body) {
  const sender = body?.waId || body?.from || '';
  const type = body?.type || 'text';
  const content = body?.text || body?.caption || body?.body || '';
  return { sender_phone: sender, message_type: type, content: String(content) };
}
