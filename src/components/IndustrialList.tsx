import React, { useState } from 'react';
import { Search, Trash2, Edit3, X } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { formatCurrency, formatDateShort, CATEGORIES } from '@/lib/calculations';

interface IndustrialListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => Promise<void>;
}

export function IndustrialList({
  transactions,
  onEdit,
  onDelete,
}: IndustrialListProps) {
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = transactions.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.notes && t.notes.toLowerCase().includes(q)) ||
      t.paidBy.toLowerCase().includes(q) ||
      t.amount.toString().includes(q)
    );
  });

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await onDelete(id);
      setConfirmId(null);
    } catch (err) {
      console.error('Erro ao deletar:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderRuleBadge = (t: Transaction) => {
    if (t.splitType === 'payment_pix') {
      return (
        <span className="px-1.5 py-0.5 border border-emerald-800 bg-emerald-950/40 text-emerald-400 text-[10px] font-mono uppercase">
          PIX
        </span>
      );
    }
    if (t.splitType === 'full_debt') {
      return (
        <span className="px-1.5 py-0.5 border border-orange-800 bg-orange-950/30 text-orange-400 text-[10px] font-mono uppercase">
          100%
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 border border-zinc-700 bg-zinc-900 text-zinc-300 text-[10px] font-mono uppercase">
        50/50
      </span>
    );
  };

  return (
    <div className="space-y-2">
      {/* Barra de Busca Industrial */}
      <div className="flex items-center justify-between gap-2 border border-zinc-800 bg-[#0c0c0e] px-3 py-1.5">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="FILTRAR LANÇAMENTOS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none uppercase"
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-zinc-500 hover:text-zinc-300 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap pl-2 border-l border-zinc-800">
          {filtered.length} {filtered.length === 1 ? 'REGISTRO' : 'REGISTROS'}
        </span>
      </div>

      {/* Lista / Tabela */}
      {filtered.length === 0 ? (
        <div className="border border-zinc-850 bg-[#0c0c0e] p-8 text-center font-mono">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Nenhum lançamento registrado neste período
          </p>
          <p className="text-[11px] text-zinc-600 mt-1">
            Utilize o botão "Lançar Conta" para adicionar uma conta real.
          </p>
        </div>
      ) : (
        <div className="border border-zinc-800 bg-[#0c0c0e] divide-y divide-zinc-850">
          {filtered.map((t) => {
            const isConfirming = confirmId === t.id;
            const cat = CATEGORIES[t.category] || CATEGORIES.general;

            return (
              <div
                key={t.id}
                className="p-3 sm:px-4 hover:bg-[#121216] transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 font-mono"
              >
                {/* Esquerda: Data, Categoria, Título */}
                <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                  <span className="text-zinc-500 text-[11px] tabular-nums shrink-0 pt-0.5 sm:pt-0">
                    {formatDateShort(t.date)}
                  </span>

                  <span className="text-[10px] px-1 py-0.5 border border-zinc-800 bg-zinc-900 text-zinc-400 shrink-0">
                    {cat.code}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-200 truncate">
                        {t.title}
                      </span>
                    </div>

                    {t.notes && (
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {t.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Centro/Direita: Quem Pagou, Regra e Valor */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-850">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400 uppercase">
                      Por: <strong className="text-zinc-200 font-bold">{t.paidBy.toUpperCase()}</strong>
                    </span>
                    {renderRuleBadge(t)}
                  </div>

                  <div className="text-sm font-bold tabular-nums text-white min-w-[90px] text-right">
                    {formatCurrency(t.amount)}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 pl-1">
                    {isConfirming ? (
                      <div className="flex items-center gap-1 bg-red-950/60 border border-red-900 px-1 py-0.5">
                        <span className="text-[9px] text-red-400 uppercase font-bold">
                          Excluir?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          disabled={isDeleting}
                          className="px-1 text-[9px] bg-red-600 text-white font-bold uppercase"
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="px-1 text-[9px] bg-zinc-700 text-zinc-200 uppercase"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit(t)}
                          className="p-1 text-zinc-500 hover:text-zinc-200 transition"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(t.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
