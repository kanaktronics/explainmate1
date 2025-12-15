'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

/**
 * Performs a setDoc operation and handles permission errors.
 */
export async function setDocument(docRef: DocumentReference, data: any, options: SetOptions) {
  try {
    await setDoc(docRef, data, options);
  } catch (error) {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write',
        requestResourceData: data,
      })
    );
    // Re-throw the error to be caught by the caller
    throw error;
  }
}


/**
 * Performs an addDoc operation and handles permission errors.
 */
export async function addDocument(colRef: CollectionReference, data: any) {
  try {
    return await addDoc(colRef, data);
  } catch (error) {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: data,
      })
    );
    throw error;
  }
}


/**
 * Performs an updateDoc operation and handles permission errors.
 */
export async function updateDocument(docRef: DocumentReference, data: any) {
  try {
    await updateDoc(docRef, data);
  } catch (error) {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: data,
      })
    );
    throw error;
  }
}


/**
 * Performs a deleteDoc operation and handles permission errors.
 */
export async function deleteDocument(docRef: DocumentReference) {
  try {
    await deleteDoc(docRef);
  } catch (error) {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      })
    );
    throw error;
  }
}
