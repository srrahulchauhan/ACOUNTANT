import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2CIHG3AV_myrlrSlHbgk-PawIQoZIM1s",
  authDomain: "accountm-43fae.firebaseapp.com",
  projectId: "accountm-43fae",
  storageBucket: "accountm-43fae.firebasestorage.app",
  messagingSenderId: "883992702415",
  appId: "1:883992702415:web:a3b403ea0f38b1d4d436ba",
  measurementId: "G-S0GHPW7EK8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { app, analytics, db, auth, googleProvider };
