/**
 * Central AI utility for ThoughtFirst
 * Providers: OpenRouter → Groq → Gemini → Mistral → Anthropic → Nvidia → OpenAI
 * Flexible key names — accepts any variant the user may have saved
 */
import pool from '../db.js';
import { getApiKey } from './secretStore.js';
import { buildContextualSystem } from './aiContext.js';

async function getSavedModel(provider) {
  try {
    const [[row]] = await pool.query(
      "SELECT setting_value FROM platform_settings WHERE politician_id IS NULL AND setting_key = ? LIMIT 1",
      [provider + '_model']
    );
    return row?.setting_value || null;
  } catch { return null; }
}

// Get the globally configured AI provider preference
async function getSavedProvider() {
  try {
    const [[row]] = await pool.query(
      "SELECT setting_value FROM platform_settings WHERE politician_id IS NULL AND setting_key = 'ai_provider' LIMIT 1"
    );
    return row?.setting_value || null;
  } catch { return null; }
}

async function getSavedAIModel() {
  try {
    const [[row]] = await pool.query(
      "SELECT setting_value FROM platform_settings WHERE politician_id IS NULL AND setting_key = 'ai_model' LIMIT 1"
    );
    return row?.setting_value || null;
  } catch { return null; }
}

async function getSavedLanguage(politicianId) {
  try {
    const polId = politicianId || null;
    const [[row]] = await pool.query(
      "SELECT setting_value FROM platform_settings WHERE politician_id <=> ? AND setting_key = 'ai_language' LIMIT 1",
      [polId]
    );
    return row?.setting_value || 'english';
  } catch { return 'english'; }
}

// Try multiple key name variants — handles MISTRAL, MISTRAL_API_KEY, GROQ, GROQ_API_KEY etc.
async function resolveKey(names, politicianId, endpoint) {
  for (const name of names) {
    try {
      const k = await getApiKey(name, { politicianId, endpoint });
      if (k) return k;
    } catch { continue; }
  }
  return null;
}

async function loadKeys(politicianId, endpoint) {
  const [or, groq, gemini, mistral, anthropic, nvidia, openai] = await Promise.all([
    resolveKey(['OPENROUTER_API_KEY'], politicianId, endpoint),
    resolveKey(['GROQ_API_KEY', 'GROQ'], politicianId, endpoint),
    resolveKey(['GEMINI_API_KEY', 'GEMINI'], politicianId, endpoint),
    resolveKey(['MISTRAL_API_KEY', 'MISTRAL'], politicianId, endpoint),
    resolveKey(['ANTHROPIC_API_KEY', 'ANTHROPIC'], politicianId, endpoint),
    resolveKey(['NVIDIA_API_KEY', 'NVIDIA', 'NVIDIABUILD', 'NVIDIABUILD-AUTOGEN-17', 'NVIDIABUILD-AUTOGEN-92'], politicianId, endpoint),
    resolveKey(['OPENAI_API_KEY', 'OPENAI'], politicianId, endpoint),
  ]);
  return [
    { name: 'openrouter', key: or },
    { name: 'groq',       key: groq },
    { name: 'gemini',     key: gemini },
    { name: 'mistral',    key: mistral },
    { name: 'anthropic',  key: anthropic },
    { name: 'nvidia',     key: nvidia },
    { name: 'openai',     key: openai },
  ].filter(p => p.key);
}

export async function aiComplete({ prompt, system, politicianId = null, endpoint = 'general', maxTokens = 1500, temperature = 0.7, jsonMode = false }) {
  return aiChat({ messages: [{ role: 'user', content: prompt }], system, politicianId, endpoint, maxTokens, temperature, jsonMode });
}

export async function aiJSON({ prompt, system, politicianId, endpoint, maxTokens = 1000 }) {
  const text = await aiComplete({ prompt, system, politicianId, endpoint, maxTokens, temperature: 0.1, jsonMode: true });
  
  // Enhanced cleanup: Remove markdown, extract JSON array/object from any surrounding text
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  // Try to extract JSON array or object if there's extra text
  let jsonStr = clean;
  if (!clean.startsWith('{') && !clean.startsWith('[')) {
    const arrayMatch = clean.match(/\[[\s\S]*\]/);
    const objectMatch = clean.match(/\{[\s\S]*\}/);
    jsonStr = arrayMatch ? arrayMatch[0] : (objectMatch ? objectMatch[0] : clean);
  }
  
  return JSON.parse(jsonStr);
}

