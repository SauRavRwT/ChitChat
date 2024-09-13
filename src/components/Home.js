import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../Firebase.js";
import { signOut } from "firebase/auth";
import { io } from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Socket connection
const socket = io("http://192.168.20.236:8080"); // Replace with your IP

function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(null);
  const [userName, setUserName] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [chat, setChat] = useState([]);

  useEffect(() => {
    // Firebase Auth listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setEmail(user.email);
        setUserName(user.email.split("@")[0]); // Setting username from email
        connectUser(user.email.split("@")[0]); // Connect user to socket after login
      } else {
        setEmail(null);
      }
    });

    // Socket listeners
    socket.on("update_users", (updatedUsers) => {
      setUsers(updatedUsers);
    });

    socket.on("receive_message", (data) => {
      setChat((prevChat) => [
        ...prevChat,
        {
          sender: data.sender,
          recipient: data.recipient,
          message: data.message,
        },
      ]);
    });

    return () => {
      unsubscribe();
      socket.off("update_users");
      socket.off("receive_message");
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const connectUser = (name) => {
    fetch("http://192.168.20.236:8080/api/connect", {
      // Replace with your IP
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    })
      .then((response) => response.json())
      .then((data) => {
        setUsers(data.users);
        const newUser = data.users.find((u) => u.name === name);
        setUserId(newUser.id);
      })
      .catch((error) => console.error("Error connecting user:", error));
  };

  const sendPersonalMessage = () => {
    socket.emit("send_personal_message", {
      message: message,
      recipient_id: recipientId,
      sender_id: userId,
    });

    setChat((prevChat) => [
      ...prevChat,
      { sender: userId, recipient: recipientId, message },
    ]);
  };

  return (
    <div>
      <header className="container p-4 d-flex flex-column flex-md-row justify-content-between align-items-center">
        <h3 className="fw-bold display-4 text-center text-md-start">RTTC</h3>
        <button
          className="btn btn-lg btn-danger mt-3 rounded-4"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <div className="container d-flex justify-content-center">
        <div className="row">
          <div className="col col-lg">
            <h1 className="fw-bold text-dark">
              Hello, {email ? email : "User"}
            </h1>
          </div>
          <div className="col col-lg">
            <img
              className="rounded-circle img-fluid"
              src="https://avatars.githubusercontent.com/u/90666710?v=4"
              alt="User Avatar"
              style={{ maxWidth: "150px" }}
            />
          </div>
        </div>
      </div>

      <section className="row m-3">
        <h2 className="col-12">Connected Users:</h2>
        <ul className="col-12 list-unstyled">
          {users.map((user) => (
            <li key={user.id} className="d-flex justify-content-between my-2">
              {user.name} (ID: {user.id})
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => setRecipientId(user.id)}
              >
                Message {user.name}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Input to send a message */}
      {recipientId && (
        <section className="row m-3">
          <h3 className="col-12">
            Send Message to{" "}
            {users.find((user) => user.id === recipientId)?.name}
          </h3>
          <div className="col-12 col-md-8 mb-3">
            <input
              type="text"
              className="form-control"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here"
            />
            <button
              className="btn btn-primary w-100"
              onClick={sendPersonalMessage}
            >
              Send Personal Message
            </button>
          </div>
        </section>
      )}

      <section className="row m-3">
        <h3 className="col-12">Chat Log:</h3>
        <ul className="col-12 list-unstyled">
          {chat.map((msg, index) => (
            <li key={index} className="my-2">
              {msg.sender === userId
                ? "You"
                : users.find((user) => user.id === msg.sender)?.name}{" "}
              to {users.find((user) => user.id === msg.recipient)?.name}:{" "}
              {msg.message}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default Home;
