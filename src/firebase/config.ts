import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const prodConfig = {
  apiKey: "AIzaSyDsQf3TG7UiGlmH7NP8GCncf-cwARKp3po",
  authDomain: "venmoter.firebaseapp.com",
  projectId: "venmoter",
  storageBucket: "venmoter.firebasestorage.app",
  messagingSenderId: "190689019316",
  appId: "1:190689019316:web:73917dd1e8d5915fbadee1",
  measurementId: "G-6DW3JR0CCP",
};

const devConfig = {
  apiKey: "AIzaSyCOovaGeUbgi4f0yZo83YupcYCirEs7JG8",
  authDomain: "venmoter-dev.firebaseapp.com",
  projectId: "venmoter-dev",
  storageBucket: "venmoter-dev.firebasestorage.app",
  messagingSenderId: "229518799884",
  appId: "1:229518799884:web:27b73fa185b6bb9096ea29",
};

const firebaseConfig = import.meta.env.MODE === "production" ? prodConfig : devConfig;

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);