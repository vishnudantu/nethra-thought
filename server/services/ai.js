/**
 * Central AI utility for ThoughtFirst
 * All services use this — never hardcode a provider in a service file
 * 
 * Priority: OpenRouter → Groq → Gemini → Anthropic → OpenAI
 * Rate limit handling: auto-fallback to next provider on 429
 */
import pool from '../db.js';
import { getApiKey } from './secretStore.js';

// Get the saved model preference for a provider
async function getSavedModel(provider) {
  try {
    const key = provider === 'openrouter' ? 'openrouter_model' : `${provider}_model`;
    const [[row]] = await pool.query(
      "SELECT setting_value FROM platform_settings WHERE politician_id IS NULL AND setting_key = ? LIMIT 1",
      [key]
    );
    return row?.setting_value || null;
  } catch { return null; }
}

// Core completion function — tries all providers in order
export async function aiComplete({ prompt, system, politicianId = null, endpoint = 'general', maxTokens = 1500, temperature = 0.7, jsonMode = false }) {
  const msgs = [{ role: 'user', content: prompt }];
  return aiChat({ messages: msgs, system, politicianId, endpoint, maxTokens, temperature, jsonMode });
}

export async function aiChat({ messages, system, politicianId = null, endpoint = 'general', maxTokens = 2048, temperature = 0.7, jsonMode = false }) {
  // Load all keys
  const [orKey, geminiKey, groqKey, anthropicKey, openaiKey] = await Promise.all([
    getApiKey('OPENROUTER_API_KEY', { politicianId, endpoint }),
    getApiKey('GEMINI_API_KEY', { politicianId, endpoint }),
    getApiKey('GROQ_API_KEY', { politicianId, endpoint }),
    getApiKey('ANTHROPIC_API_KEY', { politicianId, endpoint }),
    getApiKey('OPENAI_API_KEY', { politicianId, endpoint }),
  ]);

  const providers = [];
  if (orKey) providers.push({ name: 'openrouter', key: orKey });
  if (groqKey) providers.push({ name: 'groq', key: groqKey });
  if (geminiKey) providers.push({ name: 'gemini', key: geminiKey });
  if (anthropicKey) providers.push({ name: 'anthropic', key: anthropicKey });
  if (openaiKey) providers.push({ name: 'openai', key: openaiKey });

  if (!providers.length) throw new Error('No AI key configured. Add OPENROUTER_API_KEY or GROQ_API_KEY in Super Admin → API Keys.');

  const systemPrompt = system || 'You are a helpful political intelligence assistant for an Indian politician.';

  for (const provider of providers) {
    try {
      const text = await _callProvider({ provider, messages, system: systemPrompt, maxTokens, temperature, jsonMode });
      if (text) return text;
    } catch (e) {
      // 429 rate limit — try next provider
      if (e.status === 429 || e.message?.includes('429') || e.message?.includes('rate limit') || e.message?.includes('rate-limited')) {
        console.warn(`[ai] ${provider.name} rate-limited, trying next provider`);
        continue;
      }
      // Other errors — also try next
      console.warn(`[ai] ${provider.name} failed (${e.message?.slice(0, 80)}), trying next`);
      continue;
    }
  }
  throw new Error('All AI providers failed or rate-limited. Try again in a few seconds.');
}

async function _callProvider({ provider, messages, system, maxTokens, temperature, jsonMode }) {
  const { name, key } = provider;

  if (name === 'openrouter') {
    const model = await getSavedModel('openrouter') || process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'https://thoughtfirst.in',
        'X-Title': 'ThoughtFirst Political Intelligence',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: system }, ...messages],
        max_tokens: maxTokens,
        temperature,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    const data = await res.json();
    if (!res.ok) { const err = new Error(data.error?.message || `OpenRouter ${res.status}`); err.status = res.status; throw err; }
    return data.choices?.[0]?.message?.content || '';
  }

  if (name === 'groq') {
    const model = await getSavedModel('groq') || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: system }, ...messages],
        max_tokens: maxTokens,
        temperature,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    const data = await res.json();
    if (!res.ok) { const err = new Error(data.error?.message || `Groq ${res.status}`); err.status = res.status; throw err; }
    return data.choices?.[0]?.message?.content || '';
  }

  if (name === 'gemini') {
    const model = await getSavedModel('gemini') || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: maxTokens, temperature },
      }),
    });
    const data = await res.json();
    if (!res.ok) { const err = new Error(data.error?.message || `Gemini ${res.status}`); err.status = res.status; throw err; }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  if (name === 'anthropic') {
    const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages, temperature }),
    });
    const data = await res.json();
    if (!res.ok) { const err = new Error(data.error?.message || `Anthropic ${res.status}`); err.status = res.status; throw err; }
    return data.content?.[0]?.text || '';
  }

  if (name === 'openai') {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: system }, ...messages],
        max_tokens: maxTokens,
        temperature,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    const data = await res.json();
    if (!res.ok) { const err = new Error(data.error?.message || `OpenAI ${res.status}`); err.status = res.status; throw err; }
    return data.choices?.[0]?.message?.content || '';
  }

  throw new Error(`Unknown provider: ${name}`);
}

