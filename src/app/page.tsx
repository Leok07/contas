'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Cloud, HardDrive, Plus, Terminal } from 'lucide-react';
import { Transaction, BillingCycle } from '@/lib/types';
import { calculateBalance } from '@/lib/calculations';
import { 
  getCurrentBillingCycle, 
  getAvailableBillingCycles, 
  filterTransactionsByCycle 
} from '@/lib/billingCycle';
import { 
  subscribeTransactions, 
  createTransaction, 
  editTransaction, 
  removeTransaction 
} from '@/lib/firestoreService';
import { isFirebaseConfigured } from '@/lib/firebase';
import { IndustrialBalance } from '@/components/IndustrialBalance';
import { CycleNavigator } from '@/components/CycleNavigator';
import { IndustrialList } from '@/components/IndustrialList';
import { QuickEntryModal } from '@/components/QuickEntryModal';
import { SettleModal } from '@/components/SettleModal';
import { FirebaseModal } from '@/components/FirebaseModal';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFirebaseActive, setIsFirebaseActive] = useState(false);
  
  // Ciclo selecionado (padrão é o ciclo ativo do dia 10)
  const [selectedCycleKey, setSelectedCycleKey] = useState<string>('');

  // Modais
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    setIsFirebaseActive(isFirebaseConfigured());

    // Define o ciclo ativo inicial
    const current = getCurrentBillingCycle();
    setSelectedCycleKey(current.key);

    const unsubscribe = subscribeTransactions((data) => {
      setTransactions(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Lista de ciclos disponíveis gerada dinamicamente
  const availableCycles = useMemo(() => {
    return getAvailableBillingCycles(transactions);
  }, [transactions]);

  // Ciclo atualmente selecionado
  const activeCycleObj = useMemo(() => {
    if (selectedCycleKey === 'all') return null;
    return availableCycles.find((c) => c.key === selectedCycleKey) || getCurrentBillingCycle();
  }, [selectedCycleKey, availableCycles]);

  // Transações filtradas pelo ciclo
  const displayedTransactions = useMemo(() => {
    return filterTransactionsByCycle(transactions, selectedCycleKey);
  }, [transactions, selectedCycleKey]);

  // Resumo de saldos do período exibido (ou geral)
  const displayedSummary = useMemo(() => {
    return calculateBalance(displayedTransactions);
  }, [displayedTransactions]);

  // CRUD Handlers
  const handleSaveTransaction = async (
    data: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (data.id) {
      const existing = transactions.find((t) => t.id === data.id);
      if (existing) {
        await editTransaction({
          ...existing,
          title: data.title,
          amount: data.amount,
          date: data.date,
          paidBy: data.paidBy,
          splitType: data.splitType,
          category: data.category,
          notes: data.notes,
        });
      }
    } else {
      await createTransaction({
        title: data.title,
        amount: data.amount,
        date: data.date,
        paidBy: data.paidBy,
        splitType: data.splitType,
        category: data.category,
        notes: data.notes,
      });
    }
  };

  const handleEditClick = (t: Transaction) => {
    setEditingTransaction(t);
    setIsEntryOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    await removeTransaction(id);
  };

  const handleSettleConfirm = async (
    settleData: Omit<Transaction, 'id' | 'createdAt'>
  ) => {
    await createTransaction(settleData);
  };

  return (
    <main className="min-h-screen bg-[#08080a] text-zinc-100 pb-24 font-mono">
      {/* Header Superior Técnico */}
      <header className="sticky top-0 z-40 bg-[#08080a]/90 backdrop-blur-sm border-b border-zinc-800/80 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-orange-500 rounded-none inline-block shrink-0" />
            <div>
              <h1 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <span>Leeo & Marii</span>
                <span className="text-[10px] text-zinc-400 font-normal border border-zinc-800 px-1.5 py-0.2">
                  Contas
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status da Conexão */}
            <button
              onClick={() => setIsConfigOpen(true)}
              type="button"
              className="flex items-center gap-1.5 px-2 py-1 border border-zinc-800 bg-[#0c0c0e] hover:border-zinc-700 text-[10px] uppercase text-zinc-400 hover:text-zinc-200 transition"
              title="Configurar Firebase"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isFirebaseActive ? 'bg-emerald-500' : 'bg-orange-500'}`} />
              <span className="hidden sm:inline">
                {isFirebaseActive ? 'Firebase Nuvem' : 'Local'}
              </span>
            </button>

            <button
              onClick={() => setIsConfigOpen(true)}
              type="button"
              className="p-1 border border-zinc-800 bg-[#0c0c0e] hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition"
              title="Configurações"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Central */}
      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-6">
        {/* Bloco Hero de Balanço */}
        <IndustrialBalance
          summary={displayedSummary}
          cycle={activeCycleObj}
          isAllTime={selectedCycleKey === 'all'}
          onOpenNewTransaction={() => {
            setEditingTransaction(null);
            setIsEntryOpen(true);
          }}
          onOpenSettle={() => setIsSettleOpen(true)}
        />

        {/* Navegador de Ciclos */}
        <CycleNavigator
          cycles={availableCycles}
          selectedCycleKey={selectedCycleKey}
          onSelectCycle={setSelectedCycleKey}
        />

        {/* Extrato / Livro-Razão */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-400">
            <span>Extrato de Lançamentos</span>
            <span>{activeCycleObj?.label || 'Todas as Contas'}</span>
          </div>

          <IndustrialList
            transactions={displayedTransactions}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        </div>
      </div>

      {/* Botão Flutuante (FAB) para Mobile */}
      <div className="fixed bottom-5 right-5 sm:hidden z-30">
        <button
          onClick={() => {
            setEditingTransaction(null);
            setIsEntryOpen(true);
          }}
          type="button"
          className="w-12 h-12 bg-orange-500 text-black flex items-center justify-center font-bold shadow-lg shadow-black/80 hover:bg-orange-400 active:scale-95 transition rounded-none"
          title="Lançar Conta"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      {/* Modais */}
      <QuickEntryModal
        isOpen={isEntryOpen}
        onClose={() => {
          setIsEntryOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
      />

      <SettleModal
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        summary={displayedSummary}
        onConfirmSettlement={handleSettleConfirm}
      />

      <FirebaseModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onConfigSaved={() => {
          setIsFirebaseActive(isFirebaseConfigured());
          window.location.reload();
        }}
      />
    </main>
  );
}
