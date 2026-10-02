export function toKobo(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) {
    throw new Error('Amount must be a finite number.');
  }
  return Math.round(number * 100);
}

export function fromKobo(kobo) {
  return Number((kobo / 100).toFixed(2));
}

export function percentOfKobo(amountKobo, percent) {
  return Math.round((amountKobo * percent) / 100);
}

// Every money column is DECIMAL(14, 2), which overflows past this value.
// Checking at the edge turns a 500 from Postgres into a 400 with a message.
export const MAX_MONEY_KOBO = 99999999999999;

export function exceedsMaxAmount(value) {
  return Math.abs(toKobo(value)) > MAX_MONEY_KOBO;
}
