// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import 'dotenv/config';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

console.log('Initializing Firebase App with config:', firebaseConfig);
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export const uploadImage = async (image) => {
  try {
    console.log('uploadImage initiated with image:', image.name);
    const imageRef = ref(storage, `images/${Date.now()}_${image.name}`);
    const snapshot = await uploadBytes(imageRef, image);
    console.log('Image uploaded successfully:', snapshot.metadata.fullPath);
    return snapshot.metadata.fullPath;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
