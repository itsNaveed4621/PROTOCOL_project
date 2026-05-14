/**
 * evmTransfer.js
 *
 * Uses the Wagmi connector's provider so transfers work with MetaMask,
 * WalletConnect, Coinbase Wallet — anything AppKit connects.
 *
 * Falls back to window.ethereum for plain injected wallets.
 */
import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers';
import { getConnectorClient } from '@wagmi/core';
import { CHAIN_IDS, BSC_CHAIN_PARAMS, USDT_ERC20, USDT_BEP20, ERC20_TRANSFER_ABI } from './tokens.js';

/* ── chain helpers ── */
const CHAIN_ID_DEC = {
  ERC20: 1,   // Ethereum mainnet
  BEP20: 56,  // BNB Smart Chain
};

/**
 * Get an ethers BrowserProvider from the active Wagmi connector.
 * wagmiConfig is the config object from wagmiAdapter.wagmiConfig.
 */
async function getEthersProvider(wagmiConfig) {
  try {
    // getConnectorClient returns a viem WalletClient; we wrap it for ethers
    const client = await getConnectorClient(wagmiConfig);
    // client.transport.request is EIP-1193 compatible
    return new BrowserProvider(client.transport);
  } catch {
    // Fallback: injected MetaMask
    if (window.ethereum) return new BrowserProvider(window.ethereum);
    throw new Error('No wallet provider found. Please connect your wallet.');
  }
}

/**
 * Switch the wallet to the required chain via the provider.
 */
async function ensureChain(provider, desiredChainIdHex) {
  const network = await provider.getNetwork();
  const currentHex = '0x' + network.chainId.toString(16);
  if (currentHex.toLowerCase() === desiredChainIdHex.toLowerCase()) return;

  const signer = await provider.getSigner();
  try {
    await signer.provider.send('wallet_switchEthereumChain', [{ chainId: desiredChainIdHex }]);
  } catch (e) {
    if (e?.code === 4902 && desiredChainIdHex.toLowerCase() === CHAIN_IDS.BEP20.toLowerCase()) {
      await signer.provider.send('wallet_addEthereumChain', [BSC_CHAIN_PARAMS]);
      return;
    }
    throw e;
  }
}

/**
 * Send a real USDT transfer on ERC-20 (Ethereum) or BEP-20 (BNB Chain).
 *
 * @param {{ network: 'ERC20'|'BEP20', recipient: string, amountHuman: string, wagmiConfig: object }} params
 * @returns {{ hash: string, wait: () => Promise<void> }}
 */
export async function sendUsdtEvm({ network, recipient, amountHuman, wagmiConfig }) {
  const token =
    network === 'BEP20'
      ? { address: USDT_BEP20.address, decimals: USDT_BEP20.decimals, chainId: CHAIN_IDS.BEP20 }
      : network === 'ERC20'
        ? { address: USDT_ERC20.address, decimals: USDT_ERC20.decimals, chainId: CHAIN_IDS.ERC20 }
        : null;

  if (!token) throw new Error('On-chain send is only available for ERC-20 and BEP-20.');

  const provider = await getEthersProvider(wagmiConfig);

  await ensureChain(provider, token.chainId);

  // Re-get provider after chain switch (some wallets need a fresh instance)
  const finalProvider = await getEthersProvider(wagmiConfig);
  const signer = await finalProvider.getSigner();
  const contract = new Contract(token.address, ERC20_TRANSFER_ABI, signer);

  // Read actual decimals from chain (defensive)
  let decimals = token.decimals;
  try {
    decimals = Number(await contract.decimals());
  } catch { /* use table default */ }

  const amountWei = parseUnits(String(amountHuman), decimals);

  // Balance check
  const bal = await contract.balanceOf(await signer.getAddress());
  if (bal < amountWei) {
    const human = formatUnits(bal, decimals);
    throw new Error(`Insufficient USDT balance. Wallet holds ~${human} USDT.`);
  }

  const tx = await contract.transfer(recipient, amountWei);
  return { hash: tx.hash, wait: () => tx.wait() };
}
