import type {SharedLocation} from './location';
import type {SearchResult} from './search';

export type FriendSearchResult = SearchResult & {
  mutualFriendsCount: number;
};

export type Friend = {
  id: string;
  name: string;
  displayName: string | null;
  bio: string;
  homeCity: string;
  isOnline: boolean;
  sharedLocation?: SharedLocation;
};

export type IncomingFriendRequest = {
  friendshipId: string;
  id: string;
  name: string;
};
