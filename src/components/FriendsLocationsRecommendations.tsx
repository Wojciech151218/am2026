import React from 'react';
import {Linking, StyleSheet, Text, View} from 'react-native';
import {googleMapsUrl} from '../api/googleGeocoding';
import LocationPressableCard from './LocationPressableCard';
import type {RecommendationItem} from '../types/home';

type FriendsLocationsRecommendationsProps = {
  loading: boolean;
  error: string | null;
  items: RecommendationItem[];
};

function FriendsLocationsRecommendations({
  loading,
  error,
  items,
}: FriendsLocationsRecommendationsProps) {
  const onPressItem = (item: RecommendationItem) => {
    if (!item.coordinates) {
      return;
    }
    Linking.openURL(googleMapsUrl(item.coordinates)).catch(() => null);
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>Friends nearby</Text>
        {loading ? <Text style={styles.helper}>Loading friend locations...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && items.length === 0 ? (
          <Text style={styles.helper}>
            No friends are sharing locations yet. Accepted friends with location tracking enabled
            will appear here.
          </Text>
        ) : null}
        {items.map(item => (
          <LocationPressableCard
            key={item.id}
            title={item.title}
            subtitle={item.description}
            highlighted
            onPress={item.coordinates ? () => onPressItem(item) : undefined}
            tags={item.coordinates ? ['Open in Google Maps'] : []}
          />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
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
    fontSize: 12,
    color: '#475569',
  },
  error: {
    fontSize: 12,
    color: '#B91C1C',
  },
});

export default FriendsLocationsRecommendations;
