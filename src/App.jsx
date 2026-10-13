import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login.jsx";
import Home from "./components/Home.jsx";
import Signup from "./components/SignUp.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PrivateSession from "./components/PrivateSession";

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("chitchat-theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return savedTheme || (prefersDark ? "dark" : "light");
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("chitchat-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => current === "light" ? "dark" : "light");

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login theme={theme} onToggleTheme={toggleTheme} />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home theme={theme} onToggleTheme={toggleTheme} />
            </ProtectedRoute>
          }
        />
        <Route path="/signup" element={<Signup theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/" element={<Navigate to="/home" />} />
        <Route
          path="/private-session/:recipientEmail"
          element={<PrivateSession />}
        />
      </Routes>
    </Router>
  );
}

export default App;
