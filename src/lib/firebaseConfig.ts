// Safe loader for Firebase config in Vite/React environment
// Uses import.meta.glob so builds on Vercel / GitHub do not crash if firebase-applet-config.json is missing or gitignored.

import appletConfig from '../../firebase-applet-config.json';

const configFiles = import.meta.glob([
  '/firebase-applet-config.json',
  '../../firebase-applet-config.json',
  '../firebase-applet-config.json'
], { eager: true });

let fileConfig: Record<string, any> = appletConfig || {};

for (const path in configFiles) {
  const mod = configFiles[path] as any;
  if (mod && (mod.default || mod.projectId || mod.apiKey)) {
    fileConfig = mod.default || mod;
    break;
  }
}

export const resolvedFirebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || fileConfig.apiKey || "",
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || fileConfig.authDomain || "",
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || fileConfig.projectId || "",
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || fileConfig.storageBucket || "",
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || fileConfig.messagingSenderId || "",
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || fileConfig.appId || "",
  firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_DATABASE_ID as string) || fileConfig.firestoreDatabaseId || "",
};

export default resolvedFirebaseConfig;
