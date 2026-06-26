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

  it('accepts a valid income declaration payload', () => {
    const result = validateIncomeDeclaration({
      grossIncome: 4800000,
      employmentIncome: 4200000,
      businessIncome: 600000,
      pensionContribution: 384000,
      lifeAssurance: 120000,
      nhfContribution: 120000,
    });

    expect(result).toEqual({ valid: true, errors: {} });
  });

  it('rejects invalid income declaration payloads with field errors', () => {
    const result = validateIncomeDeclaration({
      grossIncome: 100000,
      employmentIncome: 90000,
      businessIncome: 30000,
      pensionContribution: 12000,
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
