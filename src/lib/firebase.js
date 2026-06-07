import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyD-cN90O8lWc4LPHgwOpoCHR1gARYc6qvI',
  authDomain: 'qrdocs-d21d5.firebaseapp.com',
  projectId: 'qrdocs-d21d5',
  storageBucket: 'qrdocs-d21d5.firebasestorage.app',
  messagingSenderId: '804349664343',
  appId: '1:804349664343:web:63964cba0ffcb3807e5712',
  measurementId: 'G-7NPXMREFT2',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');