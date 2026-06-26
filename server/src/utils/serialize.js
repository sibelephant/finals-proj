export function serializeUser(user) {
  if (!user) return null;
  const plain = user.toJSON ? user.toJSON() : user;
  const { passwordHash, ...safe } = plain;
  return safe;
}

export function serializeTaxReturn(taxReturn) {
  if (!taxReturn) return null;
  const plain = taxReturn.toJSON ? taxReturn.toJSON() : taxReturn;
  return {
    ...plain,
    grossIncome: numberOrZero(plain.grossIncome),
    cra: numberOrZero(plain.cra),
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
  };
}

function numberOrZero(value) {
  return Number(value || 0);
}
