// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyA98bR7NEWv-k7SyPKvslU4PLMS46GnUc4",
  authDomain: "maituqianri.firebaseapp.com",
  projectId: "maituqianri",
  storageBucket: "maituqianri.firebasestorage.app",
  messagingSenderId: "145422135927",
  appId: "1:145422135927:web:8808d7b39fad99a5dccc72"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// Authentication
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export {
  auth,
  provider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
};
