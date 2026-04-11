import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Copy, Check, RefreshCw, FileText, MessageSquare, Mic, Newspaper, Send, Loader2 } from 'lucide-react';
import { T, AIPanel, getToken, useW, isMob } from '../components/ui/ModuleLayout';

const TYPES = [
  { id: 'social_post', label: 'Social Post', icon: MessageSquare, hint: 'Twitter / Facebook' },
  { id: 'whatsapp_broadcast', label: 'WhatsApp', icon: Send, hint: 'Broadcast message' },
  { id: 'press_release', label: 'Press Release', icon: Newspaper, hint: 'Official statement' },
  { id: 'speech_excerpt', label: 'Speech', icon: Mic, hint: '~200 words' },
  { id: 'grievance_response', label: 'Response Letter', icon: FileText, hint: 'Official letter' },
];
const LANGS = [
  { code: 'english', label: 'English' }, { code: 'telugu', label: 'తెలుగు' },
  { code: 'hindi', label: 'हिंदी' }, { code: 'tamil', label: 'தமிழ்' },
  { code: 'kannada', label: 'ಕನ್ನಡ' }, { code: 'malayalam', label: 'മലയാളം' },
];

export default function ContentFactory() {
  const w = useW();
  const [type, setType] = useState('social_post');
  const [lang, setLang] = useState('english');
  const [ctx, setCtx] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<{ type: string; content: string }[]>([]);

  async function generate() {
    if (!ctx.trim()) return;
    setBusy(true); setResult('');
    try {
      const r = await fetch('/api/content-factory/ai-generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_type: type, context: ctx, language: lang }),
      });
      const d = await r.json();
      const c = d.content || '';
      setResult(c);
      if (c) setHistory(p => [{ type, content: c }, ...p].slice(0, 8));
    } catch (_) {}
    setBusy(false);
  }

  function copy() { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  const cols = isMob(w) ? 2 : 5;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div style={{ ...T.card, padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Content Type</div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
          {TYPES.map(t => {
            const Icon = t.icon; const on = type === t.id;
            return (
              <button key={t.id} onClick={() => setType(t.id)}
                style={{ padding: '12px 8px', borderRadius: 11, cursor: 'pointer', textAlign: 'center', background: on ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${on ? 'rgba(0,212,170,0.35)' : 'rgba(255,255,255,0.07)'}`, transition: 'all 0.15s' }}>
                <Icon size={18} style={{ color: on ? '#00d4aa' : '#8899bb', margin: '0 auto 6px', display: 'block' }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: on ? '#00d4aa' : '#d0d8ee' }}>{t.label}</div>
                <div style={{ fontSize: 10, color: '#8899bb', marginTop: 2 }}>{t.hint}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ ...T.card, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div style={{ ...T.label, margin: 0 }}>What to communicate</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {LANGS.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)} style={T.pill(lang === l.code)}>{l.label}</button>
            ))}
          </div>
        </div>
        <textarea value={ctx} onChange={e => setCtx(e.target.value)}
          placeholder="e.g. 'Road repair completed in Ward 4 ahead of schedule' or 'New water tank inaugurated in Kotha Road village'"
          rows={3} style={{ ...T.input, resize: 'vertical', marginBottom: 12 }} />
        <button onClick={generate} disabled={busy || !ctx.trim()}
          style={{ ...T.primary, width: '100%', justifyContent: 'center', opacity: busy || !ctx.trim() ? 0.45 : 1 }}>
          {busy
            ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(6,11,24,0.3)', borderTopColor: '#060b18', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Generating...</>
            : <><Sparkles size={13} />Generate {TYPES.find(t => t.id === type)?.label}</>}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={T.ai}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Sparkles size={13} style={{ color: '#00d4aa' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#00d4aa', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Generated {TYPES.find(t => t.id === type)?.label}
                  {lang !== 'english' && ` · ${LANGS.find(l => l.code === lang)?.label}`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <button onClick={() => generate()}
                  style={{ ...T.ghost, padding: '5px 10px', fontSize: 11, gap: 5 }}>
                  <RefreshCw size={11} />Redo
                </button>
                <button onClick={copy}
                  style={{ ...T.ghost, padding: '5px 12px', fontSize: 11, gap: 5, color: copied ? '#00c864' : '#8899bb', borderColor: copied ? 'rgba(0,200,100,0.2)' : undefined }}>
                  {copied ? <><Check size={11} />Copied!</> : <><Copy size={11} />Copy</>}
                </button>
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#f0f4ff', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line' }}>{result}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {history.length > 0 && (
        <div style={{ ...T.card, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Recent Drafts</div>
          {history.map((h, i) => (
            <button key={i} onClick={() => setResult(h.content)}
              style={{ ...T.ghost, width: '100%', justifyContent: 'flex-start', padding: '9px 12px', marginBottom: 6, textAlign: 'left' }}>
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: 'rgba(0,212,170,0.1)', color: '#00d4aa', fontWeight: 700, flexShrink: 0 }}>{TYPES.find(t => t.id === h.type)?.label}</span>
              <span style={{ fontSize: 12, color: '#8899bb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{h.content.slice(0, 70)}…</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
