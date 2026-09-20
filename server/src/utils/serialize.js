export async function serializeUser(user) {
  if (!user) return null;
  const plain = user.toJSON ? user.toJSON() : user;
  const { passwordHash, ...safe } = plain;

  if (user.getComplianceStatus && user.role === 'taxpayer') {
    safe.complianceStatus = await user.getComplianceStatus();
  }

  return safe;
}

export function serializeTaxReturn(taxReturn) {
  if (!taxReturn) return null;
  const plain = taxReturn.toJSON ? taxReturn.toJSON() : taxReturn;
  return withNumbers(plain, ['grossIncome', 'reliefAmount', 'totalDeductions', 'taxableIncome', 'taxPayable', 'effectiveRate']);
}

export function serializePayment(payment) {
  if (!payment) return null;
  const plain = payment.toJSON ? payment.toJSON() : payment;
  return withNumbers(plain, ['amount']);
}

export function serializeDeclaration(declaration) {
  if (!declaration) return null;
  const plain = declaration.toJSON ? declaration.toJSON() : declaration;
  return withNumbers(plain, [
    'grossIncome',
    'employmentIncome',
    'businessIncome',
    'pensionContribution',
    'lifeAssurance',
    'nhfContribution',
    'rentPaidAnnual',
    'nhisContribution',
    'housingLoanInterest',
  ]);
}

function withNumbers(plain, keys) {
  const safe = { ...plain };
  for (const key of keys) safe[key] = numberOrZero(plain[key]);
  return safe;
}

function numberOrZero(value) {
  return Number(value || 0);
}

export function serializeTransaction(t) {
  return {
    id: t.id,
    transactionDate: t.transactionDate,
    narration: t.narration,
    debit: Number(t.debit),
    credit: Number(t.credit),
    balance: t.balance !== null ? Number(t.balance) : null,
    category: t.category,
    sourceFile: t.sourceFile,
    createdAt: t.createdAt,
  };
}
