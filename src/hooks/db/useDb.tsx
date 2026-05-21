import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {Platform} from 'react-native';
import type {User} from 'firebase/auth';
import {isNativeDbSupported} from '../../db/client';
import {startDbSync, stopDbSync} from '../../db/sync/coordinator';

type DbContextValue = {
  currentUserId: string | null;
  ready: boolean;
  isLocalDbEnabled: boolean;
};

const DbContext = createContext<DbContextValue>({
  currentUserId: null,
  ready: Platform.OS === 'web',
  isLocalDbEnabled: false,
});

type DbProviderProps = {
  user: User | null;
  children: React.ReactNode;
};

export function DbProvider({user, children}: DbProviderProps) {
  const [ready, setReady] = useState(Platform.OS === 'web');
  const isLocalDbEnabled = isNativeDbSupported();

  useEffect(() => {
    if (!user || !isLocalDbEnabled) {
      setReady(true);
      return () => undefined;
    }

    let cancelled = false;
    setReady(false);

    startDbSync(user)
      .then(() => {
        if (!cancelled) {
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
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
    }),
    [user?.uid, ready, isLocalDbEnabled],
  );

  return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
}

export function useDb(): DbContextValue {
  return useContext(DbContext);
}
