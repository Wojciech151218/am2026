import type {LocationHistoryItem} from './location';

export type ProfileSettings = {
  notificationsEnabled: boolean;
  locationSharingEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
};

export type UserProfile = {
  id: string;
  displayName: string;
  bio: string;
  isCurrentUser: boolean;
  settings: ProfileSettings;
  locationHistory: LocationHistoryItem[];
};
