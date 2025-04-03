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
    <div className="container-fluid vh-100 d-flex flex-column bg-light">
      <header className="row py-3 px-4 bg-white shadow-sm">
        <div className="col-6 col-md-8 d-flex align-items-center gap-4">
          <h3 className="fw-bold text-primary m-0">Chit Chat</h3>
          <div className="d-flex align-items-center">
            <div className="position-relative">
              <img
                src={`https://ui-avatars.com/api/?name=${userName}&background=random`}
                alt={userName}
                className="rounded-circle border border-2 border-primary"
                width="45"
                height="45"
                onClick={handleProfileClick}
                style={{ cursor: "pointer" }}
              />
              <span className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle"
                    style={{ width: "12px", height: "12px" }}></span>
            </div>
            <div className="ms-3">
              <h6 className="mb-0 fw-bold">{userName}</h6>
              <small className="text-muted">{selectedLanguage}</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 d-flex justify-content-end align-items-center">
          <button className="btn btn-outline-danger rounded-pill px-4" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-2"></i>Logout
          </button>
        </div>
      </header>

      <div className="row flex-grow-1">
        <div className="col-md-4 col-lg-3 p-0 border-end bg-white" style={{ height: "calc(100vh - 71px)" }}>
          <div className="p-3 border-bottom">
            <h5 className="fw-bold mb-0">Active Users</h5>
          </div>
          <div className="overflow-auto h-100 px-2">
            {users.map((user) => (
              <div
                key={user.email}
                className={`d-flex align-items-center p-2 mb-2 rounded-3 ${
                  selectedUser?.email === user.email ? 'bg-primary bg-opacity-10' : 'hover-bg-light'
                }`}
                onClick={() => selectUser(user)}
                style={{ cursor: "pointer" }}
              >
                <div className="position-relative">
                  <img
                    src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
                    alt={user.name}
                    className="rounded-circle"
                    width="50"
                    height="50"
                  />
                  <span className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle"
                        style={{ width: "12px", height: "12px" }}></span>
                </div>
                <div className="ms-3 flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center">
                    <strong className="text-dark">{user.name}</strong>
                    {unseenMessages[user.email] > 0 && (
                      <span className="badge rounded-pill bg-primary">
                        {unseenMessages[user.email]}
                      </span>
                    )}
                  </div>
                  <small className="text-muted">{user.email}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-md-8 col-lg-9 p-0 bg-white">
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
            <div className="d-flex flex-column justify-content-center align-items-center h-100 text-center p-4">
              <h1 className="display-4 fw-bold text-primary mb-4">Chit Chat</h1>
              <p className="text-muted w-75">
                Select a user from the list to start a real-time conversation. 
                Your messages are translated automatically based on your language preferences.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="position-fixed bottom-0 end-0 p-3 d-flex flex-row-reverse gap-2">
        {minimizedChats.map((chat) => (
          <div
            key={chat.email}
            className="bg-white shadow rounded-3 p-2 cursor-pointer d-flex align-items-center"
            onClick={() => selectUser(chat)}
            style={{ width: "200px" }}
          >
            <img
              src={`https://ui-avatars.com/api/?name=${chat.name}&background=random`}
              alt={chat.name}
              className="rounded-circle me-2"
              width="35"
              height="35"
            />
            <div className="flex-grow-1 text-truncate">
              <strong className="d-block text-truncate">{chat.name}</strong>
              <small className="text-muted text-truncate">{chat.email}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
