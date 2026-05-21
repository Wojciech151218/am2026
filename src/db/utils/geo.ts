import type {Coordinates} from '../../types/location';

const EARTH_RADIUS_KM = 6371;

export function distanceKm(from: Coordinates, to: Coordinates): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(haversine));
}

/** Maps visit recency to a 1–5 score for filter UI. */
export function ratingFromVisitedAtIso(visitedAtIso: string): number {
  const ageMs = Date.now() - new Date(visitedAtIso).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays <= 1) {
    return 5;
  }
  if (ageDays <= 7) {
    return 4;
  }
  if (ageDays <= 30) {
    return 3;
  }
  if (ageDays <= 90) {
    return 2;
  }
  return 1;
}

export function ratingFromDistanceKm(distance: number): number {
  if (distance <= 2) {
    return 5;
  }
  if (distance <= 5) {
    return 4;
  }
  if (distance <= 15) {
    return 3;
  }
  if (distance <= 30) {
    return 2;
  }
  return 1;
}
