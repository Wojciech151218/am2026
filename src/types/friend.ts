import type {SharedLocation} from './location';
import type {SearchResult} from './search';

export type FriendSearchResult = SearchResult & {
  mutualFriendsCount: number;
};

export type Friend = {
  id: string;
  name: string;
  isOnline: boolean;
  sharedLocation?: SharedLocation;
};
