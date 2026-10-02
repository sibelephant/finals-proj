import { parse } from 'csv-parse/sync';
import { exceedsMaxAmount } from './money.js';

const CATEGORY_RULES = [
  { keywords: ['salary', 'pay', 'wages', 'employment', 'monthly', 'payroll'], category: 'employment' },
  { keywords: ['business', 'sales', 'invoice', 'consultancy', 'contract', 'consulting', 'supply'], category: 'business' },
  { keywords: ['pension', 'rsa', 'retirement'], category: 'pension' },
  { keywords: ['interest', 'dividend', 'investment'], category: 'investment' },
  { keywords: ['rent', 'lease', 'property'], category: 'rent' },
];

function detectColumnIndices(headers) {
  const normalised = headers.map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Exact matches win over substring matches, otherwise "opening balance"
  // gets bound as the running balance because it contains "bal".
  const find = (candidates, { allowSubstring = true } = {}) => {
    const exact = normalised.findIndex((h) => candidates.includes(h));
    if (exact !== -1) return exact;
    if (!allowSubstring) return null;
    const partial = normalised.findIndex((h) => candidates.some((c) => h.includes(c)));
    return partial === -1 ? null : partial;
  };

  return {
    date: find(['date', 'trandate', 'transactiondate', 'valuedate']) ?? 0,
    narration: find(['narration', 'remark', 'remarks', 'description', 'details', 'transactiondetails', 'narrative']) ?? 1,
    debit: find(['debit', 'debitamount', 'dramount', 'withdrawal', 'amountdr']),
    credit: find(['credit', 'creditamount', 'cramount', 'deposit', 'amountcr']),
    amount: find(['amount', 'transactionamount']),
    // Exact only: "bal" and "balance" must not capture an opening balance column.
    balance: find(['balance', 'availablebalance', 'closingbalance', 'runningbalance', 'bal'], { allowSubstring: false }),
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

// A date is only accepted if it names a day that actually exists, so
// 2025-02-31 and 15/01/2025 are reported as parse errors instead of
// reaching Postgres and aborting the whole upload.
function isRealDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function parseDate(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();

  const named = trimmed.match(/^(\d{1,2})-(\w{3})-(\d{4})$/);
  if (named) {
    const month = monthAbbr(named[2]);
    const day = Number(named[1]);
    if (!month || !isRealDate(Number(named[3]), month, day)) return null;
    return `${named[3]}-${month}-${String(day).padStart(2, '0')}`;
  }

const slashed = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
if (slashed) {
  const year = Number(slashed[3]);
  const first = Number(slashed[1]);
  const second = Number(slashed[2]);
  // Nigerian statements are day first, but some banks export month first.
  // ponytail: values where both parts are 12 or less stay ambiguous, so this
  // prefers day first. Add a bank name hint if a real statement needs it.
  for (const [day, month] of [[first, second], [second, first]]) {
    if (isRealDate(year, month, day)) {
      return `${slashed[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  return null;
  }

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const [, year, month, day] = iso;
    if (!isRealDate(Number(year), Number(month), Number(day))) return null;
    return `${year}-${month}-${day}`;
  }

  return null;
}

function monthAbbr(abbr) {
  const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
  return months[abbr.toLowerCase()] ?? null;
}

// Returns null for anything that is not a complete number. parseFloat would
// happily read "1.2.3abc" as 1.2, which silently invents income.
function toNumeric(value) {
  if (value === undefined || value === null) return 0;
  const str = String(value).replace(/[,\s]/g, '').trim();
  if (!str || str === '-' || str === 'nil') return 0;
  if (!/^-?\d+(\.\d+)?$/.test(str)) return null;
  const num = Number(str);
  return exceedsMaxAmount(num) ? null : num;
}

export function parseBankStatementCSV(csvText) {
  let records;
  try {
    records = parse(csvText, {
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: true,
    });
  } catch (error) {
    // A malformed file is the caller's problem, not a server fault.
    return { transactions: [], summary: null, error: `Could not read CSV: ${error.message}` };
  }

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
      errors.push({ row: i + 1, message: 'Could not parse date.' });
      continue;
    }

    let debit = 0;
    let credit = 0;

    if (cols.debit !== null && cols.credit !== null) {
      const parsedDebit = toNumeric(row[cols.debit]);
      const parsedCredit = toNumeric(row[cols.credit]);
      if (parsedDebit === null || parsedCredit === null) {
        errors.push({ row: i + 1, message: 'Could not parse debit or credit amount.' });
        continue;
      }
      // Statements sometimes sign these columns, so normalize to magnitudes.
      debit = Math.abs(parsedDebit);
      credit = Math.abs(parsedCredit);
    } else if (cols.amount !== null) {
      const amount = toNumeric(row[cols.amount]);
      if (amount === null) {
        errors.push({ row: i + 1, message: 'Could not parse amount.' });
        continue;
      }
      if (amount >= 0) {
        credit = amount;
      } else {
        debit = Math.abs(amount);
      }
    } else {
      errors.push({ row: i + 1, message: 'No debit/credit or amount column found.' });
      continue;
    }

    const narration = String(row[cols.narration] || '').trim();
    const rawBalance = cols.balance !== null ? toNumeric(row[cols.balance]) : null;
    if (rawBalance === null && cols.balance !== null) {
      errors.push({ row: i + 1, message: 'Could not parse balance.' });
      continue;
    }
    // Null means the statement has no balance column, which is legitimate.
    const balance = rawBalance === null ? null : Math.abs(rawBalance);
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

  const round2 = (n) => Number(n.toFixed(2));
  const totalCredits = round2(transactions.reduce((sum, t) => sum + t.credit, 0));
  const totalDebits = round2(transactions.reduce((sum, t) => sum + t.debit, 0));

  const categorizedIncome = {};
  for (const t of transactions) {
    if (t.credit > 0 && t.category) {
      categorizedIncome[t.category] = round2((categorizedIncome[t.category] || 0) + t.credit);
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
