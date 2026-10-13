import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../Firebase.js";
import ThemeToggle from "./ThemeToggle";

function Login({ theme, onToggleTheme }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      <section className="auth-card glass-panel">
        <Link className="brand-lockup" to="/" aria-label="ChitChat home">
          <span className="brand-mark">C</span>
          <span>chitchat</span>
        </Link>
        <div className="auth-heading">
          <span className="eyebrow">A little closer, wherever you are</span>
          <h1>Welcome back.</h1>
          <p>Pick up right where your conversations left off.</p>
        </div>
        <form onSubmit={handleLogin} className="auth-form" aria-live="polite">
          <label className="field-label" htmlFor="login-email">Email address</label>
          <input
            className="text-field"
            id="login-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label className="field-label" htmlFor="login-password">Password</label>
          <input
            className="text-field"
            id="login-password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button auth-submit" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
            <span aria-hidden="true">→</span>
          </button>
        </form>
        <p className="auth-footnote">
          New to ChitChat? <Link to="/signup">Create an account</Link>
        </p>
        <div className="auth-decoration decoration-one" aria-hidden="true" />
        <div className="auth-decoration decoration-two" aria-hidden="true" />
      </section>
      <p className="auth-caption">Conversations without borders.</p>
    </main>
  );
}

export default Login;
