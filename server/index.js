import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import pool from './db.js';
import { signToken, authMiddleware } from './auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── AUTH ──────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Invalid email or password' });
    const token = signToken({ id: user.id, email: user.email, role: user.role, politician_id: user.politician_id });
    let politician = null, allPoliticians = [];
    if (user.role === 'super_admin') {
      const [pols] = await pool.query('SELECT id,full_name,display_name,photo_url,party,designation,constituency_name,state,slug,color_primary,color_secondary,is_active FROM politician_profiles ORDER BY full_name');
      allPoliticians = pols; politician = pols[0] || null;
    } else if (user.politician_id) {
      const [pols] = await pool.query('SELECT id,full_name,display_name,photo_url,party,designation,constituency_name,state,slug,color_primary,color_secondary,is_active FROM politician_profiles WHERE id = ?', [user.politician_id]);
      politician = pols[0] || null; allPoliticians = pols;
    }
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, politician_id: user.politician_id }, politician, allPoliticians });
  } catch (err) { console.error('[login]', err); res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const [rows] = await pool.query('SELECT id,email,role,politician_id FROM users WHERE id = ?', [req.user.id]);
  rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Not found' });
});

app.get('/api/politicians', authMiddleware, async (req, res) => {
  const [rows] = await pool.query('SELECT id,full_name,display_name,photo_url,party,designation,constituency_name,state,slug,color_primary,color_secondary,is_active FROM politician_profiles ORDER BY full_name');
  res.json(rows);
});

// ── GENERIC CRUD ──────────────────────────────────────────────
// Tables that are isolated per politician
const POLITICIAN_SCOPED_TABLES = [
  'grievances','events','team_members','voters','projects','media_mentions',
  'finances','communications','documents','appointments','polls','poll_responses',
  'darshan_bookings','darshan_date_slots','darshan_donations','bills',
  'citizen_engagements','volunteers','suggestions','parliamentary_questions',
  'parliamentary_debates','parliamentary_bills','ai_briefings','constituencies',
  'ai_generated_content'
];

