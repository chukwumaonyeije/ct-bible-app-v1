// src/app/firebase.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

type Env = {
  VITE_FB_API_KEY?: string;
  VITE_FB_AUTH_DOMAIN?: string;
  VITE_FB_PROJECT_ID?: string;
  VITE_FB_STORAGE_BUCKET?: string;
  VITE_FB_SENDER_ID?: string;
  VITE_FB_APP_ID?: string;
  VITE_FB_MEASUREMENT_ID?: string; // optional
};
const E = import.meta.env as unknown as Env;

function v(name: keyof Env) {
  const val = E[name];
  if (!val) console.warn(`[Firebase] Missing env ${name}`);
  return val ?? "";
}

const config = {
  apiKey: v("VITE_FB_API_KEY"),
  authDomain: v("VITE_FB_AUTH_DOMAIN"),
  projectId: v("VITE_FB_PROJECT_ID"),
  storageBucket: v("VITE_FB_STORAGE_BUCKET"),
  messagingSenderId: v("VITE_FB_SENDER_ID"),
  appId: v("VITE_FB_APP_ID"),
  ...(E.VITE_FB_MEASUREMENT_ID ? { measurementId: E.VITE_FB_MEASUREMENT_ID } : {}),
};

function hasMinimum(c: typeof config) {
  return !!(c.apiKey && c.authDomain && c.projectId && c.appId);
}

let app: FirebaseApp | null = null;
try {
  if (hasMinimum(config)) {
    app = initializeApp(config);
    console.log("[Firebase] Initialized for project:", config.projectId);
  } else {
    console.warn("[Firebase] Skipping initializeApp: incomplete config. UI will still render.");
  }
} catch (e) {
  console.warn("[Firebase] initializeApp failed. UI will still render.", e);
  app = null;
}

export const firebaseApp = app;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();

// Optional Analytics (lazy)
export async function initAnalytics() {
  if (!app) return null;
  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    if (await isSupported()) return getAnalytics(app);
  } catch (e) {
    console.warn("[Firebase] Analytics not initialized:", e);
  }
  return null;
}

