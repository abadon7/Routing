import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/setup#config-object
const firebaseConfig = {
    apiKey: "AIzaSyCTMDX6HwL89UG2hfru7r0qy8a3de-T0Nk",
    authDomain: "routing-5a6c1.firebaseapp.com",
    projectId: "routing-5a6c1",
    storageBucket: "routing-5a6c1.firebasestorage.app",
    messagingSenderId: "120195114060",
    appId: "1:120195114060:web:f74be817d11836aaee00e9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
