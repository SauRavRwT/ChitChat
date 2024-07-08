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
    const unsubscribe = auth.onAuthStateChanged((user) => {
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
    <div className="container mt-5 p-3 d-flex justify-content-center bg-dark rounded-5">
      <div className="row w-100 align-items-center text-center">
        <div className="col-12 col-md-8">
          <h1 className="fw-bold text-light">
            Hello! <span id="userid">{email}</span>
          </h1>
          <button className="btn btn-danger mt-3 rounded-4" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <div className="col-12 col-md-4 mt-3 mt-md-0">
          <img
            className="rounded-circle img-fluid"
            src="https://avatars.githubusercontent.com/u/90666710?v=4"
            alt="User Avatar"
          />
        </div>
      </div>
    </div>
  );
}

export default Home;
