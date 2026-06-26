const { computeTax } = require('../tax');

describe('computeTax', () => {
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

    expect(result.cra).toBe(expected.cra);
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
      cra: 1160000,
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

    expect(result.cra).toBe(400000.07);
    expect(result.totalDeductions).toBe(83000.06);
    expect(result.taxableIncome).toBe(517000.2);
    expect(result.taxPayable).toBe(44870.02);
    expect(result.bandBreakdown.every((band) => Number.isFinite(band.taxForBand))).toBe(true);
  });
});
