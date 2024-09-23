import React, { useState, useEffect } from "react";
import { firestore } from "../Firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const UserProfile = ({ onClose, email }) => {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [language, setLanguage] = useState("");
  const [voiceGender, setVoiceGender] = useState("Male");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (email) {
          const docRef = doc(firestore, "users", email);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setName(data.name || "");
            setDob(data.dob || "");
            setContactNumber(data.contactNumber || "");
            setLanguage(data.language || "English");
            setVoiceGender(data.voiceGender || "Male");
          } else {
            setError("No user profile found!");
          }
        } else {
          setError("No email provided!");
        }
      } catch (error) {
        setError("Error fetching user data: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (email) {
        const userRef = doc(firestore, "users", email);
        await setDoc(
          userRef,
          {
            name,
            dob,
            contactNumber,
            language,
            voiceGender,
            email,
          },
          { merge: true }
        );
        console.log("User profile updated successfully!");
        onClose();
      } else {
        setError("No email provided for updating!");
      }
    } catch (error) {
      setError("Error updating user profile: " + error.message);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100">
      <div
        className="card shadow-sm rounded-4 m-2 p-2"
        style={{ maxWidth: "700px", width: "100%" }}
      >
        <div className="card-body p-4">
          <button
            className="btn-close position-absolute top-0 end-0 m-3"
            onClick={onClose}
            aria-label="Close"
          ></button>
          <h2 className="card-title text-center mb-4">User Profile</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit} className="needs-validation" noValidate>
            <div className="text-center mb-4">
              <img
                src={`https://ui-avatars.com/api/?name=${name}&background=random&size=100`}
                alt={name || "User"}
                className="rounded-circle img-fluid"
                style={{ width: "100px", height: "100px" }}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="floatingName" className="form-label">
                Full Name
              </label>
              <input
                type="text"
                className="form-control"
                id="floatingName"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="floatingDob" className="form-label">
                Date of Birth
              </label>
              <input
                type="date"
                className="form-control"
                id="floatingDob"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="floatingContact" className="form-label">
                Contact Number
              </label>
              <input
                type="tel"
                className="form-control"
                id="floatingContact"
                placeholder="Contact Number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="floatingLanguage" className="form-label">
                Preferred Language
              </label>
              <select
                className="form-select"
                id="floatingLanguage"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                required
              >
                <option value="Hindi">Hindi</option>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Chinese">Chinese</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label d-block">Voice Gender</label>
              <div
                className="btn-group w-100"
                role="group"
                aria-label="Voice Gender"
              >
                <input
                  type="radio"
                  className="btn-check"
                  name="voiceGender"
                  id="maleVoice"
                  value="Male"
                  onChange={(e) => setVoiceGender(e.target.value)}
                  checked={voiceGender === "Male"}
                  required
                />
                <label className="btn btn-outline-primary" htmlFor="maleVoice">
                  Male
                </label>

                <input
                  type="radio"
                  className="btn-check"
                  name="voiceGender"
                  id="femaleVoice"
                  value="Female"
                  onChange={(e) => setVoiceGender(e.target.value)}
                  checked={voiceGender === "Female"}
                  required
                />
                <label
                  className="btn btn-outline-primary"
                  htmlFor="femaleVoice"
                >
                  Female
                </label>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="floatingInput" className="form-label">
                Email address
              </label>
              <input
                type="email"
                className="form-control"
                id="floatingInput"
                placeholder="name@example.com"
                value={email}
                required
                disabled
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 mt-3">
              Save
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
