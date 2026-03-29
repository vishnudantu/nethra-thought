import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Map, Building, Landmark, Phone, Globe, Activity } from 'lucide-react';
import { api } from '../lib/api';
import type { Constituency as ConstType } from '../lib/types';

const highlights = [
  { label: 'Lok Sabha Seat', value: 'Guntur', detail: 'Andhra Pradesh - 16' },
  { label: 'State', value: 'Andhra Pradesh', detail: 'Southern India' },
  { label: 'Parliament Sessions', value: '3 per year', detail: 'Budget, Monsoon, Winter' },
  { label: 'MPLAD Funds', value: '₹5 Cr/year', detail: 'Development allocation' },
  { label: 'District', value: 'Guntur', detail: 'Administrative center' },
  { label: 'Revenue Division', value: '4 Divisions', detail: 'Guntur, Sattenapalle, Ponnur, Mangalagiri' },
];

const demographics = [
  { label: 'SC Population', value: '18.2%', color: '#42a5f5' },
  { label: 'ST Population', value: '4.1%', color: '#ffa726' },
  { label: 'OBC Population', value: '47.3%', color: '#00c864' },
  { label: 'General', value: '30.4%', color: '#00d4aa' },
];

const keyIndustries = [
  { name: 'Agriculture & Farming', icon: '🌾', desc: 'Paddy, cotton, chilli cultivation' },
  { name: 'Textile Industry', icon: '🧵', desc: 'Langa voni, handloom weaving' },
  { name: 'Education Hub', icon: '📚', desc: 'Acharya Nagarjuna University, NIT' },
  { name: 'Pharmaceutical', icon: '💊', desc: 'API manufacturing, pharma parks' },
  { name: 'Tobacco Industry', icon: '🌿', desc: 'Cigarette manufacturing, ITC Guntur' },
  { name: 'Construction', icon: '🏗️', desc: 'Real estate, infrastructure growth' },
];

export default function Constituency() {
  const [constituency, setConstituency] = useState<ConstType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConstituency() {
      const rows = await api.list('constituencies');
      const data = rows[0] || null;
      setConstituency(data);
      setLoading(false);
    }
    fetchConstituency();
  }, []);

  const statCards = constituency ? [
    { label: 'Total Voters', value: (constituency.total_voters / 100000).toFixed(1) + 'L', icon: Users, color: '#42a5f5' },
    { label: 'Registered', value: (constituency.registered_voters / 100000).toFixed(1) + 'L', icon: Users, color: '#00d4aa' },
    { label: 'Area (sq km)', value: constituency.area_sqkm.toLocaleString(), icon: Map, color: '#ffa726' },
    { label: 'Population', value: (constituency.population / 100000).toFixed(1) + 'L', icon: Users, color: '#00c864' },
    { label: 'Mandals', value: constituency.mandals, icon: Building, color: '#ef5350' },
    { label: 'Villages', value: constituency.villages, icon: MapPin, color: '#ab47bc' },
  ] : [];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(0,212,170,0.08) 0%, transparent 60%)' }} />
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Landmark size={24} style={{ color: '#00d4aa' }} />
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
                {loading ? 'Loading...' : constituency?.name || 'Guntur'} Constituency
              </h2>
            </div>
            <p style={{ color: '#8899bb', fontSize: 14 }}>
              {loading ? '' : `${constituency?.state} | Represented by ${constituency?.mp_name} (${constituency?.party})`}
            </p>
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)' }}>
                <Activity size={14} style={{ color: '#00d4aa' }} />
                <span style={{ fontSize: 12, color: '#00d4aa', fontWeight: 600 }}>Active • Lok Sabha</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Globe size={14} style={{ color: '#8899bb' }} />
                <span style={{ fontSize: 12, color: '#8899bb' }}>18th Lok Sabha (2024-2029)</span>
              </div>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/320px-Flag_of_India.svg.png"
              alt="India Flag" style={{ width: 64, borderRadius: 8, opacity: 0.8 }} />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {loading ? Array(6).fill(0).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-4">
            <div className="shimmer h-8 w-16 rounded mb-2" />
            <div className="shimmer h-3 w-full rounded" />
          </div>
        )) : statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass-card rounded-2xl p-4 text-center"
            >
              <Icon size={18} style={{ color: card.color, margin: '0 auto 8px' }} />
              <div style={{ fontSize: 22, fontWeight: 800, color: card.color, fontFamily: 'Space Grotesk' }}>{card.value}</div>
              <div style={{ fontSize: 11, color: '#8899bb', marginTop: 2 }}>{card.label}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-5"
        >
          <h3 className="font-semibold mb-4" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk', fontSize: 15 }}>
            Key Facts
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {highlights.map((h, i) => (
              <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff' }}>{h.value}</div>
                <div style={{ fontSize: 11, color: '#00d4aa', marginTop: 1 }}>{h.label}</div>
                <div style={{ fontSize: 10, color: '#8899bb', marginTop: 2 }}>{h.detail}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <h3 className="font-semibold mb-4" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk', fontSize: 15 }}>
            Demographics
          </h3>
          <div className="space-y-4">
            {demographics.map((d, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.08 }}>
                <div className="flex justify-between mb-1.5">
                  <span style={{ fontSize: 13, color: '#f0f4ff' }}>{d.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: d.color }}>{d.value}</span>
                </div>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    style={{ background: d.color }}
                    initial={{ width: 0 }}
                    animate={{ width: d.value }}
                    transition={{ delay: 0.5 + i * 0.08, duration: 0.8 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-5"
      >
        <h3 className="font-semibold mb-4" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk', fontSize: 15 }}>
          Key Industries & Economy
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {keyIndustries.map((ind, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.07 }}
              className="p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{ind.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff', marginBottom: 4 }}>{ind.name}</div>
              <div style={{ fontSize: 11, color: '#8899bb' }}>{ind.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
