/**
 * Official mainnet token contracts (for display + on-chain transfers).
 * Note: "BEP-20" on BNB Smart Chain is the EVM token standard on Binance's chain.
 * Bitcoin "BRC-20" is a different protocol (Ordinals); this app uses MetaMask / EVM.
 */

export const CHAIN_IDS = {
  ERC20: '0x1', // 1
  BEP20: '0x38', // 56
};

export const BSC_RPC = 'https://bsc-dataseed.binance.org';

export const BSC_CHAIN_PARAMS = {
  chainId: CHAIN_IDS.BEP20,
  chainName: 'BNB Smart Chain',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: [BSC_RPC],
  blockExplorerUrls: ['https://bscscan.com'],
};

/** USDT on Ethereum (6 decimals) */
export const USDT_ERC20 = {
  address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  decimals: 6,
  explorer: 'https://etherscan.io',
};

/** Binance-Peg USDT on BNB Smart Chain (18 decimals) */
export const USDT_BEP20 = {
  address: '0x55d398326f99059fF775485246999027B3197955',
  decimals: 18,
  explorer: 'https://bscscan.com',
};

export const ERC20_TRANSFER_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address account) view returns (uint256)',
];

export function explorerTxUrl(networkId, txHash) {
  if (networkId === 'BEP20') return `${USDT_BEP20.explorer}/tx/${txHash}`;
  if (networkId === 'ERC20') return `${USDT_ERC20.explorer}/tx/${txHash}`;
  return '';
}

export function tokenContractUrl(networkId) {
  if (networkId === 'BEP20') return `${USDT_BEP20.explorer}/address/${USDT_BEP20.address}`;
  if (networkId === 'ERC20') return `${USDT_ERC20.explorer}/address/${USDT_ERC20.address}`;
  return '';
}
