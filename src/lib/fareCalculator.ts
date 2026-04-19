/**
 * Official Jordanian Taxi Fare Calculator
 */

export interface FareCalculation {
  estimatedFare: number;
  currency: string;
}

export function calculateFare(
  distanceKm: number,
  durationMinutes: number,
  isNightTime: boolean
): FareCalculation {
  const baseRatePerKm = isNightTime ? 0.44 : 0.33;
  const minFare = 1.00;
  const waitingRatePerMinute = 0.10;

  let fare = (distanceKm * baseRatePerKm) + (durationMinutes * waitingRatePerMinute);
  
  if (fare < minFare) {
    fare = minFare;
  }

  return {
    estimatedFare: Number(fare.toFixed(2)),
    currency: 'JOD'
  };
}
