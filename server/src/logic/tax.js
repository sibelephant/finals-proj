import { fromKobo, percentOfKobo, toKobo } from './money.js';

export const TAX_BANDS = [
  { band: 'First ₦300,000', limitKobo: 30000000, rate: 7 },
  { band: 'Next ₦300,000', limitKobo: 30000000, rate: 11 },
  { band: 'Next ₦500,000', limitKobo: 50000000, rate: 15 },
  { band: 'Next ₦500,000', limitKobo: 50000000, rate: 19 },
  { band: 'Next ₦1,600,000', limitKobo: 160000000, rate: 21 },
  { band: 'Above ₦3,200,000', limitKobo: Infinity, rate: 24 },
];

export function computeTax(input) {
  const grossKobo = toKobo(input.grossIncome);
  const pensionKobo = toKobo(input.pensionContribution);
  const lifeAssuranceKobo = toKobo(input.lifeAssurance);
  const nhfKobo = toKobo(input.nhfContribution);

  const statutoryCraKobo = Math.max(toKobo(200000), percentOfKobo(grossKobo, 1));
  const craKobo = statutoryCraKobo + percentOfKobo(grossKobo, 20);
  const totalDeductionsKobo = pensionKobo + lifeAssuranceKobo + nhfKobo;
  const taxableKobo = Math.max(0, grossKobo - craKobo - totalDeductionsKobo);

  let remainingKobo = taxableKobo;
  let totalTaxKobo = 0;

  const bandBreakdown = TAX_BANDS.map((band) => {
    const amountTaxedInBandKobo = Math.min(remainingKobo, band.limitKobo);
    const taxForBandKobo = percentOfKobo(amountTaxedInBandKobo, band.rate);
    remainingKobo -= amountTaxedInBandKobo;
    totalTaxKobo += taxForBandKobo;

    return {
      band: band.band,
      rate: band.rate,
      amountTaxedInBand: fromKobo(amountTaxedInBandKobo),
      taxForBand: fromKobo(taxForBandKobo),
    };
  });

  return {
    cra: fromKobo(craKobo),
    totalDeductions: fromKobo(totalDeductionsKobo),
    taxableIncome: fromKobo(taxableKobo),
    bandBreakdown,
    taxPayable: fromKobo(totalTaxKobo),
    effectiveRate: grossKobo === 0 ? 0 : Number(((totalTaxKobo / grossKobo) * 100).toFixed(2)),
  };
}
