import {useCallback, useState} from 'react';
import {Platform} from 'react-native';
import {searchNearbyPlaces} from '../../api/googlePlacesSearch';
import {searchFriendLocations} from '../../db/queries/searchFriendLocations';
import {getUserById} from '../../db/repositories/userRepository';
import type {FriendLocationSearchResult, SearchFilters} from '../../types/search';
import type {Coordinates} from '../../types/location';
import {useSearchApi} from '../useSearchApi';
import {useDb} from './useDb';

type UseFriendLocationsSearchQueryResult = {
  results: FriendLocationSearchResult[];
  loading: boolean;
  error: string | null;
  executeSearch: (query: string, filters: SearchFilters) => Promise<void>;
};

function mergeSearchResults(
  friendRows: FriendLocationSearchResult[],
  placeRows: FriendLocationSearchResult[],
): FriendLocationSearchResult[] {
  const seen = new Set<string>();
  const merged: FriendLocationSearchResult[] = [];

  for (const row of [...friendRows, ...placeRows]) {
    const key = `${row.title}:${row.subtitle}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(row);
  }

  return merged.sort((a, b) => a.distanceKm - b.distanceKm);
}

export function useFriendLocationsSearchQuery(): UseFriendLocationsSearchQueryResult {
  const mockApi = useSearchApi<FriendLocationSearchResult>();
  const {currentUserId, isLocalDbEnabled, ready} = useDb();
  const [results, setResults] = useState<FriendLocationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSearch = useCallback(
    async (query: string, filters: SearchFilters) => {
      if (Platform.OS === 'web' || !isLocalDbEnabled || !ready || !currentUserId) {
        await mockApi.executeSearch(query, filters);
        const placeRows = (await searchNearbyPlaces(query, null)).map(place => ({
          ...place,
          friendUserId: '',
          distanceKm: 0,
          rating: 0,
        }));
        setResults(
          mergeSearchResults(mockApi.results as FriendLocationSearchResult[], placeRows),
        );
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const currentUser = await getUserById(currentUserId);
        const origin: Coordinates | null =
          currentUser?.currentLatitude != null && currentUser?.currentLongitude != null
            ? {
                latitude: currentUser.currentLatitude,
                longitude: currentUser.currentLongitude,
              }
            : null;

        const [friendRows, placeRows] = await Promise.all([
          searchFriendLocations({
            currentUserId,
            query,
            maxDistanceKm: filters.distanceKm,
            minRating: filters.minRating,
          }),
          searchNearbyPlaces(query, origin),
        ]);

        const normalizedPlaces: FriendLocationSearchResult[] = placeRows.map(place => ({
          ...place,
          friendUserId: '',
          distanceKm: 0,
          rating: place.tags.includes('★5')
            ? 5
            : place.tags.find(tag => tag.startsWith('★'))
              ? Number(place.tags.find(tag => tag.startsWith('★'))?.slice(1) ?? 3)
              : 3,
        }));

        setResults(mergeSearchResults(friendRows, normalizedPlaces));
      } catch (searchError) {
        setError(searchError instanceof Error ? searchError.message : 'Location search failed.');
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, isLocalDbEnabled, ready, mockApi],
  );

  return {results, loading, error, executeSearch};
}
