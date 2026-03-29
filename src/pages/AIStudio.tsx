import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, RefreshCw, Copy, CheckCheck, Save, Trash2,
  FileText, Mic2, Newspaper, Users, Zap, MessageSquare, Search,
  BookOpen, Star, ChevronRight, X, Download
} from 'lucide-react';
import { api, streamFetch } from '../lib/api';
import { useAuth } from '../lib/auth';

interface GeneratedContent {
  id: string;
  content_type: string;
  prompt: string;
  content: string;
  is_saved: boolean;
  created_at: string;
  tags: string[];
}

const CONTENT_TYPES = [
  { id: 'speech', label: 'Speech Writer', icon: Mic2, color: '#00d4aa', desc: 'Generate powerful speeches for any occasion', placeholder: 'e.g. Write an Independence Day speech focusing on infrastructure development in my constituency...' },
  { id: 'press_release', label: 'Press Release', icon: Newspaper, color: '#1e88e5', desc: 'Professional press releases for media', placeholder: 'e.g. Write a press release about the inauguration of a new hospital in the constituency...' },
  { id: 'talking_points', label: 'Talking Points', icon: Zap, color: '#ff9800', desc: 'Crisp key messages for interviews & debates', placeholder: 'e.g. Generate talking points defending the government\'s agricultural policy...' },
  { id: 'social_post', label: 'Social Media', icon: Users, color: '#e91e63', desc: 'Engaging content for all social platforms', placeholder: 'e.g. Create posts celebrating the completion of 100 new homes under PMAY...' },
  { id: 'grievance_reply', label: 'Grievance Reply', icon: FileText, color: '#9c27b0', desc: 'Empathetic official constituent responses', placeholder: 'e.g. Draft a reply to a farmer complaining about irrigation water supply being cut off...' },
  { id: 'briefing', label: 'Political Briefing', icon: BookOpen, color: '#4caf50', desc: 'Comprehensive intelligence briefings', placeholder: 'e.g. Brief me on the opposition party\'s strategy ahead of the upcoming by-elections...' },
  { id: 'analysis', label: 'Strategic Analysis', icon: MessageSquare, color: '#00bcd4', desc: 'Deep political analysis and strategy', placeholder: 'e.g. Analyze the political impact of the new reservation policy announcement...' },
];

const TYPE_LABELS: Record<string, string> = Object.fromEntries(CONTENT_TYPES.map(t => [t.id, t.label]));

