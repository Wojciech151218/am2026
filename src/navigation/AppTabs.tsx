import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AppLoadingView from '../components/AppLoadingView';
import BottomTabIcon from '../components/BottomTabIcon';
import {useProfileQuery} from '../hooks/db/useProfileQuery';
import {useLiveLocationTracker} from '../hooks/useLiveLocationTracker';
import DisplayNameSetupScreen from '../screens/DisplayNameSetupScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import SocialScreen from '../screens/SocialScreen';
import ProfileScreen from '../screens/ProfileScreen';
import type {AppTabConfig, AppTabId} from './types';

const tabs: AppTabConfig[] = [
  {id: 'Home', label: 'Home'},
  {id: 'Search', label: 'Search'},
  {id: 'Social', label: 'Social'},
  {id: 'Profile', label: 'Profile'},
];

function ActiveTabScreen({tabId}: {tabId: AppTabId}) {
  if (tabId === 'Home') {
    return <HomeScreen />;
  }
  if (tabId === 'Search') {
    return <SearchScreen />;
  }
  if (tabId === 'Social') {
    return <SocialScreen />;
  }
  return <ProfileScreen />;
}

function AppTabs() {
  const [activeTab, setActiveTab] = React.useState<AppTabId>('Home');
  const profileApi = useProfileQuery({historyLimit: 0, historyOffset: 0});
  const insets = useSafeAreaInsets();
  const tabBarHeight = 72 + insets.bottom;
  const profile = profileApi.profile;
  const awaitingProfile = profileApi.loading && !profile;
  const showDisplayNameSetup = !profileApi.loading && profile == null;

  useLiveLocationTracker({
    trackingEnabled: profile?.settings.locationSharingEnabled ?? false,
  });

  if (awaitingProfile) {
    return (
      <View style={styles.container}>
        <AppLoadingView title="Loading your profile" subtitle="Almost there..." />
      </View>
    );
  }

  if (showDisplayNameSetup) {
    return (
      <View style={styles.container}>
        <DisplayNameSetupScreen onComplete={profileApi.refetch} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.scene, {paddingBottom: tabBarHeight}]}>
        <ActiveTabScreen tabId={activeTab} />
      </View>
      <View style={[styles.tabBar, {height: tabBarHeight, paddingBottom: Math.max(insets.bottom, 8)}]}>
        {tabs.map(tab => {
          const focused = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              style={styles.tabButton}
              accessibilityRole="button"
              accessibilityState={{selected: focused}}
              onPress={() => setActiveTab(tab.id)}>
              <BottomTabIcon label={tab.label} focused={focused} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scene: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
});

export default AppTabs;
