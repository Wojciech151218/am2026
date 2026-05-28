const DEPRIORITIZED_TYPES = new Set([
  'lodging',
  'hotel',
  'motel',
  'guest_house',
  'hostel',
  'bed_and_breakfast',
  'resort_hotel',
  'extended_stay_hotel',
]);

const PRIORITIZED_TYPES = new Set([
  'restaurant',
  'cafe',
  'bar',
  'bakery',
  'museum',
  'art_gallery',
  'park',
  'tourist_attraction',
  'church',
  'library',
  'stadium',
  'movie_theater',
  'night_club',
  'book_store',
  'shopping_mall',
  'amusement_park',
  'zoo',
  'aquarium',
  'performing_arts_theater',
  'locality',
  'neighborhood',
]);

export function scorePlaceTypes(types?: string[]): number {
  if (!types?.length) {
    return 0;
  }

  let score = 0;
  for (const type of types) {
    if (PRIORITIZED_TYPES.has(type)) {
      score += 3;
    } else if (DEPRIORITIZED_TYPES.has(type)) {
      score -= 4;
    }
  }
  return score;
}

export function sortPlacesByRelevance<T extends {types?: string[]; rating?: number}>(
  places: T[],
): T[] {
  return [...places].sort((a, b) => {
    const typeDelta = scorePlaceTypes(b.types) - scorePlaceTypes(a.types);
    if (typeDelta !== 0) {
      return typeDelta;
    }
    return (b.rating ?? 0) - (a.rating ?? 0);
  });
}
