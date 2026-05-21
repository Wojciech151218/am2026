import React from 'react';
import {ActivityIndicator, Alert, Pressable, StyleSheet, Text, View} from 'react-native';
import ProfileScreen from '../screens/ProfileScreen';
import {useProfileQuery} from '../hooks/db/useProfileQuery';
import {useUnfriend} from '../hooks/mutations/useUnfriend';
import {profileFromFriend} from '../utils/profileFromFriend';
import type {Friend} from '../types/friend';

type FriendProfilePreviewProps = {
  friend: Friend;
  onUnfriended?: () => void;
};

function FriendProfilePreview({friend, onUnfriended}: FriendProfilePreviewProps) {
  const profileApi = useProfileQuery({
    userId: friend.id,
    historyLimit: 5,
    historyOffset: 0,
  });
  const unfriendMutation = useUnfriend();

  if (profileApi.loading && !profileApi.profile) {
    return <Text style={styles.loading}>Loading profile...</Text>;
  }

  const profile = profileApi.profile ?? profileFromFriend(friend);

  const confirmUnfriend = () => {
    Alert.alert(
      'Unfriend',
      `Remove ${friend.name} from your friends?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Unfriend',
          style: 'destructive',
          onPress: () => {
            unfriendMutation
              .unfriend(friend.friendshipId)
              .then(success => {
                if (!success) {
                  Alert.alert(
                    'Unable to unfriend',
                    unfriendMutation.error ?? 'Try again later.',
                  );
                  return;
                }
                onUnfriended?.();
              })
              .catch(() => null);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ProfileScreen immutableProfile={profile} embedded />
      <Pressable
        style={[styles.unfriendButton, unfriendMutation.loading && styles.unfriendButtonDisabled]}
        onPress={confirmUnfriend}
        disabled={unfriendMutation.loading}
        accessibilityRole="button"
        accessibilityLabel={`Unfriend ${friend.name}`}>
        {unfriendMutation.loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.unfriendText}>Unfriend</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
  },
  loading: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    paddingVertical: 24,
  },
  unfriendButton: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unfriendButtonDisabled: {
    opacity: 0.7,
  },
  unfriendText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default FriendProfilePreview;
