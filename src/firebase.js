import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDp3KyCDqcGQ_nyNfZSF1gS00TuUFFdBrg",
  authDomain: "racount-c81b9.firebaseapp.com",
  projectId: "racount-c81b9",
  storageBucket: "racount-c81b9.firebasestorage.app",
  messagingSenderId: "499597650093",
  appId: "1:499597650093:web:5e7f152fb344be7a897e24",
  measurementId: "G-45CS2GRFMS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const analytics = getAnalytics(app);

const googleProvider = new GoogleAuthProvider();

export { auth, db, analytics, googleProvider };
export default app;
