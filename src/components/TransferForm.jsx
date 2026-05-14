import { useState, useEffect } from 'react';
import { Send, AlertTriangle, CheckCircle2, Loader2, Clock, Zap, Globe, ExternalLink, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendUsdtEvm } from '../lib/evmTransfer.js';
import { subtractDummyBalance, appendLocalTransaction, getDummyBalance } from '../lib/protocolLedger.js';
import { USDT_BEP20, USDT_ERC20, explorerTxUrl, tokenContractUrl } from '../lib/tokens.js';
import { wagmiAdapter } from '../lib/appkit.js';

/* ─── constants ─── */
const NETWORKS = [
  { id: 'ERC20', label: 'ERC-20', sub: 'Ethereum',      color: '#6366f1', icon: '⟠' },
  { id: 'TRC20', label: 'TRC-20', sub: 'TRON Network',  color: '#ef4444', icon: '◈' },
  { id: 'BEP20', label: 'BEP-20', sub: 'BNB Chain',     color: '#f59e0b', icon: '◆' },
];

const DURATIONS = [
  { value: '1d',  label: '1 Day',     days: 1    },
  { value: '3d',  label: '3 Days',    days: 3    },
  { value: '7d',  label: '7 Days',    days: 7    },
  { value: '14d', label: '14 Days',   days: 14   },
  { value: '1m',  label: '1 Month',   days: 30   },
  { value: '3m',  label: '3 Months',  days: 90   },
  { value: '6m',  label: '6 Months',  days: 180  },
  { value: '1y',  label: '1 Year',    days: 365  },
  { value: '2y',  label: '2 Years',   days: 730  },
  { value: '3y',  label: '3 Years',   days: 1095 },
  { value: '4y',  label: '4 Years',   days: 1460 },
  { value: '5y',  label: '5 Years',   days: 1825 },
];

/* ─── small helpers ─── */
const Label = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 800, color: '#334155', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
    {children}
  </div>
);

const inputBase = {
  width: '100%', padding: '13px 16px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12, color: '#e2e8f0',
  fontSize: 14, fontFamily: 'inherit',
  outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
};

