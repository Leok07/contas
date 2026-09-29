import React, { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { BalanceSummary, Transaction, Person } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';

interface SettleModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: BalanceSummary;
  onConfirmSettlement: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
}

export function SettleModal({
  isOpen,
  onClose,
  summary,
  onConfirmSettlement,
}: SettleModalProps) {
  const [payer, setPayer] = useState<Person>('marii');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setErrorMsg('');
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      if (summary.debtor === 'marii') {
        setPayer('marii');
        setAmount(summary.debtAmount.toString());
      } else if (summary.debtor === 'leeo') {
        setPayer('leeo');
        setAmount(summary.debtAmount.toString());
      } else {
        setPayer('marii');
        setAmount('0');
      }
    }
  }, [isOpen, summary]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    try {
      setIsSubmitting(true);
      const payerName = payer === 'marii' ? 'Marii' : 'Leeo';
      const recipientName = payer === 'marii' ? 'Leeo' : 'Marii';

      await onConfirmSettlement({
        title: `Acerto PIX (${payerName} -> ${recipientName})`,
        amount: parsedAmount,
        date,
        paidBy: payer,
        splitType: 'payment_pix',
        category: 'bills',
        notes: 'Liquidação de saldo',
      });
      onClose();
    } catch (err: any) {
      console.error('Erro ao registrar acerto:', err);
      setErrorMsg(err.message || 'Falha ao registrar acerto no banco.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const payerLabel = payer === 'marii' ? 'Marii' : 'Leeo';
  const recipientLabel = payer === 'marii' ? 'Leeo' : 'Marii';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-[#0c0c0e] border border-zinc-800 p-5 sm:p-6 text-zinc-100 rounded-none shadow-2xl font-mono text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-none inline-block" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Liquidação / Acerto PIX
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 text-zinc-500 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="p-3 border border-zinc-800 bg-[#131317] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase text-zinc-500 block">Saldo Atual Pendente</span>
              <span className="text-base font-bold tabular-nums text-white">
                {formatCurrency(summary.debtAmount)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300 font-bold uppercase text-[11px]">
              <span>{payerLabel}</span>
              <ArrowRight className="w-3.5 h-3.5 text-orange-500" />
              <span>{recipientLabel}</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">
              Quem está pagando o PIX?
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setPayer('marii')}
                className={`py-2 text-center uppercase tracking-wider font-bold transition border rounded-none ${
                  payer === 'marii'
                    ? 'bg-zinc-100 text-black border-zinc-100'
                    : 'bg-[#131317] text-zinc-400 border-zinc-800'
                }`}
              >
                Marii pagou Leeo
              </button>
              <button
                type="button"
                onClick={() => setPayer('leeo')}
                className={`py-2 text-center uppercase tracking-wider font-bold transition border rounded-none ${
                  payer === 'leeo'
                    ? 'bg-zinc-100 text-black border-zinc-100'
                    : 'bg-[#131317] text-zinc-400 border-zinc-800'
                }`}
              >
                Leeo pagou Marii
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">
              Valor Transferido (R$)
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-[#131317] border border-zinc-750 text-base font-bold text-white tabular-nums focus:border-orange-500 focus:outline-none rounded-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">
              Data do Pagamento
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#131317] border border-zinc-750 text-zinc-200 focus:border-orange-500 focus:outline-none rounded-none"
            />
          </div>

          {errorMsg && (
            <div className="p-2 border border-red-900 bg-red-950/50 text-red-400 text-[11px] font-mono">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition uppercase tracking-wider text-[11px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-wider text-[11px] transition disabled:opacity-50"
            >
              {isSubmitting ? 'Registrando...' : 'Confirmar Acerto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
