import {useCallback, useState} from 'react';
import {Platform} from 'react-native';
import {searchNearbyPlaces} from '../../api/googlePlacesSearch';
import {searchFriendLocations} from '../../db/queries/searchFriendLocations';
import {getUserById} from '../../db/repositories/userRepository';
import type {FriendLocationSearchResult} from '../../types/search';
import type {Coordinates} from '../../types/location';
import {useDb} from './useDb';

type UseFriendLocationsSearchQueryResult = {
  results: FriendLocationSearchResult[];
  loading: boolean;
  error: string | null;
  executeSearch: (query: string) => Promise<void>;
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

  return merged;
}

export function useFriendLocationsSearchQuery(): UseFriendLocationsSearchQueryResult {
  const {currentUserId, isLocalDbEnabled, ready} = useDb();
  const [results, setResults] = useState<FriendLocationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSearch = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim();
      if (Platform.OS === 'web' || !isLocalDbEnabled || !ready || !currentUserId) {
        setLoading(true);
        setError(null);
        if (!trimmedQuery) {
          setResults([]);
          setLoading(false);
          return;
        }
        try {
          const placeRows = (await searchNearbyPlaces(trimmedQuery, null, 7)).map(place => ({
            ...place,
            friendUserId: '',
            distanceKm: 0,
            rating: 0,
            isFriendResult: false,
          }));
          setResults(placeRows);
          return;
        } catch (searchError) {
          setError(searchError instanceof Error ? searchError.message : 'Location search failed.');
        } finally {
          setLoading(false);
        }
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

        if (!trimmedQuery) {
          const latestFriendRows = await searchFriendLocations({
            currentUserId,
            limit: 10,
          });
          setResults(latestFriendRows);
          return;
        }

        const [friendRows, placeRows] = await Promise.all([
          searchFriendLocations({currentUserId, query: trimmedQuery, limit: 3}),
          searchNearbyPlaces(trimmedQuery, origin, 7),
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
          isFriendResult: false,
        }));

        setResults(mergeSearchResults(friendRows, normalizedPlaces));
      } catch (searchError) {
        setError(searchError instanceof Error ? searchError.message : 'Location search failed.');
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, isLocalDbEnabled, ready],
  );

  return {results, loading, error, executeSearch};
}
