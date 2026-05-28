import type {User} from 'firebase/auth';
import {isNativeDbSupported} from '../client';
import {runMigrations} from '../migrate';
import {clearFriendProfileListeners, startInboundSync, stopInboundSync} from './inboundWorker';
import {processOutboundSyncQueue} from './outboundWorker';

let syncInterval: ReturnType<typeof setInterval> | null = null;
let activeUserId: string | null = null;

export async function startDbSync(user: User): Promise<void> {
  if (!isNativeDbSupported()) {
    return;
  }

  activeUserId = user.uid;
  await runMigrations();
  await startInboundSync(user.uid);
  await processOutboundSyncQueue();

  if (syncInterval) {
    clearInterval(syncInterval);
  }

  syncInterval = setInterval(() => {
    processOutboundSyncQueue().catch(() => null);
  }, 4000);
}

export async function stopDbSync(): Promise<void> {
  activeUserId = null;
  stopInboundSync();
  clearFriendProfileListeners();

  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export function getActiveDbUserId(): string | null {
  return activeUserId;
}

export async function flushOutboundSync(): Promise<void> {
  await processOutboundSyncQueue();
}
