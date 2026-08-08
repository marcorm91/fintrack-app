import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFirebaseApp } from './firebase';

let firebaseFirestore: Firestore | null = null;

export function getFirebaseFirestore() {
  if (!firebaseFirestore) {
    firebaseFirestore = getFirestore(getFirebaseApp());
  }
  return firebaseFirestore;
}
