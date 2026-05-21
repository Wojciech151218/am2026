import {useCallback, useEffect, useState} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import {getFirebaseAuth} from '../firebase/auth';

type AuthAction = 'signIn' | 'signUp' | 'guest' | 'signOut';

export type UseFirebaseAuthResult = {
  user: User | null;
  loading: boolean;
  actionLoading: AuthAction | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInGuest: () => Promise<void>;
  signOutCurrentUser: () => Promise<void>;
};

function toMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useFirebaseAuth(): UseFirebaseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<AuthAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setError('Firebase is not configured. Add values in your .env file.');
      setLoading(false);
      return () => undefined;
    }
    const unsubscribe = onAuthStateChanged(
      auth,
      nextUser => {
        setUser(nextUser);
        setLoading(false);
      },
      authError => {
        setError(toMessage(authError, 'Unable to check auth status.'));
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setError('Firebase is not configured. Add values in your .env file.');
      return;
    }
    setError(null);
    setActionLoading('signIn');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (authError) {
      setError(toMessage(authError, 'Unable to sign in.'));
    } finally {
      setActionLoading(null);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setError('Firebase is not configured. Add values in your .env file.');
      return;
    }
    setError(null);
    setActionLoading('signUp');
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (authError) {
      setError(toMessage(authError, 'Unable to create account.'));
    } finally {
      setActionLoading(null);
    }
  }, []);

  const signInGuest = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setError('Firebase is not configured. Add values in your .env file.');
      return;
    }
    setError(null);
    setActionLoading('guest');
    try {
      await signInAnonymously(auth);
    } catch (authError) {
      setError(toMessage(authError, 'Unable to sign in as guest.'));
    } finally {
      setActionLoading(null);
    }
  }, []);

  const signOutCurrentUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setError('Firebase is not configured. Add values in your .env file.');
      return;
    }
    setError(null);
    setActionLoading('signOut');
    try {
      await signOut(auth);
    } catch (authError) {
      setError(toMessage(authError, 'Unable to sign out.'));
    } finally {
      setActionLoading(null);
    }
  }, []);

  return {
    user,
    loading,
    actionLoading,
    error,
    signIn,
    signUp,
    signInGuest,
    signOutCurrentUser,
  };
}
