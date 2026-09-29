import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
} from 'firebase/firestore';
import { getFirebaseFirestore } from './firebase';
import { Transaction } from './types';

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
 * Cria uma nova transação diretamente no Firestore
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
