import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { resolvedFirebaseConfig } from './firebaseConfig';

const app = getApps().length > 0 ? getApp() : initializeApp(resolvedFirebaseConfig);

export const auth = getAuth(app);
export const db = resolvedFirebaseConfig.firestoreDatabaseId
  ? getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

