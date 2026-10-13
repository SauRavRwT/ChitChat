import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../Firebase.js";
import { signOut } from "firebase/auth";
import { io } from "socket.io-client";
import PrivateSession from "./PrivateSession";
import UserProfile from "./UserProfile";
import ThemeToggle from "./ThemeToggle";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

const socket = io(import.meta.env.VITE_BACKEND_URL);
const db = getFirestore();
const normalizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

function Home({ theme, onToggleTheme }) {
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
  const onlineUsers = users.filter(
    (user) => normalizeEmail(user.email) !== normalizeEmail(email)
  );

  const connectUser = useCallback(async (name, email, language) => {
    try {
      const userRef = doc(db, "users", email.toLowerCase());
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/connect`, {
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
    if (normalizeEmail(user.email) === normalizeEmail(email)) return;

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
    <main className="chat-app">
      <header className="topbar glass-panel">
        <Link className="brand-lockup" to="/home">
          <span className="brand-mark">C</span>
          <span>chitchat</span>
        </Link>
        <div className="topbar-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className="user-pill" type="button" onClick={handleProfileClick} aria-label="Open your profile">
            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName || "User")}&background=7778ed&color=fff`} alt="" />
            <span className="user-pill-copy"><strong>{userName || "Your profile"}</strong><small>{selectedLanguage || "Choose a language"}</small></span>
            <span className="online-dot" />
          </button>
          <button className="icon-button logout-button" type="button" onClick={handleLogout} aria-label="Sign out" title="Sign out">↗</button>
        </div>
      </header>

      <section className="workspace">
        <aside className="people-panel glass-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">YOUR SPACE</span>
              <h1>Messages</h1>
            </div>
            <span className="online-count">{onlineUsers.length}</span>
          </div>
          <div className="people-section-label"><span>ONLINE NOW</span><span className="live-indicator">LIVE</span></div>
          <div className="people-list">
            {onlineUsers.map((user) => (
              <button
                key={user.email}
                type="button"
                className={`person-row ${selectedUser?.email === user.email ? "person-selected" : ""}`}
                onClick={() => selectUser(user)}
              >
                <span className="avatar-wrap">
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7778ed&color=fff`} alt="" />
                  <span className="online-dot" />
                </span>
                <span className="person-copy"><strong>{user.name}</strong><small>{user.email}</small></span>
                {unseenMessages[user.email] > 0 && <span className="unread-count">{unseenMessages[user.email]}</span>}
              </button>
            ))}
            {onlineUsers.length === 0 && (
              <div className="empty-people">
                <span className="empty-icon">✦</span>
                <strong>It's quiet in here</strong>
                <span>Online friends will appear here.</span>
              </div>
            )}
          </div>
          <div className="sidebar-footer"><span className="online-dot" /> Your conversations, translated</div>
        </aside>

        <section className="conversation-panel glass-panel">
          {selectedUser &&
          normalizeEmail(selectedUser.email) !== normalizeEmail(email) ? (
            <PrivateSession
              recipientEmail={selectedUser.email}
              currentUserEmail={email}
              onNewMessage={handleNewMessage}
              onMinimize={handleMinimize}
            />
          ) : (
            <div className="welcome-state">
              <div className="welcome-orbit orbit-one" />
              <div className="welcome-orbit orbit-two" />
              <div className="welcome-art">
                <span className="welcome-bubble bubble-left">你好</span>
                <span className="welcome-bubble bubble-right">Hello!</span>
                <span className="welcome-sparkle">✦</span>
              </div>
              <span className="eyebrow">A WORLD OF WORDS, ONE CHAT AWAY</span>
              <h2>Say hello to<br /><span>someone new.</span></h2>
              <p>Choose someone online and let the conversation flow. Your messages are translated automatically into their language.</p>
              <div className="translation-note"><span>文</span><span>Messages translated to {selectedLanguage || "your language"}</span></div>
            </div>
          )}
        </section>
      </section>

      {minimizedChats.length > 0 && (
        <div className="minimized-chats">
          {minimizedChats.map((chat) => (
            <button key={chat.email} type="button" className="minimized-chat glass-panel" onClick={() => selectUser(chat)}>
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name)}&background=7778ed&color=fff`} alt="" />
              <span><strong>{chat.name}</strong><small>Tap to reopen</small></span>
            </button>
          ))}
        </div>
      )}

      {showUserProfile && (
        <div className="profile-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) closeUserProfile(); }}>
          <UserProfile email={email} onClose={closeUserProfile} onLanguageUpdate={handleLanguageUpdate} currentLanguage={selectedLanguage} />
        </div>
      )}
    </main>
  );
}

export default Home;
