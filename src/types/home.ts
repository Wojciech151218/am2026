import type {Coordinates} from './location';

export type MapPreview = {
  center: Coordinates;
  zoom: number;
  provider: 'google';
};

export type WeatherSummary = {
  condition: string;
  temperatureC: number;
  humidityPercent: number;
};

export type CompassData = {
  headingDegrees: number;
  cardinalDirection: string;
};

export type RecommendationItem = {
  id: string;
  title: string;
  description: string;
};
