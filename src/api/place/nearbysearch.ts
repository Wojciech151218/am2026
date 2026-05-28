import {env} from '../../config/env';
import {sortPlacesByRelevance} from '../placeRanking';
import type {GooglePlaceMetadata} from '../../types/map';
import type {Coordinates} from '../../types/location';

export type NearbyPlace = GooglePlaceMetadata & {
  latitude: number;
  longitude: number;
};

type NearbySearchResponse = {
  results?: Array<{
    place_id: string;
    name: string;
    vicinity?: string;
    formatted_address?: string;
    rating?: number;
    user_ratings_total?: number;
    types?: string[];
    geometry?: {location?: {lat: number; lng: number}};
    opening_hours?: {open_now?: boolean};
  }>;
  status?: string;
};

export type NearbySearchOptions = {
  radiusMeters?: number;
  limit?: number;
};

export async function searchNearbyPlaces(
  origin: Coordinates,
  options: NearbySearchOptions = {},
): Promise<NearbyPlace[]> {
  const radiusMeters = options.radiusMeters ?? 2000;
  const limit = options.limit ?? 12;
  const apiKey = env.googleMapsApiKey.trim();

  if (!apiKey) {
    return mockNearbyPlaces(origin);
  }

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin.latitude},${origin.longitude}&radius=${radiusMeters}&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    return mockNearbyPlaces(origin);
  }

  const data = (await response.json()) as NearbySearchResponse;
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    return mockNearbyPlaces(origin);
  }

  const places: NearbyPlace[] = [];
  for (const place of data.results ?? []) {
    const lat = place.geometry?.location?.lat;
    const lng = place.geometry?.location?.lng;
    if (lat == null || lng == null) {
      continue;
    }

    places.push({
      placeId: place.place_id,
      name: place.name,
      address: place.vicinity ?? place.formatted_address,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      types: place.types,
      openNow: place.opening_hours?.open_now,
      latitude: lat,
      longitude: lng,
    });
  }

  return sortPlacesByRelevance(places).slice(0, limit);
}

function mockNearbyPlaces(origin: Coordinates): NearbyPlace[] {
  const offsets = [
    {lat: 0.004, lng: 0.003},
    {lat: -0.003, lng: 0.005},
    {lat: 0.002, lng: -0.004},
    {lat: -0.005, lng: -0.002},
  ];

  return offsets.map((offset, index) => ({
    placeId: `mock-place-${index + 1}`,
    name: ['Corner Cafe', 'Riverside Park', 'City Library', 'Metro Bistro'][index] ?? 'Nearby spot',
    address: `${(index + 1) * 120} m away · Mock result`,
    rating: 4.2 - index * 0.2,
    userRatingsTotal: 80 + index * 15,
    types: ['establishment'],
    openNow: index % 2 === 0,
    latitude: origin.latitude + offset.lat,
    longitude: origin.longitude + offset.lng,
  }));
}

export function nearbyPlaceToMapMarker(place: NearbyPlace) {
  return {
    id: `place-${place.placeId}`,
    latitude: place.latitude,
    longitude: place.longitude,
    kind: 'place' as const,
    title: place.name,
    description: place.address,
    place,
  };
}
