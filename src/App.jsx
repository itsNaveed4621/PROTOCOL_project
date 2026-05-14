import { useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import {
  LayoutDashboard, Send, History, LogOut, Zap,
  Menu, X, Wallet, ChevronDown, Copy, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Dashboard    from './components/Dashboard';
import TransferModule from './components/TransferForm';
import HistoryModule  from './components/History';
import Login          from './components/Login';

/* ── helpers ── */
const shortAddr = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const CHAIN_NAMES = {
  1:     'Ethereum',
  56:    'BNB Chain',
  137:   'Polygon',
  10:    'Optimism',
  42161: 'Arbitrum',
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('flash_auth') === 'true'
  );
  const [activeTab,      setActiveTab]      = useState('dashboard');
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [copied,         setCopied]         = useState(false);
  const [sidebarOpen,    setSidebarOpen]    = useState(false);

  /* ── Wagmi / AppKit hooks ── */
  const { address, isConnected, chain } = useAccount();
  const { disconnect }                  = useDisconnect();
  const { open: openAppKit }            = useAppKit();

  const walletAddress     = address ?? '';
  const isWalletConnected = isConnected && Boolean(address);
  const chainName         = chain ? (CHAIN_NAMES[chain.id] ?? chain.name ?? `Chain ${chain.id}`) : '';

  /* ── persist auth ── */
  useEffect(() => {
    localStorage.setItem('flash_auth', isAuthenticated);
  }, [isAuthenticated]);

  /* ── close wallet menu when disconnected ── */
  useEffect(() => {
    if (!isConnected) setWalletMenuOpen(false);
  }, [isConnected]);

  const connectWallet   = () => openAppKit();
  const disconnectWallet = () => { disconnect(); setWalletMenuOpen(false); };
  const copyAddress     = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleLogout = () => {
    setIsAuthenticated(false);
    disconnect();
    localStorage.removeItem('flash_auth');
  };

  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  const navItems = [
    { id: 'dashboard', label: 'Overview',    icon: LayoutDashboard },
    { id: 'transfer',  label: 'Send Assets', icon: Send },
    { id: 'history',   label: 'History',     icon: History },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#080c14', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════ */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'linear-gradient(180deg,#0d1117 0%,#0a0f1a 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
      }}
        /* desktop: always visible */
        className="lg-sidebar"
      >
        {/* Logo */}
        <div style={{ padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99,102,241,0.4)', flexShrink: 0 }}>
              <Zap size={17} color="#fff" fill="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '0.05em', lineHeight: 1.2 }}>FLASH</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', letterSpacing: '0.15em', textTransform: 'uppercase' }}>PROTOCOL</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ color: '#475569', padding: 4, background: 'none', border: 'none', cursor: 'pointer', display: 'none' }} className="sidebar-close-btn">
            <X size={16} />
          </button>
        </div>

        {/* Nav label */}
        <div style={{ padding: '20px 20px 8px', fontSize: 9, fontWeight: 700, color: '#334155', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Navigation
        </div>

        {/* Nav items */}
        <nav style={{ padding: '0 12px', flex: 1 }}>
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 10, marginBottom: 4,
                  background: active ? 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.12))' : 'transparent',
                  border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                  color: active ? '#a5b4fc' : '#475569',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: active ? '0 0 20px rgba(99,102,241,0.1)' : 'none',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = active ? 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.12))' : 'transparent'; e.currentTarget.style.color = active ? '#a5b4fc' : '#475569'; } }}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
                {active && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px #6366f1' }} />}
              </button>
            );
          })}
        </nav>

        {/* Wallet status card */}
        <div style={{ padding: '0 12px 12px' }}>
          {isWalletConnected ? (
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                <span style={{ fontSize: 9, fontWeight: 800, color: '#10b981', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Connected</span>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#cbd5e1', marginBottom: 2 }}>{shortAddr(walletAddress)}</div>
              {chainName && <div style={{ fontSize: 10, color: '#475569' }}>{chainName}</div>}
            </div>
          ) : (
            <button onClick={connectWallet}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(99,102,241,0.3)', border: 'none', cursor: 'pointer' }}>
              <Wallet size={15} />
              Connect Wallet
            </button>
          )}
        </div>

        {/* Sign out */}
        <div style={{ padding: '12px 12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, color: '#475569', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', background: 'transparent', border: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          MAIN
      ══════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }} className="main-area">

        {/* Header */}
        <header style={{ height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: 'rgba(8,12,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>

          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(true)} className="mobile-menu-btn"
              style={{ padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: 'none', cursor: 'pointer', display: 'none' }}>
              <Menu size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>Flash Protocol</span>
              <span style={{ color: '#1e293b' }}>/</span>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                {navItems.find(n => n.id === activeTab)?.label}
              </span>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Mainnet badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', animation: 'blink 2s infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mainnet</span>
            </div>

            {/* Wallet connected → dropdown trigger */}
            {isWalletConnected ? (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setWalletMenuOpen(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                  <Wallet size={13} color="#6366f1" />
                  <span style={{ fontFamily: 'monospace' }}>{shortAddr(walletAddress)}</span>
                  {chainName && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#475569', background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: 20 }}>{chainName}</span>
                  )}
                  <ChevronDown size={12} color="#475569" style={{ transform: walletMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {walletMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 260, borderRadius: 14, background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', overflow: 'hidden', zIndex: 100 }}
                    >
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#334155', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Connected Wallet</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#94a3b8', wordBreak: 'break-all', lineHeight: 1.6 }}>{walletAddress}</div>
                        {chainName && (
                          <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#6366f1' }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#818cf8' }}>{chainName}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: 6 }}>
                        {[
                          { icon: copied ? Check : Copy, label: copied ? 'Copied!' : 'Copy Address', color: copied ? '#10b981' : '#94a3b8', action: copyAddress },
                          { icon: X, label: 'Disconnect', color: '#f87171', action: disconnectWallet },
                        ].map(({ icon: Icon, label, color, action }) => (
                          <button key={label} onClick={action}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, color, fontSize: 12, fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <Icon size={14} />{label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Connect button → opens AppKit modal */
              <button onClick={connectWallet}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.35)', transition: 'all 0.2s' }}>
                <Wallet size={14} />
                Connect Wallet
              </button>
            )}
          </div>
        </header>

        {/* Click-outside for wallet dropdown */}
        {walletMenuOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setWalletMenuOpen(false)} />
        )}

        {/* Page content */}
        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '32px 28px 80px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {activeTab === 'dashboard' && <Dashboard    isWalletConnected={isWalletConnected} walletAddress={walletAddress} onConnectWallet={connectWallet} />}
                {activeTab === 'transfer'  && <TransferModule isWalletConnected={isWalletConnected} walletAddress={walletAddress} onConnectWallet={connectWallet} />}
                {activeTab === 'history'   && <HistoryModule  isWalletConnected={isWalletConnected} walletAddress={walletAddress} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div className="mobile-bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 60, background: 'rgba(8,12,20,0.98)', borderTop: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', display: 'none', alignItems: 'center', justifyContent: 'space-around', zIndex: 30 }}>
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 16px', borderRadius: 10, color: active ? '#818cf8' : '#334155', background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <item.icon size={19} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }

        /* Desktop: sidebar always visible, push main content */
        @media (min-width: 1024px) {
          .lg-sidebar {
            position: relative !important;
            transform: translateX(0) !important;
          }
          .main-area {
            margin-left: 0 !important;
          }
          .mobile-menu-btn   { display: none !important; }
          .sidebar-close-btn { display: none !important; }
          .mobile-bottom-nav { display: none !important; }
        }

        /* Mobile: sidebar hidden by default, bottom nav visible */
        @media (max-width: 1023px) {
          .lg-sidebar {
            position: fixed !important;
          }
          .mobile-menu-btn   { display: flex !important; }
          .sidebar-close-btn { display: flex !important; }
          .mobile-bottom-nav { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
