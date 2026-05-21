import {env} from '../config/env';
import {distanceKm} from '../db/utils/geo';
import type {SearchResult} from '../types/search';
import type {Coordinates} from '../types/location';

type PlacesTextSearchResponse = {
  results?: Array<{
    place_id: string;
    name: string;
    formatted_address?: string;
    geometry?: {location?: {lat: number; lng: number}};
    rating?: number;
  }>;
  status?: string;
};

export async function searchNearbyPlaces(
  query: string,
  origin: Coordinates | null,
  limit = 15,
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const apiKey = env.googleMapsApiKey.trim();
  if (!apiKey) {
    return mockPlaces(trimmed, origin);
  }

  const locationBias =
    origin != null ? `&location=${origin.latitude},${origin.longitude}&radius=15000` : '';
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(trimmed)}${locationBias}&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    return mockPlaces(trimmed, origin);
  }

  const data = (await response.json()) as PlacesTextSearchResponse;
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    return mockPlaces(trimmed, origin);
  }

  return (data.results ?? []).slice(0, limit).map(place => {
    const lat = place.geometry?.location?.lat;
    const lng = place.geometry?.location?.lng;
    const km =
      origin != null && lat != null && lng != null
        ? distanceKm(origin, {latitude: lat, longitude: lng})
        : null;

    return {
      id: `place-${place.place_id}`,
      title: place.name,
      subtitle:
        km != null
          ? `${km.toFixed(1)} km · ${place.formatted_address ?? ''}`
          : (place.formatted_address ?? 'Nearby place'),
      tags: ['place', place.rating != null ? `★${Math.round(place.rating)}` : 'maps'],
      placeCoordinates:
        lat != null && lng != null ? {latitude: lat, longitude: lng} : undefined,
    };
  });
}

function mockPlaces(query: string, origin: Coordinates | null): SearchResult[] {
  const offset = origin
    ? {latitude: origin.latitude + 0.01, longitude: origin.longitude + 0.01}
    : {latitude: 52.24, longitude: 21.02};

  return [
    {
      id: 'place-mock-1',
      title: `${query} Cafe`,
      subtitle: origin ? '1.2 km · Mock place' : 'Mock place',
      tags: ['place', 'maps'],
      placeCoordinates: offset,
    },
    {
      id: 'place-mock-2',
      title: `${query} Park`,
      subtitle: origin ? '2.4 km · Mock place' : 'Mock place',
      tags: ['place', 'maps'],
      placeCoordinates: {
        latitude: offset.latitude + 0.005,
        longitude: offset.longitude - 0.005,
      },
    },
  ];
}
