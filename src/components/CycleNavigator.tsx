import React from 'react';
import { BillingCycle } from '@/lib/types';

interface CycleNavigatorProps {
  cycles: BillingCycle[];
  selectedCycleKey: string;
  onSelectCycle: (key: string) => void;
}

export function CycleNavigator({
  cycles,
  selectedCycleKey,
  onSelectCycle,
}: CycleNavigatorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-400">
        <span>Ciclos de Fatura (Virada Dia 10)</span>
        <span>Sincronizado</span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {/* Aba Geral / Todos */}
        <button
          type="button"
          onClick={() => onSelectCycle('all')}
          className={`px-3 py-1.5 border font-mono text-[11px] uppercase tracking-wider whitespace-nowrap transition rounded-none ${
            selectedCycleKey === 'all'
              ? 'bg-zinc-100 text-black border-zinc-100 font-bold'
              : 'border-zinc-800 bg-[#0c0c0e] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
        >
          Geral (Acumulado)
        </button>

        {/* Ciclos Individuais */}
        {cycles.map((c) => {
          const isSelected = selectedCycleKey === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onSelectCycle(c.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border font-mono text-[11px] uppercase tracking-wider whitespace-nowrap transition rounded-none ${
                isSelected
                  ? 'bg-zinc-100 text-black border-zinc-100 font-bold'
                  : 'border-zinc-800 bg-[#0c0c0e] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {c.isCurrent && (
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-orange-600' : 'bg-orange-500'}`} />
              )}
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
