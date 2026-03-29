import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await signIn(email, password);
    if (err) {
      setError('Invalid email or password. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#060b18' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: 'absolute', top: -300, right: -200, width: 800, height: 800,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 65%)',
          filter: 'blur(60px)'
        }} />
        <div style={{
          position: 'absolute', bottom: -300, left: -200, width: 700, height: 700,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,136,229,0.06) 0%, transparent 65%)',
          filter: 'blur(60px)'
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '30%', width: 400, height: 400,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,170,0.03) 0%, transparent 70%)',
          filter: 'blur(80px)'
        }} />
      </div>

      <div className="hidden lg:flex flex-1 flex-col justify-between p-16 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00d4aa, #1e88e5)' }}>
            <Zap size={20} color="#060b18" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-bold text-lg tracking-wide gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>NETHRA</div>
            <div style={{ fontSize: 10, color: '#8899bb', letterSpacing: '0.5px' }}>POLITICAL INTELLIGENCE</div>
          </div>
        </div>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-5xl font-bold mb-6 leading-tight" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk, sans-serif' }}>
              Political Intelligence<br />
              <span style={{ background: 'linear-gradient(135deg, #00d4aa, #1e88e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                for Modern Leaders
              </span>
            </h1>
            <p className="text-lg leading-relaxed mb-10" style={{ color: '#8899bb', maxWidth: 480 }}>
              Manage constituents, track grievances, monitor media, and gain AI-powered political insights — all in one secure platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4" style={{ maxWidth: 480 }}>
            {[
              { num: '50K+', label: 'Voters Managed' },
              { num: '98%', label: 'Grievance Resolution' },
              { num: '200+', label: 'Politicians Served' },
              { num: '24/7', label: 'AI Intelligence' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="text-2xl font-bold mb-1" style={{ color: '#00d4aa', fontFamily: 'Space Grotesk, sans-serif' }}>{stat.num}</div>
                <div style={{ fontSize: 12, color: '#8899bb' }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'rgba(136,153,187,0.4)' }}>
          &copy; {new Date().getFullYear()} Nethra Political Intelligence. All rights reserved.
        </div>
      </div>

      <div className="flex-1 lg:max-w-lg flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00d4aa, #1e88e5)' }}>
              <Zap size={18} color="#060b18" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-bold tracking-wide gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>NETHRA</div>
              <div style={{ fontSize: 9, color: '#8899bb', letterSpacing: '0.5px' }}>POLITICAL INTELLIGENCE</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk, sans-serif' }}>Welcome back</h2>
            <p style={{ color: '#8899bb', fontSize: 14 }}>Sign in to your Nethra account to continue</p>
          </div>

          <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(255,85,85,0.12)', border: '1px solid rgba(255,85,85,0.25)', color: '#ff7777' }}
                >
                  <AlertCircle size={15} />
                  <span style={{ fontSize: 13 }}>{error}</span>
                </motion.div>
              )}

              <div>
                <label className="block mb-2" style={{ fontSize: 13, fontWeight: 600, color: '#8899bb' }}>Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#8899bb' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#f0f4ff',
                      fontSize: 14,
                      outline: 'none',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(0,212,170,0.4)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: 13, fontWeight: 600, color: '#8899bb' }}>Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#8899bb' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 rounded-xl transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#f0f4ff',
                      fontSize: 14,
                      outline: 'none',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(0,212,170,0.4)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#8899bb' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                className="w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                style={{
                  background: loading ? 'rgba(0,212,170,0.4)' : 'linear-gradient(135deg, #00d4aa, #1e88e5)',
                  color: '#060b18',
                  fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  border: 'none',
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(6,11,24,0.3)', borderTopColor: '#060b18' }} />
                    Signing in...
                  </>
                ) : 'Sign In'}
              </motion.button>
            </form>

            <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontSize: 12, color: 'rgba(136,153,187,0.6)', textAlign: 'center' }}>
                Don't have an account? Contact your platform administrator.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