export async function aiChat({ messages, system, politicianId = null, endpoint = 'general', maxTokens = 2048, temperature = 0.7, jsonMode = false, language = null }) {
  // Inject language instruction if set
  const savedLang = language || await getSavedLanguage(politicianId);
  if (savedLang && savedLang !== 'english' && system) {
    system = system + `\n\nIMPORTANT: Respond in ${savedLang} language.`;
  }

  // Inject party + politician training context
  const sys = await buildContextualSystem(
    system || 'You are a helpful political intelligence assistant for an Indian politician.',
    politicianId,
    endpoint
  );

  const chain = await loadKeys(politicianId, endpoint);

  if (!chain.length) {
    throw new Error('No AI key configured. Add GROQ_API_KEY, MISTRAL_API_KEY, or GEMINI_API_KEY in Super Admin → API Keys.');
  }

  const errors = [];
  for (const { name, key } of chain) {
    try {
      const text = await callProvider(name, key, sys, messages, maxTokens, temperature, jsonMode);
      if (text) return text;
      errors.push(name + ': empty response');
    } catch (e) {
      errors.push(name + ': ' + (e.message || '').slice(0, 100));
      console.warn('[ai]', name, 'failed:', (e.message || '').slice(0, 80));
    }
  }
  throw new Error('All AI providers failed:\n' + errors.join('\n'));
}

async function callProvider(name, key, system, messages, maxTokens, temperature, jsonMode) {
  const msgs = [{ role: 'system', content: system }, ...messages];
  const jf = jsonMode ? { response_format: { type: 'json_object' } } : {};

  if (name === 'openrouter') {
    const model = (await getSavedModel('openrouter')) || process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free';
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key, 'HTTP-Referer': 'https://thoughtfirst.in', 'X-Title': 'ThoughtFirst' },
      body: JSON.stringify({ model, messages: msgs, max_tokens: maxTokens, temperature, ...jf }),
    });
    const d = await r.json();
    if (!r.ok) { const e = new Error(d.error?.message || 'OpenRouter ' + r.status); e.status = r.status; throw e; }
    return d.choices?.[0]?.message?.content || '';
  }

  if (name === 'groq') {
    const model = (await getSavedModel('groq')) || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model, messages: msgs, max_tokens: maxTokens, temperature, ...jf }),
    });
    const d = await r.json();
    if (!r.ok) { const e = new Error(d.error?.message || 'Groq ' + r.status); e.status = r.status; throw e; }
    return d.choices?.[0]?.message?.content || '';
  }

  if (name === 'mistral') {
    const model = (await getSavedModel('mistral')) || 'mistral-small-latest';
    const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model, messages: msgs, max_tokens: maxTokens, temperature }),
    });
    const d = await r.json();
    if (!r.ok) { const e = new Error(d.message || 'Mistral ' + r.status); e.status = r.status; throw e; }
    return d.choices?.[0]?.message?.content || '';
  }

  if (name === 'gemini') {
    const model = (await getSavedModel('gemini')) || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: maxTokens, temperature },
      }),
    });
    const d = await r.json();
    if (!r.ok) { const e = new Error(d.error?.message || 'Gemini ' + r.status); e.status = r.status; throw e; }
    return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  if (name === 'anthropic') {
    const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages, temperature }),
    });
    const d = await r.json();
    if (!r.ok) { const e = new Error(d.error?.message || 'Anthropic ' + r.status); e.status = r.status; throw e; }
    return d.content?.[0]?.text || '';
  }

  if (name === 'nvidia') {
    const model = (await getSavedModel('nvidia')) || 'meta/llama-3.3-70b-instruct';
    const r = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model, messages: msgs, max_tokens: maxTokens, temperature }),
    });
    const d = await r.json();
    if (!r.ok) { const e = new Error(d.detail || d.error?.message || 'Nvidia ' + r.status); e.status = r.status; throw e; }
    return d.choices?.[0]?.message?.content || '';
  }

  if (name === 'openai') {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model, messages: msgs, max_tokens: maxTokens, temperature, ...jf }),
    });
    const d = await r.json();
    if (!r.ok) { const e = new Error(d.error?.message || 'OpenAI ' + r.status); e.status = r.status; throw e; }
    return d.choices?.[0]?.message?.content || '';
  }

  throw new Error('Unknown provider: ' + name);
}

