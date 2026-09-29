import test from 'node:test';
import assert from 'node:assert/strict';

// Test implementation of calculateBalance for Leeo & Marii
function calculateBalance(transactions) {
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

  const totalDueFromMarii = mariiOwesLeeo - paymentsMariiToLeeo;
  const totalDueFromLeeo = leeoOwesMarii - paymentsLeeoToMarii;
  const netBalance = totalDueFromMarii - totalDueFromLeeo;

  const roundedNet = Math.round(netBalance * 100) / 100;
  let debtor = 'none';
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

function pad(num, size = 2) {
  let s = num.toString();
  while (s.length < size) s = '0' + s;
  return s;
}

function getBillingCycleForDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
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

  return {
    startDate: `${startYear}-${pad(startMonth + 1)}-10`,
    endDate: `${endYear}-${pad(endMonth + 1)}-09`,
    key: `${startYear}-${pad(startMonth + 1)}`,
  };
}

test('Ciclo de Fatura: dia 09 vs dia 10', () => {
  // Dia 09/09 ainda pertence ao ciclo que iniciou em 10/08
  const c1 = getBillingCycleForDate('2026-09-09');
  assert.equal(c1.startDate, '2026-08-10');
  assert.equal(c1.endDate, '2026-09-09');
  assert.equal(c1.key, '2026-08');

  // Dia 10/09 vira automaticamente o ciclo!
  const c2 = getBillingCycleForDate('2026-09-10');
  assert.equal(c2.startDate, '2026-09-10');
  assert.equal(c2.endDate, '2026-10-09');
  assert.equal(c2.key, '2026-09');

  // Dia 29/09 continua no ciclo que iniciou em 10/09
  const c3 = getBillingCycleForDate('2026-09-29');
  assert.equal(c3.startDate, '2026-09-10');
  assert.equal(c3.endDate, '2026-10-09');

  // Virada de ano: 05 de Janeiro pertence ao ciclo de 10 de Dezembro
  const c4 = getBillingCycleForDate('2027-01-05');
  assert.equal(c4.startDate, '2026-12-10');
  assert.equal(c4.endDate, '2027-01-09');
  assert.equal(c4.key, '2026-12');
});

test('Balanço Leeo & Marii: Férias, Abatimento no Cartão e PIX', () => {
  const transactions = [
    // Leeo pagou casa de férias inteira: Marii deve 1500
    { id: '1', title: 'Casa Férias', amount: 1500, paidBy: 'leeo', splitType: 'full_debt' },
    // Marii passou compra de Leeo no cartão dela: Leeo deve 400 (abate 400)
    { id: '2', title: 'Cartão Marii', amount: 400, paidBy: 'marii', splitType: 'full_debt' },
    // Jantar 50/50 de 200 pago por Marii (Leeo deve 100, abate mais 100)
    { id: '3', title: 'Jantar', amount: 200, paidBy: 'marii', splitType: 'split_50_50' },
  ];

  const res = calculateBalance(transactions);
  // Marii devia 1500 - 400 - 100 = 1000
  assert.equal(res.debtor, 'marii');
  assert.equal(res.debtAmount, 1000);
  assert.equal(res.netBalance, 1000);

  // Marii quita via PIX de 1000
  transactions.push({
    id: '4',
    title: 'PIX Marii',
    amount: 1000,
    paidBy: 'marii',
    splitType: 'payment_pix',
  });

  const resAfterPix = calculateBalance(transactions);
  assert.equal(resAfterPix.debtor, 'none');
  assert.equal(resAfterPix.debtAmount, 0);
  assert.equal(resAfterPix.netBalance, 0);
});
