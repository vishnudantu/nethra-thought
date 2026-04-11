// Shared layout primitives used by EVERY module
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, X } from 'lucide-react';

// ── Responsive hook ───────────────────────────────────────────
import { useState, useEffect } from 'react';
export function useW() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}
export const isMob = (w: number) => w < 640;
export const isTab = (w: number) => w >= 640 && w < 1024;

// ── Design tokens ──────────────────────────────────────────────
export const T = {
  card:    { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 } as React.CSSProperties,
  input:   { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 13px', color: '#f0f4ff', fontSize: 13, outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
  label:   { fontSize: 11, fontWeight: 700, color: '#8899bb', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 } as React.CSSProperties,
  primary: { background: 'linear-gradient(135deg,#00d4aa,#1e88e5)', border: 'none', borderRadius: 10, padding: '9px 20px', color: '#060b18', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' } as React.CSSProperties,
  ghost:   { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 16px', color: '#f0f4ff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 } as React.CSSProperties,
  ai:      { background: 'linear-gradient(135deg,rgba(0,212,170,0.08),rgba(30,136,229,0.05))', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 14, padding: 16 } as React.CSSProperties,
  pill:    (on: boolean) => ({ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: on ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${on ? 'rgba(0,212,170,0.4)' : 'rgba(255,255,255,0.08)'}`, color: on ? '#00d4aa' : '#8899bb' }) as React.CSSProperties,
};

// ── Stat card ──────────────────────────────────────────────────
export function Stat({ label, value, color, icon: Icon }: { label: string; value: string | number; color: string; icon: any }) {
  return (
    <div style={{ ...T.card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={17} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'Space Grotesk', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: '#8899bb', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

// ── AI Panel ───────────────────────────────────────────────────
export function AIPanel({ title, content, onClose, loading }: { title?: string; content?: string; onClose?: () => void; loading?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} style={T.ai}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: loading ? 0 : 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={13} style={{ color: loading ? '#8899bb' : '#00d4aa' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: loading ? '#8899bb' : '#00d4aa', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {loading ? 'AI Thinking...' : (title || 'AI Analysis')}
          </span>
        </div>
        {onClose && !loading && <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8899bb', cursor: 'pointer', padding: 0 }}><X size={13} /></button>}
      </div>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
          <Loader2 size={16} style={{ color: '#00d4aa', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#8899bb' }}>Analysing your constituency data...</span>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: '#d0d8ee', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line' }}>{content}</p>
      )}
    </motion.div>
  );
}

// ── Empty state ───────────────────────────────────────────────
export function Empty({ icon: Icon, title, sub, action, onAction }: { icon: any; title: string; sub?: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ ...T.card, padding: '48px 24px', textAlign: 'center' }}>
      <Icon size={36} style={{ color: '#8899bb', opacity: 0.25, margin: '0 auto 14px', display: 'block' }} />
      <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: '#8899bb', marginBottom: action ? 18 : 0 }}>{sub}</div>}
      {action && onAction && (
        <button onClick={onAction} style={{ ...T.primary, margin: '0 auto', display: 'inline-flex' }}>
          {action}
        </button>
      )}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────
export function Loading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div style={{ padding: 48, textAlign: 'center', color: '#8899bb' }}>
      <Loader2 size={26} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px', display: 'block', color: '#00d4aa' }} />
      <div style={{ fontSize: 13 }}>{text}</div>
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────
export function Modal({ onClose, title, children, maxW = 520 }: { onClose: () => void; title: string; children: ReactNode; maxW?: number }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(6,11,24,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
        style={{ background: '#0d1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 24, width: '100%', maxWidth: maxW, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#8899bb' }}><X size={16} /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// ── Token for getToken ────────────────────────────────────────
export const getToken = () => localStorage.getItem('nethra_token') || '';
export const authHeaders = () => ({ Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' });
