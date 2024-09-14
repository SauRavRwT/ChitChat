import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../Firebase.js";
import { io } from "socket.io-client";

const socket = io("http://192.168.179.236:8080"); // Replace with your backend IP

function PrivateSession() {
  const { recipientEmail } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        socket.emit("join_private_room", { email: user.email, recipientEmail });
      } else {
        navigate("/login");
      }
    });

    socket.on("private_message", (message) => {
      setMessages((prevMessages) => {
        // Check if the message already exists in the array
        const messageExists = prevMessages.some(
          (msg) =>
            msg.sender === message.sender &&
            msg.content === message.content &&
            msg.timestamp === message.timestamp
        );

        // Only add the message if it doesn't already exist
        if (!messageExists) {
          return [...prevMessages, message];
        }
        return prevMessages;
      });
    });

    return () => {
      unsubscribe();
      socket.off("private_message");
      socket.emit("leave_private_room", { email: currentUser?.email, recipientEmail });
    };
  }, [navigate, recipientEmail, currentUser]);

  const sendMessage = () => {
    if (newMessage.trim() && currentUser) {
      const messageData = {
        sender: currentUser.email,
        recipient: recipientEmail,
        content: newMessage,
        timestamp: new Date().toISOString(),
      };
      socket.emit("send_private_message", messageData);
      setMessages((prevMessages) => [...prevMessages, messageData]);
      setNewMessage("");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Private Session with {recipientEmail}</h2>
      <div className="card">
        <div className="card-body" style={{ height: "400px", overflowY: "auto" }}>
          {messages.map((msg, index) => (
            <div key={index} className={`mb-2 ${msg.sender === currentUser?.email ? 'text-end' : 'text-start'}`}>
              <strong>{msg.sender === currentUser?.email ? 'You' : 'Them'}:</strong> {msg.content}
            </div>
          ))}
        </div>
        <div className="card-footer">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
            />
            <button className="btn btn-primary" onClick={sendMessage}>Send</button>
          </div>
        </div>
      </div>
      <button className="btn btn-secondary mt-3" onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
}

export default PrivateSession;