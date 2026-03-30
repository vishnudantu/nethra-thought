import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Eye, EyeOff, Mail, Lock, AlertCircle, ShieldCheck, RefreshCw, Radio } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';

const BASE = import.meta.env?.VITE_API_URL || '';

interface NewsItem {
  headline: string;
  snippet: string;
  source: string;
  url: string;
  category: string;
  published_at: string;
}

const CATEGORY_STYLE: Record<string, { bg: string; color: string }> = {
  Parliament:  { bg: 'rgba(30,136,229,0.18)',  color: '#64b5f6' },
  Politics:    { bg: 'rgba(0,212,170,0.18)',   color: '#00d4aa' },
  Election:    { bg: 'rgba(255,167,38,0.18)',  color: '#ffa726' },
  Party:       { bg: 'rgba(124,58,237,0.18)',  color: '#a78bfa' },
  Economy:     { bg: 'rgba(0,200,100,0.18)',   color: '#00c864' },
  Government:  { bg: 'rgba(30,136,229,0.18)',  color: '#64b5f6' },
  State:       { bg: 'rgba(136,153,187,0.15)', color: '#8899bb' },
};

const FALLBACK: NewsItem[] = [
  { headline: '18th Lok Sabha session underway with key legislative agenda', snippet: 'Parliament in session with multiple bills scheduled for discussion.', source: 'Sansad.in', url: '#', category: 'Parliament', published_at: new Date().toISOString() },
  { headline: 'Election Commission announces voter registration drive across India', snippet: 'ECI targets enrolling new voters ahead of upcoming state elections.', source: 'ECI', url: '#', category: 'Election', published_at: new Date().toISOString() },
  { headline: 'Central government releases quarterly MPLADS utilization report', snippet: 'MPs urged to accelerate constituency development fund utilization.', source: 'PIB', url: '#', category: 'Government', published_at: new Date().toISOString() },
  { headline: 'Opposition parties call for joint committee on key policy bill', snippet: 'Multiple parties demand detailed scrutiny of proposed legislation.', source: 'The Hindu', url: '#', category: 'Politics', published_at: new Date().toISOString() },
  { headline: 'State assembly elections: voter rolls being updated across constituencies', snippet: 'Election Commission finalizing logistics for multi-phase polling.', source: 'NDTV', url: '#', category: 'Election', published_at: new Date().toISOString() },
];

