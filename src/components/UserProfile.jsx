import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "../Firebase";

const languages = ["English", "Hindi", "Spanish", "French", "German", "Chinese"];

const UserProfile = ({ onClose, email, onLanguageUpdate, currentLanguage }) => {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [language, setLanguage] = useState(currentLanguage || "English");
  const [voiceGender, setVoiceGender] = useState("Male");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (!email) throw new Error("No email provided.");
        const snapshot = await getDoc(doc(firestore, "users", email));
        if (snapshot.exists()) {
          const data = snapshot.data();
          setName(data.name || "");
          setDob(data.dob || "");
          setContactNumber(data.contactNumber || "");
          setLanguage(data.language || currentLanguage || "English");
          setVoiceGender(data.voiceGender || "Male");
        }
      } catch (fetchError) {
        setError(`Could not load your profile: ${fetchError.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, [email, currentLanguage]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) {
      setError("No email provided for updating your profile.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await setDoc(
        doc(firestore, "users", email),
        { name, dob, contactNumber, language, voiceGender, email },
        { merge: true }
      );
      onLanguageUpdate(language);
      onClose();
    } catch (saveError) {
      setError(`Could not save your profile: ${saveError.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="profile-card glass-panel profile-loading">Loading your profile…</div>;

  return (
    <section className="profile-card glass-panel" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <button className="icon-button profile-close" type="button" onClick={onClose} aria-label="Close profile">×</button>
      <div className="profile-heading">
        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name || "You")}&background=7778ed&color=fff&size=128`} alt="" />
        <span className="eyebrow">YOUR ACCOUNT</span>
        <h2 id="profile-title">A little about you</h2>
        <p>Make this space feel more like yours.</p>
      </div>
      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field-group">
            <label className="field-label" htmlFor="profile-name">Full name</label>
            <input className="text-field" id="profile-name" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="profile-dob">Date of birth</label>
            <input className="text-field" id="profile-dob" type="date" value={dob} onChange={(event) => setDob(event.target.value)} required />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="profile-contact">Contact number</label>
            <input className="text-field" id="profile-contact" type="tel" value={contactNumber} onChange={(event) => setContactNumber(event.target.value)} required />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="profile-language">Preferred language</label>
            <select className="text-field" id="profile-language" value={language} onChange={(event) => setLanguage(event.target.value)}>
              {languages.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="field-group field-span">
            <span className="field-label">Voice preference</span>
            <div className="choice-row">
              {["Male", "Female"].map((voice) => (
                <label className={`choice-card ${voiceGender === voice ? "choice-selected" : ""}`} key={voice}>
                  <input type="radio" name="profileVoiceGender" value={voice} checked={voiceGender === voice} onChange={(event) => setVoiceGender(event.target.value)} />
                  <span>{voice}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="field-group field-span">
            <label className="field-label" htmlFor="profile-email">Email address</label>
            <input className="text-field" id="profile-email" type="email" value={email || ""} disabled />
          </div>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button auth-submit" type="submit" disabled={saving}>
          {saving ? "Saving changes…" : "Save changes"}
          <span aria-hidden="true">→</span>
        </button>
      </form>
    </section>
  );
};

export default UserProfile;
