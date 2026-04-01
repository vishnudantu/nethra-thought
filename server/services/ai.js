/**
 * Central AI utility for ThoughtFirst
 * Providers: OpenRouter → Groq → Gemini → Mistral → Anthropic → Nvidia → OpenAI
 * Auto-fallback on rate limits and errors
 */
import pool from '../db.js';
import { getApiKey } from './secretStore.js';

async function getSavedModel(provider) {
  try {
    const [[row]] = await pool.query(
      "SELECT setting_value FROM platform_settings WHERE politician_id IS NULL AND setting_key = ? LIMIT 1",
      [provider + '_model']
    );
    return row?.setting_value || null;
  } catch { return null; }
}

// Resolve actual API key - handles any key name the user may have saved
async function resolveKey(names, politicianId, endpoint) {
  for (const name of names) {
    const k = await getApiKey(name, { politicianId, endpoint });
    if (k) return k;
  }
  return null;
}

export async function aiComplete({ prompt, system, politicianId = null, endpoint = 'general', maxTokens = 1500, temperature = 0.7, jsonMode = false }) {
  return aiChat({ messages: [{ role: 'user', content: prompt }], system, politicianId, endpoint, maxTokens, temperature, jsonMode });
}

export async function aiJSON({ prompt, system, politicianId, endpoint, maxTokens = 1000 }) {
  const text = await aiComplete({ prompt, system, politicianId, endpoint, maxTokens, temperature: 0.1, jsonMode: true });
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean);
}

