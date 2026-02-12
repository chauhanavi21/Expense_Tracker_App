import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBvzZ3rCSnW7kWCRS7XXAz2QsHxsvAzzmc",
  authDomain: "etapp-607b7.firebaseapp.com",
  projectId: "etapp-607b7",
  storageBucket: "etapp-607b7.firebasestorage.app",
  messagingSenderId: "563758913751",
  appId: "1:563758913751:web:ea3df3d4b2f61f5be6f892",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (err) {
  // If already initialized (e.g., Fast Refresh), use existing instance
  if (err.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    throw err;
  }
}

const db = getFirestore(app);

export { app, auth, db };
