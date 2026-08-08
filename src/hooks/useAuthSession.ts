import { useCallback, useEffect, useState } from 'react';
import {
  browserLocalPersistence,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User
} from 'firebase/auth';
import { firebaseAuth } from '../services/firebase';

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(firebaseAuth.currentUser);
  const [loading, setLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<unknown>(null);

  useEffect(
    () =>
      onAuthStateChanged(
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
      ),
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    await setPersistence(firebaseAuth, browserLocalPersistence);
    await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(firebaseAuth, email.trim());
  }, []);

  const signOut = useCallback(async () => {
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
