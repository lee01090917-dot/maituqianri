import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyA98bR7NEWv-k7SyPKvslU4PLMS46GnUc4",
  authDomain: "maituqianri.firebaseapp.com",
  projectId: "maituqianri",
  storageBucket: "maituqianri.firebasestorage.app",
  messagingSenderId: "145422135927",
  appId: "1:145422135927:web:8808d7b39fad99a5dccc72"
};

const app = initializeApp(firebaseConfig);

export { app };
