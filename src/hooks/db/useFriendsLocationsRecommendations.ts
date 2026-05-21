import {useCallback} from 'react';
import {Platform} from 'react-native';
import {fetchFriendsSharedLocationsForHome} from '../../db/queries/friendsSharedLocations';
import type {RecommendationItem} from '../../types/home';
import {useRecommendationsApi} from '../useRecommendationsApi';
import type {Coordinates} from '../../types/location';
import {useDb} from './useDb';
import {useLocalQuery} from './useLocalQuery';

export type FriendsLocationsData = {
  recommendations: RecommendationItem[];
};

type UseFriendsLocationsRecommendationsResult = {
  data: FriendsLocationsData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useFriendsLocationsRecommendations(
  location: Coordinates,
): UseFriendsLocationsRecommendationsResult {
  const mockApi = useRecommendationsApi({location});
  const {currentUserId, isLocalDbEnabled, ready} = useDb();

  const queryFn = useCallback(async () => {
    if (!currentUserId) {
      return {recommendations: []};
    }
    const result = await fetchFriendsSharedLocationsForHome(currentUserId);
    return {recommendations: result.recommendations};
  }, [currentUserId]);

  const localQuery = useLocalQuery('friends-locations-rec', queryFn, {
    recommendations: [],
  });

  if (Platform.OS === 'web' || !isLocalDbEnabled || !ready || !currentUserId) {
    return {
      data: {recommendations: mockApi.data},
      loading: mockApi.loading,
      error: mockApi.error,
      refetch: mockApi.refetch,
    };
  }

  return {
    data: localQuery.data,
    loading: localQuery.loading,
    error: localQuery.error,
    refetch: localQuery.refetch,
  };
}
