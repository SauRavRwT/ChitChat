import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../Firebase.js";
import ThemeToggle from "./ThemeToggle";

const languages = ["English", "Hindi", "Spanish", "French", "German", "Chinese"];

function SignUp({ theme, onToggleTheme }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [language, setLanguage] = useState("English");
  const [voiceGender, setVoiceGender] = useState("Male");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) navigate("/home");
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSignUp = async (event) => {
    event.preventDefault();
    setError("");
    const birthDate = new Date(`${dob}T00:00:00`);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const birthdayHasPassed =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
    if (!birthdayHasPassed) age -= 1;

    if (age < 15) {
      setError("Users must be at least 15 years old to sign up.");
      return;
    }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", email), {
        email,
        name,
        dob,
        contactNumber,
        language,
        profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        voiceGender,
      });
      navigate("/home");
      return credential;
    } catch (signupError) {
      setError(signupError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page signup-page">
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      <section className="auth-card signup-card glass-panel">
        <Link className="brand-lockup" to="/" aria-label="ChitChat home">
          <span className="brand-mark">C</span>
          <span>chitchat</span>
        </Link>
        <div className="auth-heading">
          <span className="eyebrow">Your next conversation starts here</span>
          <h1>Join the conversation.</h1>
          <p>Create your account and say hello to the world.</p>
        </div>
        <form onSubmit={handleSignUp} className="auth-form signup-form">
          <div className="form-grid">
            <div className="field-group">
              <label className="field-label" htmlFor="signup-name">Full name</label>
              <input className="text-field" id="signup-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" autoComplete="name" required />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="signup-dob">Date of birth</label>
              <input className="text-field" id="signup-dob" type="date" value={dob} onChange={(event) => setDob(event.target.value)} required />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="signup-contact">Contact number</label>
              <input className="text-field" id="signup-contact" type="tel" value={contactNumber} onChange={(event) => setContactNumber(event.target.value)} placeholder="Your phone number" autoComplete="tel" required />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="signup-language">Preferred language</label>
              <select className="text-field" id="signup-language" value={language} onChange={(event) => setLanguage(event.target.value)}>
                {languages.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="field-group field-span">
              <span className="field-label">Voice preference</span>
              <div className="choice-row">
                {["Male", "Female"].map((voice) => (
                  <label className={`choice-card ${voiceGender === voice ? "choice-selected" : ""}`} key={voice}>
                    <input type="radio" name="voiceGender" value={voice} checked={voiceGender === voice} onChange={(event) => setVoiceGender(event.target.value)} />
                    <span>{voice}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="field-group field-span">
              <label className="field-label" htmlFor="signup-email">Email address</label>
              <input className="text-field" id="signup-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
            </div>
            <div className="field-group field-span">
              <label className="field-label" htmlFor="signup-password">Password</label>
              <input className="text-field" id="signup-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a password" autoComplete="new-password" minLength="6" required />
            </div>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button auth-submit" type="submit" disabled={loading}>
            {loading ? "Creating your account…" : "Create account"}
            <span aria-hidden="true">→</span>
          </button>
        </form>
        <p className="auth-footnote">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
      <p className="auth-caption">Conversations without borders.</p>
    </main>
  );
}

export default SignUp;
