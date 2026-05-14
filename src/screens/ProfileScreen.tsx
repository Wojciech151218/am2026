import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useProfileApi} from '../hooks/useProfileApi';
import type {UserProfile} from '../types/profile';

type ProfileScreenProps = {
  viewedProfile?: UserProfile;
};

function ProfileScreen({viewedProfile}: ProfileScreenProps) {
  const profileApi = useProfileApi(viewedProfile?.isCurrentUser ? undefined : viewedProfile?.id);
  const profile = viewedProfile ?? profileApi.profile;

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Profile</Text>
        {profileApi.loading && !profile ? <Text style={styles.status}>Loading profile...</Text> : null}
        {profile ? (
          <>
            <View style={styles.section}>
              <Text style={styles.profileName}>{profile.displayName}</Text>
              <Text style={styles.bio}>{profile.bio}</Text>
              <Text style={styles.helper}>{profile.isCurrentUser ? 'Your profile view' : 'Public profile view'}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
              <Text style={styles.helper}>
                Notifications: {profile.settings.notificationsEnabled ? 'enabled' : 'disabled'}
              </Text>
              <Text style={styles.helper}>
                Location sharing: {profile.settings.locationSharingEnabled ? 'enabled' : 'disabled'}
              </Text>
              <Text style={styles.helper}>Theme: {profile.settings.theme}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location history</Text>
              {profile.locationHistory.map(item => (
                <View key={item.id} style={styles.historyItem}>
                  <Text style={styles.historyTitle}>{item.label}</Text>
                  <Text style={styles.helper}>
                    {item.coordinates.latitude.toFixed(2)}, {item.coordinates.longitude.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.helper}>Profile data unavailable.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  content: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
    justifyContent: 'flex-start',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 6,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  bio: {
    fontSize: 13,
    color: '#334155',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  historyItem: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    padding: 8,
  },
  helper: {
    fontSize: 12,
    color: '#475569',
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  status: {
    fontSize: 12,
    color: '#1D4ED8',
  },
});

export default ProfileScreen;
