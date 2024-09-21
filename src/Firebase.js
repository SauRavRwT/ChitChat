import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjs_Gr6PX-LuHldy_hwrLqQSvE2JmJ0yI",
  authDomain: "contactform-6997f.firebaseapp.com",
  databaseURL: "https://contactform-6997f-default-rtdb.firebaseio.com",
  projectId: "contactform-6997f",
  storageBucket: "contactform-6997f.appspot.com",
  messagingSenderId: "167892845994",
  appId: "1:167892845994:web:2d27f6d5cf773bd32657d3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export const firestore = getFirestore(app);