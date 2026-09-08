import { validateIncomeDeclaration, validateRegistration } from '../validation.js';

describe('validation logic', () => {
  it('accepts a valid registration payload', () => {
    const result = validateRegistration({
      fullName: 'Amina Yusuf',
      email: 'amina@example.com',
      password: 'StrongPass1',
      phone: '08034567890',
      address: '14 Marina Road, Lagos',
    });

    expect(result).toEqual({ valid: true, errors: {} });
  });

  it('rejects invalid registration payloads with field errors', () => {
    const result = validateRegistration({
      fullName: '',
      email: 'bad-email',
      password: 'weak',
      phone: '',
      address: '',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toMatchObject({
      fullName: expect.any(String),
      email: expect.any(String),
      password: expect.any(String),
      phone: expect.any(String),
      address: expect.any(String),
    });
  });

  describe('validateIncomeDeclaration - Legacy PITA (filingYear <= 2025)', () => {
    it('accepts a valid legacy income declaration payload', () => {
      const result = validateIncomeDeclaration({
        filingYear: 2025,
        grossIncome: 4800000,
        employmentIncome: 4200000,
        businessIncome: 600000,
        pensionContribution: 384000, // 8% of gross
        lifeAssurance: 120000,
        nhfContribution: 120000,
      });

      expect(result).toEqual({ valid: true, errors: {} });
    });

    it('enforces 8% pension cap for legacy regime', () => {
      const result = validateIncomeDeclaration({
        filingYear: 2025,
        grossIncome: 1000000,
        pensionContribution: 90000, // Over 8%
      });

      expect(result.valid).toBe(false);
      expect(result.errors.pensionContribution).toBe('Pension contribution cannot exceed 8% of gross income.');
    });

    it('allows pension contribution up to 8% for legacy regime', () => {
      const result = validateIncomeDeclaration({
        filingYear: 2025,
        grossIncome: 1000000,
        pensionContribution: 80000, // Exactly 8%
      });

      expect(result.valid).toBe(true);
    });

    it('rejects invalid legacy income declaration payloads with field errors', () => {
      const result = validateIncomeDeclaration({
        filingYear: 2025,
        grossIncome: 100000,
        employmentIncome: 90000,
        businessIncome: 30000, // Exceeds gross
        pensionContribution: 12000, // Over 8%
        lifeAssurance: -10,
        nhfContribution: 'not-a-number',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toMatchObject({
        businessIncome: expect.any(String),
        pensionContribution: expect.any(String),
        lifeAssurance: expect.any(String),
        nhfContribution: expect.any(String),
      });
    });
  });

  describe('validateIncomeDeclaration - NTA 2025 (filingYear >= 2026)', () => {
    it('accepts a valid NTA 2025 income declaration with new fields', () => {
      const result = validateIncomeDeclaration({
        filingYear: 2026,
        grossIncome: 5000000,
        employmentIncome: 4000000,
        businessIncome: 1000000,
        pensionContribution: 500000, // No 8% cap in new regime
        lifeAssurance: 200000,
        nhfContribution: 150000,
        rentPaidAnnual: 1200000,
        nhisContribution: 100000,
        housingLoanInterest: 300000,
      });

      expect(result).toEqual({ valid: true, errors: {} });
    });

    it('does not enforce 8% pension cap for NTA 2025 regime', () => {
      const result = validateIncomeDeclaration({
        filingYear: 2026,
        grossIncome: 1000000,
        pensionContribution: 150000, // 15% - would fail in legacy
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('validates new relief fields as non-negative numbers', () => {
      const result = validateIncomeDeclaration({
        filingYear: 2026,
        grossIncome: 1000000,
        rentPaidAnnual: -100000,
        nhisContribution: 'invalid',
        housingLoanInterest: null, // Should default to 0
      });

      expect(result.valid).toBe(false);
      expect(result.errors.rentPaidAnnual).toBe('Amount cannot be negative.');
      expect(result.errors.nhisContribution).toBe('Enter a valid number.');
      expect(result.errors.housingLoanInterest).toBeUndefined(); // null/undefined should default to 0
    });

    it('still enforces total deductions cannot exceed gross income', () => {
      const result = validateIncomeDeclaration({
        filingYear: 2026,
        grossIncome: 1000000,
        pensionContribution: 300000,
        lifeAssurance: 300000,
        nhfContribution: 200000,
        nhisContribution: 150000,
        housingLoanInterest: 100000, // Total: 1,050,000 > 1,000,000
      });

      expect(result.valid).toBe(false);
      expect(result.errors.pensionContribution).toBe('Total deductions cannot exceed gross income.');
    });

    it('accepts new fields with zero values', () => {
      const result = validateIncomeDeclaration({
        filingYear: 2026,
        grossIncome: 1000000,
        rentPaidAnnual: 0,
        nhisContribution: 0,
        housingLoanInterest: 0,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('validateIncomeDeclaration - Common validation rules', () => {
    it('requires positive gross income for any regime', () => {
      expect(validateIncomeDeclaration({ filingYear: 2025, grossIncome: 0 }).valid).toBe(false);
      expect(validateIncomeDeclaration({ filingYear: 2026, grossIncome: 0 }).valid).toBe(false);
      expect(validateIncomeDeclaration({ filingYear: 2025, grossIncome: -1000 }).valid).toBe(false);
    });

    it('validates employment + business income does not exceed gross for any regime', () => {
      const testData = {
        grossIncome: 1000000,
        employmentIncome: 700000,
        businessIncome: 400000, // Total: 1,100,000
      };

      expect(validateIncomeDeclaration({ ...testData, filingYear: 2025 }).valid).toBe(false);
      expect(validateIncomeDeclaration({ ...testData, filingYear: 2026 }).valid).toBe(false);
    });

    it('defaults filingYear to current year when not provided', () => {
      const currentYear = new Date().getFullYear();
      const result = validateIncomeDeclaration({
        grossIncome: 1000000,
        pensionContribution: 100000, // 10% - should trigger legacy rule if current year <= 2025
      });

      if (currentYear <= 2025) {
        expect(result.valid).toBe(false); // Should fail 8% pension rule
      } else {
        expect(result.valid).toBe(true); // Should pass in new regime
      }
    });
  });
});
