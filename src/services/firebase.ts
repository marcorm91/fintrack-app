import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase client configuration is public by design. Access to user data is
// enforced by Firebase Authentication and Firestore Security Rules.
const firebaseConfig = {
  apiKey: 'AIzaSyDT629BjGt6y8JaErFt0EU6vA-UKXzB_h8',
  authDomain: 'fintrack-cloud-6ad3e.firebaseapp.com',
  projectId: 'fintrack-cloud-6ad3e',
  storageBucket: 'fintrack-cloud-6ad3e.firebasestorage.app',
  messagingSenderId: '921544592783',
  appId: '1:921544592783:web:ee24403953943854808ffa'
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