export default function TransferModule({ isWalletConnected, walletAddress, onConnectWallet }) {
  const [form, setForm] = useState({ recipient: '', amount: '', network: 'ERC20', duration: '1d' });
  const [durEnabled, setDurEnabled] = useState(true);
  const [status, setStatus]         = useState('idle'); // idle | loading | success | error
  const [error, setError]           = useState('');
  const [lastHash, setLastHash]     = useState('');
  const [focusedField, setFocused]  = useState('');
  const [ledgerBalance, setLedgerBalance] = useState('0');
  const [deducted, setDeducted]     = useState(null); // { from, to, amount } after success

  // Keep ledger balance in sync with localStorage
  useEffect(() => {
    const sync = () => {
      setLedgerBalance(walletAddress ? getDummyBalance(walletAddress) : '0');
    };
    sync();
    window.addEventListener('flash-protocol-ledger-updated', sync);
    return () => window.removeEventListener('flash-protocol-ledger-updated', sync);
  }, [walletAddress]);

  const net = NETWORKS.find(n => n.id === form.network);
  const dur = DURATIONS.find(d => d.value === form.duration);

  const durColor = (days) => days >= 365 ? '#10b981' : days >= 30 ? '#f59e0b' : '#6366f1';

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isWalletConnected) { onConnectWallet?.(); return; }
    setStatus('loading'); setError(''); setLastHash(''); setDeducted(null);

    const balanceBefore = Number(getDummyBalance(walletAddress));

    try {
      if (form.network === 'ERC20' || form.network === 'BEP20') {
        const { hash, wait } = await sendUsdtEvm({
          network: form.network,
          recipient: form.recipient.trim(),
          amountHuman: form.amount,
          wagmiConfig: wagmiAdapter.wagmiConfig,
        });
        setLastHash(hash);
        await wait();
        const newBalance = subtractDummyBalance(walletAddress, form.amount);
        appendLocalTransaction(walletAddress, {
          type: 'transfer', from: walletAddress, to: form.recipient.trim(),
          user: walletAddress, amount: form.amount, asset: 'USDT',
          network: form.network, time: new Date().toLocaleString(),
          status: 'Completed', txHash: hash,
        });
        setDeducted({ from: balanceBefore, to: Number(newBalance), amount: form.amount });
        setStatus('success');
        setForm(p => ({ ...p, recipient: '', amount: '' }));
        setTimeout(() => setStatus('idle'), 10000);
        return;
      }

      // TRC-20 / backend path
      const res  = await fetch('https://flash-usdt-backend-three.vercel.app/api/transfer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: walletAddress, to: form.recipient, amount: form.amount,
          asset: 'USDT', network: form.network, duration: form.duration,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const newBalance = subtractDummyBalance(walletAddress, form.amount);
        appendLocalTransaction(walletAddress, {
          type: 'transfer', from: walletAddress, to: form.recipient.trim(),
          user: walletAddress, amount: form.amount, asset: 'USDT',
          network: form.network, time: new Date().toLocaleString(),
          status: data.status || 'Queued', txHash: data.txHash || '',
        });
        setDeducted({ from: balanceBefore, to: Number(newBalance), amount: form.amount });
        setStatus('success');
        setForm(p => ({ ...p, recipient: '', amount: '' }));
        setTimeout(() => setStatus('idle'), 6000);
      } else {
        setError(data.message || 'Transfer failed');
        setStatus('error');
      }
    } catch (err) {
      setError(err?.shortMessage || err?.message || 'Transfer failed');
      setStatus('error');
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page title ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99,102,241,0.4)', flexShrink: 0 }}>
            <Send size={17} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>Send Assets</h1>
        </div>
        <p style={{ fontSize: 13, color: '#475569', marginLeft: 50 }}>Transfer USDT securely across ERC-20, TRC-20 and BEP-20 networks.</p>
      </div>

      {/* ── Wallet banner ── */}
      {!isWalletConnected && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 20px', borderRadius: 14, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wallet size={18} color="#818cf8" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>Wallet required</div>
              <div style={{ fontSize: 12, color: '#475569' }}>Connect your wallet to initiate transfers</div>
            </div>
          </div>
          <button onClick={onConnectWallet} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
            <Zap size={14} fill="#fff" /> Connect Wallet
          </button>
        </motion.div>
      )}

      {/* ── Main card ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        style={{ borderRadius: 18, background: 'rgba(13,17,27,0.9)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', overflow: 'hidden' }}>

        {/* Rainbow bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4,#10b981,#f59e0b,#ef4444)' }} />

        <form onSubmit={handleSubmit} style={{ padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── Network selector ── */}
          <div>
            <Label><Globe size={10} style={{ display: 'inline', marginRight: 5 }} />Select Network</Label>
            <div style={{ display: 'flex', gap: 10 }}>
              {NETWORKS.map(n => {
                const sel = form.network === n.id;
                return (
                  <button key={n.id} type="button" onClick={() => set('network', n.id)}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      padding: '14px 10px', borderRadius: 14, cursor: 'pointer',
                      background: sel ? `linear-gradient(135deg,${n.color}20,${n.color}0d)` : 'rgba(255,255,255,0.02)',
                      border: sel ? `1.5px solid ${n.color}60` : '1.5px solid rgba(255,255,255,0.06)',
                      boxShadow: sel ? `0 0 20px ${n.color}25` : 'none',
                      transition: 'all 0.2s', position: 'relative',
                    }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, background: sel ? `linear-gradient(135deg,${n.color},${n.color}99)` : 'rgba(255,255,255,0.05)', color: sel ? '#fff' : '#334155', boxShadow: sel ? `0 0 14px ${n.color}50` : 'none', transition: 'all 0.2s' }}>
                      {n.icon}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: sel ? '#fff' : '#475569' }}>{n.label}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: sel ? n.color : '#1e293b', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>{n.sub}</div>
                    </div>
                    {sel && <div style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: n.color, boxShadow: `0 0 8px ${n.color}` }} />}
                  </button>
                );
              })}
            </div>

            {/* Active network pill */}
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: `${net.color}0d`, border: `1px solid ${net.color}25` }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: net.color, boxShadow: `0 0 6px ${net.color}`, animation: 'pulse 2s infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: net.color }}>Active: {net.label} — {net.sub}</span>
              <span style={{ marginLeft: 'auto', fontSize: 8, fontWeight: 800, color: net.color, background: `${net.color}18`, border: `1px solid ${net.color}30`, padding: '2px 8px', borderRadius: 20, letterSpacing: '0.1em', textTransform: 'uppercase' }}>LIVE</span>
            </div>
          </div>

          {/* ── On-chain contract notice ── */}
          {(form.network === 'BEP20' || form.network === 'ERC20') && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.18)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#92400e', letterSpacing: '0.15em', textTransform: 'uppercase' }}>On-chain USDT — {form.network}</div>
              <code style={{ fontFamily: 'monospace', fontSize: 11, color: '#fbbf24', wordBreak: 'break-all' }}>
                {form.network === 'BEP20' ? USDT_BEP20.address : USDT_ERC20.address}
              </code>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 10, color: '#475569' }}>Real on-chain transfer — requires gas + USDT in wallet</span>
                <a href={tokenContractUrl(form.network)} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#f59e0b', textDecoration: 'none' }}>
                  Explorer <ExternalLink size={10} />
                </a>
              </div>
            </div>
          )}

          {/* ── Recipient ── */}
          <div>
            <Label>Recipient Address</Label>
            <input
              type="text" required
              placeholder={form.network === 'TRC20' ? 'T…' : '0x…'}
              value={form.recipient}
              onChange={e => set('recipient', e.target.value)}
              onFocus={() => setFocused('recipient')}
              onBlur={() => setFocused('')}
              style={{ ...inputBase, borderColor: focusedField === 'recipient' ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)', boxShadow: focusedField === 'recipient' ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none', fontSize: 13 }}
            />
          </div>

          {/* ── Amount ── */}
          <div>
            <Label>Amount</Label>
            <div style={{ position: 'relative' }}>
              <input
                type="number" required min="0" placeholder="0.00"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                onFocus={() => setFocused('amount')}
                onBlur={() => setFocused('')}
                style={{ ...inputBase, paddingRight: 72, borderColor: focusedField === 'amount' ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)', boxShadow: focusedField === 'amount' ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none' }}
              />
              <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 800, color: '#475569', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: 8 }}>
                USDT
              </div>
            </div>
          </div>

          {/* ── Duration ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Label><Clock size={10} style={{ display: 'inline', marginRight: 5 }} />Transaction Duration</Label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[{ v: true, l: 'Enable' }, { v: false, l: 'Disable' }].map(({ v, l }) => (
                  <button key={l} type="button" onClick={() => setDurEnabled(v)}
                    style={{ padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', border: durEnabled === v ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.06)', background: durEnabled === v ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', color: durEnabled === v ? '#818cf8' : '#334155' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
              {DURATIONS.map(d => {
                const sel = form.duration === d.value;
                const c   = durColor(d.days);
                return (
                  <button key={d.value} type="button"
                    disabled={!durEnabled}
                    onClick={() => durEnabled && set('duration', d.value)}
                    style={{
                      padding: '9px 4px', borderRadius: 10, fontSize: 11, fontWeight: 700, textAlign: 'center', cursor: durEnabled ? 'pointer' : 'not-allowed',
                      background: sel ? `linear-gradient(135deg,${c}28,${c}14)` : 'rgba(255,255,255,0.02)',
                      border: sel ? `1.5px solid ${c}55` : '1.5px solid rgba(255,255,255,0.05)',
                      color: !durEnabled ? '#1e293b' : sel ? c : '#334155',
                      boxShadow: sel ? `0 0 12px ${c}20` : 'none',
                      opacity: !durEnabled ? 0.4 : 1,
                      transition: 'all 0.15s', position: 'relative',
                    }}>
                    {d.label}
                    {sel && <div style={{ position: 'absolute', top: -3, right: -3, width: 7, height: 7, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}` }} />}
                  </button>
                );
              })}
            </div>

            {/* Duration summary pill */}
            {durEnabled && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <Clock size={13} color="#f59e0b" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Duration:</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24' }}>{dur.label}</span>
                <span style={{ fontSize: 11, color: '#334155' }}>({dur.days} day{dur.days > 1 ? 's' : ''})</span>
                {dur.days >= 365 && (
                  <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Long Term</span>
                )}
              </div>
            )}
          </div>

          {/* ── Live ledger balance ── */}
          {isWalletConnected && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ledger Balance</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#34d399', letterSpacing: '-0.01em' }}>
                  {Number(ledgerBalance).toLocaleString()}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#334155' }}>USDT</span>
              </div>
            </div>
          )}

          {/* ── Summary ── */}
          <div style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#1e293b', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>Transaction Summary</div>
            {[
              { label: 'Network',  value: `${net.label} — ${net.sub}`,                  color: net.color },
              { label: 'Asset',    value: 'USDT (Tether)',                               color: '#64748b' },
              { label: 'Duration', value: durEnabled ? dur.label : 'Disabled',           color: '#f59e0b' },
              { label: 'Amount',   value: form.amount ? `${form.amount} USDT` : '—',    color: '#818cf8' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* ── Submit ── */}
          <motion.button
            type="submit"
            disabled={status === 'loading'}
            whileHover={{ scale: status === 'loading' ? 1 : 1.015 }}
            whileTap={{ scale: status === 'loading' ? 1 : 0.985 }}
            style={{
              width: '100%', padding: '15px 20px', borderRadius: 14,
              background: status === 'loading' ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)',
              color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
              border: '1px solid rgba(255,255,255,0.1)', cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: status === 'loading' ? 'none' : '0 4px 24px rgba(99,102,241,0.4)',
              position: 'relative', overflow: 'hidden',
            }}>
            {status === 'loading' ? (
              <><Loader2 size={17} style={{ animation: 'spin 0.8s linear infinite' }} /> Processing…</>
            ) : (
              <><Zap size={17} fill="#fff" /> Initiate Flash Transfer <Send size={15} /></>
            )}
            {/* shimmer */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.08) 50%,transparent 60%)', backgroundSize: '200% 100%', animation: 'shimmer 2.5s infinite', pointerEvents: 'none' }} />
          </motion.button>

          {/* ── Status messages ── */}
          <AnimatePresence>
            {status === 'success' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 18px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399', marginBottom: 6 }}>Transfer confirmed</div>

                  {/* Balance deduction row */}
                  {deducted && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.12)', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>
                        {Number(deducted.from).toLocaleString()}
                      </span>
                      <span style={{ fontSize: 10, color: '#334155' }}>USDT</span>
                      <span style={{ fontSize: 11, color: '#475569', margin: '0 2px' }}>→</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#34d399' }}>
                        {Number(deducted.to).toLocaleString()}
                      </span>
                      <span style={{ fontSize: 10, color: '#334155' }}>USDT</span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, color: '#f87171' }}>
                        −{Number(deducted.amount).toLocaleString()} USDT
                      </span>
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: '#065f46' }}>Ledger balance updated successfully.</div>
                  {lastHash && (form.network === 'BEP20' || form.network === 'ERC20') && (
                    <a href={explorerTxUrl(form.network, lastHash)} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11, fontWeight: 700, color: '#34d399', textDecoration: 'none' }}>
                      View on explorer <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={18} color="#f87171" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#f87171' }}>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

        </form>
      </motion.div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        input::placeholder { color: #1e293b; }
      `}</style>
    </div>
  );
}
