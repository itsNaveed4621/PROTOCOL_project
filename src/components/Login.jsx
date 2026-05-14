import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, User, Key, Eye, EyeOff, ArrowRight, Shield, Activity, Globe, Lock } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [identity, setIdentity] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      if (identity === 'user' && token === 'user123') {
        onLogin();
      } else {
        setError('Invalid identity or access token.');
        setLoading(false);
      }
    }, 1200);
  };

  const stats = [
    { icon: Activity, label: 'Network', val: 'Mainnet', col: '#10b981' },
    { icon: Globe, label: 'Protocol', val: 'Flash v2', col: '#6366f1' },
    { icon: Shield, label: 'Security', val: 'AES-256', col: '#06b6d4' },
    { icon: Lock, label: 'Status', val: 'Secured', col: '#f59e0b' },
  ];

  return (
    <div style={s.root}>
      {/* Animated BG */}
      <div style={s.bg} />
      <div style={s.grid} />
      <Orbs />
      <Particles />

      <div style={s.layout}>
        {/* LEFT PANEL */}
        <motion.div
          style={s.left}
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo */}
          <div style={s.logoWrap}>
            <motion.div
              style={s.logoBox}
              animate={{ boxShadow: ['0 0 30px #6366f180', '0 0 60px #6366f1cc', '0 0 30px #6366f180'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <Zap size={40} color="#fff" fill="#fff" />
            </motion.div>
            <div>
              <h1 style={s.brand}>FLASH PROTOCOL</h1>
              <div style={s.brandSub}>v2.0 — Mainnet Active</div>
            </div>
          </div>

          {/* Tagline */}
          <div style={s.tagline}>
            <h2 style={s.tagH}>The Future of<br /><span style={s.tagGrad}>Flash Transfers</span></h2>
            <p style={s.tagP}>Blazing-fast USDT transfers across ERC-20, TRC-20 & BEP-20 networks. Secure. Instant. Unstoppable.</p>
          </div>

          {/* Stats grid */}
          <div style={s.statsGrid}>
            {stats.map(({ icon: Icon, label, val, col }) => (
              <motion.div key={label} style={{ ...s.statCard, borderColor: col + '30' }}
                whileHover={{ scale: 1.04, borderColor: col + '80' }}>
                <Icon size={16} color={col} style={{ marginBottom: 6 }} />
                <div style={{ ...s.statVal, color: col }}>{val}</div>
                <div style={s.statLabel}>{label}</div>
              </motion.div>
            ))}
          </div>

          {/* Live time */}
          <div style={s.timeBadge}>
            <div style={s.timeDot} />
            <span style={s.timeText}>
              {now.toLocaleTimeString('en-US', { hour12: false })}
              <span style={{ color: '#475569', margin: '0 8px' }}>|</span>
              {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </motion.div>

        {/* RIGHT PANEL — Login form */}
        <motion.div
          style={s.right}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={s.card}>
            <div style={s.cardBar} />

            <div style={s.cardBody}>
              {/* Card header */}
              <div style={s.cardHeader}>
                <div style={s.cardTitle}>Secure Access</div>
                <div style={s.cardSub}>Enter your credentials to access the protocol</div>
              </div>

              <form onSubmit={handleSubmit} style={s.form}>
                {/* Identity */}
                <Field label="Identity" icon={User} focused={focused === 'id'} color="#6366f1">
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focused === 'id' ? '#6366f1' : '#334155', transition: 'color 0.3s', pointerEvents: 'none', zIndex: 1 }}>
                      <User size={15} />
                    </div>
                    <input
                      type="text"
                      value={identity}
                      placeholder="Enter your identity"
                      onChange={e => setIdentity(e.target.value)}
                      onFocus={() => setFocused('id')}
                      onBlur={() => setFocused(null)}
                      required
                      style={{ ...s.input, ...(focused === 'id' ? s.inputFocused : {}) }}
                    />
                  </div>
                </Field>

                {/* Access Token */}
                <Field label="Access Token" icon={Key} focused={focused === 'tok'} color="#8b5cf6">
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focused === 'tok' ? '#8b5cf6' : '#334155', transition: 'color 0.3s', pointerEvents: 'none', zIndex: 1 }}>
                      <Key size={15} />
                    </div>
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={token}
                      placeholder="••••••••••••"
                      onChange={e => setToken(e.target.value)}
                      onFocus={() => setFocused('tok')}
                      onBlur={() => setFocused(null)}
                      required
                      style={{ ...s.input, paddingRight: 48, ...(focused === 'tok' ? { ...s.inputFocused, borderColor: '#8b5cf670', boxShadow: '0 0 0 3px #8b5cf620' } : {}) }}
                    />
                    <button type="button" onClick={() => setShowToken(!showToken)} style={s.eyeBtn}>
                      {showToken ? <EyeOff size={15} color="#64748b" /> : <Eye size={15} color="#64748b" />}
                    </button>
                  </div>
                </Field>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div style={s.errBox}
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      ⚠ {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  style={s.btn}
                  whileHover={{ scale: loading ? 1 : 1.02, boxShadow: '0 0 50px #6366f180' }}
                  whileTap={{ scale: loading ? 1 : 0.97 }}
                >
                  <div style={s.btnShimmer} />
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={s.spinner} /> Authenticating...
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      Access Protocol <ArrowRight size={18} />
                    </span>
                  )}
                </motion.button>
              </form>

              <div style={s.footer}>
                <Shield size={11} color="#6366f1" />
                <span style={s.footerText}>256-bit Encrypted · Secure Session · Flash Protocol</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }
        input { font-family: 'Inter', sans-serif; }
        input:focus { outline: none; }
        button { cursor: pointer; font-family: 'Inter', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

/* ─── Field wrapper ─── */
const Field = ({ label, icon: Icon, focused, color, children }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: focused ? color : '#475569', marginBottom: 8, transition: 'color 0.3s' }}>
      <Icon size={11} />
      {label}
    </label>
    {children}
  </div>
);

