import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

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

export { auth };
