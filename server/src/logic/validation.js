const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistration(payload = {}) {
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

function validateIncomeDeclaration(payload = {}) {
  const errors = {};
  const grossIncome = toNumber(payload.grossIncome);
  const employmentIncome = toNumber(payload.employmentIncome);
  const businessIncome = toNumber(payload.businessIncome);
  const pensionContribution = toNumber(payload.pensionContribution);
  const lifeAssurance = toNumber(payload.lifeAssurance);
  const nhfContribution = toNumber(payload.nhfContribution);

  const numericFields = {
    grossIncome,
    employmentIncome,
    businessIncome,
    pensionContribution,
    lifeAssurance,
    nhfContribution,
  };

  Object.entries(numericFields).forEach(([field, value]) => {
    if (!Number.isFinite(value)) errors[field] = 'Enter a valid number.';
    if (Number.isFinite(value) && value < 0) errors[field] = 'Amount cannot be negative.';
  });

  if (!grossIncome || grossIncome <= 0) errors.grossIncome = 'Gross income is required.';
  if (employmentIncome + businessIncome > grossIncome) {
    errors.businessIncome = 'Employment and business income cannot exceed gross income.';
  }
  if (pensionContribution > grossIncome * 0.08) {
    errors.pensionContribution = 'Pension contribution cannot exceed 8% of gross income.';
  }
  if (lifeAssurance + nhfContribution + pensionContribution > grossIncome) {
    errors.lifeAssurance = 'Total deductions cannot exceed gross income.';
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

module.exports = {
  validateIncomeDeclaration,
  validateRegistration,
};
