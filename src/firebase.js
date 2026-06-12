import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 

const firebaseConfig = {
  apiKey: "AIzaSyDlVnUnEaV5wqN5n7WNqsWgJ7h_0QiK4vA",
  authDomain: "edith-ai-assistant-beab1.firebaseapp.com",
  projectId: "edith-ai-assistant-beab1",
  storageBucket: "edith-ai-assistant-beab1.firebasestorage.app",
  messagingSenderId: "55546915577",
  appId: "1:55546915577:web:edd30304268ab81b37d028",
  measurementId: "G-1F5MXNB4VR"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);