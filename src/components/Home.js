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

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // alert("User logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div>
      <header className="container p-4 d-flex flex-column flex-md-row justify-content-between align-items-center">
        <h3 className="fw-bold display-4 text-center text-md-start">
          React-Login
        </h3>
        <nav className="nav nav-masthead justify-content-center gap-2 mt-3 mt-md-0">
          <a
            className="nav-link fw-bold fs-6 active text-dark"
            aria-current="page"
            href="/#"
          >
            Home
          </a>
          <a className="nav-link fw-bold fs-6 text-dark" href="/#">
            Features
          </a>
          <a className="nav-link fw-bold fs-6 text-dark" href="/#">
            Contact
          </a>
        </nav>
      </header>

      <div className="container mt-5 p-4 d-flex flex-column flex-lg-row justify-content-center rounded-5 align-items-center text-center">
        <div className="col-12 col-lg-8 mb-4 mb-lg-0">
          <h1 className="fw-bold text-dark">
            Hello! <span id="userid">{email}</span>
          </h1>
          <button
            className="btn btn-lg btn-danger mt-3 rounded-4"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
        <div className="col-12 col-lg-4">
          <img
            className="rounded-circle img-fluid"
            src="https://avatars.githubusercontent.com/u/90666710?v=4"
            alt="User Avatar"
            style={{ maxWidth: "150px" }}
          />
        </div>
      </div>
    </div>
  );
}

export default Home;
