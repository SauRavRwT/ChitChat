import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../Firebase.js";
import { signOut } from "firebase/auth";
import { io } from "socket.io-client";
import PrivateSession from "./PrivateSession";
import UserProfile from "./UserProfile";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const socket = io(process.env.REACT_APP_BACKEND_URL);
const db = getFirestore();

function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(null);
  const [userName, setUserName] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(
    localStorage.getItem("selectedLanguage") || ""
  );
  const [unseenMessages, setUnseenMessages] = useState({});
  const [minimizedChats, setMinimizedChats] = useState([]);
  const [showUserProfile, setShowUserProfile] = useState(false);

  const connectUser = useCallback(async (name, email, language) => {
    try {
      const userRef = doc(db, "users", email.toLowerCase());
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, selectedLanguage: language }),
      });
      await updateDoc(userRef, { language });

      // Notify others about the language change
      socket.emit("language_updated", { email, language });
    } catch (error) {
      console.error("Error connecting user:", error);
    }
  }, []);

  const fetchUserData = useCallback(
    async (user) => {
      const userDocRef = doc(db, "users", user.email.toLowerCase());
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const language = userData.language || selectedLanguage;
        setUserName(userData.name || user.email.split("@")[0]);
        setSelectedLanguage(language);
        localStorage.setItem("selectedLanguage", language);
        await connectUser(
          userData.name || user.email.split("@")[0],
          user.email,
          language
        );
        socket.emit("join", { email: user.email });
      } else {
        console.log("No such user document!");
      }
    },
    [connectUser, selectedLanguage]
  );

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setEmail(user.email);
        await fetchUserData(user);
      } else {
        setEmail(null);
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate, fetchUserData]);

  useEffect(() => {
    if (!email) return;

    const userDocRef = doc(db, "users", email.toLowerCase());
    const unsubscribeLanguageListener = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const newLanguage = docSnap.data().language;
        if (newLanguage && newLanguage !== selectedLanguage) {
          setSelectedLanguage(newLanguage);
          localStorage.setItem("selectedLanguage", newLanguage);
        }
      }
    });

    return () => unsubscribeLanguageListener();
  }, [email, selectedLanguage]);

  useEffect(() => {
    const handleLanguageUpdate = ({ email: updatedEmail, language }) => {
      if (email === updatedEmail) {
        setSelectedLanguage(language);
        localStorage.setItem("selectedLanguage", language);
      }
    };

    const handleUpdateUsers = (updatedUsers) => setUsers(updatedUsers);

    socket.on("language_updated", handleLanguageUpdate);
    socket.on("update_users", handleUpdateUsers);

    return () => {
      socket.off("language_updated", handleLanguageUpdate);
      socket.off("update_users", handleUpdateUsers);
    };
  }, [email]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setUnseenMessages((prev) => ({ ...prev, [user.email]: 0 }));
    setMinimizedChats((prev) =>
      prev.filter((chat) => chat.email !== user.email)
    );
  };

  const handleNewMessage = (recipientEmail) => {
    if (recipientEmail !== selectedUser?.email) {
      setUnseenMessages((prev) => ({
        ...prev,
        [recipientEmail]: (prev[recipientEmail] || 0) + 1,
      }));
    }
  };

  const handleMinimize = () => {
    if (selectedUser) {
      setMinimizedChats((prev) => [...prev, selectedUser]);
      setSelectedUser(null);
    }
  };

  const handleProfileClick = () => setShowUserProfile(true);
  const closeUserProfile = () => setShowUserProfile(false);
  const handleLanguageUpdate = (newLanguage) =>
    setSelectedLanguage(newLanguage);

  return (
    <div className="container-fluid vh-100 d-flex flex-column">
      <header className="row p-3 bg-light">
        <div className="col-6 col-md-8 d-flex align-items-center">
          <h3 className="fw-bold me-3">RTTC</h3>
          <div className="d-flex align-items-center">
            <img
              src={`https://ui-avatars.com/api/?name=${userName}&background=random`}
              alt={userName}
              className="rounded-circle me-2"
              width="40"
              height="40"
              onClick={handleProfileClick}
              style={{ cursor: "pointer" }}
            />
            <h5 className="mb-0">Hello, {userName}</h5>
          </div>
        </div>
        <div className="col-4 col-md-2 text-end">
          <p>{selectedLanguage}</p>
        </div>
        <div className="col-2 col-md-2 text-end">
          <button className="btn btn-danger rounded-3" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="row flex-grow-1">
        <div className="col-md-4 col-lg-3 border-end overflow-auto">
          <h5 className="p-3 fw-bold">Active Users</h5>
          <ul className="list-group list-group-flush">
            {users.map((user) => (
              <li
                key={user.email}
                className={`list-group-item list-group-item-action rounded-3 ${
                  selectedUser?.email === user.email ? "active" : ""
                }`}
                onClick={() => selectUser(user)}
              >
                <div className="d-flex align-items-center">
                  <img
                    src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
                    alt={user.name}
                    className="rounded-circle me-2"
                    width="40"
                    height="40"
                  />
                  <div>
                    <strong>{user.name}</strong>
                    <br />
                    <small>{user.email}</small>
                  </div>
                  {unseenMessages[user.email] > 0 && (
                    <span className="badge bg-danger ms-2">
                      {unseenMessages[user.email]}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-md-8 col-lg-9 d-flex flex-column">
          {showUserProfile ? (
            <UserProfile
              email={email}
              onClose={closeUserProfile}
              onLanguageUpdate={handleLanguageUpdate}
              currentLanguage={selectedLanguage}
            />
          ) : selectedUser ? (
            <PrivateSession
              recipientEmail={selectedUser.email}
              currentUserEmail={email}
              onNewMessage={handleNewMessage}
              onMinimize={handleMinimize}
            />
          ) : (
            <div className="container d-flex flex-column justify-content-center align-items-center min-vh-100">
              <div className="row text-center">
                <h2 className="col-12 mb-3 display-1">RTTC</h2>
                <p className="col-12 text-muted">
                  Send and receive messages without keeping your phone online.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="position-fixed bottom-0 end-0 p-3 d-flex flex-row-reverse">
        {minimizedChats.map((chat) => (
          <div
            key={chat.email}
            className="bg-light border rounded-5 p-2 ms-2 cursor-pointer"
            onClick={() => selectUser(chat)}
            style={{ minWidth: "120px" }}
          >
            <img
              src={`https://ui-avatars.com/api/?name=${userName}&background=random`}
              alt={userName}
              className="rounded-circle me-2"
              width="40"
              height="40"
              onClick={handleProfileClick}
              style={{ cursor: "pointer" }}
            />
            <strong>{chat.name}</strong>
            {/* <small>{chat.email}</small> */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
