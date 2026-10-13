import React, { useEffect, useState } from 'react';
import { Navigate } from "react-router-dom";
import { auth } from "../Firebase.js";
import { onAuthStateChanged } from "firebase/auth";

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <>
        <style>{`
          @keyframes chat-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>

        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: 'linear-gradient(135deg, #0f172a 0%, #111827 100%)',
            color: '#c4b5fd',
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '1rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}
        >
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: '2px solid rgba(196, 181, 253, 0.35)',
              borderTop: '2px solid #a78bfa',
              animation: 'chat-spin 0.9s linear infinite'
            }}
          />
          <span>Loading...</span>
        </div>
      </>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
