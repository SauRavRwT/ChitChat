import React, { useState, useEffect } from "react";
import { firestore, auth } from "../Firebase"; // Ensure correct Firebase import
import { doc, getDoc, setDoc } from "firebase/firestore";

const UserProfile = ({ onClose, email }) => {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [language, setLanguage] = useState(""); // Initialize with empty string
  const [voiceGender, setVoiceGender] = useState("Male");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); // Add error state

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (email) { // Ensure email is provided
          const docRef = doc(firestore, "users", email); // Use email as document ID
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Populate state with fetched data or fallback to defaults
            setName(data.name || "");
            setDob(data.dob || "");
            setContactNumber(data.contactNumber || "");
            setLanguage(data.language || "English"); // Default to fetched language
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
  }, [email]); // Fetch user details when email changes

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (email) { // Ensure email is provided
        const userRef = doc(firestore, "users", email); // Use email as document ID
        await setDoc(
          userRef,
          {
            name,
            dob,
            contactNumber,
            language,
            voiceGender,
            email, // Use the email passed as a prop
          },
          { merge: true } // Merge updates with existing data
        );
        console.log("User profile updated successfully!");
        onClose(); // Close the modal or sidebar after saving
      } else {
        setError("No email provided for updating!");
      }
    } catch (error) {
      setError("Error updating user profile: " + error.message); // Set error on update failure
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="modal-body p-5 pt-0">
      <button
        className="btn-close position-absolute top-0 end-0 m-3"
        onClick={onClose}
      ></button>
      {error && <div className="alert alert-danger">{error}</div>} {/* Display error if exists */}
      <form onSubmit={handleSubmit}>
        {/* Avatar Generation */}
        <div className="text-center mb-3">
          <img
            src={`https://ui-avatars.com/api/?name=${name}&background=random`}
            alt={name}
            className="rounded-circle me-2"
            width="150"
            height="150"
          />
        </div>

        <div className="form-floating mb-3">
          <input
            type="text"
            className="form-control rounded-3"
            id="floatingName"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <label htmlFor="floatingName">Full Name</label>
        </div>

        <div className="form-floating mb-3">
          <input
            type="date"
            className="form-control rounded-3"
            id="floatingDob"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
          />
          <label htmlFor="floatingDob">Date of Birth</label>
        </div>

        <div className="form-floating mb-3">
          <input
            type="tel"
            className="form-control rounded-3"
            id="floatingContact"
            placeholder="Contact Number"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            required
          />
          <label htmlFor="floatingContact">Contact Number</label>
        </div>

        <div className="form-floating mb-3">
          <select
            className="form-control rounded-3"
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
            {/* Add more languages as needed */}
          </select>
          <label htmlFor="floatingLanguage">Preferred Language</label>
        </div>

        {/* Voice Gender Section */}
        <div className="form-floating mb-3">
          <div className="form-control rounded-3 p-3" style={{ height: "60px" }}>
            <div className="d-flex justify-content-end">
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name="voiceGender"
                  id="maleVoice"
                  value="Male"
                  onChange={(e) => setVoiceGender(e.target.value)}
                  checked={voiceGender === "Male"}
                  required
                />
                <label className="form-check-label ms-2" htmlFor="maleVoice">
                  Male
                </label>
              </div>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name="voiceGender"
                  id="femaleVoice"
                  value="Female"
                  onChange={(e) => setVoiceGender(e.target.value)}
                  checked={voiceGender === "Female"}
                  required
                />
                <label className="form-check-label ms-2" htmlFor="femaleVoice">
                  Female
                </label>
              </div>
            </div>
          </div>
          <label className="pt-3">Voice Gender</label>
        </div>

        <div className="form-floating mb-3">
          <input
            type="email"
            className="form-control rounded-3"
            id="floatingInput"
            placeholder="name@example.com"
            value={email} // Email is passed as prop, no need to set it here
            required
            disabled // Disable email field for editing since it's from Firebase Auth
          />
          <label htmlFor="floatingInput">Email address</label>
        </div>

        <button type="submit" className="btn btn-primary w-100">
          Save
        </button>
      </form>
    </div>
  );
};

export default UserProfile;
