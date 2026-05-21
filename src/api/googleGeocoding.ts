import {env} from '../config/env';
import type {Coordinates} from '../types/location';

export type GeocodedPlace = {
  label: string;
  secondary: string;
};

export async function reverseGeocode(coordinates: Coordinates): Promise<GeocodedPlace> {
  const fallback = formatCoordinates(coordinates);
  const apiKey = env.googleMapsApiKey.trim();
  if (!apiKey) {
    return {label: 'Current location', secondary: fallback};
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.latitude},${coordinates.longitude}&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    return {label: 'Current location', secondary: fallback};
  }

  const data = (await response.json()) as {
    results?: Array<{formatted_address?: string}>;
    status?: string;
  };

  if (data.status !== 'OK' || !data.results?.[0]?.formatted_address) {
    return {label: 'Current location', secondary: fallback};
  }

  const address = data.results[0].formatted_address;
  const parts = address.split(',');
  const label = parts[0]?.trim() || 'Current location';
  const secondary = parts.slice(1).join(',').trim() || fallback;
  return {label, secondary};
}

export function formatCoordinates(coordinates: Coordinates): string {
  return `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`;
}

export function googleMapsUrl(coordinates: Coordinates): string {
  return `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`;
}
