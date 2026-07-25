
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCsvfi4OpyKiPiZtHu8Idj0K2nZMvhwf30",
  authDomain: "fitiq-43d7d.firebaseapp.com",
  projectId: "fitiq-43d7d",
  storageBucket: "fitiq-43d7d.firebasestorage.app",
  messagingSenderId: "762827425629",
  appId: "1:762827425629:web:0791af8de914997fac0ab4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);