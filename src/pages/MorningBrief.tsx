import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, FileText, AlertTriangle, Calendar } from 'lucide-react';
import { api } from '../lib/api';

interface Briefing {
  id: string;
  title: string;
  summary: string;
  content: string;
  briefing_date: string;
  priority: string;
  created_at: string;
}

export default function MorningBrief() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function fetchBriefing() {
    setLoading(true);
    const data = await api.get('/api/briefing/today');
    setBriefing(data as Briefing);
    setLoading(false);
  }

  async function generateBrief() {
    setGenerating(true);
    await api.post('/api/briefing/generate', {});
    await fetchBriefing();
    setGenerating(false);
  }

  useEffect(() => { fetchBriefing(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00d4aa, #1e88e5)' }}>
            <Sparkles size={18} style={{ color: '#060b18' }} />
          </div>
          <div>
            <h2 className="font-bold text-xl" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Morning Brief</h2>
            <p style={{ fontSize: 12, color: '#8899bb' }}>Daily intelligence summary for today</p>
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={generateBrief} disabled={generating}>
          <RefreshCw size={14} /> {generating ? 'Generating...' : 'Generate Brief'}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5"
      >
        {loading ? (
          <div className="space-y-3">
            <div className="shimmer h-5 w-1/2 rounded" />
            <div className="shimmer h-4 w-2/3 rounded" />
            <div className="shimmer h-40 rounded-xl" />
          </div>
        ) : briefing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <FileText size={16} style={{ color: '#00d4aa' }} />
              <h3 className="font-semibold" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>{briefing.title}</h3>
              <span className="px-2 py-0.5 rounded-lg text-xs"
                style={{ background: 'rgba(255,167,38,0.12)', color: '#ffa726' }}>
                {briefing.priority}
              </span>
              <div className="flex items-center gap-1 text-xs" style={{ color: '#8899bb' }}>
                <Calendar size={12} /> {new Date(briefing.briefing_date).toLocaleDateString('en-IN')}
              </div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 12, color: '#8899bb', marginBottom: 4 }}>Summary</div>
              <div style={{ fontSize: 13, color: '#f0f4ff' }}>{briefing.summary}</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.15)' }}>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#d0d8f0', lineHeight: 1.8 }}>
                {briefing.content}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <AlertTriangle size={32} style={{ color: '#ffa726', margin: '0 auto 10px' }} />
            <div style={{ color: '#f0f4ff', fontWeight: 600 }}>No briefing generated yet</div>
            <div style={{ color: '#8899bb', fontSize: 13 }}>Click "Generate Brief" to create today’s briefing.</div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
