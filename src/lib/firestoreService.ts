import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
} from 'firebase/firestore';
import { getFirebaseFirestore } from './firebase';
import { Transaction } from './types';
import { 
  getLocalTransactions, 
  saveLocalTransaction, 
  updateLocalTransaction, 
  deleteLocalTransaction 
} from './storageService';

const COLLECTION_NAME = 'transactions_v2';

/**
 * Listener em tempo real para sincronização com o Firestore
 */
export function subscribeTransactions(
  onUpdate: (transactions: Transaction[]) => void,
  onError?: (err: Error) => void
): () => void {
  const db = getFirebaseFirestore();

  if (!db) {
    const local = getLocalTransactions();
    onUpdate(local);
    const storageHandler = () => {
      onUpdate(getLocalTransactions());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', storageHandler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', storageHandler);
      }
    };
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
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
        onUpdate(items);
      },
      (error) => {
        console.error('Erro na sincronização em tempo real do Firestore:', error);
        if (onError) onError(error);
        onUpdate(getLocalTransactions());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Falha ao registrar listener do Firestore:', err);
    onUpdate(getLocalTransactions());
    return () => {};
  }
}

export async function createTransaction(
  item: Omit<Transaction, 'id' | 'createdAt'>
): Promise<string> {
  const db = getFirebaseFirestore();

  if (!db) {
    const saved = saveLocalTransaction(item);
    return saved.id;
  }

  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...item,
    amount: Number(item.amount),
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function editTransaction(item: Transaction): Promise<void> {
  const db = getFirebaseFirestore();

  if (!db) {
    updateLocalTransaction(item);
    return;
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

export async function removeTransaction(id: string): Promise<void> {
  const db = getFirebaseFirestore();

  if (!db) {
    deleteLocalTransaction(id);
    return;
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}