const TICKER_STATIC = [
  '18th Lok Sabha has 543 elected members across 28 states and Union Territories',
  'India has 96.8 crore registered voters — the largest electorate in the world',
  '2024 General Elections: 65.79% voter turnout across 10.5 lakh polling stations',
  '6 recognised national political parties and 57 state parties registered with ECI',
  '74 women MPs in the 18th Lok Sabha — 13.6% of total strength',
  'Rajya Sabha has 245 seats — the upper house of Indian Parliament',
  'India has 36 states and Union Territories each with elected representation',
];

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Login() {
  const { signIn, verify2fa } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp]           = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // News feed state
  const [newsPool, setNewsPool]       = useState<NewsItem[]>(FALLBACK);
  const [visible, setVisible]         = useState<NewsItem[]>(FALLBACK.slice(0, 5));
  const [poolIdx, setPoolIdx]         = useState(5);
  const [removing, setRemoving]       = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [stats, setStats]             = useState({ news_today: '—', states_today: '—' });
  const tickerItems = [...TICKER_STATIC, ...newsPool.slice(0, 6).map(n => n.headline.substring(0, 75))];
  const tickerDouble = [...tickerItems, ...tickerItems];

  // Fetch news
  useEffect(() => {
    async function load() {
      try {
        const [newsRes, statsRes] = await Promise.all([
          fetch(`${BASE}/api/public/news?limit=20`),
          fetch(`${BASE}/api/public/stats`),
        ]);
        if (newsRes.ok) {
          const data: NewsItem[] = await newsRes.json();
          if (data?.length) {
            setNewsPool(data);
            setVisible(data.slice(0, 5));
            setPoolIdx(5);
            setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
          }
        }
        if (statsRes.ok) {
          const s = await statsRes.json();
          setStats({ news_today: String(s.news_today ?? '—'), states_today: String(s.states_today ?? '—') });
        }
      } catch (err) {
        console.error('Failed to load login news feed', err);
      }
    }
    load();
    const t = setInterval(load, 2 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // Rotate cards every 8s
  useEffect(() => {
    if (!newsPool.length) return;
    const t = setInterval(() => {
      setRemoving(true);
      setTimeout(() => {
        setRemoving(false);
        setVisible(prev => {
          const next = newsPool[poolIdx % newsPool.length];
          setPoolIdx(i => i + 1);
          return [...prev.slice(1), next];
        });
      }, 350);
    }, 8000);
    return () => clearInterval(t);
  }, [newsPool, poolIdx]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true); setError('');
    const { error: err, requires2fa, email: loginEmail } = await signIn(email, password);
    if (err) setError('Invalid email or password. Please try again.');
    else if (requires2fa) { setOtpRequired(true); setOtpEmail(loginEmail || email); }
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) { setOtpError('Enter the OTP sent to your email.'); return; }
    setOtpLoading(true); setOtpError('');
    const { error: err } = await verify2fa(otpEmail, otp);
    if (err) setOtpError('Invalid or expired OTP.');
    setOtpLoading(false);
  }

  async function handleResendOtp() {
    if (!otpEmail) return;
    setOtpLoading(true); setOtpError('');
    try { await api.post('/api/auth/2fa/request', { email: otpEmail }); }
    catch (err: unknown) { setOtpError(err instanceof Error ? err.message : 'Failed to resend OTP'); }
    setOtpLoading(false);
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#060b18', overflow: 'hidden' }}>

      {/* ── ANIMATED BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div animate={{ x: [0,25,0], y: [0,-20,0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position:'absolute', top:-200, right:-100, width:700, height:700, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(0,212,170,0.07) 0%, transparent 65%)' }} />
        <motion.div animate={{ x: [0,-18,0], y: [0,22,0] }} transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position:'absolute', bottom:-200, left:-100, width:600, height:600, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(30,136,229,0.06) 0%, transparent 65%)' }} />
        <div style={{ position:'absolute', inset:0,
          backgroundImage:'linear-gradient(rgba(0,212,170,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,170,0.03) 1px,transparent 1px)',
          backgroundSize:'48px 48px' }} />
      </div>

      {/* ══════════════════════════════════
          LEFT PANEL — INTELLIGENCE FEED
      ══════════════════════════════════ */}
      <div className="hidden lg:flex flex-col flex-1 p-10 gap-5 relative z-10" style={{ minWidth:0 }}>

        {/* Brand */}
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
          className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background:'linear-gradient(135deg,#00d4aa,#1e88e5)' }}>
            <Zap size={20} color="#060b18" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily:'Space Grotesk,sans-serif', color:'#00d4aa', fontSize:15, fontWeight:800, letterSpacing:1.5 }}>THOUGHTFIRST</div>
            <div style={{ fontSize:9, color:'#8899bb', letterSpacing:1, textTransform:'uppercase' }}>Political Intelligence OS</div>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          className="grid grid-cols-4 gap-3">
          {[
            { label:'Active MPs',         value:'543',             sub:'18th Lok Sabha'        },
            { label:'Registered Voters',  value:'96.8 Cr',         sub:'+2.1 Cr since 2019'    },
            { label:'News Today',         value:stats.news_today,  sub:'articles in 24h'       },
            { label:'States in News',     value:stats.states_today,sub:'states mentioned'      },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.3+i*0.07 }}
              className="rounded-xl p-4" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize:20, fontWeight:800, color:'#f0f4ff', fontFamily:'Space Grotesk,sans-serif', lineHeight:1, marginBottom:4 }}>{s.value}</div>
              <div style={{ fontSize:9, color:'#8899bb', textTransform:'uppercase', letterSpacing:0.8, marginBottom:3 }}>{s.label}</div>
              <div style={{ fontSize:9, color:'rgba(136,153,187,0.5)' }}>{s.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Feed header */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div animate={{ opacity:[1,0.3,1] }} transition={{ duration:1.5, repeat:Infinity }}
              style={{ width:7, height:7, borderRadius:'50%', background:'#ff5555' }} />
            <span style={{ fontSize:10, fontWeight:700, color:'rgba(136,153,187,0.6)', letterSpacing:1.5, textTransform:'uppercase' }}>
              Live Political Intelligence
            </span>
          </div>
          <div className="flex items-center gap-1.5" style={{ fontSize:9, color:'rgba(136,153,187,0.4)' }}>
            <Radio size={10} />
            {lastUpdated ? `Updated ${lastUpdated}` : 'via Google News RSS'}
          </div>
        </motion.div>

        {/* News feed */}
        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
          <AnimatePresence mode="popLayout">
            {visible.map((item, i) => {
              const cat = CATEGORY_STYLE[item.category] || CATEGORY_STYLE.State;
              const isOldest = i === 0 && removing;
              return (
                <motion.a
                  key={`${item.headline}-${i}`}
                  href={item.url !== '#' ? item.url : undefined}
                  target="_blank" rel="noopener noreferrer"
                  initial={{ opacity:0, y:14 }}
                  animate={{ opacity: isOldest ? 0 : 1, y: isOldest ? -10 : 0 }}
                  exit={{ opacity:0, y:-12 }}
                  transition={{ duration:0.32 }}
                  whileHover={{ y:-1 }}
                  style={{
                    display:'block', textDecoration:'none',
                    background:'rgba(255,255,255,0.025)',
                    border:'1px solid rgba(255,255,255,0.07)',
                    borderRadius:12, padding:'11px 15px',
                    cursor: item.url !== '#' ? 'pointer' : 'default',
                    transition:'border-color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor='rgba(0,212,170,0.28)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor='rgba(255,255,255,0.07)')}
                >
                  <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom:5 }}>
                    <span style={{ fontSize:8, fontWeight:700, padding:'2px 8px', borderRadius:100,
                      background:cat.bg, color:cat.color, textTransform:'uppercase', letterSpacing:0.5 }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize:9, color:'rgba(136,153,187,0.45)' }}>{timeAgo(item.published_at)}</span>
                    <span style={{ fontSize:9, color:'rgba(136,153,187,0.35)' }}>· {item.source}</span>
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, color:'#e0e8ff', lineHeight:1.5,
                    overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                    {item.headline}
                  </div>
                  {item.snippet && (
                    <div style={{ fontSize:10, color:'rgba(136,153,187,0.5)', marginTop:2, lineHeight:1.5,
                      overflow:'hidden', display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical' }}>
                      {item.snippet}
                    </div>
                  )}
                </motion.a>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Ticker */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.9 }}
          style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:10, overflow:'hidden' }}>
          <div style={{ fontSize:8, color:'#00d4aa', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', marginBottom:5 }}>
            Trending
          </div>
          <div style={{ overflow:'hidden' }}>
            <motion.div
              animate={{ x:['0%','-50%'] }}
              transition={{ duration:65, repeat:Infinity, ease:'linear' }}
              style={{ display:'flex', gap:28, whiteSpace:'nowrap' }}
            >
              {tickerDouble.map((t, i) => (
                <span key={i} style={{ fontSize:10, color:'rgba(136,153,187,0.5)',
                  display:'inline-flex', alignItems:'center', gap:7, flexShrink:0 }}>
                  <span style={{ width:4, height:4, borderRadius:'50%',
                    background:'rgba(0,212,170,0.45)', display:'inline-block', flexShrink:0 }} />
                  {t}
                </span>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ══════════════════════════════
          RIGHT PANEL — LOGIN FORM
      ══════════════════════════════ */}
      <div className="flex items-center justify-center p-6 lg:p-10 relative z-10 w-full"
        style={{ maxWidth:440, background:'rgba(8,14,26,0.96)', borderLeft:'1px solid rgba(255,255,255,0.07)', minHeight:'100vh' }}>

        <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.5 }}
          className="w-full" style={{ maxWidth:380 }}>

          {/* Mobile brand */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background:'linear-gradient(135deg,#00d4aa,#1e88e5)' }}>
              <Zap size={18} color="#060b18" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontFamily:'Space Grotesk,sans-serif', color:'#00d4aa', fontSize:13, fontWeight:800, letterSpacing:1.2 }}>THOUGHTFIRST</div>
              <div style={{ fontSize:8, color:'#8899bb', letterSpacing:0.8, textTransform:'uppercase' }}>Political Intelligence OS</div>
            </div>
          </div>

          {!otpRequired ? (
            <>
              <div style={{ marginBottom:28 }}>
                <h2 style={{ color:'#f0f4ff', fontFamily:'Space Grotesk,sans-serif', fontSize:26, fontWeight:800, marginBottom:6 }}>
                  Welcome back
                </h2>
                <p style={{ color:'#8899bb', fontSize:13 }}>Sign in to your constituency dashboard</p>
              </div>

              <div className="rounded-2xl p-7" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)' }}>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl"
                        style={{ background:'rgba(255,85,85,0.1)', border:'1px solid rgba(255,85,85,0.2)', color:'#ff7777' }}>
                        <AlertCircle size={14} />
                        <span style={{ fontSize:12 }}>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label style={{ fontSize:11, fontWeight:600, color:'#8899bb', display:'block', marginBottom:6, letterSpacing:0.5, textTransform:'uppercase' }}>
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color:'#8899bb' }} />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com" autoComplete="email"
                        className="w-full pl-10 pr-4 py-3 rounded-xl"
                        style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                          color:'#f0f4ff', fontSize:13, outline:'none', fontFamily:'inherit' }}
                        onFocus={e => (e.target.style.borderColor='rgba(0,212,170,0.45)')}
                        onBlur={e  => (e.target.style.borderColor='rgba(255,255,255,0.1)')} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize:11, fontWeight:600, color:'#8899bb', display:'block', marginBottom:6, letterSpacing:0.5, textTransform:'uppercase' }}>
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color:'#8899bb' }} />
                      <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" autoComplete="current-password"
                        className="w-full pl-10 pr-11 py-3 rounded-xl"
                        style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                          color:'#f0f4ff', fontSize:13, outline:'none', fontFamily:'inherit' }}
                        onFocus={e => (e.target.style.borderColor='rgba(0,212,170,0.45)')}
                        onBlur={e  => (e.target.style.borderColor='rgba(255,255,255,0.1)')} />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color:'#8899bb' }}>
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <motion.button type="submit" disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                    style={{ background: loading ? 'rgba(0,212,170,0.35)' : 'linear-gradient(135deg,#00d4aa,#1e88e5)',
                      color:'#060b18', fontSize:13, cursor: loading ? 'not-allowed' : 'pointer',
                      border:'none', fontFamily:'inherit', fontWeight:700 }}>
                    {loading
                      ? <><div className="w-4 h-4 rounded-full border-2 animate-spin"
                          style={{ borderColor:'rgba(6,11,24,0.3)', borderTopColor:'#060b18' }} />Signing in...</>
                      : 'Sign In to ThoughtFirst'}
                  </motion.button>
                </form>

                <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ fontSize:11, color:'rgba(136,153,187,0.5)', textAlign:'center' }}>
                    No account? Contact your platform administrator.
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* OTP Screen */
            <>
              <div style={{ marginBottom:28 }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background:'rgba(0,212,170,0.12)', border:'1px solid rgba(0,212,170,0.2)' }}>
                  <ShieldCheck size={22} style={{ color:'#00d4aa' }} />
                </div>
                <h2 style={{ color:'#f0f4ff', fontFamily:'Space Grotesk,sans-serif', fontSize:24, fontWeight:800, marginBottom:6 }}>
                  Two-Factor Auth
                </h2>
                <p style={{ color:'#8899bb', fontSize:13 }}>
                  Enter the OTP sent to <strong style={{ color:'#f0f4ff' }}>{otpEmail}</strong>
                </p>
              </div>

              <div className="rounded-2xl p-7" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)' }}>
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <AnimatePresence>
                    {otpError && (
                      <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl"
                        style={{ background:'rgba(255,85,85,0.1)', border:'1px solid rgba(255,85,85,0.2)', color:'#ff7777' }}>
                        <AlertCircle size={14} />
                        <span style={{ fontSize:12 }}>{otpError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label style={{ fontSize:11, fontWeight:600, color:'#8899bb', display:'block', marginBottom:6, letterSpacing:0.5, textTransform:'uppercase' }}>
                      One-Time Password
                    </label>
                    <input value={otp} onChange={e => setOtp(e.target.value)}
                      placeholder="Enter OTP" maxLength={8}
                      className="w-full px-4 py-3 rounded-xl text-center"
                      style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                        color:'#f0f4ff', fontSize:20, outline:'none', fontFamily:'Space Grotesk,monospace',
                        letterSpacing:6, fontWeight:700 }}
                      onFocus={e => (e.target.style.borderColor='rgba(0,212,170,0.45)')}
                      onBlur={e  => (e.target.style.borderColor='rgba(255,255,255,0.1)')} />
                  </div>

                  <motion.button type="submit" disabled={otpLoading}
                    whileHover={{ scale: otpLoading ? 1 : 1.01 }} whileTap={{ scale: otpLoading ? 1 : 0.98 }}
                    className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                    style={{ background: otpLoading ? 'rgba(0,212,170,0.35)' : 'linear-gradient(135deg,#00d4aa,#1e88e5)',
                      color:'#060b18', fontSize:13, cursor: otpLoading ? 'not-allowed' : 'pointer',
                      border:'none', fontFamily:'inherit', fontWeight:700 }}>
                    {otpLoading
                      ? <><div className="w-4 h-4 rounded-full border-2 animate-spin"
                          style={{ borderColor:'rgba(6,11,24,0.3)', borderTopColor:'#060b18' }} />Verifying...</>
                      : 'Verify & Sign In'}
                  </motion.button>

                  <button type="button" onClick={handleResendOtp} disabled={otpLoading}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl transition-all"
                    style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
                      color:'#8899bb', fontSize:12, cursor: otpLoading ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                    <RefreshCw size={12} />
                    Resend OTP
                  </button>

                  <button type="button" onClick={() => { setOtpRequired(false); setOtp(''); setOtpError(''); }}
                    style={{ fontSize:11, color:'rgba(136,153,187,0.5)', background:'none', border:'none',
                      cursor:'pointer', width:'100%', textAlign:'center', fontFamily:'inherit' }}>
                    ← Back to login
                  </button>
                </form>
              </div>
            </>
          )}

          {/* Security badges */}
          <div className="flex items-center justify-center gap-4 flex-wrap" style={{ marginTop:20 }}>
            {['🔒 Encrypted','🛡️ Self-hosted','✓ PDPB Compliant','⚡ Data Sovereign'].map(b => (
              <span key={b} style={{ fontSize:10, color:'rgba(136,153,187,0.35)' }}>{b}</span>
            ))}
          </div>

          <p style={{ fontSize:10, color:'rgba(136,153,187,0.2)', textAlign:'center', marginTop:12 }}>
            © {new Date().getFullYear()} ThoughtFirst Political Intelligence
          </p>
        </motion.div>
      </div>
    </div>
  );
}