function crud(table, searchCols = []) {
  const router = express.Router();
  const isScoped = POLITICIAN_SCOPED_TABLES.includes(table);

  const clean = (data, skipId = false) => {
    const c = {};
    for (const [k, v] of Object.entries(data)) {
      if (skipId && k === 'id') continue;
      if (Array.isArray(v) || (v !== null && typeof v === 'object')) {
        c[k] = JSON.stringify(v);
      } else if (typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        c[k] = v.slice(0, 19).replace('T', ' ');
      } else {
        c[k] = v;
      }
    }
    return c;
  };

  // Parse JSON fields in rows
  const parseRows = (rows) => rows.map(row => {
    const r = {...row};
    for (const k of Object.keys(r)) {
      if (typeof r[k] === 'string' && (r[k].startsWith('[') || r[k].startsWith('{'))) {
        try { r[k] = JSON.parse(r[k]); } catch(_) {}
      }
    }
    return r;
  });

  router.get('/', authMiddleware, async (req, res) => {
    try {
      const { search, limit = 500, offset = 0, order = 'created_at', dir = 'DESC' } = req.query;
      const isSuperAdmin = req.user.role === 'super_admin';
      const polId = req.user.politician_id;

      let sql = `SELECT * FROM \`${table}\``, params = [];
      const conditions = [];

      // Add politician filter for scoped tables (non-super-admin)
      if (isScoped && !isSuperAdmin && polId) {
        conditions.push(`(politician_id = ? OR politician_id IS NULL)`);
        params.push(polId);
      }

      if (search && searchCols.length) {
        const searchCond = searchCols.map(c => `\`${c}\` LIKE ?`).join(' OR ');
        conditions.push(`(${searchCond})`);
        searchCols.forEach(() => params.push(`%${search}%`));
      }

      if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
      sql += ` ORDER BY \`${order.replace(/[^a-zA-Z_]/g,'')}\` ${dir==='ASC'?'ASC':'DESC'} LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [rows] = await pool.query(sql, params);
      res.json(parseRows(rows));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  router.get('/:id', authMiddleware, async (req, res) => {
    const [rows] = await pool.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [req.params.id]);
    rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Not found' });
  });
  router.post('/', authMiddleware, async (req, res) => {
    try {
      const c = clean(req.body);
      // Convert ISO datetime strings to MySQL format
      for (const k of Object.keys(c)) {
        if (typeof c[k] === 'string' && c[k].match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          c[k] = c[k].slice(0, 19).replace('T', ' ');
        }
      }
      const cols = Object.keys(c).map(k=>`\`${k}\``).join(',');
      const ph = Object.keys(c).map(()=>'?').join(',');
      const [r] = await pool.query(`INSERT INTO \`${table}\` (${cols}) VALUES (${ph})`, Object.values(c));
      const [rows] = await pool.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [r.insertId]);
      res.status(201).json(rows[0]);
    } catch (e) { console.error(`[POST ${table}]`, e); res.status(500).json({ error: e.message }); }
  });
  router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const c = clean(req.body, true);
      const sets = Object.keys(c).map(k=>`\`${k}\` = ?`).join(',');
      await pool.query(`UPDATE \`${table}\` SET ${sets} WHERE id = ?`, [...Object.values(c), req.params.id]);
      const [rows] = await pool.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [req.params.id]);
      res.json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  router.delete('/:id', authMiddleware, async (req, res) => {
    try { await pool.query(`DELETE FROM \`${table}\` WHERE id = ?`, [req.params.id]); res.json({ success: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });
  return router;
}

app.use('/api/grievances',             crud('grievances',             ['petitioner_name','subject','category','location']));
app.use('/api/events',                 crud('events',                 ['title','location','organizer']));
app.use('/api/team_members',           crud('team_members',           ['name','role','department','email']));
app.use('/api/voters',                 crud('voters',                 ['name','voter_id','mandal','village','phone']));
app.use('/api/projects',              crud('projects',               ['project_name','location','mandal','contractor']));
app.use('/api/media_mentions',         crud('media_mentions',         ['headline','source','summary']));
app.use('/api/finances',              crud('finances',               ['category','description']));
app.use('/api/communications',        crud('communications',         ['subject','message']));
app.use('/api/documents',             crud('documents',              ['title','category']));
app.use('/api/appointments',          crud('appointments',           ['visitor_name','purpose','category']));
app.use('/api/polls',                 crud('polls',                  ['title','category']));
app.use('/api/poll_responses',        crud('poll_responses',         []));
app.use('/api/darshan_bookings',      crud('darshan_bookings',       ['pilgrim_name','pilgrim_contact','mandal']));
app.use('/api/darshan_date_slots',    crud('darshan_date_slots',     []));
app.use('/api/darshan_donations',     crud('darshan_donations',      ['donor_name']));
app.use('/api/bills',                 crud('bills',                  ['bill_name','bill_number','ministry']));
app.use('/api/citizen_engagements',   crud('citizen_engagements',    ['title','location','mandal']));
app.use('/api/volunteers',            crud('volunteers',             ['name','phone','mandal']));
app.use('/api/suggestions',           crud('suggestions',            ['title','category']));
// politician_profiles — filtered by role
app.get('/api/politician_profiles', authMiddleware, async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'super_admin') {
      [rows] = await pool.query('SELECT * FROM politician_profiles ORDER BY full_name');
    } else {
      [rows] = await pool.query('SELECT * FROM politician_profiles WHERE id = ?', [req.user.politician_id]);
    }
    // Parse JSON fields
    rows = rows.map(r => {
      const p = {...r};
      for (const k of Object.keys(p)) {
        if (typeof p[k] === 'string' && (p[k].startsWith('[') || p[k].startsWith('{'))) {
          try { p[k] = JSON.parse(p[k]); } catch(_) {}
        }
      }
      return p;
    });
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/politician_profiles/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM politician_profiles WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    const r = {...rows[0]};
    for (const k of Object.keys(r)) {
      if (typeof r[k] === 'string' && (r[k].startsWith('[') || r[k].startsWith('{'))) {
        try { r[k] = JSON.parse(r[k]); } catch(_) {}
      }
    }
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/politician_profiles', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const data = req.body;
    const clean = {};
    for (const [k, v] of Object.entries(data)) {
      if (k === 'id') continue;
      if (Array.isArray(v) || (v !== null && typeof v === 'object')) clean[k] = JSON.stringify(v);
      else if (typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}T/)) clean[k] = v.slice(0,19).replace('T',' ');
      else clean[k] = v;
    }
    const cols = Object.keys(clean).map(k => `\`${k}\``).join(',');
    const ph = Object.keys(clean).map(() => '?').join(',');
    const [r] = await pool.query(`INSERT INTO politician_profiles (${cols}) VALUES (${ph})`, Object.values(clean));
    const [rows] = await pool.query('SELECT * FROM politician_profiles WHERE id = ?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/politician_profiles/:id', authMiddleware, async (req, res) => {
  try {
    const data = req.body;
    const clean = {};
    for (const [k, v] of Object.entries(data)) {
      if (k === 'id') continue;
      if (Array.isArray(v) || (v !== null && typeof v === 'object')) clean[k] = JSON.stringify(v);
      else if (typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}T/)) clean[k] = v.slice(0,19).replace('T',' ');
      else clean[k] = v;
    }
    const sets = Object.keys(clean).map(k => `\`${k}\` = ?`).join(',');
    await pool.query(`UPDATE politician_profiles SET ${sets} WHERE id = ?`, [...Object.values(clean), req.params.id]);
    const [rows] = await pool.query('SELECT * FROM politician_profiles WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/politician_profiles/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  try { await pool.query('DELETE FROM politician_profiles WHERE id = ?', [req.params.id]); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.use('/api/constituency_profiles', crud('constituency_profiles',  ['constituency_name','state']));
app.use('/api/caste_demographics',    crud('caste_demographics',     ['caste_name']));
app.use('/api/mandal_stats',          crud('mandal_stats',           ['mandal_name']));
app.use('/api/parliamentary_questions',crud('parliamentary_questions',['subject','ministry','session_number']));
app.use('/api/parliamentary_debates', crud('parliamentary_debates',  ['topic','session_number']));
app.use('/api/parliamentary_bills',   crud('parliamentary_bills',    ['bill_name','bill_number']));
app.use('/api/ai_briefings',          crud('ai_briefings',           ['title','briefing_type']));
app.use('/api/ai_generated_content',  crud('ai_generated_content',  ['content_type','prompt']));
app.use('/api/constituencies',        crud('constituencies',         ['name','state']));

// ── DARSHAN SMS ───────────────────────────────────────────────
app.post('/api/darshan-sms', authMiddleware, async (req, res) => {
  try {
    const { booking_id, approved_by, approval_notes, contact_person, contact_phone } = req.body;
    const [rows] = await pool.query('SELECT * FROM darshan_bookings WHERE id = ?', [booking_id]);
    const bk = rows[0];
    if (!bk) return res.status(404).json({ success: false, error: 'Booking not found' });
    const pc = bk.pilgrim_contact?.replace(/\D/g,'').slice(-10);
    const dt = new Date(bk.darshan_date).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
    const rcp = contact_person || bk.contact_person, rph = contact_phone || bk.contact_phone;
    const cLine = rcp && rph ? `For queries: ${rcp} - ${rph}.` : '';
    const sms = `Dear ${bk.pilgrim_name}, Darshan APPROVED by ${approved_by}. Date: ${dt}. Type: ${bk.darshan_type}. ${cLine} Carry this msg & valid ID. - MP Office`;
    let smsSent = false, smsErr = '';
    if (process.env.FAST2SMS_API_KEY && pc) {
      const r = await fetch('https://www.fast2sms.com/dev/bulkV2',{method:'POST',headers:{authorization:process.env.FAST2SMS_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({route:'q',message:sms,language:'english',flash:0,numbers:pc})});
      const d = await r.json(); smsSent = d.return === true; if (!smsSent) smsErr = JSON.stringify(d);
    }
    await pool.query(`UPDATE darshan_bookings SET approval_status='approved',approved_at=NOW(),approved_by=?,approval_notes=?,contact_person=?,contact_phone=?,sms_sent=?,sms_sent_at=?,status='Confirmed' WHERE id=?`,
      [approved_by,approval_notes||'',rcp||'',rph||'',smsSent,smsSent?new Date():null,booking_id]);
    res.json({ success: true, sms_sent: smsSent, sms_error: smsErr||null, message: sms });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
});

// ── AI ASSISTANT — GEMINI ─────────────────────────────────────
function buildPrompt(ctx, mode) {
  const n=ctx?.name||'the politician',p=ctx?.party||'their party',c=ctx?.constituency||'their constituency',s=ctx?.state||'their state',d=ctx?.designation||'Member of Parliament';
  const base=`You are NETHRA AI, a highly intelligent political assistant for ${n}, ${d} from ${c}, ${s}, representing ${p}. Deep expertise in Indian politics, parliamentary procedures, constituency management. Always professional, factual, culturally sensitive.`;
  const m={
    chat:`${base} Answer questions and offer strategic political advice.`,
    speech:`${base} Write powerful inspiring speeches with a strong hook, local issues, data points, call to action.`,
    briefing:`${base} Generate comprehensive briefings: executive summary, analysis, risks, recommended actions.`,
    grievance_reply:`${base} Draft professional empathetic official constituent replies. Sign off as ${n}.`,
    social_post:`${base} Create 3 variations: tweet under 280 chars, Facebook post, Instagram caption with hashtags.`,
    press_release:`${base} Write formal press release with headline, lead, body with quotes, boilerplate.`,
    talking_points:`${base} Generate crisp bullet-point talking points with supporting data.`,
    analysis:`${base} Deep structured analysis: situation, stakeholders, risks, opportunities, recommendations.`,
  };
  return m[mode]||m.chat;
}

app.post('/api/ai-assistant', authMiddleware, async (req, res) => {
  const { messages, politician_context, mode='chat', politician_id, save_content, content_type, prompt_summary } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'No messages provided' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
  try {
    const contents = messages.filter(m=>m.role!=='system').map(m=>({ role:m.role==='assistant'?'model':'user', parts:[{text:m.content}] }));
    const gemRes = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ system_instruction:{parts:[{text:buildPrompt(politician_context,mode)}]}, contents, generationConfig:{maxOutputTokens:2048,temperature:0.7} }) });
    if (!gemRes.ok) throw new Error(`Gemini ${gemRes.status}: ${await gemRes.text()}`);
    res.setHeader('Content-Type','text/plain; charset=utf-8');
    const reader = gemRes.body.getReader(); const dec = new TextDecoder(); let full = '';
    while (true) {
      const {done,value} = await reader.read(); if (done) break;
      for (const line of dec.decode(value,{stream:true}).split('\n').filter(l=>l.startsWith('data: '))) {
        try { const t=JSON.parse(line.slice(6)).candidates?.[0]?.content?.parts?.[0]?.text||''; if(t){full+=t;res.write(t);} } catch(_){}
      }
    }
    res.end();
    if (save_content && politician_id && full) {
      const up = messages.filter(m=>m.role==='user').slice(-1)[0]?.content||'';
      await pool.query('INSERT INTO ai_generated_content (politician_id,content_type,prompt,content,is_saved) VALUES (?,?,?,?,0)', [politician_id, content_type||mode, (prompt_summary||up).slice(0,500), full]);
    }
  } catch (e) { console.error('[ai-assistant]',e); if(!res.headersSent) res.status(500).json({error:e.message}); }
});

