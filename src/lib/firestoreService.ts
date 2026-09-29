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
import { Transaction } from './types';
import { calculateInstallments, addMonthsToDate } from './calculations';

const COLLECTION_NAME = 'transactions_v2';

export type ConnectionStatus = 'connecting' | 'connected' | 'error';

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
            title: data.title || '',
            amount: Number(data.amount) || 0,
            date: data.date || '',
            paidBy: data.paidBy === 'marii' ? 'marii' : 'leeo',
            splitType: data.splitType || 'split_50_50',
            category: data.category || 'general',
            notes: data.notes || '',
            installment: data.installment || undefined,
            createdAt: Number(data.createdAt) || Date.now(),
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
  } catch (err: any) {
    console.error('Falha ao registrar snapshot do Firestore:', err);
    if (onStatusChange) onStatusChange('error');
    if (onError) onError(err);
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

  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...item,
    amount: Number(item.amount),
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

  const installmentAmounts = calculateInstallments(baseItem.amount, installmentsCount);
  const groupId = 'inst-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const batch = writeBatch(db);

  for (let i = 0; i < installmentsCount; i++) {
    const installmentDate = addMonthsToDate(baseItem.date, i);
    const installmentNumber = i + 1;
    const docRef = doc(collection(db, COLLECTION_NAME));

    batch.set(docRef, {
      title: `${baseItem.title} (${installmentNumber}/${installmentsCount})`,
      amount: installmentAmounts[i],
      date: installmentDate,
      paidBy: baseItem.paidBy,
      splitType: baseItem.splitType,
      category: baseItem.category,
      notes: baseItem.notes ? `${baseItem.notes} - Parcela ${installmentNumber}/${installmentsCount}` : `Parcela ${installmentNumber}/${installmentsCount}`,
      installment: {
        current: installmentNumber,
        total: installmentsCount,
        groupId,
      },
      createdAt: Date.now() + i, // Incremento sutil para manter ordenação estável
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

  const docRef = doc(db, COLLECTION_NAME, item.id);
  await updateDoc(docRef, {
    title: item.title,
    amount: Number(item.amount),
    date: item.date,
    paidBy: item.paidBy,
    splitType: item.splitType,
    category: item.category,
    notes: item.notes || '',
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
