import { computeTax } from '../tax.js';

describe('computeTax', () => {
  describe('Legacy PITA (filingYear <= 2025)', () => {
    it.each([
      {
        name: '₦250k gross with no taxable income after CRA',
        input: { grossIncome: 250000 },
        expected: {
          cra: 250000,
          totalDeductions: 0,
          taxableIncome: 0,
          taxPayable: 0,
          effectiveRate: 0,
          bandAmounts: [0, 0, 0, 0, 0, 0],
          bandTaxes: [0, 0, 0, 0, 0, 0],
        },
      },
      {
        name: '₦600k gross inside first band',
        input: { grossIncome: 600000 },
        expected: {
          cra: 320000,
          totalDeductions: 0,
          taxableIncome: 280000,
          taxPayable: 19600,
          effectiveRate: 3.27,
          bandAmounts: [280000, 0, 0, 0, 0, 0],
          bandTaxes: [19600, 0, 0, 0, 0, 0],
        },
      },
      {
        name: '₦1.5M gross spanning third band',
        input: { grossIncome: 1500000 },
        expected: {
          cra: 500000,
          totalDeductions: 0,
          taxableIncome: 1000000,
          taxPayable: 114000,
          effectiveRate: 7.6,
          bandAmounts: [300000, 300000, 400000, 0, 0, 0],
          bandTaxes: [21000, 33000, 60000, 0, 0, 0],
        },
      },
      {
        name: '₦4M gross spanning fifth band',
        input: { grossIncome: 4000000 },
        expected: {
          cra: 1000000,
          totalDeductions: 0,
          taxableIncome: 3000000,
          taxPayable: 518000,
          effectiveRate: 12.95,
          bandAmounts: [300000, 300000, 500000, 500000, 1400000, 0],
          bandTaxes: [21000, 33000, 75000, 95000, 294000, 0],
        },
      },
      {
        name: '₦10M gross spanning top band',
        input: { grossIncome: 10000000 },
        expected: {
          cra: 2200000,
          totalDeductions: 0,
          taxableIncome: 7800000,
          taxPayable: 1664000,
          effectiveRate: 16.64,
          bandAmounts: [300000, 300000, 500000, 500000, 1600000, 4600000],
          bandTaxes: [21000, 33000, 75000, 95000, 336000, 1104000],
        },
      },
    ])('$name', ({ input, expected }) => {
      const result = computeTax(input);

      expect(result.reliefAmount).toBe(expected.cra);
      expect(result.totalDeductions).toBe(expected.totalDeductions);
      expect(result.taxableIncome).toBe(expected.taxableIncome);
      expect(result.taxPayable).toBe(expected.taxPayable);
      expect(result.effectiveRate).toBe(expected.effectiveRate);
      expect(result.bandBreakdown.map((band) => band.amountTaxedInBand)).toEqual(expected.bandAmounts);
      expect(result.bandBreakdown.map((band) => band.taxForBand)).toEqual(expected.bandTaxes);
    });

    it.each([
      { taxableIncome: 300000, grossIncome: 625000, taxPayable: 21000 },
      { taxableIncome: 600000, grossIncome: 1000000, taxPayable: 54000 },
      { taxableIncome: 1100000, grossIncome: 1625000, taxPayable: 129000 },
      { taxableIncome: 1600000, grossIncome: 2250000, taxPayable: 224000 },
      { taxableIncome: 3200000, grossIncome: 4250000, taxPayable: 560000 },
    ])('handles exact taxable band boundary ₦$taxableIncome', ({ grossIncome, taxableIncome, taxPayable }) => {
      const result = computeTax({ grossIncome });

      expect(result.taxableIncome).toBe(taxableIncome);
      expect(result.taxPayable).toBe(taxPayable);
    });

    it('applies declared deductions and pension contribution exactly as supplied', () => {
      const result = computeTax({
        grossIncome: 4800000,
        employmentIncome: 4200000,
        businessIncome: 600000,
        pensionContribution: 384000,
        lifeAssurance: 120000,
        nhfContribution: 120000,
      });

      expect(result).toMatchObject({
        reliefAmount: 1160000,
        totalDeductions: 624000,
        taxableIncome: 3016000,
        taxPayable: 521360,
        effectiveRate: 10.86,
      });
    });

    it('is deterministic for identical inputs', () => {
      const input = {
        grossIncome: 1234567.89,
        employmentIncome: 1000000,
        businessIncome: 234567.89,
        pensionContribution: 98765.43,
        lifeAssurance: 3210.11,
        nhfContribution: 2222.22,
      };

      expect(JSON.stringify(computeTax(input))).toBe(JSON.stringify(computeTax(input)));
    });

    it('rounds monetary values to fixed two-decimal precision without drift', () => {
      const result = computeTax({
        grossIncome: 1000000.33,
        pensionContribution: 80000.03,
        lifeAssurance: 1000.01,
        nhfContribution: 2000.02,
      });

      expect(result.reliefAmount).toBe(400000.07);
      expect(result.totalDeductions).toBe(83000.06);
      expect(result.taxableIncome).toBe(517000.2);
      expect(result.taxPayable).toBe(44870.02);
      expect(result.bandBreakdown.every((band) => Number.isFinite(band.taxForBand))).toBe(true);
    });

    it('preserves exact legacy behavior after refactoring (regression test)', () => {
      const input = { grossIncome: 2000000, filingYear: 2025 };
      const result = computeTax(input);

      expect(result).toMatchObject({
        reliefAmount: 600000,
        reliefBasis: 'CRA',
        totalDeductions: 0,
        taxableIncome: 1400000,
        taxPayable: 186000,
        effectiveRate: 9.3,
      });
    });
  });

  describe('NTA 2025 (filingYear >= 2026)', () => {
    it('income entirely within 0% band', () => {
      const result = computeTax({
        filingYear: 2026,
        grossIncome: 600000,
        rentPaidAnnual: 0,
      });

      expect(result).toMatchObject({
        reliefAmount: 0,
        reliefBasis: 'RENT_RELIEF',
        totalDeductions: 0,
        taxableIncome: 600000,
        taxPayable: 0,
        effectiveRate: 0,
      });

      expect(result.bandBreakdown.map((band) => band.amountTaxedInBand)).toEqual([600000, 0, 0, 0, 0, 0]);
      expect(result.bandBreakdown.map((band) => band.taxForBand)).toEqual([0, 0, 0, 0, 0, 0]);
    });

    it('income spanning 15%/18% bands', () => {
      const result = computeTax({
        filingYear: 2026,
        grossIncome: 5000000,
        rentPaidAnnual: 1000000,
      });

      // Relief: min(20% of 1M, 500k) = 200k
      // Taxable: 5M - 200k = 4.8M
      // Tax: 0 on first 800k + 15% on next 2.2M (330k) + 18% on remaining 1.8M (324k) = 654k

      expect(result).toMatchObject({
        reliefAmount: 200000,
        reliefBasis: 'RENT_RELIEF',
        totalDeductions: 0,
        taxableIncome: 4800000,
        taxPayable: 654000,
        effectiveRate: 13.08,
      });

      expect(result.bandBreakdown.map((band) => band.amountTaxedInBand)).toEqual([800000, 2200000, 1800000, 0, 0, 0]);
      expect(result.bandBreakdown.map((band) => band.taxForBand)).toEqual([0, 330000, 324000, 0, 0, 0]);
    });

    it('income in the top 25% band', () => {
      const result = computeTax({
        filingYear: 2026,
        grossIncome: 60000000,
        rentPaidAnnual: 3000000, // Would give 600k relief, capped at 500k
      });

      // Relief: min(20% of 3M, 500k) = 500k
      // Taxable: 60M - 500k = 59.5M
      // Tax: 0 + 330k + 1.62M + 2.73M + 5.75M + 2.375M = 12.805M

      expect(result).toMatchObject({
        reliefAmount: 500000,
        reliefBasis: 'RENT_RELIEF',
        totalDeductions: 0,
        taxableIncome: 59500000,
        taxPayable: 12805000,
        effectiveRate: 21.34,
      });

      expect(result.bandBreakdown.map((band) => band.amountTaxedInBand)).toEqual([800000, 2200000, 9000000, 13000000, 25000000, 9500000]);
      expect(result.bandBreakdown.map((band) => band.taxForBand)).toEqual([0, 330000, 1620000, 2730000, 5750000, 2375000]);
    });

    it('rent relief cap is applied correctly', () => {
      const result = computeTax({
        filingYear: 2026,
        grossIncome: 5000000,
        rentPaidAnnual: 10000000, // 20% would be 2M but capped at 500k
      });

      expect(result.reliefAmount).toBe(500000);
      expect(result.reliefBasis).toBe('RENT_RELIEF');
    });

    it('is deterministic for identical inputs (2026)', () => {
      const input = {
        filingYear: 2026,
        grossIncome: 3456789.12,
        rentPaidAnnual: 2000000,
        pensionContribution: 200000,
        lifeAssurance: 50000,
        nhfContribution: 100000,
      };

      expect(JSON.stringify(computeTax(input))).toBe(JSON.stringify(computeTax(input)));
    });

    it('handles no deductions with rent relief', () => {
      const result = computeTax({
        filingYear: 2026,
        grossIncome: 2000000,
        rentPaidAnnual: 800000, // 20% = 160k relief
      });

      expect(result).toMatchObject({
        reliefAmount: 160000,
        reliefBasis: 'RENT_RELIEF',
        totalDeductions: 0,
        taxableIncome: 1840000,
        taxPayable: 156000, // 0 on first 800k + 15% on remaining 1.04M
        effectiveRate: 7.8,
      });
    });
  });
});
