'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';


/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string) {
  return createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string) {
   return signInWithEmailAndPassword(authInstance, email, password);
}

/** Update user's password (non-blocking). */
export function initiatePasswordUpdate(authInstance: Auth, newPassword: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!authInstance.currentUser) {
        return reject(new Error("No user is currently signed in."));
    }
    updatePassword(authInstance.currentUser, newPassword)
        .then(() => resolve())
        .catch((error: FirebaseError) => reject(error));
  });
}
