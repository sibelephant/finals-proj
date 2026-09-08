import { parse } from 'csv-parse/sync';

const CATEGORY_RULES = [
  { keywords: ['salary', 'pay', 'wages', 'employment', 'monthly', 'payroll'], category: 'employment' },
  { keywords: ['business', 'sales', 'invoice', 'consultancy', 'contract', 'consulting', 'supply'], category: 'business' },
  { keywords: ['pension', 'rsa', 'retirement'], category: 'pension' },
  { keywords: ['interest', 'dividend', 'investment'], category: 'investment' },
  { keywords: ['rent', 'lease', 'property'], category: 'rent' },
];

function detectColumnIndices(headers) {
  const normalised = headers.map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));

  const find = (candidates) => {
    const idx = normalised.findIndex((h) => candidates.some((c) => h === c || h.includes(c)));
    return idx !== -1 ? idx : null;
  };

  return {
    date: find(['date', 'trandate', 'tran_date', 'transactiondate', 'valuedate', 'value_date']) ?? 0,
    narration: find(['narration', 'remark', 'remarks', 'description', 'details', 'transactiondetails', 'transaction_details', 'narrative']) ?? 1,
    debit: find(['debit', 'debitamount', 'debit_amount', 'dramount', 'dr_amount', 'withdrawal', 'amountdr']),
    credit: find(['credit', 'creditamount', 'credit_amount', 'cramount', 'cr_amount', 'deposit', 'amountcr']),
    amount: find(['amount', 'transactionamount', 'transaction_amount']),
    balance: find(['balance', 'availablebalance', 'available_balance', 'bal', 'closingbalance']),
  };
}

function classifyNarration(narration) {
  const text = narration.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return rule.category;
    }
  }
  return null;
}

function parseDate(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  const formats = [
    (s) => { const m = s.match(/^(\d{2})-(\w{3})-(\d{4})$/); return m ? `${m[3]}-${monthAbbr(m[2])}-${m[1]}` : null; },
    (s) => { const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : null; },
    (s) => { const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[0] : null; },
  ];
  for (const fmt of formats) {
    const result = fmt(trimmed);
    if (result) return result;
  }
  return null;
}

function monthAbbr(abbr) {
  const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
  return months[abbr.toLowerCase()] || '01';
}

function toNumeric(value) {
  if (value === undefined || value === null) return 0;
  const str = String(value).replace(/[,\s]/g, '').trim();
  if (!str || str === '-' || str === 'nil') return 0;
  const num = parseFloat(str);
  return Number.isFinite(num) ? num : 0;
}

export function parseBankStatementCSV(csvText) {
  const records = parse(csvText, {
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  });

  if (records.length < 2) {
    return { transactions: [], summary: null, error: 'CSV must contain a header row and at least one data row.' };
  }

  const headers = records[0];
  const cols = detectColumnIndices(headers);

  const transactions = [];
  const errors = [];

  for (let i = 1; i < records.length; i++) {
    const row = records[i];
    if (!row || row.every((cell) => !cell || String(cell).trim() === '')) continue;

    const date = parseDate(row[cols.date]);
    if (!date) {
      errors.push({ row: i + 1, message: 'Could not parse date.', raw: row });
      continue;
    }

    let debit = 0;
    let credit = 0;

    if (cols.debit !== null && cols.credit !== null) {
      debit = toNumeric(row[cols.debit]);
      credit = toNumeric(row[cols.credit]);
    } else if (cols.amount !== null) {
      const amount = toNumeric(row[cols.amount]);
      if (amount >= 0) {
        credit = amount;
      } else {
        debit = Math.abs(amount);
      }
    } else {
      errors.push({ row: i + 1, message: 'No debit/credit or amount column found.', raw: row });
      continue;
    }

    const narration = String(row[cols.narration] || '').trim();
    const balance = cols.balance !== null ? toNumeric(row[cols.balance]) : null;
    const category = credit > 0 ? classifyNarration(narration) : null;

    transactions.push({
      transactionDate: date,
      narration,
      debit,
      credit,
      balance,
      category,
    });
  }

  const totalCredits = transactions.reduce((sum, t) => sum + t.credit, 0);
  const totalDebits = transactions.reduce((sum, t) => sum + t.debit, 0);

  const categorizedIncome = {};
  for (const t of transactions) {
    if (t.credit > 0 && t.category) {
      categorizedIncome[t.category] = (categorizedIncome[t.category] || 0) + t.credit;
    }
  }

  return {
    transactions,
    summary: {
      totalTransactions: transactions.length,
      totalCredits,
      totalDebits,
      parseErrors: errors.length,
      categorizedIncome,
    },
    errors: errors.length > 0 ? errors : undefined,
  };
}
