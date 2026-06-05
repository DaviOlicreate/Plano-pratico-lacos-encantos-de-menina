import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCjlfRUWzyieDpVgwHFJ1QS9jlX97f85_Q",
  authDomain: "lacos-encantos-de-menina.firebaseapp.com",
  projectId: "lacos-encantos-de-menina",
  storageBucket: "lacos-encantos-de-menina.firebasestorage.app",
  messagingSenderId: "347197627007",
  appId: "1:347197627007:web:99a41456bb88c5abc6bd4a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
