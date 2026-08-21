import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDsQf3TG7UiGlmH7NP8GCncf-cwARKp3po",
  authDomain: "venmoter.firebaseapp.com",
  projectId: "venmoter",
  storageBucket: "venmoter.firebasestorage.app",
  messagingSenderId: "190689019316",
  appId: "1:190689019316:web:73917dd1e8d5915fbadee1",
  measurementId: "G-6DW3JR0CCP",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);