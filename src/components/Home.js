import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../Firebase.js";
import { signOut } from "firebase/auth";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setEmail(user.email);
      } else {
        setEmail(null);
      }
    });

    // Cleanup subscription to avoid memory leaks
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("User logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  
  return (
    <div className="container mt-5 p-3 text-center">
      <h1 className="fw-bold p-3">Welcome to the Home Page</h1>
      <p className="fw-bold" id="userid">{email}</p>
      <button className="btn btn-danger mt-3" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default Home;
