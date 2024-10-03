// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyANAJKOdtaTybWN3sTYPEGtygCEJfnwv2I",
    authDomain: "bania-d28d9.firebaseapp.com",
    projectId: "bania-d28d9",
    storageBucket: "bania-d28d9.appspot.com",
    messagingSenderId: "302326775864",
    appId: "1:302326775864:web:f2fae98db5b5fcd39166cd",
    measurementId: "G-ZDL761YWJ0"
  };

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export const uploadImage = async (file) => {
  const storageRef = ref(storage, `images/${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
