import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../Firebase.js";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [language, setLanguage] = useState("English");
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [voiceGender, setVoiceGender] = useState("Male");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const db = getFirestore();
  const storage = getStorage();

  const handleImageUpload = async (file) => {
    if (!file) return;
    const storageRef = ref(storage, `profileImages/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  const handleSignUp = async (event) => {
    event.preventDefault();

    const birthDate = new Date(dob);
    const age = new Date().getFullYear() - birthDate.getFullYear();

    if (age < 15) {
      setError("Users must be at least 15 years old to sign up.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);

      const uid = email;

      // Handle profile image upload
      const profileImageUrl = profileImage
        ? await handleImageUpload(profileImage)
        : null;

      // Save user data with the image URL
      await setDoc(doc(db, "users", uid), {
        uid,
        name,
        dob,
        contactNumber,
        language,
        profileImage: profileImageUrl,
        voiceGender,
      });

      alert("User signed up successfully");
      navigate("/home");
    } catch (error) {
      setError(error.message);
    }
  };

  // Image preview function
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setProfileImage(file);

    // Show a preview of the image
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImageUrl(reader.result);
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="App d-flex justify-content-center align-items-center min-vh-100">
      <div
        className="modal modal-sheet position-static d-block p-4 py-md-5"
        role="dialog"
        id="modalSignin"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content rounded-4 shadow">
            <div className="modal-header p-5 pb-4 border-bottom-0">
              <h1 className="fw-bold mb-0 fs-2">Sign up for free</h1>
            </div>
            <div className="modal-body p-5 pt-0">
              <form onSubmit={handleSignUp}>
                {/* Circular Image Upload */}
                <div className="text-center mb-3">
                  <label htmlFor="imageUpload" className="position-relative">
                    <div
                      className="rounded-circle"
                      style={{
                        width: "150px",
                        height: "150px",
                        backgroundColor: "#f0f0f0",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        overflow: "hidden",
                        cursor: "pointer",
                      }}
                    >
                      {profileImageUrl ? (
                        <img
                          src={profileImageUrl}
                          alt="Profile"
                          className="rounded-circle"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span>Click to upload</span>
                      )}
                    </div>
                  </label>
                  <input
                    type="file"
                    id="imageUpload"
                    style={{ display: "none" }} // Hide the actual file input
                    onChange={handleImageChange}
                    accept="image/*"
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
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                  <label htmlFor="floatingLanguage">Preferred Language</label>
                </div>

                {/* Voice Gender Section */}
                <div className="form-floating mb-3">
                  <div
                    className="form-control rounded-3 p-3"
                    style={{ height: "60px" }}
                  >
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
                        <label
                          className="form-check-label ms-2"
                          htmlFor="maleVoice"
                        >
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
                        <label
                          className="form-check-label ms-2"
                          htmlFor="femaleVoice"
                        >
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <label htmlFor="floatingInput">Email address</label>
                </div>
                <div className="form-floating mb-3">
                  <input
                    type="password"
                    className="form-control rounded-3"
                    id="floatingPassword"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <label htmlFor="floatingPassword">Password</label>
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
                <button
                  className="w-30 mb-2 btn btn-lg btn-secondary rounded-3"
                  type="submit"
                >
                  Sign up
                </button>
                <p className="mb-0">
                  Already have an account? <a href="/login">Login</a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
