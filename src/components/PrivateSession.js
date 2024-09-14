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
        
        // Load private chat history from localStorage
        const storedChat = localStorage.getItem(`private_chat_${user.email}_${recipientEmail}`);
        if (storedChat) {
          setMessages(JSON.parse(storedChat));
        }
      } else {
        navigate("/login");
      }
    });

    socket.on("private_message", (message) => {
      setMessages((prevMessages) => {
        // Check if the message already exists in the chat
        const messageExists = prevMessages.some(
          (msg) => msg.timestamp === message.timestamp && msg.sender === message.sender
        );
        if (!messageExists) {
          const newMessages = [...prevMessages, message];
          localStorage.setItem(`private_chat_${currentUser.email}_${recipientEmail}`, JSON.stringify(newMessages));
          return newMessages;
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
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages, messageData];
        // Store updated chat in localStorage
        localStorage.setItem(`private_chat_${currentUser.email}_${recipientEmail}`, JSON.stringify(newMessages));
        return newMessages;
      });
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
              <small className="text-muted ms-2">
                {new Date(msg.timestamp).toLocaleString()}
              </small>
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