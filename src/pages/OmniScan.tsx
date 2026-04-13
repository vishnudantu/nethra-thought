import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Zap, Newspaper, Video, MessageSquare, Clock, Star, Plus, Trash2, Brain, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import Badge from '../components/ui/Badge';

interface OmniStatus { enabled: boolean; omni: { lastRun: string | null; lastDurationMs: number; counts: { rss: number; youtube: number; twitter: number; facebook: number; instagram: number; whatsapp: number; }; }; }
interface Mention { id: string; headline: string; source: string; sentiment: string; url: string; published_at: string; triage_urgency?: string; triage_category?: string; ai_summary?: string; }
interface Keyword { id: string; keyword: string; keyword_type: string; is_active: boolean; }

const ITEMS_PER_PAGE = 15;

export default function OmniScan() {
  const [status, setStatus] = useState<OmniStatus | null>(null);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [keywordType, setKeywordType] = useState('politician');
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triaging, setTriaging] = useState(false);
  const [triageFilter, setTriageFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [triageProgress, setTriageProgress] = useState(0);

  async function fetchAll() {
    setLoading(true);
    const [s, m, k] = await Promise.all([
      api.get('/api/omniscan/status'),
      api.list('media_mentions', { order: 'published_at', dir: 'DESC', limit: '200' }),
      api.get('/api/keywords').then(r => r.keywords || []),
    ]);
    setStatus(s as OmniStatus);
    setMentions((m as Mention[]) || []);
    setKeywords((k as Keyword[]) || []);
    setLoading(false);
  }

  async function triggerScan() {
    setTriggering(true);
    await api.post('/api/omniscan/trigger', {});
    await fetchAll();
    setTriggering(false);
  }

  async function runAITriage() {
    setTriaging(true);
    setTriageProgress(0);
    const pending = mentions.filter(m => !m.triage_urgency);
    if (pending.length === 0) { alert('All mentions triaged!'); setTriaging(false); return; }
    
    const total = Math.min(pending.length, 20);
    let processed = 0;
    
    for (const m of pending.slice(0, 20)) {
      try {
        let result;
        try {
          result = await api.post('/api/ai/triage', { text: m.headline, context: 'political_news' });
        } catch (e) {
          const text = (m.headline + ' ' + m.sentiment).toLowerCase();
          if (text.includes('threat') || text.includes('attack')) result = { urgency: 'High', category: 'Threat' };
          else if (text.includes('positive') || text.includes('success')) result = { urgency: 'Low', category: 'Positive' };
          else result = { urgency: 'Medium', category: 'Neutral' };
        }
        await api.put('/api/media_mentions/' + m.id, { triage_urgency: result.urgency, triage_category: result.category, ai_summary: result.summary || '' });
        processed++;
        setTriageProgress(Math.round((processed / total) * 100));
      } catch (e) { console.error('Triage failed:', m.id); }
    }
    await fetchAll();
    alert('AI Triage complete! Processed ' + processed + ' mentions.');
    setTriaging(false);
  }

  async function addKeyword() {
    if (!newKeyword.trim()) return;
    await api.post('/api/keywords', { keyword: newKeyword, keyword_type: keywordType });
    await fetchAll();
    setNewKeyword('');
  }
  async function deleteKeyword(id: string) { if (confirm('Delete?')) { await api.delete('/api/keywords/' + id); await fetchAll(); } }
  async function toggleKeyword(id: string, current: boolean) { await api.patch('/api/keywords/' + id + '/toggle', { is_active: !current }); await fetchAll(); }

  useEffect(() => { fetchAll(); }, []);

  const counts = status?.omni?.counts;
  const lastRun = status?.omni?.lastRun;
  const filteredMentions = triageFilter === 'All' ? mentions : mentions.filter(m => m.triage_urgency === triageFilter);
  const totalPages = Math.ceil(filteredMentions.length / ITEMS_PER_PAGE);
  const paginatedMentions = filteredMentions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const triageStats = { Critical: mentions.filter(m => m.triage_urgency === 'Critical').length, High: mentions.filter(m => m.triage_urgency === 'High').length, Medium: mentions.filter(m => m.triage_urgency === 'Medium').length, Low: mentions.filter(m => m.triage_urgency === 'Low').length, Pending: mentions.filter(m => !m.triage_urgency).length };
  const getUrgencyColor = (u: string) => u === 'Critical' ? '#ff5555' : u === 'High' ? '#ff9933' : u === 'Medium' ? '#ffcc00' : u === 'Low' ? '#00c864' : '#8899bb';
  const formatLastRun = (d: string | null) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00d4aa, #1e88e5)' }}>
            <Zap size={18} style={{ color: '#060b18' }} />
          </div>
          <div>
            <h2 className="font-bold text-xl" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>OmniScan Engine</h2>
            <p style={{ fontSize: 12, color: '#8899bb' }}>Last scan: <span style={{ color: lastRun ? '#00c864' : '#8899bb', fontWeight: 600 }}>{formatLastRun(lastRun)}</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={runAITriage} disabled={triaging || triageStats.Pending === 0}>
            <Brain size={14} /> {triaging ? 'Triaging... ' + triageProgress + '%' : 'AI Triage (' + triageStats.Pending + ')'}
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={triggerScan} disabled={triggering}>
            <RefreshCw size={14} /> {triggering ? 'Scanning...' : 'Run OmniScan'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {['Critical', 'High', 'Medium', 'Low', 'Pending'].map((label) => {
          const val = triageStats[label as keyof typeof triageStats];
          const color = getUrgencyColor(label);
          return (<div key={label} className="glass-card rounded-xl p-3 text-center cursor-pointer" onClick={() => { setTriageFilter(label); setCurrentPage(1); }} style={{ border: triageFilter === label ? '2px solid ' + color : '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 10, color: '#8899bb' }}>{label}</div>
          </div>);
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ label: 'RSS', value: counts?.rss ?? 0, color: '#42a5f5' }, { label: 'YouTube', value: counts?.youtube ?? 0, color: '#ef5350' }, { label: 'Social', value: (counts?.twitter ?? 0) + (counts?.facebook ?? 0), color: '#00c864' }, { label: 'WhatsApp', value: counts?.whatsapp ?? 0, color: '#00d4aa' }].map((c) => (
          <div key={c.label} className="glass-card rounded-2xl p-4">
            <div style={{ fontSize: 11, color: '#8899bb', marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: c.color, fontFamily: 'Space Grotesk' }}>{loading ? '...' : c.value}</div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Star size={16} style={{ color: '#00d4aa' }} /><h3 className="font-semibold" style={{ color: '#f0f4ff' }}>Tracked Keywords</h3></div>
          <div className="flex gap-2">
            <select value={keywordType} onChange={e => setKeywordType(e.target.value)} className="input-field" style={{ fontSize: 11, padding: '6px 10px' }}>
              <option value="politician">Politician</option><option value="party">Party</option><option value="constituency">Constituency</option>
            </select>
            <input value={newKeyword} onChange={e => setNewKeyword(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKeyword()} placeholder="Add keyword..." className="input-field" style={{ fontSize: 11, padding: '6px 10px', width: 150 }} />
            <button onClick={addKeyword} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#00d4aa', color: '#060b18' }}>Add</button>
          </div>
        </div>
        {keywords.length === 0 ? (<div style={{ color: '#8899bb', fontSize: 12, textAlign: 'center', padding: 20 }}>No keywords tracked</div>) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2" style={{ maxHeight: 200, overflowY: 'auto' }}>
            {keywords.map((k: any) => (<div key={k.id} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', opacity: k.is_active ? 1 : 0.5 }}>
              <div className="flex items-center gap-2"><span style={{ fontSize: 12, color: '#f0f4ff' }}>{k.keyword}</span><span className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(0,212,170,0.2)', color: '#00d4aa', fontSize: 9 }}>{k.keyword_type}</span></div>
              <div className="flex gap-1">
                <button onClick={() => toggleKeyword(k.id, k.is_active)} className="p-1 rounded hover:bg-white/10" style={{ color: k.is_active ? '#00d4aa' : '#8899bb' }}>{k.is_active ? '⏸' : '▶'}</button>
                <button onClick={() => deleteKeyword(k.id)} className="p-1 rounded hover:bg-red-500/20" style={{ color: '#ff5555' }}>🗑</button>
              </div>
            </div>))}
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: '#f0f4ff' }}>Latest Mentions ({filteredMentions.length}){triageFilter !== 'All' && <span style={{ color: getUrgencyColor(triageFilter), marginLeft: 8 }}>• {triageFilter}</span>}</h3>
          {totalPages > 1 && (<div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30"><ChevronLeft size={16} /></button>
            <span style={{ fontSize: 12, color: '#8899bb' }}>Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>)}
        </div>
        <div className="space-y-3">
          {loading ? [1,2,3].map(i => <div key={i} className="shimmer h-14 rounded-xl" />) : paginatedMentions.map((m) => (
            <div key={m.id} className="glass-card-hover rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}><Newspaper size={14} style={{ color: '#8899bb' }} /></div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }} className="line-clamp-2">{m.headline}</div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span style={{ fontSize: 11, color: '#8899bb' }}>{m.source}</span>
                    <Badge variant={m.sentiment === 'Positive' ? 'success' : m.sentiment === 'Negative' ? 'danger' : 'neutral'}>{m.sentiment}</Badge>
                    {m.triage_urgency && (<span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: getUrgencyColor(m.triage_urgency) + '20', color: getUrgencyColor(m.triage_urgency), fontWeight: 700 }}>{m.triage_urgency}</span>)}
                    <span style={{ fontSize: 11, color: '#6677aa' }}>{new Date(m.published_at).toLocaleString('en-IN')}</span>
                  </div>
                  {m.ai_summary && <div style={{ fontSize: 11, color: '#8899bb', marginTop: 6, fontStyle: 'italic' }}>{m.ai_summary}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00d4aa, #1e88e5)' }}>
            <Zap size={18} style={{ color: '#060b18' }} />
          </div>
          <div>
            <h2 className="font-bold text-xl" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>OmniScan Engine</h2>
            <p style={{ fontSize: 12, color: '#8899bb' }}>Last scan: <span style={{ color: lastRun ? '#00c864' : '#8899bb', fontWeight: 600 }}>{formatLastRun(lastRun)}</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={runAITriage} disabled={triaging || triageStats.Pending === 0}>
            <Brain size={14} /> {triaging ? 'Triaging... ' + triageProgress + '%' : 'AI Triage (' + triageStats.Pending + ')'}
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={triggerScan} disabled={triggering}>
            <RefreshCw size={14} /> {triggering ? 'Scanning...' : 'Run OmniScan'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {['Critical', 'High', 'Medium', 'Low', 'Pending'].map((label) => (
          <div key={label} className="glass-card rounded-xl p-3 text-center cursor-pointer hover:bg-white/5" onClick={() => { setTriageFilter(label); setCurrentPage(1); }}
            style={{ border: triageFilter === label ? '2px solid ' + getUrgencyColor(label) : '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: getUrgencyColor(label) }}>{triageStats[label]}</div>
            <div style={{ fontSize: 10, color: '#8899bb' }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ label: 'RSS', value: counts?.rss ?? 0, color: '#42a5f5' }, { label: 'YouTube', value: counts?.youtube ?? 0, color: '#ef5350' }, { label: 'Social', value: (counts?.twitter ?? 0) + (counts?.facebook ?? 0), color: '#00c864' }, { label: 'WhatsApp', value: counts?.whatsapp ?? 0, color: '#00d4aa' }].map((c) => (
          <div key={c.label} className="glass-card rounded-2xl p-4">
            <div style={{ fontSize: 11, color: '#8899bb', marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: c.color, fontFamily: 'Space Grotesk' }}>{loading ? '...' : c.value}</div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Star size={16} style={{ color: '#00d4aa' }} /><h3 className="font-semibold" style={{ color: '#f0f4ff' }}>Tracked Keywords</h3></div>
          <div className="flex gap-2">
            <select value={keywordType} onChange={e => setKeywordType(e.target.value)} className="input-field" style={{ fontSize: 11, padding: '6px 10px' }}>
              <option value="politician">Politician</option><option value="party">Party</option><option value="constituency">Constituency</option>
            </select>
            <input value={newKeyword} onChange={e => setNewKeyword(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKeyword()} placeholder="Add keyword..." className="input-field" style={{ fontSize: 11, padding: '6px 10px', width: 150 }} />
            <button onClick={addKeyword} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#00d4aa', color: '#060b18' }}>Add</button>
          </div>
        </div>
        {keywords.length === 0 ? (<div style={{ color: '#8899bb', fontSize: 12, textAlign: 'center', padding: 20 }}>No keywords tracked</div>) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2" style={{ maxHeight: 200, overflowY: 'auto' }}>
            {keywords.map((k) => (
              <div key={k.id} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', opacity: k.is_active ? 1 : 0.5 }}>
                <div className="flex items-center gap-2"><span style={{ fontSize: 12, color: '#f0f4ff' }}>{k.keyword}</span><span className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(0,212,170,0.2)', color: '#00d4aa', fontSize: 9 }}>{k.keyword_type}</span></div>
                <div className="flex gap-1">
                  <button onClick={() => toggleKeyword(k.id, k.is_active)} className="p-1 rounded" style={{ color: k.is_active ? '#00d4aa' : '#8899bb' }}>{k.is_active ? '⏸' : '▶'}</button>
                  <button onClick={() => deleteKeyword(k.id)} className="p-1 rounded" style={{ color: '#ff5555' }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: '#f0f4ff' }}>Latest Mentions ({filteredMentions.length})</h3>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded hover:bg-white/10 disabled:opacity-30"><ChevronLeft size={16} /></button>
              <span style={{ fontSize: 12, color: '#8899bb' }}>Page {currentPage}/{totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded hover:bg-white/10 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          )}
        </div>
        <div className="space-y-3">
          {loading ? [1,2,3].map(i => <div key={i} className="shimmer h-14 rounded-xl" />) : paginatedMentions.length === 0 ? (
            <div style={{ color: '#8899bb', fontSize: 12, textAlign: 'center', padding: 40 }}>No mentions</div>
          ) : (
            paginatedMentions.map((m) => (
              <div key={m.id} className="glass-card-hover rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}><Newspaper size={14} style={{ color: '#8899bb' }} /></div>
                  <div className="flex-1">
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>{m.headline}</div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span style={{ fontSize: 11, color: '#8899bb' }}>{m.source}</span>
                      <Badge variant={m.sentiment === 'Positive' ? 'success' : m.sentiment === 'Negative' ? 'danger' : 'neutral'}>{m.sentiment}</Badge>
                      {m.triage_urgency && <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: getUrgencyColor(m.triage_urgency) + '20', color: getUrgencyColor(m.triage_urgency) }}>{m.triage_urgency}</span>}
                      <span style={{ fontSize: 11, color: '#6677aa' }}>{new Date(m.published_at).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
