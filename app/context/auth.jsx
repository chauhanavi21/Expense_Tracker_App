import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setIsLoaded(true);
    });
    return unsub;
  }, []);

  const value = useMemo(() => {
    const isSignedIn = Boolean(firebaseUser);

    const getToken = async () => {
      if (!auth.currentUser) return null;
      return auth.currentUser.getIdToken();
    };

    const signOut = async () => {
      await firebaseSignOut(auth);
    };

    const setDisplayName = async (displayName) => {
      if (!auth.currentUser) return;
      await updateProfile(auth.currentUser, { displayName });
    };

    // Clerk-like shim to minimize app changes
    const clerkLikeUser =
      firebaseUser
        ? {
            id: firebaseUser.uid,
            fullName: firebaseUser.displayName || null,
            firstName: firebaseUser.displayName?.split(" ")?.[0] || null,
            lastName: firebaseUser.displayName
              ? firebaseUser.displayName.split(" ").slice(1).join(" ") || null
              : null,
            primaryEmailAddress: firebaseUser.email
              ? { emailAddress: firebaseUser.email }
              : null,
            emailAddresses: firebaseUser.email ? [{ emailAddress: firebaseUser.email }] : [],
            createdAt: firebaseUser.metadata?.creationTime || null,
            update: async ({ firstName, lastName }) => {
              const name = [firstName, lastName].filter(Boolean).join(" ").trim();
              await setDisplayName(name);
            },
          }
        : null;

    return {
      firebaseUser,
      user: clerkLikeUser,
      isLoaded,
      isSignedIn,
      userId: firebaseUser?.uid || null,
      getToken,
      signOut,
      setDisplayName,
    };
  }, [firebaseUser, isLoaded]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return { isLoaded: ctx.isLoaded, isSignedIn: ctx.isSignedIn, userId: ctx.userId, getToken: ctx.getToken };
}

export function useUser() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useUser must be used inside AuthProvider");
  return { isLoaded: ctx.isLoaded, isSignedIn: ctx.isSignedIn, user: ctx.user };
}

export function useClerk() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useClerk must be used inside AuthProvider");
  return { signOut: ctx.signOut };
}

export function SignedIn({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  return isSignedIn ? children : null;
}

export function SignedOut({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  return !isSignedIn ? children : null;
}