// JSON-mode helper — ensures parsed response
export async function aiJSON({ prompt, system, politicianId, endpoint, maxTokens = 1000 }) {
  const text = await aiComplete({ prompt, system, politicianId, endpoint, maxTokens, temperature: 0.1, jsonMode: true });
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean);
}

// Streaming helper for the chat endpoint
export async function aiStream({ messages, system, politicianId, endpoint, res }) {
  const [orKey, geminiKey, groqKey, anthropicKey, openaiKey] = await Promise.all([
    getApiKey('OPENROUTER_API_KEY', { politicianId, endpoint }),
    getApiKey('GEMINI_API_KEY', { politicianId, endpoint }),
    getApiKey('GROQ_API_KEY', { politicianId, endpoint }),
    getApiKey('ANTHROPIC_API_KEY', { politicianId, endpoint }),
    getApiKey('OPENAI_API_KEY', { politicianId, endpoint }),
  ]);

  const systemPrompt = system || 'You are a helpful political intelligence assistant for an Indian politician.';

  // Try streaming with each provider, fall back on rate limit
  async function tryStream(name, key) {
    if (name === 'openrouter' || name === 'groq' || name === 'openai') {
      const { url, headers, body } = await _streamPayload(name, key, messages, systemPrompt);
      const upstream = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!upstream.ok) {
        const errData = await upstream.json().catch(() => ({}));
        const err = new Error(errData.error?.message || `${name} ${upstream.status}`);
        err.status = upstream.status;
        throw err;
      }
      const reader = upstream.body.getReader();
      const dec = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value, { stream: true }).split('\n').filter(l => l.startsWith('data: ') && l !== 'data: [DONE]')) {
          try { const t = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content || ''; if (t) { full += t; res.write(t); } } catch (_) {}
        }
      }
      return full;
    }
    if (name === 'gemini') {
      const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`;
      const upstream = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_instruction: { parts: [{ text: systemPrompt }] }, contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })), generationConfig: { maxOutputTokens: 2048, temperature: 0.7 } }),
      });
      if (!upstream.ok) { const err = new Error(`Gemini ${upstream.status}`); err.status = upstream.status; throw err; }
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
      const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model, max_tokens: 2048, system: systemPrompt, messages, stream: true }),
      });
      if (!upstream.ok) { const err = new Error(`Anthropic ${upstream.status}`); err.status = upstream.status; throw err; }
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

  const pairs = [];
  if (orKey) pairs.push(['openrouter', orKey]);
  if (groqKey) pairs.push(['groq', groqKey]);
  if (geminiKey) pairs.push(['gemini', geminiKey]);
  if (anthropicKey) pairs.push(['anthropic', anthropicKey]);
  if (openaiKey) pairs.push(['openai', openaiKey]);

  if (!pairs.length) throw new Error('No AI key configured. Add OPENROUTER_API_KEY or GROQ_API_KEY in Super Admin → API Keys.');

  for (const [name, key] of pairs) {
    try {
      const full = await tryStream(name, key);
      return full;
    } catch (e) {
      if (e.status === 429 || e.message?.includes('429') || e.message?.includes('rate limit') || e.message?.includes('rate-limited')) {
        console.warn(`[ai-stream] ${name} rate-limited, trying next`);
        continue;
      }
      console.warn(`[ai-stream] ${name} failed: ${e.message?.slice(0, 80)}`);
      continue;
    }
  }
  throw new Error('All AI providers rate-limited or failed.');
}

async function _streamPayload(name, key, messages, system) {
  if (name === 'openrouter') {
    const model = await getSavedModel('openrouter') || process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
    return {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`, 'HTTP-Referer': 'https://thoughtfirst.in', 'X-Title': 'ThoughtFirst' },
      body: { model, messages: [{ role: 'system', content: system }, ...messages], stream: true, max_tokens: 2048, temperature: 0.7 },
    };
  }
  if (name === 'groq') {
    const model = await getSavedModel('groq') || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    return {
      url: 'https://api.groq.com/openai/v1/chat/completions',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: { model, messages: [{ role: 'system', content: system }, ...messages], stream: true, max_tokens: 2048, temperature: 0.7 },
    };
  }
  if (name === 'openai') {
    return {
      url: 'https://api.openai.com/v1/chat/completions',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: { model: 'gpt-4o-mini', messages: [{ role: 'system', content: system }, ...messages], stream: true, max_tokens: 2048, temperature: 0.7 },
    };
  }
}
