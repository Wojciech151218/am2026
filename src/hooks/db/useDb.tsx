import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {Platform} from 'react-native';
import type {User} from 'firebase/auth';
import {isNativeDbSupported} from '../../db/client';
import {startDbSync, stopDbSync} from '../../db/sync/coordinator';

type DbContextValue = {
  currentUserId: string | null;
  ready: boolean;
  isLocalDbEnabled: boolean;
  syncError: string | null;
};

const DbContext = createContext<DbContextValue>({
  currentUserId: null,
  ready: Platform.OS === 'web',
  isLocalDbEnabled: false,
  syncError: null,
});

type DbProviderProps = {
  user: User | null;
  children: React.ReactNode;
};

export function DbProvider({user, children}: DbProviderProps) {
  const [ready, setReady] = useState(Platform.OS === 'web');
  const [syncError, setSyncError] = useState<string | null>(null);
  const isLocalDbEnabled = isNativeDbSupported();

  useEffect(() => {
    if (!user || !isLocalDbEnabled) {
      setSyncError(null);
      setReady(true);
      return () => undefined;
    }

    let cancelled = false;
    setReady(false);
    setSyncError(null);

    startDbSync(user)
      .then(() => {
        if (!cancelled) {
          setSyncError(null);
          setReady(true);
        }
      })
      .catch(error => {
        if (!cancelled) {
          setSyncError(
            error instanceof Error ? error.message : 'Unable to start cloud sync.',
          );
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
      stopDbSync().catch(() => null);
    };
  }, [user?.uid, isLocalDbEnabled]);

  const value = useMemo(
    () => ({
      currentUserId: user?.uid ?? null,
      ready,
      isLocalDbEnabled,
      syncError,
    }),
    [user?.uid, ready, isLocalDbEnabled, syncError],
  );

  return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
}

export function useDb(): DbContextValue {
  return useContext(DbContext);
}
