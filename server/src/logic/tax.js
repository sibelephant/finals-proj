import { fromKobo, percentOfKobo, toKobo } from './money.js';

export const MIN_FILING_YEAR = 1990;
export const NTA_FIRST_YEAR = 2026;

// Single source of truth for the filing year so validation, computation and
// persistence can never disagree on which tax table applies.
export function resolveFilingYear(value) {
  const currentYear = new Date().getFullYear();
  if (value === undefined || value === null || value === '') return currentYear;

  const year = Number(value);
  if (!Number.isInteger(year) || year < MIN_FILING_YEAR || year > currentYear + 1) {
    throw new RangeError(
      `Filing year must be a whole number between ${MIN_FILING_YEAR} and ${currentYear + 1}.`,
    );
  }
  return year;
}

const TAX_PROFILES = {
  legacy_pita: {
    validFrom: 0,
    validTo: 2025,
    bands: [
      { band: 'First ₦300,000', limitKobo: 30000000, rate: 7 },
      { band: 'Next ₦300,000', limitKobo: 30000000, rate: 11 },
      { band: 'Next ₦500,000', limitKobo: 50000000, rate: 15 },
      { band: 'Next ₦500,000', limitKobo: 50000000, rate: 19 },
      { band: 'Next ₦1,600,000', limitKobo: 160000000, rate: 21 },
      { band: 'Above ₦3,200,000', limitKobo: Infinity, rate: 24 },
    ],
    // CRA only: statutory component plus the 20% of gross component.
    computeRelief: (input) => {
      const grossKobo = toKobo(input.grossIncome);
      const statutoryCraKobo = Math.max(toKobo(200000), percentOfKobo(grossKobo, 1));
      const craKobo = statutoryCraKobo + percentOfKobo(grossKobo, 20);
      return { reliefAmount: fromKobo(craKobo), reliefBasis: 'CRA' };
    },
  },
  nta_2025: {
    validFrom: NTA_FIRST_YEAR,
    validTo: Infinity,
    bands: [
      { band: 'First ₦800,000', limitKobo: 80000000, rate: 0 },
      { band: 'Next ₦2,200,000', limitKobo: 220000000, rate: 15 },
      { band: 'Next ₦9,000,000', limitKobo: 900000000, rate: 18 },
      { band: 'Next ₦13,000,000', limitKobo: 1300000000, rate: 21 },
      { band: 'Next ₦25,000,000', limitKobo: 2500000000, rate: 23 },
      { band: 'Above ₦50,000,000', limitKobo: Infinity, rate: 25 },
    ],
    // NHIS is deductible in full, housing loan interest gives 20% relief.
    extraDeductionRates: { nhisContribution: 100, housingLoanInterest: 20 },
    computeRelief: (input) => {
      const rentPaidAnnual = input.rentPaidAnnual || 0;
      const reliefAmount = Math.min(percentOfKobo(toKobo(rentPaidAnnual), 20), toKobo(500000));
      return { reliefAmount: fromKobo(reliefAmount), reliefBasis: 'RENT_RELIEF' };
    },
  },
};

function selectProfile(filingYear) {
  for (const profile of Object.values(TAX_PROFILES)) {
    if (filingYear >= profile.validFrom && filingYear <= profile.validTo) {
      return profile;
    }
  }
  throw new Error(`No tax profile available for filing year ${filingYear}`);
}

export function computeTax(input = {}) {
  const filingYear = resolveFilingYear(input.filingYear);
  const profile = selectProfile(filingYear);

  const grossKobo = toKobo(input.grossIncome);
  const pensionKobo = toKobo(input.pensionContribution);
  const lifeAssuranceKobo = toKobo(input.lifeAssurance);
  const nhfKobo = toKobo(input.nhfContribution);

  const { reliefAmount, reliefBasis } = profile.computeRelief(input);
  const reliefKobo = toKobo(reliefAmount);

  const extraDeductionKobo = Object.entries(profile.extraDeductionRates ?? {}).reduce(
    (sum, [field, rate]) => sum + percentOfKobo(toKobo(input[field]), rate),
    0,
  );
  const totalDeductionsKobo = pensionKobo + lifeAssuranceKobo + nhfKobo + extraDeductionKobo;
  const taxableKobo = Math.max(0, grossKobo - reliefKobo - totalDeductionsKobo);

  let remainingKobo = taxableKobo;
  let totalTaxKobo = 0;

  const bandBreakdown = profile.bands.map((band) => {
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
    filingYear,
    reliefAmount,
    reliefBasis,
    totalDeductions: fromKobo(totalDeductionsKobo),
    taxableIncome: fromKobo(taxableKobo),
    bandBreakdown,
    taxPayable: fromKobo(totalTaxKobo),
    effectiveRate: grossKobo === 0 ? 0 : Number(((totalTaxKobo / grossKobo) * 100).toFixed(2)),
  };
}