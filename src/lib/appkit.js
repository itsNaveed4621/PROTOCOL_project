import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter }  from '@reown/appkit-adapter-wagmi';
import { mainnet, bsc }  from '@reown/appkit/networks';

// ─── Get a free Project ID at https://cloud.reown.com ───────────────────────
// Replace this placeholder with your real Project ID before deploying.
export const PROJECT_ID = import.meta.env.VITE_REOWN_PROJECT_ID ?? 'YOUR_PROJECT_ID';

export const networks = [mainnet, bsc];

// Wagmi adapter — handles EIP-6963, WalletConnect, Coinbase out of the box
export const wagmiAdapter = new WagmiAdapter({
  projectId: PROJECT_ID,
  networks,
});

// Initialise AppKit once at module load time (idempotent)
createAppKit({
  adapters:  [wagmiAdapter],
  networks,
  projectId: PROJECT_ID,
  metadata: {
    name:        'Flash Protocol',
    description: 'Blazing-fast USDT transfers across ERC-20, TRC-20 & BEP-20',
    url:         typeof window !== 'undefined' ? window.location.origin : 'https://flashprotocol.app',
    icons:       ['https://avatars.githubusercontent.com/u/37784886'],
  },
  features: {
    analytics: false,
    email:     false,
    socials:   false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent':           '#6366f1',
    '--w3m-border-radius-master': '4px',
    '--w3m-font-family':      'Inter, sans-serif',
    '--w3m-z-index':          '9999',
  },
});
