import { useState, useEffect } from 'react';
import { Activity, TrendingUp, Wallet, ArrowUpRight, ArrowDownLeft, Loader2, ExternalLink, Zap, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { getDummyBalance } from '../lib/protocolLedger.js';
import { USDT_BEP20, tokenContractUrl } from '../lib/tokens.js';

const fmt = (v) => {
  const n = Number(v);
  if (isNaN(n) || v === '—') return v;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
};

export default function Dashboard({ isWalletConnected, walletAddress, onConnectWallet }) {
  const [dummyBalance, setDummyBalance] = useState('0');
  const [stats, setStats]               = useState({ volume: '—', transactions: '—', activeUsers: '—' });
  const [activities, setActivities]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  useEffect(() => {
    const sync = () => setDummyBalance(walletAddress ? getDummyBalance(walletAddress) : '0');
    sync();
    window.addEventListener('flash-protocol-ledger-updated', sync);
    return () => window.removeEventListener('flash-protocol-ledger-updated', sync);
  }, [walletAddress]);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [sRes, tRes] = await Promise.all([
        fetch('https://flash-usdt-backend-three.vercel.app/api/admin/stats'),
        fetch('https://flash-usdt-backend-three.vercel.app/api/admin/transactions'),
      ]);
      const sd = await sRes.json();
      if (sd.success) setStats({ volume: sd.stats.totalVolume, transactions: sd.stats.totalTransactions, activeUsers: sd.stats.activeUsers });
      const td = await tRes.json();
      if (Array.isArray(td)) setActivities(td);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const displayBalance = isWalletConnected && walletAddress ? dummyBalance : null;

  const cards = [
    { label: 'Ledger Balance', value: displayBalance ?? '—', sub: 'USDT', note: 'simulated', icon: Wallet,     color: '#10b981', glow: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.2)' },
    { label: 'Platform Volume', value: fmt(stats.volume),    sub: 'USDT', note: 'total',     icon: TrendingUp, color: '#6366f1', glow: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.2)' },
    { label: 'Transactions',    value: fmt(stats.transactions), sub: 'TXs', note: 'indexed', icon: Activity,   color: '#f59e0b', glow: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.2)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Page title ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 6 }}>
            Protocol Overview
          </h1>
          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
            Simulated balances for demos. BEP-20 / ERC-20 sends use real on-chain contracts via MetaMask.
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            flexShrink: 0, transition: 'all 0.2s',
          }}
        >
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* ── Connect wallet prompt ── */}
      {!isWalletConnected && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            padding: '16px 20px', borderRadius: 14,
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wallet size={18} color="#818cf8" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>Wallet not connected</div>
              <div style={{ fontSize: 12, color: '#475569' }}>Connect to view your balance and send assets</div>
            </div>
          </div>
          <button
            onClick={onConnectWallet}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
            }}
          >
            <Zap size={14} fill="#fff" />
            Connect Wallet
          </button>
        </motion.div>
      )}

      {/* ── BEP-20 contract info ── */}
      {isWalletConnected && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 12,
          background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
        }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#92400e', letterSpacing: '0.15em', textTransform: 'uppercase' }}>BEP-20 USDT</span>
          <code style={{ fontFamily: 'monospace', fontSize: 11, color: '#fbbf24', wordBreak: 'break-all' }}>{USDT_BEP20.address}</code>
          <a href={tokenContractUrl('BEP20')} target="_blank" rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#f59e0b', textDecoration: 'none' }}>
            BscScan <ExternalLink size={10} />
          </a>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{
              padding: '22px 22px 20px',
              borderRadius: 16,
              background: `linear-gradient(135deg, rgba(13,17,27,0.9), rgba(10,14,22,0.95))`,
              border: `1px solid ${card.border}`,
              boxShadow: `0 0 30px ${card.glow}, 0 4px 20px rgba(0,0,0,0.3)`,
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Glow blob */}
            <div style={{
              position: 'absolute', top: -20, right: -20, width: 80, height: 80,
              borderRadius: '50%', background: card.glow, filter: 'blur(20px)', pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: `${card.color}18`,
                border: `1px solid ${card.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <card.icon size={18} color={card.color} />
              </div>
              <div style={{
                fontSize: 9, fontWeight: 800, color: card.color,
                background: `${card.color}15`, border: `1px solid ${card.color}25`,
                padding: '3px 8px', borderRadius: 20, letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                Live
              </div>
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
              {card.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {card.value}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>{card.sub}</span>
            </div>
            <div style={{ fontSize: 10, color: '#1e293b', marginTop: 4 }}>{card.note}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Activity feed ── */}
      <div style={{
        borderRadius: 16,
        background: 'rgba(13,17,27,0.8)',
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 22px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>Platform Activity</span>
          </div>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#6366f1', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Live Feed</span>
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 48 }}>
            <Loader2 size={24} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : activities.length > 0 ? (
          activities.slice(0, 7).map((a, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 22px',
                borderBottom: i < Math.min(activities.length, 7) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: a.type === 'transfer' ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {a.type === 'transfer'
                    ? <ArrowUpRight size={16} color="#818cf8" />
                    : <ArrowDownLeft size={16} color="#34d399" />}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', textTransform: 'capitalize', marginBottom: 2 }}>{a.type}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#334155', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.user || a.to}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>
                  {a.amount} <span style={{ color: '#334155', fontSize: 10 }}>{a.asset}</span>
                </div>
                <div style={{ fontSize: 10, color: '#1e293b' }}>{a.time}</div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
            <Activity size={32} color="#1e293b" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>No recent activity</div>
            <div style={{ fontSize: 11, color: '#1e293b' }}>Transactions will appear here once processed</div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
