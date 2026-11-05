import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function loadProductionModule(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const encodedSource = Buffer.from(outputText).toString('base64');
  return import(`data:text/javascript;base64,${encodedSource}`);
}

const [{ calculateBalance, calculateInstallments, addMonthsToDate, formatLocalDateForInput },
  { getBillingCycleForDate, getAvailableBillingCycles }] = await Promise.all([
  loadProductionModule('./calculations.ts'),
  loadProductionModule('./billingCycle.ts'),
]);

test('Ciclo de fatura: dia 09 e dia 10 pertencem a ciclos consecutivos', () => {
  const beforeCutoff = getBillingCycleForDate('2026-09-09');
  assert.equal(beforeCutoff.startDate, '2026-08-10');
  assert.equal(beforeCutoff.endDate, '2026-09-09');
  assert.equal(beforeCutoff.key, '2026-08');

  const cutoff = getBillingCycleForDate('2026-09-10');
  assert.equal(cutoff.startDate, '2026-09-10');
  assert.equal(cutoff.endDate, '2026-10-09');
  assert.equal(cutoff.key, '2026-09');
});

test('Ciclos aparecem do mais antigo para o mais recente', () => {
  const cycles = getAvailableBillingCycles([
    { date: '2026-08-10' },
    { date: '2026-10-10' },
    { date: '2026-09-10' },
  ]);
  const keys = cycles.map((cycle) => cycle.key);

  assert.deepEqual(keys, [...keys].sort((a, b) => a.localeCompare(b)));
  assert.equal(keys[0], '2026-08');
  assert.equal(keys.at(-1), getBillingCycleForDate('2026-10-10').key);
});

test('Balanço real consolida despesas, divisão e acerto PIX', () => {
  const transactions = [
    { amount: 1500, paidBy: 'leeo', splitType: 'full_debt' },
    { amount: 400, paidBy: 'marii', splitType: 'full_debt' },
    { amount: 200, paidBy: 'marii', splitType: 'split_50_50' },
  ];

  assert.equal(calculateBalance(transactions).debtAmount, 1000);

  transactions.push({ amount: 1000, paidBy: 'marii', splitType: 'payment_pix' });
  const settled = calculateBalance(transactions);
  assert.equal(settled.debtor, 'none');
  assert.equal(settled.debtAmount, 0);
  assert.equal(settled.netBalance, 0);
});

test('Parcelamento mantém a soma em centavos e ajusta datas de fim de mês', () => {
  const installments = calculateInstallments(100, 3);
  assert.deepEqual(installments, [33.34, 33.33, 33.33]);
  assert.equal(Math.round(installments.reduce((sum, amount) => sum + amount, 0) * 100), 10000);
  assert.equal(addMonthsToDate('2026-01-31', 1), '2026-02-28');
});

test('Data sugerida para lançamento usa o dia local', () => {
  const localDate = new Date(2026, 10, 5, 23, 30);
  assert.equal(formatLocalDateForInput(localDate), '2026-11-05');
});