export async function aiChat({ messages, system, politicianId = null, endpoint = 'general', maxTokens = 2048, temperature = 0.7, jsonMode = false }) {
  // Resolve all keys — support multiple possible key names per provider
  const keys = {
    openrouter: await resolveKey(['OPENROUTER_API_KEY'], politicianId, endpoint),
    groq:       await resolveKey(['GROQ_API_KEY', 'GROQ'], politicianId, endpoint),
    gemini:     await resolveKey(['GEMINI_API_KEY', 'GEMINI'], politicianId, endpoint),
    mistral:    await resolveKey(['MISTRAL_API_KEY', 'MISTRAL'], politicianId, endpoint),
    anthropic:  await resolveKey(['ANTHROPIC_API_KEY', 'ANTHROPIC'], politicianId, endpoint),
    nvidia:     await resolveKey(['NVIDIA_API_KEY', 'NVIDIA', 'NVIDIABUILD'], politicianId, endpoint),
    openai:     await resolveKey(['OPENAI_API_KEY', 'OPENAI'], politicianId, endpoint),
  };

  const sys = system || 'You are a helpful political intelligence assistant for an Indian politician.';
  const errors = [];

  // Try each provider in order
  const chain = [
    { name: 'openrouter', key: keys.openrouter },
    { name: 'groq',       key: keys.groq },
    { name: 'gemini',     key: keys.gemini },
    { name: 'mistral',    key: keys.mistral },
    { name: 'anthropic',  key: keys.anthropic },
    { name: 'nvidia',     key: keys.nvidia },
    { name: 'openai',     key: keys.openai },
  ].filter(p => p.key);

  if (!chain.length) {
    throw new Error('No AI key configured. Go to Super Admin → API Keys and add any key: GROQ_API_KEY, MISTRAL_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY.');
  }

  for (const { name, key } of chain) {
    try {
      const text = await _call(name, key, sys, messages, maxTokens, temperature, jsonMode);
      if (text) return text;
      errors.push(`${name}: empty response`);
    } catch (e) {
      errors.push(`${name}: ${e.message?.slice(0, 120)}`);
      console.warn(`[ai] ${name} failed:`, e.message?.slice(0, 100));
      continue;
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join('\n')}`);
}

async function _call(name, key, system, messages, maxTokens, temperature, jsonMode) {
  const body = (model, msgs) => JSON.stringify({
    model,
    messages: msgs,
    max_tokens: maxTokens,
    temperature,
    ...(jsonMode && name !== 'gemini' ? { response_format: { type: 'json_object' } } : {}),
  });

  if (name === 'openrouter') {
    const model = (await getSavedModel('openrouter')) || process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`, 'HTTP-Referer': 'https://thoughtfirst.in', 'X-Title': 'ThoughtFirst' },
      body: body(model, [{ role: 'system', content: system }, ...messages]),
    });
    const d = await r.json();
    if (!r.ok) { const e = new Error(d.error?.message || `OpenRouter ${r.status}`); e.status = r.status; throw e; }
    return d.choices?.[0]?.message?.content || '';
  }

  if (name === 'groq') {
    const model = (await getSavedModel('groq')) || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: body(model, [{ role: 'system', content: system }, ...messages]),
    });
    const d = await r.json();
    if (!r.ok) { const e = new Error(d.error?.message || `Groq ${r.status}`); e.status = r.status; throw e; }
    return d.choices?.[0]?.message?.content || '';
  }

  if (name === 'mistral') {
    const model = (await getSavedModel('mistral')) || 'mistral-small-latest';
    const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: body(model, [{ role: 'system', content: system }, ...messages]),
    });
    const d = await r.json();
    if (!r.ok) { const e = new Error(d.message || `Mistral ${r.status}`); e.status = r.status; throw e; }
    return d.choices?.[0]?.message?.content || '';
  }

  if (name === 'gemini') {
    const model = (await getSavedModel('gemini')) || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: maxTokens, temperature },
      }),
    });
    const d = await r.json();
    if (!r.ok) { const e = new Error(d.error?.message || `Gemini ${r.status}`); e.status = r.status; throw e; }
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
    if (!r.ok) { const e = new Error(d.error?.message || `Anthropic ${r.status}`); e.status = r.status; throw e; }
    return d.content?.[0]?.text || '';
  }

  if (name === 'nvidia') {
    // Nvidia NIM API — OpenAI compatible
    const model = (await getSavedModel('nvidia')) || 'meta/llama-3.3-70b-instruct';
    const r = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: body(model, [{ role: 'system', content: system }, ...messages]),
    });
    const d = await r.json();
    if (!r.ok) { const e = new Error(d.detail || d.error?.message || `Nvidia ${r.status}`); e.status = r.status; throw e; }
    return d.choices?.[0]?.message?.content || '';
  }

  if (name === 'openai') {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: body(model, [{ role: 'system', content: system }, ...messages]),
    });
    const d = await r.json();
    if (!r.ok) { const e = new Error(d.error?.message || `OpenAI ${r.status}`); e.status = r.status; throw e; }
    return d.choices?.[0]?.message?.content || '';
  }

  throw new Error(`Unknown provider: ${name}`);
}

// Streaming for chat endpoint
export async function aiStream({ messages, system, politicianId, endpoint, res }) {
  const sys = system || 'You are a helpful political intelligence assistant for an Indian politician.';

  const keys = {
    openrouter: await resolveKey(['OPENROUTER_API_KEY'], politicianId, endpoint),
    groq:       await resolveKey(['GROQ_API_KEY', 'GROQ'], politicianId, endpoint),
    gemini:     await resolveKey(['GEMINI_API_KEY', 'GEMINI'], politicianId, endpoint),
    mistral:    await resolveKey(['MISTRAL_API_KEY', 'MISTRAL'], politicianId, endpoint),
    anthropic:  await resolveKey(['ANTHROPIC_API_KEY', 'ANTHROPIC'], politicianId, endpoint),
    nvidia:     await resolveKey(['NVIDIA_API_KEY', 'NVIDIA', 'NVIDIABUILD'], politicianId, endpoint),
    openai:     await resolveKey(['OPENAI_API_KEY', 'OPENAI'], politicianId, endpoint),
  };

  const chain = [
    { name: 'openrouter', key: keys.openrouter },
    { name: 'groq',       key: keys.groq },
    { name: 'gemini',     key: keys.gemini },
    { name: 'mistral',    key: keys.mistral },
    { name: 'anthropic',  key: keys.anthropic },
    { name: 'nvidia',     key: keys.nvidia },
    { name: 'openai',     key: keys.openai },
  ].filter(p => p.key);

  if (!chain.length) throw new Error('No AI key configured.');

  const errors = [];
  for (const { name, key } of chain) {
    try {
      const full = await _stream(name, key, sys, messages, res);
      return full;
    } catch (e) {
      errors.push(`${name}: ${e.message?.slice(0,100)}`);
      console.warn(`[ai-stream] ${name} failed:`, e.message?.slice(0,100));
      continue;
    }
  }
  throw new Error(`All providers failed: ${errors.join(' | ')}`);
}

