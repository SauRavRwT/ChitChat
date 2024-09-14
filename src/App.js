import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login.js";
import Home from "./components/Home.js";
import Signup from "./components/SignUp.js";
import ProtectedRoute from "./components/ProtectedRoute.js";
import PrivateSession from "./components/PrivateSession";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/private-session/:recipientEmail" element={<PrivateSession />} />
      </Routes>
    </Router>
  );
}

export default App;
