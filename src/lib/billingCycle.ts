import type { BillingCycle, Transaction } from './types';

const MONTH_NAMES_SHORT = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
];

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function pad(num: number, size = 2): string {
  return String(num).padStart(size, '0');
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseIsoDate(dateStr: string): Date | null {
  if (!dateStr || !ISO_DATE_RE.test(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== y ||
    parsed.getMonth() !== m - 1 ||
    parsed.getDate() !== d
  ) {
    return null;
  }
  return parsed;
}

/**
 * Retorna o ciclo de faturamento (10 a 09) para qualquer data YYYY-MM-DD.
 * Aceita referenceDate opcional para cálculos e testes determinísticos.
 */
export function getBillingCycleForDate(
  dateStr: string,
  referenceDate: Date = new Date()
): BillingCycle {
  const dateObj = parseIsoDate(dateStr) ?? referenceDate;

  const year = dateObj.getFullYear();
  const month = dateObj.getMonth(); // 0 a 11
  const day = dateObj.getDate();

  let startYear = year;
  let startMonth = month;
  let endYear = year;
  let endMonth = month + 1;

  if (day >= 10) {
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

  const nowStr = formatDateKey(referenceDate);
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
 * Retorna o ciclo ativo na data de referência informada (padrão: hoje).
 */
export function getCurrentBillingCycle(referenceDate: Date = new Date()): BillingCycle {
  return getBillingCycleForDate(formatDateKey(referenceDate), referenceDate);
}

/**
 * Retorna todos os ciclos disponíveis a partir do histórico de transações + ciclo atual.
 */
export function getAvailableBillingCycles(
  transactions: Pick<Transaction, 'date'>[],
  referenceDate: Date = new Date()
): BillingCycle[] {
  const map = new Map<string, BillingCycle>();

  // Sempre inclui o ciclo atual
  const current = getCurrentBillingCycle(referenceDate);
  map.set(current.key, current);

  // Inclui os ciclos de cada lançamento válido
  transactions.forEach((t) => {
    if (t.date && parseIsoDate(t.date)) {
      const cycle = getBillingCycleForDate(t.date, referenceDate);
      if (!map.has(cycle.key)) {
        map.set(cycle.key, cycle);
      }
    }
  });

  // Ordena do mais antigo para o mais recente, da esquerda para a direita.
  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Filtra transações que pertençam ao ciclo especificado (ou todas se for 'all').
 */
export function filterTransactionsByCycle(
  transactions: Transaction[],
  cycleKey: string,
  referenceDate: Date = new Date()
): Transaction[] {
  if (!cycleKey || cycleKey === 'all') return transactions;

  return transactions.filter((t) => {
    if (!t.date || !parseIsoDate(t.date)) return false;
    const cycle = getBillingCycleForDate(t.date, referenceDate);
    return cycle.key === cycleKey;
  });
}
