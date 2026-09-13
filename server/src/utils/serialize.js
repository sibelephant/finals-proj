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
  return {
    ...plain,
    grossIncome: numberOrZero(plain.grossIncome),
    reliefAmount: numberOrZero(plain.reliefAmount),
    totalDeductions: numberOrZero(plain.totalDeductions),
    taxableIncome: numberOrZero(plain.taxableIncome),
    taxPayable: numberOrZero(plain.taxPayable),
    effectiveRate: numberOrZero(plain.effectiveRate),
  };
}

export function serializePayment(payment) {
  if (!payment) return null;
  const plain = payment.toJSON ? payment.toJSON() : payment;
  return {
    ...plain,
    amount: numberOrZero(plain.amount),
  };
}

export function serializeDeclaration(declaration) {
  if (!declaration) return null;
  const plain = declaration.toJSON ? declaration.toJSON() : declaration;
  return {
    ...plain,
    grossIncome: numberOrZero(plain.grossIncome),
    employmentIncome: numberOrZero(plain.employmentIncome),
    businessIncome: numberOrZero(plain.businessIncome),
    pensionContribution: numberOrZero(plain.pensionContribution),
    lifeAssurance: numberOrZero(plain.lifeAssurance),
    nhfContribution: numberOrZero(plain.nhfContribution),
    rentPaidAnnual: numberOrZero(plain.rentPaidAnnual),
    nhisContribution: numberOrZero(plain.nhisContribution),
    housingLoanInterest: numberOrZero(plain.housingLoanInterest),
  };
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
