import React from 'react';
import { BalanceSummary, BillingCycle } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';
import { Plus, ArrowRight, CornerDownRight } from 'lucide-react';

interface IndustrialBalanceProps {
  summary: BalanceSummary;
  cycle: BillingCycle | null;
  isAllTime: boolean;
  onOpenNewTransaction: () => void;
  onOpenSettle: () => void;
}

export function IndustrialBalance({
  summary,
  cycle,
  isAllTime,
  onOpenNewTransaction,
  onOpenSettle,
}: IndustrialBalanceProps) {
  const isSettled = summary.debtor === 'none';
  const mariiOwes = summary.debtor === 'marii';
  const leeoOwes = summary.debtor === 'leeo';

  return (
    <div className="border border-zinc-800 bg-[#0c0c0e] p-5 sm:p-6 rounded-none relative">
      {/* Top Header: Technical Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3 mb-5 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-zinc-300 font-semibold">Balanço Financeiro</span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          {isAllTime ? (
            <span className="px-2 py-0.5 border border-zinc-700 bg-zinc-900 text-zinc-300">
              Histórico Geral Acumulado
            </span>
          ) : cycle ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 border border-zinc-750 bg-zinc-900 text-zinc-300">
              <span className={`w-1.5 h-1.5 rounded-full ${cycle.isCurrent ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
              Ciclo {cycle.label}
            </span>
          ) : null}
        </div>
      </div>

      {/* Main Focus: WHO OWES WHOM and HOW MUCH */}
      <div className="space-y-2 my-2">
        <div className="text-[11px] font-mono tracking-widest uppercase text-zinc-400">
          Posição Líquida
        </div>

        {isSettled ? (
          <div className="py-2">
            <div className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-emerald-400">
              Contas Zeradas
            </div>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              Nenhuma pendência financeira entre Leeo e Marii.
            </p>
          </div>
        ) : mariiOwes ? (
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-orange-500/40 bg-orange-950/20 text-orange-400 text-xs font-mono uppercase tracking-wider font-semibold mb-2">
              <CornerDownRight className="w-3.5 h-3.5" />
              Marii deve para Leeo
            </div>
            <div className="text-4xl sm:text-5xl font-mono font-extrabold tabular-nums tracking-tight text-white">
              {formatCurrency(summary.debtAmount)}
            </div>
            <p className="text-[11px] font-mono text-zinc-400 mt-1.5">
              Valor líquido a ser pago ou abatido por Marii
            </p>
          </div>
        ) : (
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-zinc-700 bg-zinc-900 text-zinc-300 text-xs font-mono uppercase tracking-wider font-semibold mb-2">
              <CornerDownRight className="w-3.5 h-3.5" />
              Leeo deve para Marii
            </div>
            <div className="text-4xl sm:text-5xl font-mono font-extrabold tabular-nums tracking-tight text-white">
              {formatCurrency(summary.debtAmount)}
            </div>
            <p className="text-[11px] font-mono text-zinc-400 mt-1.5">
              Valor líquido a ser pago ou abatido por Leeo
            </p>
          </div>
        )}
      </div>

      {/* Breakdown Bar (Desembolsos) */}
      <div className="grid grid-cols-2 gap-px bg-zinc-800 border border-zinc-800 mt-5 text-xs font-mono">
        <div className="bg-[#0f0f12] p-3">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 block mb-0.5">
            Total Desembolsado Leeo
          </span>
          <span className="text-sm font-bold tabular-nums text-zinc-200">
            {formatCurrency(summary.spentLeeo)}
          </span>
        </div>
        <div className="bg-[#0f0f12] p-3">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 block mb-0.5">
            Total Desembolsado Marii
          </span>
          <span className="text-sm font-bold tabular-nums text-zinc-200">
            {formatCurrency(summary.spentMarii)}
          </span>
        </div>
      </div>

      {/* Action Triggers */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2.5 mt-5">
        <button
          type="button"
          onClick={onOpenNewTransaction}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-black font-mono text-xs font-bold uppercase tracking-wider transition rounded-sm shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Lançar Conta</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettle}
          disabled={isSettled}
          className={`flex items-center justify-center gap-2 py-3 px-4 border text-xs font-mono uppercase tracking-wider transition rounded-sm ${
            isSettled
              ? 'border-zinc-800 text-zinc-600 cursor-not-allowed bg-zinc-950'
              : 'border-zinc-700 bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-500 text-zinc-200'
          }`}
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>Registrar PIX / Acerto</span>
        </button>
      </div>
    </div>
  );
}
