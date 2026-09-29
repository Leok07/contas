import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { FirebaseConfig } from './types';

let memoryConfig: FirebaseConfig | null = null;

export function setMemoryFirebaseConfig(config: FirebaseConfig) {
  if (config.apiKey && config.projectId) {
    memoryConfig = config;
  }
}

export function getActiveFirebaseConfig(): FirebaseConfig | null {
  // 1. Configuração carregada dinamicamente via /api/config
  if (memoryConfig && memoryConfig.apiKey && memoryConfig.projectId) {
    return memoryConfig;
  }

  // 2. Variáveis de ambiente (Vercel ou .env.local)
  const envConfig: FirebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '',
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  return null;
}

export function isFirebaseConfigured(): boolean {
  return getActiveFirebaseConfig() !== null;
}

export function getFirebaseFirestore(): Firestore | null {
  const config = getActiveFirebaseConfig();
  if (!config) return null;

  try {
    let app: FirebaseApp;
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    return getFirestore(app);
  } catch (err) {
    console.error('Falha ao inicializar Firebase Firestore:', err);
    return null;
  }
}
