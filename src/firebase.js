import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDs2MZOnl15k8C9iPoDkaD3u6hh4TN--oY",
  authDomain: "finanzas-corp-2026-v1.firebaseapp.com",
  projectId: "finanzas-corp-2026-v1",
  storageBucket: "finanzas-corp-2026-v1.firebasestorage.app",
  messagingSenderId: "120389242531",
  appId: "1:120389242531:web:196f9ce6283cf4d9bb3916"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