// Streaming for chat endpoint
export async function aiStream({ messages, system, politicianId, endpoint, res }) {
  const sys = await buildContextualSystem(
    system || 'You are a helpful political intelligence assistant for an Indian politician.',
    politicianId,
    endpoint
  );
  const chain = await loadKeys(politicianId, endpoint);
  if (!chain.length) throw new Error('No AI key configured.');

  const errors = [];
  for (const { name, key } of chain) {
    try {
      const full = await streamProvider(name, key, sys, messages, res);
      return full;
    } catch (e) {
      errors.push(name + ': ' + (e.message || '').slice(0, 80));
      console.warn('[ai-stream]', name, 'failed:', (e.message || '').slice(0, 80));
    }
  }
  throw new Error('All providers failed: ' + errors.join(' | '));
}

async function streamProvider(name, key, system, messages, res) {
  const msgs = [{ role: 'system', content: system }, ...messages];

  // OpenAI-compatible streaming providers
  const oaiMap = {
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    groq:       'https://api.groq.com/openai/v1/chat/completions',
    mistral:    'https://api.mistral.ai/v1/chat/completions',
    nvidia:     'https://integrate.api.nvidia.com/v1/chat/completions',
    openai:     'https://api.openai.com/v1/chat/completions',
  };

  const modelMap = {
    openrouter: (await getSavedModel('openrouter')) || 'mistralai/mistral-7b-instruct:free',
    groq:       (await getSavedModel('groq')) || 'llama-3.3-70b-versatile',
    mistral:    'mistral-small-latest',
    nvidia:     'meta/llama-3.3-70b-instruct',
    openai:     'gpt-4o-mini',
  };

  if (oaiMap[name]) {
    const extraHeaders = name === 'openrouter' ? { 'HTTP-Referer': 'https://thoughtfirst.in', 'X-Title': 'ThoughtFirst' } : {};
    const upstream = await fetch(oaiMap[name], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key, ...extraHeaders },
      body: JSON.stringify({ model: modelMap[name], messages: msgs, stream: true, max_tokens: 2048, temperature: 0.7 }),
    });
    if (!upstream.ok) {
      const d = await upstream.json().catch(() => ({}));
      const e = new Error(d.error?.message || d.message || name + ' ' + upstream.status);
      e.status = upstream.status;
      throw e;
    }
    const reader = upstream.body.getReader();
    const dec = new TextDecoder();
    let full = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = dec.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
        try {
          const t = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content || '';
          if (t) { full += t; res.write(t); }
        } catch (_) {}
      }
    }
    return full;
  }

  if (name === 'gemini') {
    const model = (await getSavedModel('gemini')) || 'gemini-2.0-flash';
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':streamGenerateContent?alt=sse&key=' + key, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
      }),
    });
    if (!upstream.ok) { const e = new Error('Gemini ' + upstream.status); e.status = upstream.status; throw e; }
    const reader = upstream.body.getReader();
    const dec = new TextDecoder();
    let full = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of dec.decode(value, { stream: true }).split('\n')) {
        if (!line.startsWith('data: ')) continue;
        try {
          const t = JSON.parse(line.slice(6)).candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (t) { full += t; res.write(t); }
        } catch (_) {}
      }
    }
    return full;
  }

  if (name === 'anthropic') {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2048, system, messages, stream: true }),
    });
    if (!upstream.ok) { const e = new Error('Anthropic ' + upstream.status); e.status = upstream.status; throw e; }
    const reader = upstream.body.getReader();
    const dec = new TextDecoder();
    let full = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of dec.decode(value, { stream: true }).split('\n')) {
        if (!line.startsWith('data: ')) continue;
        try {
          const t = JSON.parse(line.slice(6)).delta?.text || '';
          if (t) { full += t; res.write(t); }
        } catch (_) {}
      }
    }
    return full;
  }
}
export { callProvider };