function formatContent(content: string) {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f0f4ff">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^#{1,3}\s+(.+)$/gm, '<div style="font-weight:700;color:#f0f4ff;font-size:15px;margin:12px 0 6px;font-family:Space Grotesk,sans-serif">$1</div>')
    .replace(/^[-•]\s+(.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0;padding-left:4px"><span style="color:#00d4aa;flex-shrink:0;margin-top:2px">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default function AIStudio() {
  const { activePolitician } = useAuth();
  const [activeType, setActiveType] = useState('speech');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState('');
  const [savedItems, setSavedItems] = useState<GeneratedContent[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentContentId, setCurrentContentId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const primaryColor = activePolitician?.color_primary || '#00d4aa';
  const secondaryColor = activePolitician?.color_secondary || '#1e88e5';
  const currentType = CONTENT_TYPES.find(t => t.id === activeType) || CONTENT_TYPES[0];

  const fetchHistory = useCallback(async () => {
    if (!activePolitician?.id) return;
    setLoadingHistory(true);
    const data = await api.list('ai_generated_content', { order: 'created_at', dir: 'DESC', limit: '50' }) as GeneratedContent[];
    setSavedItems(data.filter(item => item.is_saved));
    setLoadingHistory(false);
  }, [activePolitician?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  async function generate() {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setOutput('');
    setCurrentContentId(null);

    const context = activePolitician ? {
      name: activePolitician.full_name,
      party: activePolitician.party || undefined,
      constituency: activePolitician.constituency_name || undefined,
      state: activePolitician.state || undefined,
      designation: activePolitician.designation || undefined,
    } : undefined;

    try {
      const token = localStorage.getItem('nethra_token');
      if (!token) throw new Error('Not authenticated');

      abortRef.current = new AbortController();

      const response = await streamFetch('/api/ai-assistant', {
        messages: [{ role: 'user', content: prompt }],
        politician_context: context,
        mode: activeType,
        politician_id: activePolitician?.id,
        save_content: false,
      });

      if (!response.ok || !response.body) throw new Error('AI service unavailable');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setOutput(full);
      }

      if (full && activePolitician?.id) {
        const created = await api.create('ai_generated_content', {
          politician_id: activePolitician.id,
          content_type: activeType,
          prompt: prompt.slice(0, 500),
          content: full,
          is_saved: false,
        }) as GeneratedContent;
        if (created?.id) setCurrentContentId(created.id);
      }
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error?.name !== 'AbortError') {
        setOutput('Error generating content. Please try again.');
      }
    }
    setGenerating(false);
  }

  async function saveContent() {
    if (!currentContentId) return;
    setSaving(true);
    await api.update('ai_generated_content', currentContentId, { is_saved: true });
    await fetchHistory();
    setSaving(false);
  }

  async function deleteContent(id: string) {
    await api.remove('ai_generated_content', id);
    setSavedItems(prev => prev.filter(i => i.id !== id));
  }

  function copyOutput() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadOutput() {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeType}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredHistory = savedItems.filter(item => {
    const matchType = filterType === 'all' || item.content_type === filterType;
    const matchSearch = !searchQuery ||
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="h-full flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
            <Sparkles size={18} color="#060b18" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk, sans-serif' }}>AI Studio</h1>
            <p style={{ fontSize: 12, color: '#8899bb' }}>Generate speeches, briefings, social content and more</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5" style={{ flex: 1, minHeight: 0 }}>
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="flex gap-2 flex-wrap">
            {CONTENT_TYPES.map(type => {
              const Icon = type.icon;
              const isActive = activeType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => { setActiveType(type.id); setOutput(''); setCurrentContentId(null); setPrompt(''); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
                  style={{
                    background: isActive ? `${type.color}18` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isActive ? type.color + '40' : 'rgba(255,255,255,0.08)'}`,
                    color: isActive ? type.color : '#8899bb',
                  }}
                >
                  <Icon size={13} />
                  <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400 }}>{type.label}</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl flex flex-col" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', flex: 1 }}>
            <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-1">
                <currentType.icon size={14} style={{ color: currentType.color }} />
                <span className="font-semibold" style={{ fontSize: 13, color: '#f0f4ff' }}>{currentType.label}</span>
                <span style={{ fontSize: 12, color: '#8899bb' }}>— {currentType.desc}</span>
              </div>
              <div className="relative mt-3">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) generate(); }}
                  placeholder={currentType.placeholder}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl resize-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f0f4ff', fontSize: 13, outline: 'none', lineHeight: 1.6,
                  }}
                />
                <div className="flex items-center justify-between mt-2">
                  <span style={{ fontSize: 11, color: 'rgba(136,153,187,0.4)' }}>
                    {activePolitician ? `Context: ${activePolitician.full_name} • ${activePolitician.constituency_name}` : ''} • Cmd+Enter to generate
                  </span>
                  <motion.button
                    onClick={generating ? () => abortRef.current?.abort() : generate}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold"
                    style={{
                      background: generating
                        ? 'rgba(255,85,85,0.15)'
                        : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      color: generating ? '#ff7777' : '#060b18',
                      fontSize: 13,
                      border: generating ? '1px solid rgba(255,85,85,0.3)' : 'none',
                    }}
                  >
                    {generating ? (
                      <><X size={13} /> Stop</>
                    ) : (
                      <><Sparkles size={13} /> Generate</>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="flex-1 relative p-4 overflow-auto" style={{ minHeight: 200, maxHeight: 400 }}>
              {!output && !generating && (
                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: `${currentType.color}15`, border: `1px solid ${currentType.color}25` }}>
                    <currentType.icon size={22} style={{ color: currentType.color }} />
                  </div>
                  <p style={{ fontSize: 13, color: '#8899bb', maxWidth: 300 }}>
                    Describe what you need above and click Generate. AI will create content tailored to {activePolitician?.full_name || 'your'} profile.
                  </p>
                </div>
              )}
              {(output || generating) && (
                <div>
                  <div
                    style={{ fontSize: 14, color: '#c8d4e8', lineHeight: 1.8 }}
                    dangerouslySetInnerHTML={{ __html: output ? formatContent(output) : '' }}
                  />
                  {generating && (
                    <div className="flex gap-1 mt-2">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                          style={{ background: primaryColor }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {output && !generating && (
              <div className="flex items-center gap-2 p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={copyOutput} className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all" style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb', fontSize: 12 }}>
                  {copied ? <><CheckCheck size={13} style={{ color: primaryColor }} /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
                <button onClick={downloadOutput} className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all" style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb', fontSize: 12 }}>
                  <Download size={13} /> Download
                </button>
                <button
                  onClick={saveContent}
                  disabled={saving || !currentContentId}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all ml-auto"
                  style={{
                    background: `${primaryColor}15`,
                    border: `1px solid ${primaryColor}30`,
                    color: primaryColor, fontSize: 12,
                    opacity: !currentContentId ? 0.5 : 1,
                  }}
                >
                  {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                  {saving ? 'Saving...' : 'Save to Library'}
                </button>
                <button onClick={() => { setOutput(''); setCurrentContentId(null); }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all" style={{ color: '#8899bb' }}>
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <BookOpen size={14} style={{ color: primaryColor }} />
              <span className="font-semibold" style={{ fontSize: 13, color: '#f0f4ff' }}>Saved Library</span>
            </div>
            <span style={{ fontSize: 11, color: '#8899bb' }}>{savedItems.length} items</span>
          </div>

          <div className="p-3 space-y-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Search size={12} style={{ color: '#8899bb' }} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search saved content..."
                className="flex-1 bg-transparent outline-none" style={{ fontSize: 12, color: '#f0f4ff' }} />
            </div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: '#8899bb', outline: 'none' }}
            >
              <option value="all">All Types</option>
              {CONTENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingHistory ? (
              <div className="py-8 text-center" style={{ color: '#8899bb', fontSize: 12 }}>
                <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                Loading...
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="py-10 text-center px-4">
                <Star size={28} className="mx-auto mb-2 opacity-20" style={{ color: '#8899bb' }} />
                <p style={{ fontSize: 12, color: '#8899bb' }}>
                  {savedItems.length === 0 ? 'No saved content yet. Generate and save content to build your library.' : 'No results match your filter.'}
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {filteredHistory.map(item => {
                  const typeInfo = CONTENT_TYPES.find(t => t.id === item.content_type);
                  const Icon = typeInfo?.icon || FileText;
                  return (
                    <div key={item.id} className="p-3 hover:bg-white/[0.02] transition-all group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Icon size={12} style={{ color: typeInfo?.color || '#8899bb', flexShrink: 0, marginTop: 2 }} />
                          <div className="min-w-0">
                            <div className="truncate" style={{ fontSize: 12, color: '#f0f4ff', fontWeight: 500 }}>
                              {item.prompt.slice(0, 60)}{item.prompt.length > 60 ? '...' : ''}
                            </div>
                            <div style={{ fontSize: 10, color: '#8899bb', marginTop: 1 }}>
                              {TYPE_LABELS[item.content_type]} • {new Date(item.created_at).toLocaleDateString('en-IN')}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteContent(item.id)}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
                          style={{ color: '#ff5555', background: 'rgba(255,85,85,0.1)' }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <button
                        onClick={() => { setOutput(item.content); setActiveType(item.content_type); setPrompt(item.prompt); setCurrentContentId(item.id); }}
                        className="mt-2 w-full text-left px-2 py-1.5 rounded-lg transition-all flex items-center gap-1"
                        style={{ background: 'rgba(255,255,255,0.04)', color: '#8899bb', fontSize: 11 }}
                      >
                        <ChevronRight size={11} />
                        View & Edit
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
