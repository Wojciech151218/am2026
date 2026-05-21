import {useCallback, useState} from 'react';
import {Platform} from 'react-native';
import {flushOutboundSync} from '../../db/sync/coordinator';
import {addFriend} from '../../db/repositories/friendshipRepository';
import {useDb} from '../db/useDb';

type UseAddFriendResult = {
  loading: boolean;
  error: string | null;
  addFriend: (targetUserId: string) => Promise<boolean>;
};

export function useAddFriend(): UseAddFriendResult {
  const {currentUserId, isLocalDbEnabled} = useDb();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFriendMutation = useCallback(
    async (targetUserId: string): Promise<boolean> => {
      if (!currentUserId) {
        setError('You must be signed in to add friends.');
        return false;
      }

      if (Platform.OS === 'web' || !isLocalDbEnabled) {
        setError('Local database is only available on native platforms.');
        return false;
      }

      setLoading(true);
      setError(null);
      try {
        await addFriend(currentUserId, targetUserId);
        await flushOutboundSync();
        return true;
      } catch (mutationError) {
        setError(mutationError instanceof Error ? mutationError.message : 'Unable to add friend.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, isLocalDbEnabled],
  );

  return {loading, error, addFriend: addFriendMutation};
}