// ── SUPER ADMIN — USERS ───────────────────────────────────────
app.post('/api/admin/users', authMiddleware, async (req, res) => {
  const callerRole = req.user.role;
  if (callerRole !== 'super_admin' && callerRole !== 'politician_admin') return res.status(403).json({ error: 'Forbidden' });
  
  const { email, password, role, politician_id } = req.body;
  
  // Politician admin can only create staff for their own politician
  if (callerRole === 'politician_admin') {
    if (role && role !== 'staff') return res.status(403).json({ error: 'Politicians can only create staff accounts' });
    if (politician_id && politician_id != req.user.politician_id) return res.status(403).json({ error: 'Cannot create users for other politicians' });
  }
  
  const assignedPoliticianId = callerRole === 'politician_admin' ? req.user.politician_id : (politician_id || null);
  const assignedRole = callerRole === 'politician_admin' ? 'staff' : (role || 'staff');
  
  try {
    const hash = await bcrypt.hash(password, 12);
    const [r] = await pool.query('INSERT INTO users (email,password_hash,role,politician_id) VALUES (?,?,?,?)', 
      [email, hash, assignedRole, assignedPoliticianId]);
    res.status(201).json({ id: r.insertId, email, role: assignedRole, politician_id: assignedPoliticianId });
  } catch (e) { 
    e.code==='ER_DUP_ENTRY' ? res.status(409).json({error:'Email already exists'}) : res.status(500).json({error:e.message}); 
  }
});

