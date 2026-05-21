export * from './user';
export * from './location';
export * from './friendship';
export * from './syncMutation';

import {friendships} from './friendship';
import {locations} from './location';
import {syncMutations} from './syncMutation';
import {users} from './user';

export const schema = {
  users,
  locations,
  friendships,
  syncMutations,
};
