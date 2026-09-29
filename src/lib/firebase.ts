import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStoredFirebaseConfig } from './storageService';
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

  // 2. Tenta carregar das variáveis de ambiente com NEXT_PUBLIC_
  const envConfig: FirebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  // 3. Se não estiver em env, verifica se o usuário configurou via modal no app
  const storedConfig = getStoredFirebaseConfig();
  if (storedConfig && storedConfig.apiKey && storedConfig.projectId) {
    return storedConfig;
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
