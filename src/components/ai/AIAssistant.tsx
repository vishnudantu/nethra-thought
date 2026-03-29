import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, X, Minimize2, Maximize2, Copy, CheckCheck,
  RefreshCw, ChevronDown, FileText, Mic2, Newspaper, Users,
  MessageSquare, Zap, Trash2
} from 'lucide-react';
import { streamFetch } from '../../lib/api';
import { useAuth } from '../../lib/auth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

interface AIAssistantProps {
  onClose: () => void;
}

const MODES = [
  { id: 'chat', label: 'Chat', icon: MessageSquare, desc: 'General political assistant' },
  { id: 'speech', label: 'Speech', icon: Mic2, desc: 'Write speeches & addresses' },
  { id: 'briefing', label: 'Briefing', icon: Newspaper, desc: 'Political intelligence briefings' },
  { id: 'grievance_reply', label: 'Reply', icon: FileText, desc: 'Draft grievance responses' },
  { id: 'social_post', label: 'Social', icon: Users, desc: 'Social media content' },
  { id: 'talking_points', label: 'Talking Points', icon: Zap, desc: 'Key messages & points' },
];

const QUICK_PROMPTS: Record<string, string[]> = {
  chat: [
    'What are the key issues in my constituency?',
    'How can I improve my approval ratings?',
    'Analyze the political situation in Andhra Pradesh',
    'What should be my priority this month?',
  ],
  speech: [
    'Write an Independence Day speech for my constituency',
    'Write a speech for a development project inauguration',
    'Write a speech addressing farmer concerns',
    'Write a victory rally speech',
  ],
  briefing: [
    'Brief me on opposition party strategy',
    'Brief me on upcoming election risks',
    'Analyze media sentiment about my party',
    'Brief me on key policy opportunities',
  ],
  grievance_reply: [
    'Draft a reply for a road repair complaint',
    'Draft a reply for a water supply grievance',
    'Draft a reply for delayed pension payment',
    'Draft a reply for school infrastructure issue',
  ],
  social_post: [
    'Post about a new road inauguration',
    'Post about meeting farmers in my constituency',
    'Post about a welfare scheme launch',
    'Post about Independence Day celebration',
  ],
  talking_points: [
    'Key points on development achievements',
    'Talking points on education policy',
    'Points to counter opposition criticism',
    'Talking points for next press conference',
  ],
};

function generateId() {
  return Math.random().toString(36).slice(2);
}