async function _stream(name, key, system, messages, res) {
  // OpenAI-compatible streaming (OpenRouter, Groq, Mistral, Nvidia, OpenAI)
  const oaiCompat = {
    openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions',          headers: { 'HTTP-Referer': 'https://thoughtfirst.in', 'X-Title': 'ThoughtFirst' } },
    groq:       { url: 'https://api.groq.com/openai/v1/chat/completions',          headers: {} },
    mistral:    { url: 'https://api.mistral.ai/v1/chat/completions',               headers: {} },
    nvidia:     { url: 'https://integrate.api.nvidia.com/v1/chat/completions',     headers: {} },
    openai:     { url: 'https://api.openai.com/v1/chat/completions',               headers: {} },
  };

  if (oaiCompat[name]) {
    const models = { openrouter: (await getSavedModel('openrouter')) || 'meta-llama/llama-3.3-70b-instruct:free', groq: (await getSavedModel('groq')) || 'llama-3.3-70b-versatile', mistral: 'mistral-small-latest', nvidia: 'meta/llama-3.3-70b-instruct', openai: 'gpt-4o-mini' };
    const cfg = oaiCompat[name];
    const upstream = await fetch(cfg.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`, ...cfg.headers },
      body: JSON.stringify({ model: models[name], messages: [{ role: 'system', content: system }, ...messages], stream: true, max_tokens: 2048, temperature: 0.7 }),
    });
    if (!upstream.ok) {
      const errData = await upstream.json().catch(() => ({}));
      const e = new Error(errData.error?.message || errData.message || `${name} ${upstream.status}`);
      e.status = upstream.status;
      throw e;
    }
    const reader = upstream.body.getReader(); const dec = new TextDecoder(); let full = '';
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      for (const line of dec.decode(value, { stream: true }).split('\n').filter(l => l.startsWith('data: ') && l !== 'data: [DONE]')) {
        try { const t = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content || ''; if (t) { full += t; res.write(t); } } catch (_) {}
      }
    }
    return full;
  }

  if (name === 'gemini') {
    const model = (await getSavedModel('gemini')) || 'gemini-1.5-flash';
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })), generationConfig: { maxOutputTokens: 2048, temperature: 0.7 } }),
    });
    if (!upstream.ok) { const e = new Error(`Gemini ${upstream.status}`); e.status = upstream.status; throw e; }
    const reader = upstream.body.getReader(); const dec = new TextDecoder(); let full = '';
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      for (const line of dec.decode(value, { stream: true }).split('\n').filter(l => l.startsWith('data: '))) {
        try { const t = JSON.parse(line.slice(6)).candidates?.[0]?.content?.parts?.[0]?.text || ''; if (t) { full += t; res.write(t); } } catch (_) {}
      }
    }
    return full;
  }

  if (name === 'anthropic') {
    const model = 'claude-haiku-4-5-20251001';
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 2048, system, messages, stream: true }),
    });
    if (!upstream.ok) { const e = new Error(`Anthropic ${upstream.status}`); e.status = upstream.status; throw e; }
    const reader = upstream.body.getReader(); const dec = new TextDecoder(); let full = '';
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      for (const line of dec.decode(value, { stream: true }).split('\n').filter(l => l.startsWith('data: '))) {
        try { const t = JSON.parse(line.slice(6)).delta?.text || ''; if (t) { full += t; res.write(t); } } catch (_) {}
      }
    }
    return full;
  }
}
