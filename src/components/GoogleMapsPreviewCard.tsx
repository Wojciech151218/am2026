import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import MapView, {Marker, type Region} from 'react-native-maps';
import BlurContainer from './BlurContainer';
import {distanceKm} from '../db/utils/geo';
import {usePostUserLocation} from '../hooks/mutations/usePostUserLocation';
import {useToast} from './Toast';
import type {MapMarker, MapMarkerKind} from '../types/map';
import type {Coordinates} from '../types/location';

export type {MapMarker} from '../types/map';

type GoogleMapsPreviewCardProps = {
  loading?: boolean;
  error?: string | null;
  markers: MapMarker[];
  initialCenter?: Coordinates | null;
  initialZoom?: number;
  onMapInteractionChange?: (interacting: boolean) => void;
  onExpandedChange?: (expanded: boolean) => void;
};

const MAP_EDGE_PADDING = {top: 48, right: 48, bottom: 48, left: 48};
const PREVIEW_MAP_HEIGHT = 220;
const PREVIEW_TAP_SLOP_PX = 10;
const MAP_REFIT_DISTANCE_KM = 0.15;

const MARKER_DOT_COLORS: Record<MapMarkerKind, string> = {
  you: '#22C55E',
  friend: '#8B5CF6',
  place: '#475569',
};

function buildInitialRegion(center: Coordinates, zoom: number): Region {
  const delta = Math.max(360 / 2 ** zoom, 0.005);
  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

function regionForPoints(points: Coordinates[], paddingFactor = 1.5): Region {
  if (points.length === 1) {
    return buildInitialRegion(points[0], 14);
  }

  const lats = points.map(point => point.latitude);
  const lngs = points.map(point => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * paddingFactor, 0.02),
    longitudeDelta: Math.max((maxLng - minLng) * paddingFactor, 0.02),
  };
}

function formatPlaceTypes(types?: string[]): string | null {
  if (!types?.length) {
    return null;
  }
  const readable = types
    .filter(type => !['establishment', 'point_of_interest', 'geocode', 'political'].includes(type))
    .slice(0, 3)
    .map(type => type.replaceAll('_', ' '));
  return readable.length > 0 ? readable.join(' · ') : null;
}

type MarkerDotProps = {
  kind: MapMarkerKind;
  selected: boolean;
};

function MarkerDot({kind, selected}: MarkerDotProps) {
  const color = MARKER_DOT_COLORS[kind];
  return (
    <View
      style={[
        styles.markerDot,
        {backgroundColor: color, borderColor: selected ? '#FFFFFF' : 'rgba(255,255,255,0.9)'},
        selected && styles.markerDotSelected,
      ]}
    />
  );
}

type MarkerDetailPanelProps = {
  marker: MapMarker;
  posting: boolean;
  postError: string | null;
  onPost: () => void;
  onDismiss: () => void;
};