function formatContent(content: string) {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^#{1,3}\s+(.+)$/gm, '<div style="font-weight:700;color:#f0f4ff;margin:8px 0 4px">$1</div>')
    .replace(/^[-•]\s+(.+)$/gm, '<div style="display:flex;gap:6px;margin:2px 0"><span style="color:#00d4aa;flex-shrink:0">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default function AIAssistant({ onClose }: AIAssistantProps) {
  const { activePolitician } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('chat');
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [copied, setCopied] = useState('');
  const [showModes, setShowModes] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const primaryColor = activePolitician?.color_primary || '#00d4aa';
  const secondaryColor = activePolitician?.color_secondary || '#1e88e5';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: content.trim(), id: generateId() };
    const assistantMsg: Message = { role: 'assistant', content: '', id: generateId() };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setLoading(true);

    const context = activePolitician ? {
      name: activePolitician.full_name,
      party: activePolitician.party || undefined,
      constituency: activePolitician.constituency_name || undefined,
      state: activePolitician.state || undefined,
      designation: activePolitician.designation || undefined,
    } : undefined;

    const history = messages.map(m => ({ role: m.role, content: m.content }));

    try {


      abortRef.current = new AbortController();

      const response = await streamFetch('/api/ai-assistant', {
        messages: [...history, { role: 'user', content: content.trim() }],
        politician_context: context,
        mode,
        politician_id: activePolitician?.id,
        save_content: true,
        content_type: mode,
      });

      if (!response.ok || !response.body) {
        throw new Error('AI service unavailable');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: fullContent } : m
        ));
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id
            ? { ...m, content: 'Sorry, I encountered an error. Please try again.' }
            : m
        ));
      }
    }

    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function copyMessage(content: string, id: string) {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }

  function clearChat() {
    if (loading) abortRef.current?.abort();
    setMessages([]);
    setLoading(false);
  }

  const currentMode = MODES.find(m => m.id === mode) || MODES[0];
  const ModeIcon = currentMode.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
      style={{
        width: minimized ? 320 : 420,
        height: minimized ? 'auto' : 620,
        background: '#0a1020',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: `0 0 60px ${primaryColor}20, 0 24px 48px rgba(0,0,0,0.6)`,
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)`, borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
          <Sparkles size={15} color="#060b18" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk, sans-serif' }}>NETHRA AI</div>
          <div style={{ fontSize: 10, color: primaryColor }}>Political Intelligence Assistant</div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button onClick={clearChat} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all" style={{ color: '#8899bb' }} title="Clear chat">
              <Trash2 size={13} />
            </button>
          )}
          <button onClick={() => setMinimized(!minimized)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all" style={{ color: '#8899bb' }}>
            {minimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all" style={{ color: '#8899bb' }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          <div className="px-3 py-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="relative">
              <button
                onClick={() => setShowModes(!showModes)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <ModeIcon size={13} style={{ color: primaryColor, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#f0f4ff', fontWeight: 500 }}>{currentMode.label}</span>
                <span style={{ fontSize: 11, color: '#8899bb', flex: 1, textAlign: 'left' }}>— {currentMode.desc}</span>
                <ChevronDown size={12} style={{ color: '#8899bb', transform: showModes ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
              </button>
              <AnimatePresence>
                {showModes && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10"
                    style={{ background: '#0d1628', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {MODES.map(m => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.id}
                          onClick={() => { setMode(m.id); setShowModes(false); clearChat(); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 transition-all text-left hover:bg-white/5"
                        >
                          <Icon size={13} style={{ color: mode === m.id ? primaryColor : '#8899bb', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 12, color: mode === m.id ? primaryColor : '#f0f4ff', fontWeight: 500 }}>{m.label}</div>
                            <div style={{ fontSize: 10, color: '#8899bb' }}>{m.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4" style={{ minHeight: 0 }}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)`, border: `1px solid ${primaryColor}30` }}>
                  <Sparkles size={22} style={{ color: primaryColor }} />
                </div>
                <p className="font-semibold mb-1" style={{ color: '#f0f4ff', fontSize: 14 }}>
                  How can I help you today?
                </p>
                <p style={{ fontSize: 12, color: '#8899bb', marginBottom: 16, maxWidth: 280 }}>
                  {currentMode.desc}. Try a quick prompt below.
                </p>
                <div className="space-y-2 w-full">
                  {(QUICK_PROMPTS[mode] || []).map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="w-full text-left px-3 py-2 rounded-xl transition-all text-xs"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#c0ccdd' }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                      <Sparkles size={11} color="#060b18" />
                    </div>
                  )}
                  <div
                    className="max-w-[85%] rounded-2xl px-4 py-3 relative group"
                    style={{
                      background: msg.role === 'user'
                        ? `linear-gradient(135deg, ${primaryColor}25, ${secondaryColor}25)`
                        : 'rgba(255,255,255,0.05)',
                      border: msg.role === 'user'
                        ? `1px solid ${primaryColor}30`
                        : '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    {msg.role === 'assistant' && msg.content === '' && loading ? (
                      <div className="flex gap-1 py-1">
                        {[0, 1, 2].map(i => (
                          <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                            style={{ background: primaryColor }}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }} />
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{ fontSize: 13, color: '#d0dcf0', lineHeight: 1.6 }}
                        dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                      />
                    )}
                    {msg.role === 'assistant' && msg.content && (
                      <button
                        onClick={() => copyMessage(msg.content, msg.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-md flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.3)', color: '#8899bb' }}
                      >
                        {copied === msg.id ? <CheckCheck size={11} style={{ color: primaryColor }} /> : <Copy size={11} />}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-end gap-2 rounded-2xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask NETHRA AI...`}
                rows={1}
                className="flex-1 resize-none bg-transparent outline-none"
                style={{ color: '#f0f4ff', fontSize: 13, lineHeight: 1.5, maxHeight: 100, minHeight: 20 }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: input.trim() && !loading ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` : 'rgba(255,255,255,0.08)',
                  color: input.trim() && !loading ? '#060b18' : '#8899bb',
                  cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
            <p style={{ fontSize: 10, color: 'rgba(136,153,187,0.4)', textAlign: 'center', marginTop: 6 }}>
              Powered by Supabase AI • Press Enter to send
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
}
