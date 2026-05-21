import React from 'react';
import {StyleSheet, Text} from 'react-native';
import ProfileScreen from '../screens/ProfileScreen';
import {useProfileQuery} from '../hooks/db/useProfileQuery';
import {minimalProfileFromIds} from '../utils/profileFromFriend';

type FriendProfileByIdPreviewProps = {
  userId: string;
  fallbackTitle: string;
  fallbackDescription: string;
};

function FriendProfileByIdPreview({
  userId,
  fallbackTitle,
  fallbackDescription,
}: FriendProfileByIdPreviewProps) {
  const profileApi = useProfileQuery({
    userId,
    historyLimit: 5,
    historyOffset: 0,
  });

  if (profileApi.loading && !profileApi.profile) {
    return <Text style={styles.loading}>Loading profile...</Text>;
  }

  const profile =
    profileApi.profile ??
    minimalProfileFromIds({
      id: userId,
      displayName: fallbackTitle,
      bio: fallbackDescription,
    });

  return <ProfileScreen immutableProfile={profile} embedded />;
}

const styles = StyleSheet.create({
  loading: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    paddingVertical: 24,
  },
});

export default FriendProfileByIdPreview;
