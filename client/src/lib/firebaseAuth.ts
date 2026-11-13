import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "./firebase";

const isConfigured = () => {
  return import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_API_KEY !== "demo-key";
};

export async function signUpWithEmail(email: string, password: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    if (!isConfigured()) {
      throw new Error("Firebase is not configured. Please add your Firebase credentials to .env.local");
    }
    throw error;
  }
}

export async function loginWithEmail(email: string, password: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    if (!isConfigured()) {
      throw new Error("Firebase is not configured. Please add your Firebase credentials to .env.local");
    }
    throw error;
  }
}

export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    if (!isConfigured()) {
      throw new Error("Firebase is not configured. Please add your Firebase credentials to .env.local");
    }
    throw error;
  }
}

export async function logout() {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error("Logout error:", error);
  }
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be signed in to access documents.");
  }
  return user.getIdToken();
}

export { auth };
export type { FirebaseUser };
