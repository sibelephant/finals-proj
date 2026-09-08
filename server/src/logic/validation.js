const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegistration(payload = {}) {
  const errors = {};
  if (!String(payload.fullName || '').trim()) errors.fullName = 'Full name is required.';
  if (!emailPattern.test(String(payload.email || '').trim())) errors.email = 'A valid email address is required.';
  if (!isStrongPassword(payload.password)) {
    errors.password = 'Password must be at least 8 characters and include uppercase, lowercase, and a number.';
  }
  if (!String(payload.phone || '').trim()) errors.phone = 'Phone number is required.';
  if (!String(payload.address || '').trim()) errors.address = 'Address is required.';

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateIncomeDeclaration(payload = {}) {
  const errors = {};
  const filingYear = toNumber(payload.filingYear) || new Date().getFullYear();
  const isLegacyRegime = filingYear <= 2025;
  
  const grossIncome = toNumber(payload.grossIncome);
  const employmentIncome = toNumber(payload.employmentIncome);
  const businessIncome = toNumber(payload.businessIncome);
  const pensionContribution = toNumber(payload.pensionContribution);
  const lifeAssurance = toNumber(payload.lifeAssurance);
  const nhfContribution = toNumber(payload.nhfContribution);
  
  // New NTA 2025 fields (optional for legacy regime)
  const rentPaidAnnual = toNumber(payload.rentPaidAnnual);
  const nhisContribution = toNumber(payload.nhisContribution);
  const housingLoanInterest = toNumber(payload.housingLoanInterest);

  const allFields = {
    grossIncome,
    employmentIncome,
    businessIncome,
    pensionContribution,
    lifeAssurance,
    nhfContribution,
    rentPaidAnnual,
    nhisContribution,
    housingLoanInterest,
  };

  // Validate all fields are non-negative finite numbers
  Object.entries(allFields).forEach(([field, value]) => {
    if (!Number.isFinite(value)) errors[field] = 'Enter a valid number.';
    if (Number.isFinite(value) && value < 0) errors[field] = 'Amount cannot be negative.';
  });

  // Required field validation
  if (!grossIncome || grossIncome <= 0) errors.grossIncome = 'Gross income is required.';
  
  // Income composition validation
  if (employmentIncome + businessIncome > grossIncome) {
    errors.businessIncome = 'Employment and business income cannot exceed gross income.';
  }

  // Regime-specific validation rules
  if (isLegacyRegime) {
    // Legacy PITA rules: 8% pension cap and total deductions cap
    if (pensionContribution > grossIncome * 0.08) {
      errors.pensionContribution = 'Pension contribution cannot exceed 8% of gross income.';
    }
    if (lifeAssurance + nhfContribution + pensionContribution > grossIncome) {
      errors.lifeAssurance = 'Total deductions cannot exceed gross income.';
    }
  } else {
    // NTA 2025 rules: no explicit combined deduction cap, each deduction type unlimited
    // Just ensure individual deductions don't exceed gross income (reasonable limit)
    const totalDeductions = pensionContribution + lifeAssurance + nhfContribution + nhisContribution + housingLoanInterest;
    if (totalDeductions > grossIncome) {
      errors.pensionContribution = 'Total deductions cannot exceed gross income.';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

function isStrongPassword(value) {
  const password = String(value || '');
  return password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
}

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return 0;
  return Number(value);
}
