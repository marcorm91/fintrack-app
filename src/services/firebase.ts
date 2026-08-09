import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// Firebase client configuration is public by design. Access to user data is
// enforced by Firebase Authentication and Firestore Security Rules. Environment
// values let forks point the cloud mode at their own Firebase project.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyDT629BjGt6y8JaErFt0EU6vA-UKXzB_h8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'fintrack-cloud-6ad3e.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'fintrack-cloud-6ad3e',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'fintrack-cloud-6ad3e.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '921544592783',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:921544592783:web:ee24403953943854808ffa'
};

let firebaseAuth: Auth | null = null;
let firebaseApp: FirebaseApp | null = null;

export function getFirebaseApp() {
  if (!firebaseApp) {
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return firebaseApp;
}

export function getFirebaseAuth() {
  if (!firebaseAuth) {
    firebaseAuth = getAuth(getFirebaseApp());
  }
  return firebaseAuth;
}
