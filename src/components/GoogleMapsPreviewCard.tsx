import React from 'react';
import {Linking, Pressable, StyleSheet, Text, View} from 'react-native';
import MapView, {Marker, type Region} from 'react-native-maps';
import type {MapPreview} from '../types/home';
import type {Coordinates} from '../types/location';

type GoogleMapsPreviewCardProps = {
  loading: boolean;
  error: string | null;
  data: MapPreview | null;
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

function GoogleMapsPreviewCard({loading, error, data}: GoogleMapsPreviewCardProps) {
  const center = data?.center;
  const zoom = data?.zoom ?? 12;
  const initialRegion = center ? buildInitialRegion(center, zoom) : undefined;

  const openInMaps = React.useCallback(() => {
    if (!center) {
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${center.latitude},${center.longitude}`;
    Linking.openURL(url).catch(() => null);
  }, [center]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Google Maps</Text>
      {loading ? <Text style={styles.helper}>Loading map preview...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && center ? (
        <>
          <View style={styles.mapContainer}>
            <MapView
              key={`${center.latitude}:${center.longitude}:${zoom}`}
              style={styles.previewMap}
              initialRegion={initialRegion}
              showsCompass
              showsScale
              toolbarEnabled>
              <Marker
                coordinate={center}
                title="Current location"
                description={`${center.latitude.toFixed(4)}, ${center.longitude.toFixed(4)}`}
              />
            </MapView>
          </View>
          <Text style={styles.helper}>
            Center: {center.latitude.toFixed(2)}, {center.longitude.toFixed(2)} (zoom {zoom})
          </Text>
          <Pressable
            style={({pressed}) => [styles.openButton, pressed && styles.openButtonPressed]}
            onPress={openInMaps}
            accessibilityRole="button"
            accessibilityLabel="Open map in Google Maps">
            <Text style={styles.openButtonText}>Open in Google Maps</Text>
          </Pressable>
          <Text style={styles.hint}>Pan/zoom directly on the map or tap to open Google Maps.</Text>
        </>
      ) : null}
      {!loading && !center ? <Text style={styles.helper}>Map data not available yet.</Text> : null}
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
  previewMap: {
    width: '100%',
    height: 160,
    backgroundColor: '#E2E8F0',
  },
  hint: {
    fontSize: 12,
    color: '#64748B',
  },
  openButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#0EA5E9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  openButtonPressed: {
    opacity: 0.85,
  },
  openButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default GoogleMapsPreviewCard;
