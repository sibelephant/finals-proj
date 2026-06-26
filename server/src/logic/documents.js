export function buildReceiptData(taxReturn, payment) {
  return {
    documentType: 'receipt',
    receiptNumber: payment.paymentReference,
    taxpayerName: taxReturn.taxpayerName,
    tin: taxReturn.tin,
    filingYear: taxReturn.filingYear,
    taxReturnId: taxReturn.id,
    amountPaid: payment.amount,
    paymentStatus: payment.paymentStatus,
    paidAt: payment.paidAt,
    issuedAt: payment.paidAt,
  };
}

export function buildTCCData(taxReturn, payment) {
  return {
    documentType: 'tax_clearance_certificate',
    certificateNumber: `TCC-${taxReturn.filingYear}-${taxReturn.id}`,
    taxpayerName: taxReturn.taxpayerName,
    tin: taxReturn.tin,
    filingYear: taxReturn.filingYear,
    taxReturnId: taxReturn.id,
    taxPaid: payment.amount,
    clearanceStatus: payment.paymentStatus === 'successful' ? 'cleared' : 'pending',
    issuedAt: payment.paidAt,
  };
}
