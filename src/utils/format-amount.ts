export function formatAmount(minorUnits: number): string {
  if (!Number.isSafeInteger(minorUnits) || minorUnits < 0) {
    throw new RangeError("minorUnits must be a non-negative safe integer");
  }

  const whole = Math.floor(minorUnits / 100);
  const cents = String(minorUnits % 100).padStart(2, "0");

  return `$${whole}.${cents}`;
}
