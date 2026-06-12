// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, FacebookAuthProvider, browserLocalPersistence } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDtAh4kgX22ShZNv5wxcwprOW5Hz886TqU",
  authDomain: "lampu-5a178.firebaseapp.com",
  projectId: "lampu-5a178",
  storageBucket: "lampu-5a178.firebasestorage.app",
  messagingSenderId: "879165280409",
  appId: "1:879165280409:web:19ad46e56f9d04b6f96808",
  measurementId: "G-871R7MYFVB",
  databaseURL: "https://lampu-5a178-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app); 
export const auth = getAuth(app);

export const db = getDatabase(app);

auth.setPersistence(browserLocalPersistence); 
export const facebookProvider = new FacebookAuthProvider();