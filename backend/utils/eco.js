// utils/eco.js
export const VEHICLE_PROFILES = {
  car: { co2PerKm: 0.192, fuelLPerKm: 0.08, weightFactor: 1 },
  van: { co2PerKm: 0.280, fuelLPerKm: 0.12, weightFactor: 1.3 },
  bike: { co2PerKm: 0.0, fuelLPerKm: 0.0, weightFactor: 0.05 },
  ev: { co2PerKm: 0.0, fuelLPerKm: 0.0, weightFactor: 0.9, electricityKWhPerKm: 0.15 }
};

export function estimateFromRoute({ distanceKm, durationMin, polyline, vehicle = 'car' }) {
  const profile = VEHICLE_PROFILES[vehicle] || VEHICLE_PROFILES.car;
  const turnPenaltyFactor = computeTurnPenaltyFactor(polyline);
  const fuelL = distanceKm * (profile.fuelLPerKm || 0) * turnPenaltyFactor * profile.weightFactor;
  const co2Kg = distanceKm * (profile.co2PerKm || 0) * turnPenaltyFactor * profile.weightFactor;
  const timeHours = durationMin / 60;
  return {
    distanceKm: round(distanceKm, 2),
    durationMin: Math.round(durationMin),
    fuelL: round(fuelL, 2),
    co2Kg: round(co2Kg, 2),
    turnPenaltyFactor: round(turnPenaltyFactor, 3),
    timeHours: round(timeHours, 2)
  };
}

function round(v, d) { return Math.round(v * Math.pow(10, d)) / Math.pow(10, d) }

export function computeTurnPenaltyFactor(polyline) {
  if (!polyline || polyline.length < 3) return 1.0;
  let penalty = 1.0;
  for (let i = 1; i < polyline.length - 1; i++) {
    const a = polyline[i - 1];
    const b = polyline[i];
    const c = polyline[i + 1];
    const ang = angleBetween(a, b, c);
    if (ang > 40) penalty += 0.01;
    if (ang > 90) penalty += 0.02;
  }
  return Math.min(Math.max(penalty, 1.0), 1.6);
}

function angleBetween(a, b, c) {
  const ab = [b[0] - a[0], b[1] - a[1]];
  const cb = [b[0] - c[0], b[1] - c[1]];
  const dot = ab[0] * cb[0] + ab[1] * cb[1];
  const magA = Math.hypot(ab[0], ab[1]);
  const magC = Math.hypot(cb[0], cb[1]);
  if (magA === 0 || magC === 0) return 0;
  const cos = dot / (magA * magC);
  const clamped = Math.min(1, Math.max(-1, cos));
  return Math.acos(clamped) * (180 / Math.PI);
}
