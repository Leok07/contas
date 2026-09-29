import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Transaction, Person, SplitType, CategoryKey } from '@/lib/types';
import { CATEGORIES, formatCurrency } from '@/lib/calculations';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  editingTransaction?: Transaction | null;
}

export function QuickEntryModal({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
}: QuickEntryModalProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [paidBy, setPaidBy] = useState<Person>('leeo');
  const [splitType, setSplitType] = useState<SplitType>('split_50_50');
  const [category, setCategory] = useState<CategoryKey>('general');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setTitle(editingTransaction.title);
      setAmount(editingTransaction.amount.toString());
      setDate(editingTransaction.date);
      setPaidBy(editingTransaction.paidBy);
      setSplitType(editingTransaction.splitType);
      setCategory(editingTransaction.category);
      setNotes(editingTransaction.notes || '');
    } else {
      setTitle('');
      setAmount('');
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setPaidBy('leeo');
      setSplitType('split_50_50');
      setCategory('general');
      setNotes('');
    }
  }, [editingTransaction, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0 || !date) return;

    try {
      setIsSubmitting(true);
      await onSave({
        id: editingTransaction?.id,
        title: title.trim(),
        amount: parsedAmount,
        date,
        paidBy,
        splitType,
        category,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Erro ao salvar lançamento:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const numAmount = parseFloat(amount.replace(',', '.')) || 0;
  const halfAmount = numAmount / 2;

  const getDynamicImpactText = () => {
    if (splitType === 'payment_pix') {
      if (paidBy === 'marii') {
        return `Marii transferiu ${formatCurrency(numAmount)} para Leeo (Abate ${formatCurrency(numAmount)} da dívida).`;
      }
      return `Leeo transferiu ${formatCurrency(numAmount)} para Marii (Abate ${formatCurrency(numAmount)} que Leeo devia).`;
    }

    if (splitType === 'full_debt') {
      if (paidBy === 'leeo') {
        return `Leeo pagou valor total: Marii deve ${formatCurrency(numAmount)} integralmente.`;
      }
      return `Marii pagou (ex: no cartão dela): Abate ${formatCurrency(numAmount)} da dívida com Leeo.`;
    }

    // 50/50
    if (paidBy === 'leeo') {
      return `Dividido 50/50: Marii deve ${formatCurrency(halfAmount)} para Leeo.`;
    }
    return `Dividido 50/50: Leeo deve ${formatCurrency(halfAmount)} para Marii (Abate do saldo).`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="w-full max-w-md bg-[#0c0c0e] border border-zinc-800 p-5 sm:p-6 text-zinc-100 my-6 rounded-none shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-none inline-block" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
              {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 text-zinc-500 hover:text-zinc-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 font-mono text-xs">
          {/* Valor Principal (Display Grande) */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">
              Valor (R$)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 text-sm font-bold">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                autoFocus
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-3 py-3 bg-[#131317] border border-zinc-750 text-xl font-bold text-white tabular-nums focus:border-orange-500 focus:outline-none rounded-none"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">
              Descrição
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Aluguel, Mercado, Compras no cartão..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#131317] border border-zinc-750 text-zinc-200 focus:border-orange-500 focus:outline-none rounded-none"
            />
          </div>

          {/* Quem Pagou */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">
              Quem Pagou / Desembolsou?
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setPaidBy('leeo')}
                className={`py-2.5 text-center uppercase tracking-wider font-bold transition border rounded-none ${
                  paidBy === 'leeo'
                    ? 'bg-zinc-100 text-black border-zinc-100'
                    : 'bg-[#131317] text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                Leeo
              </button>

              <button
                type="button"
                onClick={() => setPaidBy('marii')}
                className={`py-2.5 text-center uppercase tracking-wider font-bold transition border rounded-none ${
                  paidBy === 'marii'
                    ? 'bg-zinc-100 text-black border-zinc-100'
                    : 'bg-[#131317] text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                Marii
              </button>
            </div>
          </div>

          {/* Tipo de Divisão */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">
              Regra de Divisão
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setSplitType('split_50_50')}
                className={`py-2 px-1 text-center uppercase tracking-wider text-[11px] font-medium border rounded-none transition ${
                  splitType === 'split_50_50'
                    ? 'bg-orange-500 text-black border-orange-500 font-bold'
                    : 'bg-[#131317] text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                50% / 50%
              </button>

              <button
                type="button"
                onClick={() => setSplitType('full_debt')}
                className={`py-2 px-1 text-center uppercase tracking-wider text-[11px] font-medium border rounded-none transition ${
                  splitType === 'full_debt'
                    ? 'bg-orange-500 text-black border-orange-500 font-bold'
                    : 'bg-[#131317] text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                100% Outro
              </button>

              <button
                type="button"
                onClick={() => setSplitType('payment_pix')}
                className={`py-2 px-1 text-center uppercase tracking-wider text-[11px] font-medium border rounded-none transition ${
                  splitType === 'payment_pix'
                    ? 'bg-orange-500 text-black border-orange-500 font-bold'
                    : 'bg-[#131317] text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                PIX Acerto
              </button>
            </div>

            {/* Impacto no Saldo */}
            <div className="mt-2 p-2 border border-zinc-800 bg-[#101014] text-[11px] text-zinc-300">
              {getDynamicImpactText()}
            </div>
          </div>

          {/* Data e Categoria */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">
                Data
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-[#131317] border border-zinc-750 text-zinc-200 focus:border-orange-500 focus:outline-none rounded-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryKey)}
                className="w-full px-2.5 py-2 bg-[#131317] border border-zinc-750 text-zinc-200 focus:border-orange-500 focus:outline-none rounded-none"
              >
                {(Object.keys(CATEGORIES) as CategoryKey[]).map((k) => (
                  <option key={k} value={k}>
                    {CATEGORIES[k].code} - {CATEGORIES[k].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">
              Notas (Opcional)
            </label>
            <input
              type="text"
              placeholder="Detalhes adicionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#131317] border border-zinc-750 text-zinc-300 text-xs focus:border-orange-500 focus:outline-none rounded-none"
            />
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition uppercase tracking-wider text-[11px]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-black font-bold uppercase tracking-wider text-[11px] transition disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
