import {useCallback, useState} from 'react';
import {Platform} from 'react-native';
import {acceptFriendRequest} from '../../db/repositories/friendshipRepository';
import {flushOutboundSync} from '../../db/sync/coordinator';
import {useDb} from '../db/useDb';

type UseAcceptFriendRequestResult = {
  loading: boolean;
  acceptingFriendshipId: string | null;
  error: string | null;
  acceptFriendRequest: (friendshipId: string) => Promise<boolean>;
};

export function useAcceptFriendRequest(): UseAcceptFriendRequestResult {
  const {currentUserId, isLocalDbEnabled} = useDb();
  const [loading, setLoading] = useState(false);
  const [acceptingFriendshipId, setAcceptingFriendshipId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const acceptFriendRequestMutation = useCallback(
    async (friendshipId: string): Promise<boolean> => {
      if (!currentUserId) {
        setError('You must be signed in to accept friend requests.');
        return false;
      }

      if (Platform.OS === 'web' || !isLocalDbEnabled) {
        setError('Local database is only available on native platforms.');
        return false;
      }

      setLoading(true);
      setAcceptingFriendshipId(friendshipId);
      setError(null);
      try {
        await acceptFriendRequest(currentUserId, friendshipId);
        await flushOutboundSync();
        return true;
      } catch (mutationError) {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : 'Unable to accept friend request.',
        );
        return false;
      } finally {
        setLoading(false);
        setAcceptingFriendshipId(null);
      }
    },
    [currentUserId, isLocalDbEnabled],
  );

  return {
    loading,
    acceptingFriendshipId,
    error,
    acceptFriendRequest: acceptFriendRequestMutation,
  };
}
