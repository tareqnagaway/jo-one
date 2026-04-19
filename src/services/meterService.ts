//src/services/meterService.ts

/**
 * Jordanian Taxi Meter Calculation
 * Opening Fee: 0.35 JOD
 * Per KM: 0.25 JOD
 */

const OPENING_FEE = 0.35;
const PER_KM_FEE = 0.25;

export const calculateFare = (distanceInKm: number): number => {
  if (distanceInKm <= 0) return OPENING_FEE;
  
  const fare = OPENING_FEE + (distanceInKm * PER_KM_FEE);
  
  // Return rounded to 2 decimal places
  return Math.round(fare * 100) / 100;
};
