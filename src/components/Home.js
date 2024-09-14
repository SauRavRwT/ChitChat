import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../Firebase.js";
import { signOut } from "firebase/auth";
import { io } from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Socket connection
const socket = io("http://192.168.179.236:8080"); // Replace with your backend IP

function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(null);
  const [userName, setUserName] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  // eslint-disable-next-line
  const [recipientEmail, setRecipientEmail] = useState("");
  const [chat, setChat] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const name = user.email.split("@")[0];
        setEmail(user.email);
        setUserName(name);

        connectUser(name, user.email);

        socket.emit("join", { email: user.email });
      } else {
        setEmail(null);
      }
    });

    socket.on("update_users", (updatedUsers) => {
      setUsers(updatedUsers);
    });

    socket.on("receive_message", (data) => {
      setChat((prevChat) => [...prevChat, data]);
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

  const connectUser = (name, email) => {
    fetch("http://192.168.179.236:8080/api/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email }),
    })
      .then((response) => response.json())
      .then((data) => {
        setUsers(data.users);
      })
      .catch((error) => console.error("Error connecting user:", error));
  };

  const sendPersonalMessage = () => {
    if (!recipientEmail || !message) {
      console.error("Recipient email or message is empty");
      return;
    }

    const payload = {
      sender_name: userName,
      recipient_email: recipientEmail,
      message: message,
      sender_email: email,
    };

    socket.emit("send_personal_message", payload);

    setChat((prevChat) => [
      ...prevChat,
      { sender: userName, recipient: recipientEmail, message },
    ]);

    setMessage("");
  };

  const startPrivateSession = (recipientEmail) => {
    navigate(`/private-session/${recipientEmail}`);
  };

  // const selectRecipient = (email) => {
  //   setRecipientEmail(email);
  // };

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
            <li key={user.email} className="d-flex justify-content-between my-2">
              {user.name} (Email: {user.email})
              <div>
                {/* <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => selectRecipient(user.email)}
                >
                  Select to Message
                </button> */}
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => startPrivateSession(user.email)}
                >
                  Start Private Session
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {recipientEmail && (
        <section className="row m-3">
          <h3 className="col-12">
            Send Message to{" "}
            {users.find((user) => user.email === recipientEmail)?.name}
          </h3>
          <div className="col-12 col-md-8 mb-3">
            <input
              type="text"
              className="form-control"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
            />
          </div>
          <div className="col-12 col-md-4 mb-3">
            <button className="btn btn-primary" onClick={sendPersonalMessage}>
              Send
            </button>
          </div>
        </section>
      )}

      <section className="row m-3">
        <h3 className="col-12">Chat Log</h3>
        <ul className="col-12 list-unstyled">
          {chat.map((entry, index) => (
            <li key={index} className="my-2">
              <strong>{entry.sender}:</strong> {entry.message}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default Home;