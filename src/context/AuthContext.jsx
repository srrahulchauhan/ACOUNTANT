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
import { ref, get, set, update, child } from "firebase/database";
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
        // Fetch additional user data from Realtime Database
        try {
          const dbRef = ref(db);
          const snapshot = await get(child(dbRef, `users/${user.uid}`));
          if (snapshot.exists()) {
            setUserData(snapshot.val());
          } else {
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

    await set(ref(db, 'users/' + user.uid), data);
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
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `users/${user.uid}`));
    
    if (!snapshot.exists()) {
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
      await set(ref(db, 'users/' + user.uid), data);
      setUserData(data);
    } else {
      setUserData(snapshot.val());
    }
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
    if (!currentUser) return;
    const userRef = ref(db, 'users/' + currentUser.uid);
    await update(userRef, data);
    setUserData(prev => ({ ...prev, ...data }));
  };

  const value = {
    currentUser,
    userData,
    register,
    login,
    loginWithGoogle,
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
