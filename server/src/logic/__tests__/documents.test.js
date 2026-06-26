const { buildReceiptData, buildTCCData } = require('../documents');

describe('document content logic', () => {
  const taxReturn = {
    id: 'ret-001',
    taxpayerName: 'Amina Yusuf',
    tin: 'TIN-2026-000042',
    filingYear: 2025,
  };

  const payment = {
    amount: 521360,
    paymentReference: 'PAY-ETAX-000042',
    paymentStatus: 'successful',
    paidAt: '2026-06-26',
  };

  it('builds receipt data for later PDF rendering', () => {
    expect(buildReceiptData(taxReturn, payment)).toEqual({
      documentType: 'receipt',
      receiptNumber: 'PAY-ETAX-000042',
      taxpayerName: 'Amina Yusuf',
      tin: 'TIN-2026-000042',
      filingYear: 2025,
      taxReturnId: 'ret-001',
      amountPaid: 521360,
      paymentStatus: 'successful',
      paidAt: '2026-06-26',
      issuedAt: '2026-06-26',
    });
  });

  it('builds TCC data for later PDF rendering', () => {
    expect(buildTCCData(taxReturn, payment)).toEqual({
      documentType: 'tax_clearance_certificate',
      certificateNumber: 'TCC-2025-ret-001',
      taxpayerName: 'Amina Yusuf',
      tin: 'TIN-2026-000042',
      filingYear: 2025,
      taxReturnId: 'ret-001',
      taxPaid: 521360,
      clearanceStatus: 'cleared',
      issuedAt: '2026-06-26',
    });
  });
});
