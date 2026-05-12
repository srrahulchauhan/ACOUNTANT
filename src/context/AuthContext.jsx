import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch additional user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            // If user exists in Auth but not in Firestore (e.g. first Google login)
            // This case is handled in loginWithGoogle, but good to have a fallback
            setUserData(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email, password, firstName, lastName, phone) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const data = {
      uid: user.uid,
      firstName,
      lastName,
      email,
      phone,
      role: 'user',
      customCategories: [],
      customPaymentApps: [],
      appLogo: '',
      dismissedNotifications: [],
      lastAutoSave: null,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "users", user.uid), data);
    setUserData(data);
    return userCredential;
  };

  const login = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user data exists, if not create it
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      const names = user.displayName ? user.displayName.split(' ') : ['Google', 'User'];
      const data = {
        uid: user.uid,
        firstName: names[0],
        lastName: names.slice(1).join(' ') || '',
        email: user.email,
        phone: user.phoneNumber || '',
        profilePic: user.photoURL || '',
        customCategories: [],
        customPaymentApps: [],
        appLogo: '',
        dismissedNotifications: [],
        lastAutoSave: null,
        role: 'user',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "users", user.uid), data);
      setUserData(data);
    } else {
      setUserData(userDoc.data());
    }
  };

  const loginAsGuest = async () => {
    // Note: Firebase has an Anonymous Auth feature, but for simplicity 
    // we can keep a local mock or use signInAnonymously if configured.
    // Given the user asked for DB, we'll just mock it or skip if not essential.
    // For now, keeping it as is but it won't be "real" firebase unless using signInAnonymously.
    const guestUid = "guest_" + Date.now().toString();
    const user = { uid: guestUid, isGuest: true };
    setCurrentUser(user);
    setUserData({
      uid: guestUid,
      firstName: "Free",
      lastName: "User",
      email: "freeuse@account.com",
      role: 'user',
      isGuest: true
    });
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email) => {
    return await sendPasswordResetEmail(auth, email);
  };

  const updatePassword = async (newPassword) => {
    if (currentUser) {
      return await firebaseUpdatePassword(currentUser, newPassword);
    }
  };

  const updateUserData = async (data) => {
    if (!currentUser || currentUser.isGuest) return;
    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, data);
    setUserData(prev => ({ ...prev, ...data }));
  };

  const value = {
    currentUser,
    userData,
    register,
    login,
    loginWithGoogle,
    loginAsGuest,
    logout,
    resetPassword,
    updatePassword,
    updateUserData,
    customCategories: userData?.customCategories || [],
    customPaymentApps: userData?.customPaymentApps || [],
    appLogo: userData?.appLogo || '',
    dismissedNotifications: userData?.dismissedNotifications || [],
    lastAutoSave: userData?.lastAutoSave || null
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
