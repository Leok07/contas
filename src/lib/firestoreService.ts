import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  writeBatch
} from 'firebase/firestore';
import { getFirebaseFirestore } from './firebase';
import type { Transaction } from './types';
import {
  calculateInstallments,
  addMonthsToDate,
  isValidIsoDate,
  roundCurrency,
} from './calculations';

const COLLECTION_NAME = 'transactions_v2';
const MAX_INSTALLMENTS = 120;

export type ConnectionStatus = 'connecting' | 'connected' | 'error';

function validateTransactionInput(item: Omit<Transaction, 'id' | 'createdAt'>): {
  title: string;
  amount: number;
  date: string;
  notes: string;
} {
  const title = item.title.trim();
  if (!title) {
    throw new Error('Informe uma descrição válida para o lançamento.');
  }

  const amount = roundCurrency(Number(item.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Informe um valor maior que zero.');
  }

  if (!isValidIsoDate(item.date)) {
    throw new Error('Informe uma data válida no formato AAAA-MM-DD.');
  }

  return {
    title,
    amount,
    date: item.date,
    notes: (item.notes || '').trim(),
  };
}

/**
 * Listener em tempo real para sincronização com o Firestore.
 * Não utiliza ordenação composta para evitar o erro "The query requires an index".
 * A ordenação é feita em memória no JavaScript.
 */
export function subscribeTransactions(
  onUpdate: (transactions: Transaction[]) => void,
  onStatusChange?: (status: ConnectionStatus) => void,
  onError?: (err: Error) => void
): () => void {
  const db = getFirebaseFirestore();

  if (!db) {
    if (onStatusChange) onStatusChange('error');
    if (onError) onError(new Error('Firebase Firestore não está inicializado'));
    return () => {};
  }

  if (onStatusChange) onStatusChange('connecting');

  try {
    const colRef = collection(db, COLLECTION_NAME);

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (onStatusChange) onStatusChange('connected');
        
        const items: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            title: typeof data.title === 'string' ? data.title : '',
            amount: Number.isFinite(Number(data.amount)) ? Number(data.amount) : 0,
            date: typeof data.date === 'string' ? data.date : '',
            paidBy: data.paidBy === 'marii' ? 'marii' : 'leeo',
            splitType:
              data.splitType === 'full_debt' ||
              data.splitType === 'split_50_50' ||
              data.splitType === 'payment_pix'
                ? data.splitType
                : 'split_50_50',
            category: data.category || 'general',
            notes: typeof data.notes === 'string' ? data.notes : '',
            installment: data.installment || undefined,
            createdAt: Number.isFinite(Number(data.createdAt)) ? Number(data.createdAt) : 0,
          });
        });

        // Ordenação em memória: Data decrescente, e em caso de empate, createdAt decrescente
        items.sort((a, b) => {
          if (b.date !== a.date) {
            return b.date.localeCompare(a.date);
          }
          return b.createdAt - a.createdAt;
        });

        onUpdate(items);
      },
      (error) => {
        console.error('Erro no listener em tempo real do Firestore:', error);
        if (onStatusChange) onStatusChange('error');
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err: unknown) {
    const normalizedErr = err instanceof Error ? err : new Error('Falha ao conectar ao Firestore.');
    console.error('Falha ao registrar snapshot do Firestore:', normalizedErr);
    if (onStatusChange) onStatusChange('error');
    if (onError) onError(normalizedErr);
    return () => {};
  }
}

/**
 * Cria uma nova transação direta
 */
export async function createTransaction(
  item: Omit<Transaction, 'id' | 'createdAt'>
): Promise<string> {
  const db = getFirebaseFirestore();

  if (!db) {
    throw new Error('Banco de dados em nuvem não disponível.');
  }

  const validated = validateTransactionInput(item);

  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    title: validated.title,
    amount: validated.amount,
    date: validated.date,
    paidBy: item.paidBy,
    splitType: item.splitType,
    category: item.category,
    notes: validated.notes,
    createdAt: Date.now(),
  });
  return docRef.id;
}

/**
 * Cria múltiplos lançamentos parcelados de forma atômica no Firestore via writeBatch
 */
export async function createInstallmentTransactions(
  baseItem: Omit<Transaction, 'id' | 'createdAt'>,
  installmentsCount: number
): Promise<void> {
  const db = getFirebaseFirestore();

  if (!db) {
    throw new Error('Banco de dados em nuvem não disponível.');
  }

  const safeCount = Math.floor(Number(installmentsCount));
  if (!Number.isFinite(safeCount) || safeCount < 2 || safeCount > MAX_INSTALLMENTS) {
    throw new Error(`O número de parcelas deve estar entre 2 e ${MAX_INSTALLMENTS}.`);
  }

  const validated = validateTransactionInput(baseItem);
  const installmentAmounts = calculateInstallments(validated.amount, safeCount);
  const now = Date.now();
  const groupId = 'inst-' + now + '-' + Math.random().toString(36).substring(2, 6);
  const batch = writeBatch(db);

  for (let i = 0; i < safeCount; i++) {
    const installmentDate = addMonthsToDate(validated.date, i);
    const installmentNumber = i + 1;
    const docRef = doc(collection(db, COLLECTION_NAME));

    batch.set(docRef, {
      title: `${validated.title} (${installmentNumber}/${safeCount})`,
      amount: installmentAmounts[i],
      date: installmentDate,
      paidBy: baseItem.paidBy,
      splitType: baseItem.splitType,
      category: baseItem.category,
      notes: validated.notes
        ? `${validated.notes} - Parcela ${installmentNumber}/${safeCount}`
        : `Parcela ${installmentNumber}/${safeCount}`,
      installment: {
        current: installmentNumber,
        total: safeCount,
        groupId,
      },
      createdAt: now + i,
    });
  }

  await batch.commit();
}

/**
 * Atualiza uma transação existente
 */
export async function editTransaction(item: Transaction): Promise<void> {
  const db = getFirebaseFirestore();

  if (!db) {
    throw new Error('Banco de dados em nuvem não disponível.');
  }

  const validated = validateTransactionInput(item);
  const docRef = doc(db, COLLECTION_NAME, item.id);
  await updateDoc(docRef, {
    title: validated.title,
    amount: validated.amount,
    date: validated.date,
    paidBy: item.paidBy,
    splitType: item.splitType,
    category: item.category,
    notes: validated.notes,
  });
}

/**
 * Remove uma transação
 */
export async function removeTransaction(id: string): Promise<void> {
  const db = getFirebaseFirestore();

  if (!db) {
    throw new Error('Banco de dados em nuvem não disponível.');
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}
