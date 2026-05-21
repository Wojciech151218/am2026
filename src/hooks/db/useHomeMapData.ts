import {useCallback, useEffect, useMemo, useState} from 'react';
import {Platform} from 'react-native';
import {nearbyPlaceToMapMarker, searchNearbyPlaces, type NearbyPlace} from '../../api/place/nearbysearch';
import {
  fetchFriendsSharedLocationsForHome,
  getCurrentUserCoordinates,
} from '../../db/queries/friendsSharedLocations';
import {getUserById} from '../../db/repositories/userRepository';
import type {MapMarker} from '../../types/map';
import type {Coordinates} from '../../types/location';
import {useDb} from './useDb';
import {useLocalQuery} from './useLocalQuery';

const defaultCoordinates: Coordinates = {latitude: 52.2297, longitude: 21.0122};
const DEFAULT_ZOOM = 13;

type LocalHomeMapData = {
  center: Coordinates;
  markers: MapMarker[];
  trackingEnabled: boolean;
  currentCoordinates: Coordinates | null;
};

type HomeMapData = LocalHomeMapData & {
  zoom: number;
  nearbyPlaces: NearbyPlace[];
};

type UseHomeMapDataResult = {
  data: HomeMapData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useHomeMapData(): UseHomeMapDataResult {
  const {currentUserId, isLocalDbEnabled, ready} = useDb();
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);

  const queryFn = useCallback(async (): Promise<LocalHomeMapData> => {
    if (!currentUserId) {
      return {
        center: defaultCoordinates,
        markers: [],
        trackingEnabled: false,
        currentCoordinates: null,
      };
    }

    const user = await getUserById(currentUserId);
    const trackingEnabled = user?.locationTrackingEnabled ?? false;
    const center = await getCurrentUserCoordinates(currentUserId, defaultCoordinates);
    const currentCoordinates =
      trackingEnabled && user?.currentLatitude != null && user?.currentLongitude != null
        ? {latitude: user.currentLatitude, longitude: user.currentLongitude}
        : null;

    const {markers: friendMarkers} = await fetchFriendsSharedLocationsForHome(currentUserId);

    const markers: MapMarker[] = [
      ...(currentCoordinates
        ? [
            {
              id: 'you',
              kind: 'you' as const,
              latitude: currentCoordinates.latitude,
              longitude: currentCoordinates.longitude,
              title: 'You',
              description: user?.currentLocationLabel ?? 'Live location',
            },
          ]
        : []),
      ...friendMarkers.map(marker => ({
        id: marker.id,
        kind: 'friend' as const,
        latitude: marker.latitude,
        longitude: marker.longitude,
        title: marker.title,
        description: marker.description,
        sharedBy: marker.sharedBy,
      })),
    ];

    return {
      center: currentCoordinates ?? center,
      markers,
      trackingEnabled,
      currentCoordinates,
    };
  }, [currentUserId]);

  const localQuery = useLocalQuery('home-map', queryFn, {
    center: defaultCoordinates,
    markers: [],
    trackingEnabled: false,
    currentCoordinates: null,
  });

  const searchCenter = localQuery.data.center;

  const fetchNearby = useCallback(async () => {
    setPlacesLoading(true);
    setPlacesError(null);
    try {
      const places = await searchNearbyPlaces(searchCenter);
      setNearbyPlaces(places);
    } catch (requestError) {
      setPlacesError(
        requestError instanceof Error ? requestError.message : 'Unable to load nearby places.',
      );
      setNearbyPlaces([]);
    } finally {
      setPlacesLoading(false);
    }
  }, [searchCenter.latitude, searchCenter.longitude]);

  useEffect(() => {
    if (Platform.OS === 'web' || !isLocalDbEnabled || !ready) {
      return;
    }
    fetchNearby().catch(() => null);
  }, [fetchNearby, isLocalDbEnabled, ready]);

  const fallback = useMemo(
    (): HomeMapData => ({
      center: defaultCoordinates,
      markers: [],
      nearbyPlaces: [],
      trackingEnabled: false,
      currentCoordinates: null,
      zoom: DEFAULT_ZOOM,
    }),
    [],
  );

  const mergedData = useMemo((): HomeMapData => {
    const placeMarkers = nearbyPlaces.map(nearbyPlaceToMapMarker);
    return {
      ...localQuery.data,
      zoom: DEFAULT_ZOOM,
      nearbyPlaces,
      markers: [...localQuery.data.markers, ...placeMarkers],
    };
  }, [localQuery.data, nearbyPlaces]);

  const refetch = useCallback(async () => {
    await Promise.all([localQuery.refetch(), fetchNearby()]);
  }, [fetchNearby, localQuery.refetch]);

  if (Platform.OS === 'web' || !isLocalDbEnabled || !ready || !currentUserId) {
    return {
      data: fallback,
      loading: false,
      error: null,
      refetch: async () => undefined,
    };
  }

  return {
    data: mergedData,
    loading: localQuery.loading || placesLoading,
    error: localQuery.error ?? placesError,
    refetch,
  };
}

export {defaultCoordinates};
