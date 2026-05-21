export type SearchFilterKey = 'type' | 'distance' | 'rating';

export type SearchFilters = {
  type: 'all' | 'places' | 'events' | 'people';
  distanceKm: number;
  minRating: number;
};

import type {Coordinates} from './location';

export type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  placeCoordinates?: Coordinates;
};

export type FriendLocationSearchResult = SearchResult & {
  friendUserId: string;
  distanceKm: number;
  rating: number;
};