app.get('/api/admin/users', authMiddleware, async (req, res) => {
  const callerRole = req.user.role;
  if (callerRole !== 'super_admin' && callerRole !== 'politician_admin') return res.status(403).json({ error: 'Forbidden' });
  
  let rows;
  if (callerRole === 'super_admin') {
    [rows] = await pool.query('SELECT id,email,role,politician_id,is_active,created_at FROM users ORDER BY created_at DESC');
  } else {
    // Politician can only see their own staff
    [rows] = await pool.query('SELECT id,email,role,politician_id,is_active,created_at FROM users WHERE politician_id = ? ORDER BY created_at DESC', [req.user.politician_id]);
  }
  res.json(rows);
});

app.delete('/api/admin/users/:id', authMiddleware, async (req, res) => {
  const callerRole = req.user.role;
  if (callerRole !== 'super_admin' && callerRole !== 'politician_admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    // Politician can only delete their own staff
    if (callerRole === 'politician_admin') {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
      if (!rows[0] || rows[0].politician_id != req.user.politician_id) return res.status(403).json({ error: 'Cannot delete this user' });
      if (rows[0].role !== 'staff') return res.status(403).json({ error: 'Can only delete staff accounts' });
    }
    await pool.query('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
  console.log(`\n✅ Nethra API running on http://localhost:${PORT}`);
  console.log(`   DB: ${process.env.DB_HOST}/${process.env.DB_NAME} | AI: Gemini\n`);
});

// ── POLITICIAN AUTO-FILL ─────────────────────────────────────
// Uses Gemini to search public data and return structured politician profile
app.post('/api/politician-autofill', authMiddleware, async (req, res) => {
  const { name, type = 'MP' } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  const prompt = `You are a political data researcher for India. Search your knowledge and return detailed information about the Indian politician: "${name}" (${type}).

Return ONLY a valid JSON object with NO markdown, NO backticks, NO explanation. Just raw JSON.

Required format:
{
  "full_name": "complete official name",
  "display_name": "commonly known name",
  "party": "party abbreviation e.g. TDP, BJP, INC, YSRCP",
  "designation": "Member of Parliament or Member of Legislative Assembly",
  "constituency_name": "exact constituency name",
  "state": "state name",
  "lok_sabha_seat": "seat name if MP",
  "bio": "2-3 sentence biography",
  "education": "educational qualifications",
  "age": null,
  "languages": ["Telugu", "English"],
  "achievements": ["achievement 1", "achievement 2"],
  "election_year": 2024,
  "previous_terms": 0,
  "winning_margin": null,
  "vote_count": null,
  "total_votes_polled": null,
  "constituency_stats": {
    "total_voters": null,
    "registered_voters": null,
    "area_sqkm": null,
    "population": null,
    "total_mandals": null,
    "total_villages": null,
    "total_booths": null,
    "literacy_rate": null,
    "sex_ratio": null
  },
  "twitter_handle": "",
  "website": "",
  "confidence": "high or medium or low"
}

If you do not know a specific numeric value use null. If you do not recognize this politician at all return {"error": "Politician not found in knowledge base"}.`;

  try {
    // Use Groq for autofill if available, fallback to Gemini
    const groqKey = process.env.GROQ_API_KEY;
    let text = '';

    if (groqKey) {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
          temperature: 0.1,
        }),
      });
      if (!groqRes.ok) throw new Error(`Groq error: ${groqRes.status}`);
      const groqData = await groqRes.json();
      text = groqData.choices?.[0]?.message?.content || '';
    } else {
      const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1500, temperature: 0.1 },
        }),
      });
      if (!geminiRes.ok) throw new Error(`Gemini error: ${geminiRes.status}`);
      const data = await geminiRes.json();
      text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(text);
    if (parsed.error) return res.status(404).json({ error: parsed.error });

    res.json(parsed);
  } catch (err) {
    console.error('[politician-autofill]', err);
    res.status(500).json({ error: 'Failed to fetch politician data: ' + err.message });
  }
});

// ── CHANGE PASSWORD ───────────────────────────────────────────
app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'Both fields required' });
  if (new_password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
