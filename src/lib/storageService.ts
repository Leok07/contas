import { Transaction, FirebaseConfig } from './types';

const STORAGE_KEY = 'contas_transactions_v2';
const FIREBASE_CONFIG_KEY = 'contas_firebase_config_v2';

/**
 * Retorna transações salvas localmente (começa 100% limpo, apenas contas reais)
 */
export function getLocalTransactions(): Transaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler do localStorage', err);
    return [];
  }
}

export function saveLocalTransaction(t: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  const current = getLocalTransactions();
  const newTx: Transaction = {
    ...t,
    id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    createdAt: Date.now(),
  };
  const updated = [newTx, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return newTx;
}

export function updateLocalTransaction(transaction: Transaction): void {
  const current = getLocalTransactions();
  const updated = current.map((t) => (t.id === transaction.id ? transaction : t));
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}

export function deleteLocalTransaction(id: string): void {
  const current = getLocalTransactions();
  const updated = current.filter((t) => t.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}

export function clearAllLocalTransactions(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getStoredFirebaseConfig(): FirebaseConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredFirebaseConfig(config: FirebaseConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
  }
}

export function removeStoredFirebaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(FIREBASE_CONFIG_KEY);
  }
}
