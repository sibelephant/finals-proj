function toKobo(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) {
    throw new Error('Amount must be a finite number.');
  }
  return Math.round(number * 100);
}

function fromKobo(kobo) {
  return Number((kobo / 100).toFixed(2));
}

function percentOfKobo(amountKobo, percent) {
  return Math.round((amountKobo * percent) / 100);
}

module.exports = {
  toKobo,
  fromKobo,
  percentOfKobo,
};
