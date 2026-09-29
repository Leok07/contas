import { BillingCycle, Transaction } from './types';

const MONTH_NAMES_SHORT = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
];

function pad(num: number, size = 2): string {
  let s = num.toString();
  while (s.length < size) s = '0' + s;
  return s;
}

/**
 * Retorna o ciclo de faturamento (10 a 09) para qualquer data YYYY-MM-DD
 */
export function getBillingCycleForDate(dateStr: string): BillingCycle {
  let dateObj: Date;
  if (!dateStr || !dateStr.includes('-')) {
    dateObj = new Date();
  } else {
    const [y, m, d] = dateStr.split('-').map(Number);
    dateObj = new Date(y, m - 1, d);
  }

  const year = dateObj.getFullYear();
  const month = dateObj.getMonth(); // 0 a 11
  const day = dateObj.getDate();

  let startYear = year;
  let startMonth = month; // 0 a 11
  let endYear = year;
  let endMonth = month + 1; // 1 a 12

  if (day >= 10) {
    // Início no dia 10 deste mês
    startYear = year;
    startMonth = month;
    if (month === 11) {
      endYear = year + 1;
      endMonth = 0;
    } else {
      endYear = year;
      endMonth = month + 1;
    }
  } else {
    // Início no dia 10 do mês anterior
    endYear = year;
    endMonth = month;
    if (month === 0) {
      startYear = year - 1;
      startMonth = 11;
    } else {
      startYear = year;
      startMonth = month - 1;
    }
  }

  const startDate = `${startYear}-${pad(startMonth + 1)}-10`;
  const endDate = `${endYear}-${pad(endMonth + 1)}-09`;
  const key = `${startYear}-${pad(startMonth + 1)}`;

  const startName = MONTH_NAMES_SHORT[startMonth];
  const endName = MONTH_NAMES_SHORT[endMonth];

  // Verifica se a data atual do sistema está contida neste ciclo
  const now = new Date();
  const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const isCurrent = nowStr >= startDate && nowStr <= endDate;

  return {
    key,
    startDate,
    endDate,
    label: `10/${startName} — 09/${endName}`,
    shortLabel: `${startName}/${endName}`,
    isCurrent,
  };
}

/**
 * Retorna o ciclo ativo no exato momento da consulta
 */
export function getCurrentBillingCycle(): BillingCycle {
  const now = new Date();
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  return getBillingCycleForDate(`${y}-${m}-${d}`);
}

/**
 * Retorna todos os ciclos disponíveis a partir do histórico de transações + ciclo atual
 */
export function getAvailableBillingCycles(transactions: Transaction[]): BillingCycle[] {
  const map = new Map<string, BillingCycle>();

  // Sempre inclui o ciclo atual
  const current = getCurrentBillingCycle();
  map.set(current.key, current);

  // Inclui os ciclos de cada lançamento
  transactions.forEach((t) => {
    if (t.date) {
      const cycle = getBillingCycleForDate(t.date);
      if (!map.has(cycle.key)) {
        map.set(cycle.key, cycle);
      }
    }
  });

  // Ordena do mais recente para o mais antigo
  return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
}

/**
 * Filtra transações que pertençam ao ciclo especificado (ou todas se for 'all')
 */
export function filterTransactionsByCycle(
  transactions: Transaction[],
  cycleKey: string
): Transaction[] {
  if (!cycleKey || cycleKey === 'all') return transactions;

  return transactions.filter((t) => {
    const cycle = getBillingCycleForDate(t.date);
    return cycle.key === cycleKey;
  });
}
