export type SearchFilterKey = 'type' | 'distance' | 'rating';

export type SearchFilters = {
  type: 'all' | 'places' | 'events' | 'people';
  distanceKm: number;
  minRating: number;
};

export type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
};
