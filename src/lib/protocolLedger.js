/**
 * protocolLedger.js
 *
 * Simulated per-wallet USDT ledger stored in localStorage.
 * All address keys are normalised to lowercase so checksummed
 * addresses (from Wagmi/viem) and lowercase addresses resolve
 * to the same bucket.
 */

const dummyKey = (address) =>
  `flash_dummy_balance_${address.trim().toLowerCase()}`;

const txKey = (address) =>
  `flash_local_txs_${address.trim().toLowerCase()}`;

export const DEFAULT_DUMMY_BALANCE = 1_000_000; // numeric default

/* ── read ── */
export function getDummyBalance(address) {
  if (!address) return String(DEFAULT_DUMMY_BALANCE);
  const raw = localStorage.getItem(dummyKey(address));
  if (raw == null || raw === '' || isNaN(Number(raw))) {
    // First access — seed the balance
    localStorage.setItem(dummyKey(address), String(DEFAULT_DUMMY_BALANCE));
    return String(DEFAULT_DUMMY_BALANCE);
  }
  return raw;
}

/* ── write ── */
export function setDummyBalance(address, valueStr) {
  if (!address) return;
  const n = Number(valueStr);
  const safe = Number.isFinite(n) ? String(Math.max(0, n)) : '0';
  localStorage.setItem(dummyKey(address), safe);
  dispatchLedgerUpdated();
}

/* ── subtract (called after a successful transfer) ── */
export function subtractDummyBalance(address, amountStr) {
  if (!address) return getDummyBalance(address);

  const amt = Number(amountStr);
  if (!Number.isFinite(amt) || amt <= 0) return getDummyBalance(address);

  const current = Number(getDummyBalance(address));
  const next    = Math.max(0, current - amt);
  const out     = String(next);

  localStorage.setItem(dummyKey(address), out);
  dispatchLedgerUpdated();
  return out;
}

/* ── transaction log ── */
export function getLocalTransactions(address) {
  if (!address) return [];
  try {
    const raw = localStorage.getItem(txKey(address));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendLocalTransaction(address, record) {
  if (!address) return;
  const prev = getLocalTransactions(address);
  const next = [record, ...prev].slice(0, 200);
  localStorage.setItem(txKey(address), JSON.stringify(next));
  dispatchLedgerUpdated();
}

/* ── event bus ── */
function dispatchLedgerUpdated() {
  window.dispatchEvent(new CustomEvent('flash-protocol-ledger-updated'));
}
