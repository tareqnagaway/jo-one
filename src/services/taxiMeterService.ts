import L from 'leaflet';

// Jordanian Taxi Meter Rates (Amman Official Strategy)
const BASE_FARE = 0.35; // JD - Opening Fee
const RATE_PER_KM = 0.25; // JD per KM
const RATE_PER_WAITING_MINUTE = 0.05; // JD per minute
const MIN_FARE = 1.00; // JD

export interface RouteInfo {
  distance: number; // KM
  duration: number; // Minutes
  cost: number; // JD
  geometry: [number, number][]; // Line coordinates
}

/**
 * Calculates taxi fare based on official meter logic
 */
export const calculateTaxiFare = (distanceInKm: number, durationInMinutes: number): number => {
  const distanceCost = distanceInKm * RATE_PER_KM;
  const waitingCost = durationInMinutes * RATE_PER_WAITING_MINUTE; 
  const total = BASE_FARE + distanceCost + waitingCost;
  return Math.max(total, MIN_FARE);
};

/**
 * Fetches route and distance using OSRM (Open Source Routing Machine)
 */
export const getRoute = async (start: [number, number], end: [number, number]): Promise<RouteInfo> => {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`
    );
    const data = await response.json();

    if (data.code !== 'Ok') throw new Error('Route not found');

    const route = data.routes[0];
    const distanceKm = route.distance / 1000;
    const durationMin = route.duration / 60;
    const cost = calculateTaxiFare(distanceKm, durationMin);

    return {
      distance: distanceKm,
      duration: durationMin,
      cost: cost,
      geometry: route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]])
    };
  } catch (error) {
    console.error('OSRM Routing Error:', error);
    throw error;
  }
};
