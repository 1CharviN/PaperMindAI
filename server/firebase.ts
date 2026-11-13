import admin from "firebase-admin";
import { createPrivateKey } from "node:crypto";

// Initialize Firebase Admin SDK
// In production, use service account credentials
// For now, we'll use a simple in-memory approach
// Users should provide FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY

const initializeFirebase = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // For development: use a local emulator or in-memory fallback
  // In production: use proper credentials from environment variables
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY.trim();
    if (
      (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, "\n");

    try {
      createPrivateKey(privateKey);
    } catch (error) {
      throw new Error(
        "FIREBASE_PRIVATE_KEY is not a valid PEM private key. Copy the complete private_key value from your Firebase service-account JSON.",
        { cause: error },
      );
    }
    
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }

  // Development fallback - no Firebase connection
  // This allows the app to run without Firebase credentials during development
  console.warn("⚠️  Firebase credentials not found - using in-memory storage for development");
  return null;
};

const app = initializeFirebase();
export const db = app ? admin.firestore() : null;
export const auth = app ? admin.auth(app) : null;

// Collection names
export const COLLECTIONS = {
  DOCUMENTS: "documents",
  ANALYSES: "analyses",
};
