import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseBankStatementCSV } from '../bankStatementParser.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../../../../mock-bank-statements');

const CSV = {
  withDebitCredit: 'Date,Narration,Debit,Credit,Balance',
  amountOnly: 'Date,Narration,Amount',
  noBalance: 'Date,Narration,Debit,Credit',
};

describe('parseBankStatementCSV', () => {
  // covers: the four committed fixtures exercise the header shapes the parser supports
  it.each([
    ['access_bank_statement_2025.csv'],
    ['first_bank_statement_2025.csv'],
    ['gtbank_statement_2025.csv'],
    ['zenith_bank_statement_2025.csv'],
  ])('parses %s with no parse errors', (file) => {
    const result = parseBankStatementCSV(readFileSync(join(FIXTURES, file), 'utf-8'));

    expect(result.error).toBeUndefined();
    expect(result.transactions.length).toBeGreaterThan(10);
    expect(result.errors).toBeUndefined();
    expect(result.summary.totalTransactions).toBe(result.transactions.length);
    expect(result.summary.totalCredits).toBeGreaterThan(0);
  });

  it.each([
    ['access_bank_statement_2025.csv'],
    ['first_bank_statement_2025.csv'],
    ['gtbank_statement_2025.csv'],
    ['zenith_bank_statement_2025.csv'],
  ])('produces rows that can be persisted for %s', (file) => {
    const { transactions } = parseBankStatementCSV(readFileSync(join(FIXTURES, file), 'utf-8'));

    for (const t of transactions) {
      expect(t).not.toHaveProperty('raw');
      expect(t.transactionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(t.transactionDate))).toBe(false);
      expect(Number.isFinite(t.debit)).toBe(true);
      expect(Number.isFinite(t.credit)).toBe(true);
      expect(t.balance === null || Number.isFinite(t.balance)).toBe(true);
      expect(t.debit).toBeGreaterThanOrEqual(0);
      expect(t.credit).toBeGreaterThanOrEqual(0);
    }
  });

  // covers: balance was NOT NULL, so a statement without that column 500'd
  it('reports a missing balance column as null rather than failing', () => {
    const result = parseBankStatementCSV(`${CSV.noBalance}\n2025-01-15,Salary,,50000\n`);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].balance).toBeNull();
  });

  // covers: 2025-02-31 reached Postgres and aborted the whole upload
  it('rejects an impossible calendar date and keeps the valid rows', () => {
    const csv = `${CSV.withDebitCredit}\n2025-02-31,Salary,,50000,50000\n2025-03-01,Salary,,50000,100000\n`;

    const result = parseBankStatementCSV(csv);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].transactionDate).toBe('2025-03-01');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toMatch(/date/i);
  });

  it.each([
    ['2025-02-31', 'day past end of month'],
    ['2025-13-01', 'month 13'],
    ['2025-00-10', 'month 0'],
    ['30/15/2025', 'neither day nor month reading is real'],
    ['31/04/2025', 'April has 30 days'],
  ])('rejects %s (%s)', (value) => {
    const result = parseBankStatementCSV(`${CSV.withDebitCredit}\n${value},Salary,,50000,50000\n`);

    expect(result.transactions).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  // covers: the DD-Mon-YYYY regex demanded two digits, so real rows vanished
  it.each([
    ['2-Jan-2025', '2025-01-02'],
    ['05-Jan-2025', '2025-01-05'],
    ['2-Dec-2025', '2025-12-02'],
  ])('parses a single digit day %s as %s', (input, expected) => {
    const result = parseBankStatementCSV(`${CSV.withDebitCredit}\n${input},Salary,,50000,50000\n`);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].transactionDate).toBe(expected);
  });

  it('pads a single digit slash format day to two digits', () => {
    const result = parseBankStatementCSV(`${CSV.amountOnly}\n2/1/2025,Salary,50000\n`);

    expect(result.transactions[0].transactionDate).toBe('2025-01-02');
  });

  it('reads a slash date where only the month first reading is real', () => {
    const result = parseBankStatementCSV(`${CSV.amountOnly}\n01/20/2025,Salary,50000\n`);

    expect(result.transactions[0].transactionDate).toBe('2025-01-20');
  });

  it('prefers the day first reading when both are real', () => {
    const result = parseBankStatementCSV(`${CSV.amountOnly}\n05/03/2025,Salary,50000\n`);

    expect(result.transactions[0].transactionDate).toBe('2025-03-05');
  });

  it('reports an unparsable month name instead of assuming January', () => {
    const result = parseBankStatementCSV(`${CSV.withDebitCredit}\n05-Foo-2025,Salary,,50000,50000\n`);

    expect(result.transactions).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  // covers: csv-parse threw on a bad quote and the route returned 500
  it('returns an error for a malformed CSV instead of throwing', () => {
    const result = parseBankStatementCSV('Date,Narration,Amount\n2025-01-15,"Salary,50000\n');

    expect(result.error).toMatch(/could not read csv/i);
    expect(result.transactions).toEqual([]);
  });

  it('returns an error for a file with no data rows', () => {
    const result = parseBankStatementCSV('Date,Narration,Amount\n');

    expect(result.error).toMatch(/header row/i);
  });

  // covers: negative debit and credit columns corrupted the totals
  it('normalizes signed debit and credit columns to magnitudes', () => {
    const csv = `${CSV.withDebitCredit}\n2025-01-15,Salary,-50000,-90000,0\n`;

    const result = parseBankStatementCSV(csv);

    expect(result.transactions[0]).toMatchObject({ debit: 50000, credit: 90000, balance: 0 });
    expect(result.summary.totalDebits).toBe(50000);
    expect(result.summary.totalCredits).toBe(90000);
  });

  // covers: parseFloat read "1.2.3abc" as 1.2, inventing income with no error
  it('rejects a malformed amount rather than reading a prefix of it', () => {
    const result = parseBankStatementCSV(`${CSV.amountOnly}\n2025-01-15,Salary,1.2.3abc\n`);

    expect(result.transactions).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it.each([
    ['99999999999999999.99', 'an amount that overflows DECIMAL(14, 2)'],
  ])('rejects %s (%s)', (amount) => {
    const result = parseBankStatementCSV(`${CSV.amountOnly}\n2025-01-15,Salary,${amount}\n`);

    expect(result.transactions).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  // covers: "opening balance" contains "bal" and was bound as the running balance
  it('does not bind an opening balance column as the running balance', () => {
    const csv = 'Date,Opening Balance,Narration,Amount\n2025-01-01,145000.00,Opening,0.00\n2025-01-05,145000.00,Salary,50000\n';

    const result = parseBankStatementCSV(csv);

    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[1].balance).toBeNull();
    expect(result.transactions[1].credit).toBe(50000);
  });

  // covers: totals were accumulated as binary floats and drifted
  it('keeps summary totals free of floating point drift', () => {
    const rows = Array.from({ length: 100 }, () => `2025-01-15,Salary,,0.10,0`);
    const result = parseBankStatementCSV(`${CSV.withDebitCredit}\n${rows.join('\n')}\n`);

    expect(result.summary.totalCredits).toBe(10);
    expect(result.summary.categorizedIncome.employment).toBe(10);
  });

  it('does not echo the raw row back to the caller', () => {
    const result = parseBankStatementCSV(`${CSV.amountOnly}\nnot-a-date,Salary,abc\n`);

    expect(result.errors[0]).not.toHaveProperty('raw');
  });

  it('categorises credits by narration and leaves debits uncategorised', () => {
    const csv = `${CSV.withDebitCredit}\n2025-01-15,NIP/Payroll/Salary,0,100000,100000\n2025-01-16,ATM Withdrawal,50000,0,50000\n`;

    const result = parseBankStatementCSV(csv);

    expect(result.transactions[0].category).toBe('employment');
    expect(result.transactions[1].category).toBeNull();
  });
});