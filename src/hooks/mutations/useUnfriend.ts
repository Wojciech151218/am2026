import {useCallback, useState} from 'react';
import {Platform} from 'react-native';
import {removeFriend} from '../../db/repositories/friendshipRepository';
import {flushOutboundSync} from '../../db/sync/coordinator';
import {useDb} from '../db/useDb';

type UseUnfriendResult = {
  loading: boolean;
  error: string | null;
  unfriend: (friendshipId: string) => Promise<boolean>;
};

export function useUnfriend(): UseUnfriendResult {
  const {currentUserId, isLocalDbEnabled} = useDb();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unfriendMutation = useCallback(
    async (friendshipId: string): Promise<boolean> => {
      if (!currentUserId) {
        setError('You must be signed in to unfriend someone.');
        return false;
      }

      if (Platform.OS === 'web' || !isLocalDbEnabled) {
        setError('Local database is only available on native platforms.');
        return false;
      }

      setLoading(true);
      setError(null);
      try {
        const removed = await removeFriend(currentUserId, friendshipId);
        if (!removed) {
          setError('Friendship not found.');
          return false;
        }
        await flushOutboundSync();
        return true;
      } catch (mutationError) {
        setError(mutationError instanceof Error ? mutationError.message : 'Unable to unfriend.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, isLocalDbEnabled],
  );

  return {loading, error, unfriend: unfriendMutation};
}
