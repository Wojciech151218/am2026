import React from 'react';
import {StyleSheet, Text} from 'react-native';
import ProfileScreen from '../screens/ProfileScreen';
import {useProfileQuery} from '../hooks/db/useProfileQuery';
import {profileFromFriend} from '../utils/profileFromFriend';
import type {Friend} from '../types/friend';

type FriendProfilePreviewProps = {
  friend: Friend;
};

function FriendProfilePreview({friend}: FriendProfilePreviewProps) {
  const profileApi = useProfileQuery({
    userId: friend.id,
    historyLimit: 5,
    historyOffset: 0,
  });

  if (profileApi.loading && !profileApi.profile) {
    return <Text style={styles.loading}>Loading profile...</Text>;
  }

  const profile = profileApi.profile ?? profileFromFriend(friend);
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

export default FriendProfilePreview;
