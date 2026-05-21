import {syncMutations, type SyncMutationType} from '../../entities';
import {getDatabase} from '../client';
import {createId, nowIso} from '../utils';

export async function enqueueSyncMutation(
  type: SyncMutationType,
  payload: Record<string, unknown>,
): Promise<string> {
  const db = getDatabase();
  const id = createId('sync');
  const createdAtIso = nowIso();

  await db.insert(syncMutations).values({
    id,
    type,
    payloadJson: JSON.stringify(payload),
    status: 'pending',
    createdAtIso,
    retryCount: 0,
  });

  return id;
}
