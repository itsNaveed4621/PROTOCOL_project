import { useState, useEffect } from 'react';
import { ExternalLink, ArrowUpRight, ArrowDownLeft, Clock, Wallet } from 'lucide-react';
import { getLocalTransactions } from '../lib/protocolLedger.js';
import { explorerTxUrl } from '../lib/tokens.js';

const STATUS_STYLE = {
  Completed: { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  color: '#34d399' },
  Approved:  { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  color: '#34d399' },
  Pending:   { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  color: '#fbbf24' },
  Queued:    { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  color: '#fbbf24' },
  Failed:    { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   color: '#f87171' },
};

const Badge = ({ status }) => {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.Failed;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
    }}>
      {status}
    </span>
  );
};

export default function HistoryModule({ isWalletConnected, walletAddress }) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading]       = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!isWalletConnected || !walletAddress) { setTransactions([]); setIsLoading(false); return; }
      setIsLoading(true);
      try {
        const res  = await fetch('https://flash-usdt-backend-three.vercel.app/api/admin/transactions');
        const data = await res.json();
        const backend = Array.isArray(data)
          ? data.filter(tx =>
              [tx.from, tx.to, tx.user].some(v => v?.toLowerCase() === walletAddress.toLowerCase())
            )
          : [];
        const local = getLocalTransactions(walletAddress);
        const seen = new Set();
        const merged = [];
        for (const tx of [...local, ...backend]) {
          const key = tx.txHash || `${tx.time}-${tx.to}-${tx.amount}`;
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(tx);
        }
        setTransactions(merged);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    load();
    window.addEventListener('flash-protocol-ledger-updated', load);
    return () => window.removeEventListener('flash-protocol-ledger-updated', load);
  }, [isWalletConnected, walletAddress]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 6 }}>
          Transaction History
        </h1>
        <p style={{ fontSize: 13, color: '#475569' }}>
          On-chain BEP-20 / ERC-20 transfers and backend protocol records.
        </p>
      </div>

      {/* Table card */}
      <div style={{
        borderRadius: 16,
        background: 'rgba(13,17,27,0.8)',
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr 120px 160px 140px',
          padding: '12px 22px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          {['Type', 'Recipient', 'Amount', 'Time', 'Status'].map((h, i) => (
            <div key={h} style={{
              fontSize: 9, fontWeight: 800, color: '#334155',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              textAlign: i === 4 ? 'right' : 'left',
            }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 48 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 12, color: '#334155' }}>Indexing history…</span>
          </div>
        ) : !isWalletConnected ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 56, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={22} color="#6366f1" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>Connect wallet to view history</div>
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 56, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} color="#334155" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>No transactions found</div>
            <div style={{ fontSize: 12, color: '#1e293b' }}>Your transfers will appear here</div>
          </div>
        ) : (
          transactions.map((tx, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr 120px 160px 140px',
                padding: '14px 22px',
                borderBottom: i < transactions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Type */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: tx.type === 'transfer' ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {tx.type === 'transfer'
                    ? <ArrowUpRight size={14} color="#818cf8" />
                    : <ArrowDownLeft size={14} color="#34d399" />}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'capitalize' }}>{tx.type}</span>
              </div>

              {/* Recipient */}
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 16 }}>
                {tx.to || tx.user || '—'}
              </div>

              {/* Amount */}
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{tx.amount}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#334155', marginLeft: 4, textTransform: 'uppercase' }}>{tx.asset}</span>
              </div>

              {/* Time */}
              <div style={{ fontSize: 11, color: '#334155' }}>{tx.time}</div>

              {/* Status + tx link */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {tx.txHash && (tx.network === 'BEP20' || tx.network === 'ERC20') && (
                  <a
                    href={explorerTxUrl(tx.network, tx.txHash)}
                    target="_blank" rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: '#6366f1', textDecoration: 'none' }}
                  >
                    {tx.txHash.slice(0, 8)}… <ExternalLink size={9} />
                  </a>
                )}
                <Badge status={tx.status} />
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
