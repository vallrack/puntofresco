'use client';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { initializeFirebase } from '@/firebase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads an image to Firebase Storage.
 * @param file The image file to upload.
 * @param path The path in storage to upload the file to (e.g., 'products/user123').
 * @returns The download URL of the uploaded image.
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  const { storage } = initializeFirebase();
  
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  // Generate a unique filename
  const fileExtension = file.name.split('.').pop();
  const uniqueFilename = `${uuidv4()}.${fileExtension}`;
  
  const storageRef = ref(storage, `${path}/${uniqueFilename}`);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image: ', error);
    throw new Error('Failed to upload image.');
  }
}
