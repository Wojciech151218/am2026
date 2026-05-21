import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import BlurContainer from './BlurContainer';
import FriendProfileByIdPreview from './FriendProfileByIdPreview';
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
  const [previewItem, setPreviewItem] = useState<RecommendationItem | null>(null);

  const onPressItem = (item: RecommendationItem) => {
    if (!item.friendUserId) {
      return;
    }
    setPreviewItem(item);
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
          <Pressable
            key={item.id}
            style={({pressed}) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => onPressItem(item)}
            disabled={!item.friendUserId}
            accessibilityRole="button">
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.helper}>{item.description}</Text>
          </Pressable>
        ))}
      </View>

      <BlurContainer
        visible={previewItem != null}
        onClose={() => setPreviewItem(null)}
        expandedFraction={0.85}>
        {previewItem?.friendUserId ? (
          <FriendProfileByIdPreview
            userId={previewItem.friendUserId}
            fallbackTitle={previewItem.title}
            fallbackDescription={previewItem.description}
          />
        ) : null}
      </BlurContainer>
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
  card: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#F8FAFC',
  },
  cardPressed: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
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
