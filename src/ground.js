// Metric tonne-force conversion at standard gravity. kN/m² = kPa.
export const KPA_PER_TF_M2 = 9.80665;
export function positive(value) {
  return String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) > 0;
}
export function pressureKpa(value, unit) {
  if (!['kPa', 'tf/m²'].includes(unit) || !positive(value)) return null;
  const converted = Number(value) * (unit === 'tf/m²' ? KPA_PER_TF_M2 : 1);
  return Number.isFinite(converted) && converted > 0 ? converted : null;
}
export function groundResult({ load, loadUnit, area, capacity, capacityUnit, peak, peakUnit }) {
  const allowable = pressureKpa(capacity, capacityUnit);
  const peakKpa = pressureKpa(peak, peakUnit);
  const force = positive(load) && ['kN', 'tf'].includes(loadUnit)
    ? Number(load) * (loadUnit === 'tf' ? KPA_PER_TF_M2 : 1) : NaN;
  const average = positive(area) ? force / Number(area) : NaN;
  const averageKpa = Number.isFinite(average) && average > 0 ? average : null;
  const ratio = (pressure) => {
    const value = pressure !== null && allowable !== null ? pressure / allowable * 100 : NaN;
    return Number.isFinite(value) && value > 0 ? value : null;
  };
  return { averageKpa, peakKpa, allowable, averageUtilization: ratio(averageKpa),
    peakUtilization: ratio(peakKpa), inconsistent: averageKpa !== null && peakKpa !== null && peakKpa < averageKpa };
}
