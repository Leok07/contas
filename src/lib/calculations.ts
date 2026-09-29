import { Transaction, BalanceSummary, CategoryInfo, CategoryKey } from './types';

export const CATEGORIES: Record<CategoryKey, CategoryInfo> = {
  general: {
    key: 'general',
    label: 'Geral',
    code: 'GER',
  },
  vacation: {
    key: 'vacation',
    label: 'Férias & Viagens',
    code: 'FER',
  },
  credit_card: {
    key: 'credit_card',
    label: 'Cartão de Crédito',
    code: 'CRT',
  },
  food: {
    key: 'food',
    label: 'Alimentação & Mercado',
    code: 'ALM',
  },
  housing: {
    key: 'housing',
    label: 'Moradia & Casa',
    code: 'MOR',
  },
  transport: {
    key: 'transport',
    label: 'Transporte',
    code: 'TRN',
  },
  bills: {
    key: 'bills',
    label: 'Contas Fixas',
    code: 'CON',
  },
};

/**
 * Calcula o resumo consolidado do balanço financeiro entre Leeo e Marii
 */
export function calculateBalance(transactions: Transaction[]): BalanceSummary {
  let spentLeeo = 0;
  let spentMarii = 0;
  let mariiOwesLeeo = 0;
  let leeoOwesMarii = 0;
  let paymentsMariiToLeeo = 0;
  let paymentsLeeoToMarii = 0;

  for (const t of transactions) {
    const amount = Number(t.amount) || 0;

    if (t.splitType === 'payment_pix') {
      if (t.paidBy === 'marii') {
        paymentsMariiToLeeo += amount;
      } else {
        paymentsLeeoToMarii += amount;
      }
      continue;
    }

    if (t.paidBy === 'leeo') {
      spentLeeo += amount;
      if (t.splitType === 'full_debt') {
        mariiOwesLeeo += amount;
      } else if (t.splitType === 'split_50_50') {
        mariiOwesLeeo += amount / 2;
      }
    } else if (t.paidBy === 'marii') {
      spentMarii += amount;
      if (t.splitType === 'full_debt') {
        leeoOwesMarii += amount;
      } else if (t.splitType === 'split_50_50') {
        leeoOwesMarii += amount / 2;
      }
    }
  }

  // mariiOwesLeeo: dívidas de despesas onde Marii deve pagar Leeo
  // leeoOwesMarii: dívidas de despesas onde Leeo deve pagar Marii (ex: compra no cartão da Marii)
  const totalDueFromMarii = mariiOwesLeeo - paymentsMariiToLeeo;
  const totalDueFromLeeo = leeoOwesMarii - paymentsLeeoToMarii;
  const netBalance = totalDueFromMarii - totalDueFromLeeo;

  const roundedNet = Math.round(netBalance * 100) / 100;
  let debtor: 'leeo' | 'marii' | 'none' = 'none';
  let debtAmount = 0;

  if (roundedNet > 0.009) {
    debtor = 'marii';
    debtAmount = roundedNet;
  } else if (roundedNet < -0.009) {
    debtor = 'leeo';
    debtAmount = Math.abs(roundedNet);
  }

  return {
    spentLeeo: Math.round(spentLeeo * 100) / 100,
    spentMarii: Math.round(spentMarii * 100) / 100,
    mariiOwesLeeo: Math.round(totalDueFromMarii * 100) / 100,
    leeoOwesMarii: Math.round(totalDueFromLeeo * 100) / 100,
    netBalance: roundedNet,
    debtor,
    debtAmount: Math.round(debtAmount * 100) / 100,
  };
}

/**
 * Formata moeda BRL com precisão e estilo tabular
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

/**
 * Formata data curta YYYY-MM-DD para DD/MM
 */
export function formatDateShort(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return '';
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}`;
}

/**
 * Formata data completa DD/MM/YYYY
 */
export function formatDateFull(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return '';
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