function MarkerDetailPanel({marker, posting, postError, onDismiss, onPost}: MarkerDetailPanelProps) {
  const place = marker.place;
  const title = place?.name ?? marker.title ?? 'Location';
  const subtitle = place?.address ?? marker.description;
  const typesLabel = formatPlaceTypes(place?.types);
  const canPost = marker.kind === 'place' || marker.kind === 'you';

  return (
    <View style={styles.detailPanel}>
      <View style={styles.detailHeader}>
        <View style={[styles.detailKindDot, {backgroundColor: MARKER_DOT_COLORS[marker.kind]}]} />
        <View style={styles.detailTextWrap}>
          <Text style={styles.detailTitle} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.detailSubtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={onDismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close marker details">
          <Text style={styles.detailDismiss}>✕</Text>
        </Pressable>
      </View>

      {place?.rating != null ? (
        <Text style={styles.detailMeta}>
          ★ {place.rating.toFixed(1)}
          {place.userRatingsTotal != null ? ` · ${place.userRatingsTotal} reviews` : ''}
          {place.openNow != null ? ` · ${place.openNow ? 'Open now' : 'Closed'}` : ''}
        </Text>
      ) : null}

      {typesLabel ? <Text style={styles.detailMeta}>{typesLabel}</Text> : null}

      {marker.sharedBy ? (
        <Text style={styles.detailSharedBy}>Shared by {marker.sharedBy}</Text>
      ) : null}

      {marker.kind === 'you' ? (
        <Text style={styles.detailMeta}>Your live location</Text>
      ) : null}

      {canPost ? (
        <View style={styles.detailActions}>
          <Pressable
            style={({pressed}) => [
              styles.postButton,
              pressed && styles.postButtonPressed,
              posting && styles.postButtonDisabled,
            ]}
            onPress={onPost}
            disabled={posting}
            accessibilityRole="button"
            accessibilityLabel="Save this place to your location history">
            {posting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.postButtonText}>Save here</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {postError ? <Text style={styles.detailError}>{postError}</Text> : null}
    </View>
  );
}

type MapContentProps = {
  mapRef: React.RefObject<MapView | null>;
  initialRegion: Region;
  markers: MapMarker[];
  expanded: boolean;
  selectedMarkerId: string | null;
  onMarkerPress: (marker: MapMarker) => void;
  onMapTouchStart: () => void;
  onMapTouchEnd: () => void;
};

function MapContent({
  mapRef,
  initialRegion,
  markers,
  expanded,
  selectedMarkerId,
  onMarkerPress,
  onMapTouchStart,
  onMapTouchEnd,
}: MapContentProps) {
  return (
    <View
      style={[styles.mapContainer, expanded && styles.mapContainerExpanded]}
      onTouchStart={onMapTouchStart}
      onTouchEnd={onMapTouchEnd}
      onTouchCancel={onMapTouchEnd}>
      <MapView
        ref={mapRef}
        style={expanded ? styles.mapExpanded : styles.mapPreview}
        initialRegion={initialRegion}
        scrollEnabled
        zoomEnabled
        rotateEnabled={false}
        pitchEnabled={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}>
        {markers.map(marker => (
          <Marker
            key={marker.id}
            coordinate={{latitude: marker.latitude, longitude: marker.longitude}}
            tracksViewChanges={false}
            onPress={expanded ? () => onMarkerPress(marker) : undefined}
            zIndex={selectedMarkerId === marker.id ? 2 : 1}>
            <MarkerDot kind={marker.kind} selected={selectedMarkerId === marker.id} />
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

function GoogleMapsPreviewCard({
  loading = false,
  error = null,
  markers,
  initialCenter = null,
  initialZoom = 12,
  onMapInteractionChange,
  onExpandedChange,
}: GoogleMapsPreviewCardProps) {
  const mapRef = useRef<MapView>(null);
  const [expanded, setExpanded] = useState(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const {loading: posting, error: postError, postUserLocation} = usePostUserLocation();
  const {showToast} = useToast();
  const previewTouchRef = useRef({startX: 0, startY: 0, moved: false});
  const lastFitSignatureRef = useRef<string | null>(null);

  const markerCoordinates = useMemo(
    () => markers.map(marker => ({latitude: marker.latitude, longitude: marker.longitude})),
    [markers],
  );

  const selectedMarker = useMemo(
    () => markers.find(marker => marker.id === selectedMarkerId) ?? null,
    [markers, selectedMarkerId],
  );

  const initialRegion = useMemo(() => {
    if (markerCoordinates.length > 0) {
      return regionForPoints(markerCoordinates);
    }
    if (initialCenter) {
      return buildInitialRegion(initialCenter, initialZoom);
    }
    return undefined;
  }, [initialCenter, initialZoom, markerCoordinates]);

  useEffect(() => {
    if (markerCoordinates.length === 0) {
      return;
    }

    const signature = markerCoordinates
      .map(point => `${point.latitude.toFixed(3)},${point.longitude.toFixed(3)}`)
      .join('|');
    const lastSignature = lastFitSignatureRef.current;
    if (lastSignature && lastSignature !== signature) {
      const lastPoints = lastSignature.split('|').map(pair => {
        const [lat, lng] = pair.split(',').map(Number);
        return {latitude: lat, longitude: lng};
      });
      const movedLittle =
        markerCoordinates.length === lastPoints.length &&
        markerCoordinates.every((point, index) => {
          const previous = lastPoints[index];
          if (!previous) {
            return false;
          }
          return distanceKm(point, previous) < MAP_REFIT_DISTANCE_KM;
        });
      if (movedLittle && !expanded) {
        return;
      }
    }

    lastFitSignatureRef.current = signature;
    mapRef.current?.fitToCoordinates(markerCoordinates, {
      edgePadding: MAP_EDGE_PADDING,
      animated: true,
    });
  }, [markerCoordinates, expanded]);

  const handleMapTouchStart = useCallback(() => {
    onMapInteractionChange?.(true);
  }, [onMapInteractionChange]);

  const handleMapTouchEnd = useCallback(() => {
    onMapInteractionChange?.(false);
  }, [onMapInteractionChange]);

  const openInMaps = useCallback(() => {
    const target =
      selectedMarker ??
      markers[0] ??
      (initialCenter ? {latitude: initialCenter.latitude, longitude: initialCenter.longitude} : null);
    if (!target) {
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${target.latitude},${target.longitude}`;
    Linking.openURL(url).catch(() => null);
  }, [initialCenter, markers, selectedMarker]);

  const setExpandedState = useCallback(
    (value: boolean) => {
      setExpanded(value);
      if (!value) {
        setSelectedMarkerId(null);
      }
      onExpandedChange?.(value);
    },
    [onExpandedChange],
  );

  const handleMarkerPress = useCallback((marker: MapMarker) => {
    setSelectedMarkerId(current => (current === marker.id ? null : marker.id));
  }, []);

  const handlePostLocation = useCallback(async () => {
    if (!selectedMarker) {
      return;
    }
    const label = selectedMarker.place?.name ?? selectedMarker.title ?? 'Saved place';
    const city =
      selectedMarker.place?.address?.split(',').slice(-2).join(',').trim() ||
      selectedMarker.description;
    const success = await postUserLocation({
      latitude: selectedMarker.latitude,
      longitude: selectedMarker.longitude,
      label,
      city,
    });
    if (success) {
      showToast('Place saved', {body: label, variant: 'success'});
    }
  }, [postUserLocation, selectedMarker, showToast]);

  const onPreviewTouchStart = useCallback(
    (event: GestureResponderEvent) => {
      const {pageX, pageY} = event.nativeEvent;
      previewTouchRef.current = {startX: pageX, startY: pageY, moved: false};
      handleMapTouchStart();
    },
    [handleMapTouchStart],
  );

  const onPreviewTouchMove = useCallback((event: GestureResponderEvent) => {
    const {pageX, pageY} = event.nativeEvent;
    const dx = Math.abs(pageX - previewTouchRef.current.startX);
    const dy = Math.abs(pageY - previewTouchRef.current.startY);
    if (dx > PREVIEW_TAP_SLOP_PX || dy > PREVIEW_TAP_SLOP_PX) {
      previewTouchRef.current.moved = true;
    }
  }, []);

  const onPreviewTouchEnd = useCallback(() => {
    handleMapTouchEnd();
    if (!previewTouchRef.current.moved) {
      setExpandedState(true);
    }
  }, [handleMapTouchEnd, setExpandedState]);

  const hasMapContent = markerCoordinates.length > 0 || initialCenter != null;
  const placeCount = markers.filter(marker => marker.kind === 'place').length;

  const mapProps =
    initialRegion && hasMapContent
      ? {
          mapRef,
          initialRegion,
          markers,
          onMapTouchStart: handleMapTouchStart,
          onMapTouchEnd: handleMapTouchEnd,
          onMarkerPress: handleMarkerPress,
          selectedMarkerId,
        }
      : null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Google Maps</Text>
      {loading ? <Text style={styles.helper}>Updating map...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && mapProps ? (
        <>
          <View
            onTouchStart={onPreviewTouchStart}
            onTouchMove={onPreviewTouchMove}
            onTouchEnd={onPreviewTouchEnd}
            onTouchCancel={onPreviewTouchEnd}
            accessibilityRole="button"
            accessibilityLabel="Expand map">
            <MapContent {...mapProps} expanded={false} />
          </View>
          {markers.length > 0 ? (
            <Text style={styles.helper}>
              {markers.length} pin{markers.length === 1 ? '' : 's'}
              {placeCount > 0 ? ` · ${placeCount} nearby place${placeCount === 1 ? '' : 's'}` : ''} · tap
              to open full map
            </Text>
          ) : (
            <Text style={styles.helper}>Tap to open full map</Text>
          )}
        </>
      ) : null}
      {!loading && !hasMapContent ? <Text style={styles.helper}>Map data not available yet.</Text> : null}

      <BlurContainer
        visible={expanded}
        onClose={() => setExpandedState(false)}
        expandedFraction={0.88}
        position="center"
        horizontalInset={20}
        showHandle={false}>
        {mapProps ? (
          <View style={styles.expandedBody}>
            <MapContent {...mapProps} expanded />
            {selectedMarker ? (
              <MarkerDetailPanel
                marker={selectedMarker}
                posting={posting}
                postError={postError}
                onDismiss={() => setSelectedMarkerId(null)}
                onPost={() => {
                  handlePostLocation().catch(() => null);
                }}
              />
            ) : (
              <Text style={styles.expandedHint}>Tap a pin for place details</Text>
            )}
            <Pressable
              style={({pressed}) => [styles.openButtonSmall, pressed && styles.openButtonPressed]}
              onPress={openInMaps}
              accessibilityRole="button"
              accessibilityLabel="Open map in Google Maps">
              <Text style={styles.openButtonText}>Open in Google Maps</Text>
            </Pressable>
          </View>
        ) : null}
      </BlurContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  helper: {
    fontSize: 13,
    color: '#475569',
  },
  error: {
    fontSize: 12,
    color: '#B91C1C',
  },
  mapContainer: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  mapContainerExpanded: {
    flex: 1,
    borderRadius: 10,
  },
  mapPreview: {
    width: '100%',
    height: PREVIEW_MAP_HEIGHT,
    backgroundColor: '#E2E8F0',
  },
  mapExpanded: {
    flex: 1,
    width: '100%',
    minHeight: 220,
    backgroundColor: '#E2E8F0',
  },
  expandedBody: {
    flex: 1,
    gap: 8,
  },
  expandedHint: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  markerDotSelected: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
  },
  detailPanel: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    padding: 10,
    gap: 6,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailKindDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  detailTextWrap: {
    flex: 1,
    gap: 2,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  detailMeta: {
    fontSize: 12,
    color: '#475569',
  },
  detailSharedBy: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6D28D9',
  },
  detailDismiss: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
    lineHeight: 18,
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  postButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 72,
    alignItems: 'center',
  },
  postButtonPressed: {
    opacity: 0.88,
  },
  postButtonDisabled: {
    opacity: 0.7,
  },
  postButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailError: {
    fontSize: 11,
    color: '#B91C1C',
  },
  openButtonSmall: {
    alignSelf: 'center',
    backgroundColor: '#0EA5E9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  openButtonPressed: {
    opacity: 0.85,
  },
  openButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default GoogleMapsPreviewCard;
