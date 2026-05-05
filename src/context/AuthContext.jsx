import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  signInWithPopup,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  sendEmailVerification,
  getRedirectResult
} from "firebase/auth";
import { auth, db, googleProvider } from "../firebase";
import { signInWithRedirect } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign Up
  const register = async (email, password, firstName, lastName, phone) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`
    });

    // Send email verification
    await sendEmailVerification(user);

    // Save additional user info to Firestore
    const userDoc = {
      uid: user.uid,
      firstName,
      lastName,
      email,
      phone,
      role: 'user', // Default role
      customCategories: [],
      customPaymentApps: [],
      appLogo: '',
      dismissedNotifications: [],
      lastAutoSave: null,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, "users", user.uid), userDoc);
    
    setUserData(userDoc);
    return user;
  };

  // Reset Password
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Update Password
  const updatePassword = (newPassword) => {
    return firebaseUpdatePassword(currentUser, newPassword);
  };

  // Update User Profile Data
  const updateUserData = async (data) => {
    if (!currentUser) return;

    // Update Firebase Auth Profile (Display Name / Photo)
    const profileUpdates = {};
    if (data.firstName || data.lastName) {
      profileUpdates.displayName = `${data.firstName || userData.firstName} ${data.lastName || userData.lastName}`.trim();
    }
    if (data.profilePic) {
      profileUpdates.photoURL = data.profilePic;
    }
    
    if (Object.keys(profileUpdates).length > 0) {
      await updateProfile(currentUser, profileUpdates);
    }

    // Update Firestore User Doc
    const docRef = doc(db, "users", currentUser.uid);
    await setDoc(docRef, { ...userData, ...data }, { merge: true });
    
    // Update local state
    setUserData(prev => ({ ...prev, ...data }));
  };

  // Google Login
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user exists in Firestore
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      let userDoc;
      if (!docSnap.exists()) {
        const names = user.displayName ? user.displayName.split(' ') : ['User'];
        userDoc = {
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
          role: 'user', // Default role
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, userDoc);
      } else {
        userDoc = docSnap.data();
        // Update profile pic if it changed on Google
        if (user.photoURL && userDoc.profilePic !== user.photoURL) {
          await setDoc(docRef, { profilePic: user.photoURL }, { merge: true });
          userDoc.profilePic = user.photoURL;
        }
      }
      
      setUserData(userDoc);
      return user;
    } catch (error) {
      console.error("Google Auth Error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error("Login cancelled. Please keep the popup open.");
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error("This domain is not authorized for Google Login. Please check Firebase console.");
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error("Google login is not enabled in Firebase. Please enable it in the console.");
      } else if (error.code === 'auth/popup-blocked') {
        // Fallback to redirect flow if popup is blocked
        try {
          await signInWithRedirect(auth, googleProvider);
          // After redirect, the auth state listener will handle user data
          return null;
        } catch (redirectError) {
          console.error("Redirect login failed:", redirectError);
          throw redirectError;
        }
      } else {
        throw error;
      }
    }
  };

  // Login
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Logout
  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    // Handle redirect result
    getRedirectResult(auth).then(async (result) => {
      if (result) {
        const user = result.user;
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
           const names = user.displayName ? user.displayName.split(' ') : ['User'];
           await setDoc(docRef, {
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
           });
        }
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch additional user data from Firestore
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
    // Shorthand helpers for custom settings
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
