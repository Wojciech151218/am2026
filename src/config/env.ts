type EnvKey =
  | 'FIREBASE_API_KEY'
  | 'FIREBASE_AUTH_DOMAIN'
  | 'FIREBASE_PROJECT_ID'
  | 'FIREBASE_STORAGE_BUCKET'
  | 'FIREBASE_MESSAGING_SENDER_ID'
  | 'FIREBASE_APP_ID'
  | 'GOOGLE_MAPS_API_KEY'
  | 'OPENWEATHER_API_KEY';

declare const process: {
  env: Record<string, string | undefined>;
};

const firebaseFromGoogleServices = {
  apiKey: 'AIzaSyCWEid1zzZG9lvEUnaUaefrRimJvP1Jcak',
  projectId: 'am2026-1d112',
  storageBucket: 'am2026-1d112.firebasestorage.app',
  messagingSenderId: '870429665473',
  appId: '1:870429665473:android:e96a51063b52c145290c40',
};

const rawEnv: Record<EnvKey, string> = {
  // Keep direct `process.env.KEY` access so Metro/Babel can inline `.env` values.
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ?? '',
  FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN ?? '',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? '',
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET ?? '',
  FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID ?? '',
  FIREBASE_APP_ID: process.env.FIREBASE_APP_ID ?? '',
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ?? '',
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY ?? '',
};

function readEnv(key: EnvKey): string {
  return rawEnv[key];
}

function readEnvOrFallback(key: EnvKey, fallback: string): string {
  const value = readEnv(key).trim();
  return value.length > 0 ? value : fallback;
}

export const env = {
  firebaseApiKey: readEnvOrFallback('FIREBASE_API_KEY', firebaseFromGoogleServices.apiKey),
  firebaseAuthDomain: readEnvOrFallback(
    'FIREBASE_AUTH_DOMAIN',
    `${firebaseFromGoogleServices.projectId}.firebaseapp.com`,
  ),
  firebaseProjectId: readEnvOrFallback('FIREBASE_PROJECT_ID', firebaseFromGoogleServices.projectId),
  firebaseStorageBucket: readEnvOrFallback(
    'FIREBASE_STORAGE_BUCKET',
    firebaseFromGoogleServices.storageBucket,
  ),
  firebaseMessagingSenderId: readEnvOrFallback(
    'FIREBASE_MESSAGING_SENDER_ID',
    firebaseFromGoogleServices.messagingSenderId,
  ),
  firebaseAppId: readEnvOrFallback('FIREBASE_APP_ID', firebaseFromGoogleServices.appId),
  googleMapsApiKey: readEnv('GOOGLE_MAPS_API_KEY'),
  openWeatherApiKey: readEnv('OPENWEATHER_API_KEY'),
};

export const hasFirebaseConfig = Boolean(
  env.firebaseApiKey &&
    env.firebaseAuthDomain &&
    env.firebaseProjectId &&
    env.firebaseStorageBucket &&
    env.firebaseMessagingSenderId &&
    env.firebaseAppId,
);