/* ─── Orbs ─── */
const Orbs = () => (
  <>
    {[
      { x: '8%', y: '15%', size: 500, c: '#6366f1' },
      { x: '80%', y: '60%', size: 400, c: '#8b5cf6' },
      { x: '50%', y: '85%', size: 350, c: '#06b6d4' },
      { x: '15%', y: '75%', size: 280, c: '#10b981' },
    ].map((o, i) => (
      <div key={i} style={{
        position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
        left: o.x, top: o.y, width: o.size, height: o.size,
        background: `radial-gradient(circle, ${o.c}18, transparent 70%)`,
        transform: 'translate(-50%,-50%)',
        filter: 'blur(10px)',
      }} />
    ))}
  </>
);

/* ─── Particles ─── */
const Particles = () => {
  const cols = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {Array.from({ length: 25 }, (_, i) => {
        const col = cols[i % cols.length];
        const size = Math.random() * 3 + 1;
        return (
          <motion.div key={i} style={{
            position: 'absolute', borderRadius: '50%', opacity: 0.5,
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            width: size, height: size, background: col,
            boxShadow: `0 0 ${size * 4}px ${col}`,
          }}
            animate={{ y: [0, -25, 0], opacity: [0.2, 0.7, 0.2], scale: [1, 1.6, 1] }}
            transition={{ duration: Math.random() * 6 + 4, delay: Math.random() * 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        );
      })}
    </div>
  );
};

/* ─── Styles ─── */
const s = {
  root: {
    position: 'fixed', inset: 0, display: 'flex', alignItems: 'stretch',
    fontFamily: 'Inter, sans-serif', overflow: 'hidden',
  },
  bg: {
    position: 'absolute', inset: 0, zIndex: 0,
    background: 'linear-gradient(135deg, #020617 0%, #0a0e1a 40%, #050b18 100%)',
  },
  grid: {
    position: 'absolute', inset: 0, zIndex: 0, opacity: 0.04,
    backgroundImage: 'linear-gradient(rgba(99,102,241,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.8) 1px,transparent 1px)',
    backgroundSize: '50px 50px',
  },
  layout: {
    position: 'relative', zIndex: 10, display: 'flex', width: '100%', height: '100%',
  },
  /* LEFT */
  left: {
    flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
    padding: '60px 64px',
    background: 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(139,92,246,0.05) 100%)',
    borderRight: '1px solid rgba(99,102,241,0.12)',
  },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 52 },
  logoBox: {
    width: 64, height: 64, borderRadius: 18, flexShrink: 0,
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 40px #6366f180',
  },
  brand: { fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '0.12em', textTransform: 'uppercase' },
  brandSub: { fontSize: 10, color: '#6366f1', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4 },
  tagline: { marginBottom: 44 },
  tagH: { fontSize: 40, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 16 },
  tagGrad: {
    background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4,#10b981)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  tagP: { fontSize: 14, color: '#64748b', lineHeight: 1.7, maxWidth: 380 },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 36, maxWidth: 380 },
  statCard: {
    background: 'rgba(15,23,42,0.6)', border: '1.5px solid rgba(30,41,59,0.6)',
    borderRadius: 14, padding: '16px 18px',
    backdropFilter: 'blur(20px)',
    transition: 'all 0.3s',
  },
  statVal: { fontSize: 13, fontWeight: 800, marginBottom: 2 },
  statLabel: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#334155' },
  timeBadge: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
    background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(99,102,241,0.15)',
    borderRadius: 40, width: 'fit-content', backdropFilter: 'blur(20px)',
  },
  timeDot: { width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'pulse 2s infinite' },
  timeText: { fontSize: 11, fontWeight: 700, color: '#6366f1', fontVariantNumeric: 'tabular-nums' },

  /* RIGHT */
  right: {
    width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 40,
    background: 'rgba(5,8,18,0.6)', backdropFilter: 'blur(40px)',
  },
  card: {
    width: '100%', borderRadius: 28, overflow: 'hidden',
    background: 'rgba(10,15,30,0.9)',
    border: '1px solid rgba(99,102,241,0.2)',
    boxShadow: '0 0 0 1px rgba(99,102,241,0.08), 0 30px 80px rgba(0,0,0,0.6), 0 0 100px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
    backdropFilter: 'blur(60px)',
  },
  cardBar: {
    height: 3, width: '100%',
    background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4,#10b981,#f59e0b,#ef4444)',
  },
  cardBody: { padding: '36px 36px 28px' },
  cardHeader: { marginBottom: 32 },
  cardTitle: { fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 6 },
  cardSub: { fontSize: 12, color: '#475569', fontWeight: 500 },
  form: {},
  input: {
    display: 'block', width: '100%',
    background: 'rgba(2,6,23,0.85)', border: '1.5px solid rgba(30,41,59,0.9)',
    borderRadius: 13, padding: '14px 16px 14px 44px',
    color: '#e2e8f0', fontSize: 13, fontWeight: 500,
    transition: 'all 0.3s', fontFamily: 'Inter, sans-serif',
  },
  inputFocused: {
    borderColor: 'rgba(99,102,241,0.6)',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.12), 0 0 20px rgba(99,102,241,0.06)',
    background: 'rgba(2,6,23,0.95)',
  },
  eyeBtn: {
    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', padding: 4, display: 'flex', alignItems: 'center',
  },
  errBox: {
    padding: '11px 14px', borderRadius: 12, marginBottom: 16,
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
    color: '#fca5a5', fontSize: 12, fontWeight: 600,
  },
  btn: {
    width: '100%', padding: '15px 20px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)',
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)',
    color: '#fff', fontWeight: 900, fontSize: 13, letterSpacing: '0.08em',
    textTransform: 'uppercase', cursor: 'pointer', position: 'relative', overflow: 'hidden',
    boxShadow: '0 0 35px rgba(99,102,241,0.4), 0 4px 15px rgba(0,0,0,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.3s', marginTop: 4,
  },
  btnShimmer: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 2.5s infinite',
  },
  spinner: {
    display: 'inline-block', width: 16, height: 16, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
    animation: 'spin 0.7s linear infinite',
  },
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    marginTop: 24, paddingTop: 20,
    borderTop: '1px solid rgba(30,41,59,0.5)',
  },
  footerText: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#334155' },
};

/* Field icon overlay via a wrapper */
const FieldIconWrapper = ({ children, icon: Icon, color, focused }) => (
  <div style={{ position: 'relative' }}>
    <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 1, transition: 'color 0.3s', color: focused ? color : '#334155' }}>
      <Icon size={15} />
    </div>
    {children}
  </div>
);

export default Login;
