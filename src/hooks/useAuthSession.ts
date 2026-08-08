import { useCallback, useEffect, useState } from 'react';
import {
  browserLocalPersistence,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type Auth,
  type User
} from 'firebase/auth';
import { getFirebaseAuth } from '../services/firebase';

export function useAuthSession(enabled: boolean) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializationError, setInitializationError] = useState<unknown>(null);

  useEffect(() => {
    if (!enabled) {
      setUser(null);
      setLoading(false);
      setInitializationError(null);
      return;
    }
    setLoading(true);
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    const initializeSession = async () => {
      try {
        const firebaseAuth: Auth = getFirebaseAuth();
        await setPersistence(firebaseAuth, browserLocalPersistence);
        if (cancelled) {
          return;
        }
        unsubscribe = onAuthStateChanged(
          firebaseAuth,
          (nextUser) => {
            setUser(nextUser);
            setInitializationError(null);
            setLoading(false);
          },
          (error) => {
            setInitializationError(error);
            setLoading(false);
          }
        );
      } catch (error) {
        if (!cancelled) {
          setInitializationError(error);
          setLoading(false);
        }
      }
    };

    void initializeSession();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [enabled]);

  const signIn = useCallback(async (email: string, password: string) => {
    const firebaseAuth = getFirebaseAuth();
    await setPersistence(firebaseAuth, browserLocalPersistence);
    await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const firebaseAuth = getFirebaseAuth();
    await sendPasswordResetEmail(firebaseAuth, email.trim());
  }, []);

  const signOut = useCallback(async () => {
    const firebaseAuth = getFirebaseAuth();
    await firebaseSignOut(firebaseAuth);
  }, []);

  return {
    user,
    loading,
    initializationError,
    signIn,
    requestPasswordReset,
    signOut
  };
}
