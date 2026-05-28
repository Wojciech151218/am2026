import React, {useEffect, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import ProfileFieldsForm from '../components/ProfileFieldsForm';
import {formatHistoryDate} from '../utils/formatDate';
import {useProfileLocationHistory} from '../hooks/db/useProfileLocationHistory';
import {useProfileQuery} from '../hooks/db/useProfileQuery';
import {useDb} from '../hooks/db/useDb';
import {useToggleLocationTracking} from '../hooks/mutations/useToggleLocationTracking';
import {useUpdateUserProfile} from '../hooks/mutations/useUpdateUserProfile';
import {useFirebaseAuth} from '../hooks/useFirebaseAuth';
import type {UserProfile} from '../types/profile';

const HISTORY_PAGE_SIZE = 10;

type ProfileScreenProps = {
  /** When set, profile is read-only and must not be mutated by this screen. */
  immutableProfile?: UserProfile;
  /** Compact layout for BlurContainer overlay (no page heading). */
  embedded?: boolean;
};

function ProfileScreen({immutableProfile, embedded = false}: ProfileScreenProps) {
  const isImmutable = immutableProfile != null;
  const {currentUserId, isLocalDbEnabled, ready} = useDb();
  const profileApi = useProfileQuery(
    isImmutable
      ? {historyLimit: 0, historyOffset: 0}
      : {historyLimit: undefined, historyOffset: 0},
  );
  const auth = useFirebaseAuth();
  const locationTracking = useToggleLocationTracking();
  const updateProfile = useUpdateUserProfile();
  const profile = immutableProfile ?? profileApi.profile;
  const isCurrentUserProfile = profile?.isCurrentUser ?? false;
  const historyUserId = profile?.id ?? currentUserId ?? '';
  const locationHistory = useProfileLocationHistory({
    userId: isImmutable ? '' : historyUserId,
    pageSize: HISTORY_PAGE_SIZE,
  });

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!profile) {
      return;
    }
    setDisplayName(profile.displayName ?? '');
    setBio(profile.bio);
    setHomeCity(profile.homeCity ?? '');
  }, [profile?.id, profile?.displayName, profile?.bio, profile?.homeCity]);

  useEffect(() => {
    if (isImmutable || !historyUserId || !isLocalDbEnabled || !ready) {
      return;
    }
    locationHistory.reset().catch(() => null);
  }, [historyUserId, isLocalDbEnabled, ready, isImmutable]);

  const onToggleLocationSharing = async () => {
    if (!profile || isImmutable) {
      return;
    }
    await locationTracking.toggleLocationTracking(!profile.settings.locationSharingEnabled);
    await profileApi.refetch();
  };

  const onSaveProfile = async () => {
    const patch: {displayName?: string; bio: string; homeCity: string} = {
      bio: bio.trim(),
      homeCity: homeCity.trim(),
    };
    if (profile?.displayName == null) {
      patch.displayName = displayName.trim();
    }
    const success = await updateProfile.updateProfile(patch);
    if (success) {
      setEditing(false);
      await profileApi.refetch();
      await locationHistory.reset();
    }
  };

  const onLoadMoreHistory = async () => {
    await locationHistory.loadMore();
  };

  const historyItems =
    isImmutable
      ? profile?.locationHistory ?? []
      : isLocalDbEnabled && ready && historyUserId
        ? locationHistory.items
        : (profile?.locationHistory ?? []);

  const content = (
    <>
      {!embedded ? <Text style={styles.heading}>Profile</Text> : null}
      {profileApi.loading && !profile ? <Text style={styles.status}>Loading your profile...</Text> : null}
      {profileApi.error && !isImmutable ? <Text style={styles.status}>{profileApi.error}</Text> : null}
      {profile ? (
        <>
          <View style={styles.section}>
            {isCurrentUserProfile && !isImmutable && editing ? (
              <ProfileFieldsForm
                title="Edit profile"
                values={{displayName, bio, homeCity}}
                onChangeDisplayName={setDisplayName}
                onChangeBio={setBio}
                onChangeHomeCity={setHomeCity}
                lockedDisplayName={profile.displayName}
                showActions
                onSave={onSaveProfile}
                onCancel={() => setEditing(false)}
                saving={updateProfile.loading}
                error={updateProfile.error}
              />
            ) : (
              <>
                <ProfileFieldsForm
                  readOnly
                  values={{
                    displayName: profile.displayName ?? '—',
                    bio: profile.bio,
                    homeCity: profile.homeCity,
                  }}
                  helperText={
                    isImmutable
                      ? 'Profile preview'
                      : profile.isCurrentUser
                        ? 'Your profile view'
                        : 'Public profile view'
                  }
                />
                {isCurrentUserProfile && !isImmutable ? (
                  <View style={styles.actionRow}>
                    <Pressable style={styles.editButton} onPress={() => setEditing(true)}>
                      <Text style={styles.editButtonText}>Edit profile</Text>
                    </Pressable>
                    <Pressable
                      style={styles.logoutButton}
                      onPress={() => auth.signOutCurrentUser().catch(() => null)}
                      disabled={auth.actionLoading === 'signOut'}
                      accessibilityRole="button"
                      accessibilityLabel="Log out">
                      <Text style={styles.logoutButtonText}>
                        {auth.actionLoading === 'signOut' ? 'Logging out...' : 'Log out'}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <Text style={styles.helper}>
              Notifications: {profile.settings.notificationsEnabled ? 'enabled' : 'disabled'}
            </Text>
            {isCurrentUserProfile && !isImmutable ? (
              <Pressable
                style={styles.toggleButton}
                onPress={onToggleLocationSharing}
                disabled={locationTracking.loading}>
                <Text style={styles.toggleButtonText}>
                  Location tracking: {profile.settings.locationSharingEnabled ? 'on' : 'off'} (tap
                  to toggle)
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.helper}>
                Location tracking: {profile.settings.locationSharingEnabled ? 'on' : 'off'}
              </Text>
            )}
            {locationTracking.error && !isImmutable ? (
              <Text style={styles.status}>{locationTracking.error}</Text>
            ) : null}
            <Text style={styles.helper}>Theme: {profile.settings.theme}</Text>
            {auth.error && isCurrentUserProfile && !isImmutable ? (
              <Text style={styles.status}>{auth.error}</Text>
            ) : null}
          </View>

          {!isImmutable || historyItems.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location history</Text>
              {locationHistory.loading && historyItems.length === 0 ? (
                <Text style={styles.status}>Loading places you've visited...</Text>
              ) : null}
              {locationHistory.error ? <Text style={styles.status}>{locationHistory.error}</Text> : null}
              {historyItems.length === 0 ? (
                <Text style={styles.helper}>
                  No visit snapshots yet. Turn on location tracking to share your live position with
                  friends.
                </Text>
              ) : (
                historyItems.map(item => {
                  const placeName = item.label?.trim() || item.city?.trim() || 'Unknown place';
                  const area =
                    item.city?.trim() && item.city.trim() !== placeName ? item.city.trim() : null;
                  return (
                    <View key={item.id} style={styles.historyItem}>
                      <Text style={styles.historyTitle}>{placeName}</Text>
                      {area ? <Text style={styles.historyArea}>{area}</Text> : null}
                      <Text style={styles.historyDate}>{formatHistoryDate(item.visitedAt)}</Text>
                    </View>
                  );
                })
              )}
              {!isImmutable && locationHistory.hasMore ? (
                <Pressable
                  style={styles.loadMoreButton}
                  onPress={onLoadMoreHistory}
                  disabled={locationHistory.loading}>
                  <Text style={styles.loadMoreText}>
                    {locationHistory.loading ? 'Loading...' : 'Load more'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </>
      ) : (
        <Text style={styles.helper}>Profile data unavailable.</Text>
      )}
    </>
  );

  if (embedded) {
    return (
      <ScrollView style={styles.embeddedRoot} contentContainerStyle={styles.embeddedContent}>
        {content}
      </ScrollView>
    );
  }

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>{content}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  embeddedRoot: {
    flex: 1,
  },
  embeddedContent: {
    gap: 12,
    paddingBottom: 8,
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
    gap: 8,
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
    gap: 2,
  },
  helper: {
    fontSize: 12,
    color: '#475569',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  historyArea: {
    fontSize: 12,
    color: '#64748B',
  },
  historyDate: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  status: {
    fontSize: 12,
    color: '#1D4ED8',
  },
  toggleButton: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 8,
  },
  toggleButtonText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  editButton: {
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  loadMoreButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  logoutButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  logoutButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
  },
});

export default ProfileScreen;
