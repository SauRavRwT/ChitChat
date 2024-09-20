import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const socket = io(process.env.REACT_APP_BACKEND_URL);

function PrivateSession({ recipientEmail, currentUserEmail, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const getRecipientName = (email) => {
    if (!email) return "";
    return email.split("@")[0]; // Extract the name from the email
  };

  useEffect(() => {
    socket.emit("join_private_room", {
      email: currentUserEmail,
      recipientEmail,
    });

    const storedChat = localStorage.getItem(
      `private_chat_${currentUserEmail}_${recipientEmail}`
    );
    if (storedChat) {
      setMessages(JSON.parse(storedChat));
    }

    // Listen for incoming private messages
    socket.on("private_message", (message) => {
      setMessages((prevMessages) => {
        const messageExists = prevMessages.some(
          (msg) =>
            msg.timestamp === message.timestamp && msg.sender === message.sender
        );
        if (!messageExists) {
          const newMessages = [...prevMessages, message];
          localStorage.setItem(
            `private_chat_${currentUserEmail}_${recipientEmail}`,
            JSON.stringify(newMessages)
          );
          return newMessages;
        }
        return prevMessages;
      });
    });

    // Clean up event listener on component unmount
    return () => {
      socket.off("private_message");
      socket.emit("leave_private_room", {
        email: currentUserEmail,
        recipientEmail,
      });
    };
  }, [currentUserEmail, recipientEmail]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Function to handle sending messages
  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && currentUserEmail) {
      const messageData = {
        sender: currentUserEmail,
        recipient: recipientEmail,
        content: newMessage,
        timestamp: new Date().toISOString(),
      };
      // Emit message to the backend
      socket.emit("send_private_message", messageData); // Send original message to backend

      // Update the local state and store the message
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages, messageData];
        localStorage.setItem(
          `private_chat_${currentUserEmail}_${recipientEmail}`,
          JSON.stringify(newMessages)
        );
        return newMessages;
      });
      setNewMessage(""); // Clear input after sending
    }
  };

  return (
    <>
      <div className="p-3 border-bottom d-flex align-items-center">
        <button className="btn btn-outline-secondary me-3 rounded-5" onClick={onBack}>
          <i className="bi bi-arrow-left"></i>
        </button>
        {/* User's avatar and name */}
        <img
          src={`https://ui-avatars.com/api/?name=${getRecipientName(
            recipientEmail
          )}&background=random`}
          alt={getRecipientName(recipientEmail)}
          className="rounded-circle me-2"
          width="40"
          height="40"
        />
        <div>
          <h4 className="mb-0" alt={getRecipientName(recipientEmail)}>
            {getRecipientName(recipientEmail)}
          </h4>
          <small className="text-muted">{recipientEmail}</small>
        </div>
      </div>

      <div
        className="flex-grow-1 overflow-auto p-3"
        style={{ maxHeight: "calc(100vh - 210px)" }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 ${
              msg.sender === currentUserEmail ? "text-end" : "text-start"
            }`}
          >
            <div
              className={`d-inline-block p-2 rounded-4 ${
                msg.sender === currentUserEmail
                  ? "bg-primary text-white"
                  : "bg-secondary text-white"
              }`}
            >
              {/* Display original and translated messages */}
              <div>{msg.content}</div>
              {msg.translated_content && (
                <div className="small text-muted mt-1">
                  <em>{msg.translated_content}</em>
                </div>
              )}
            </div>
            <div className="small text-muted mt-1">
              {new Date(msg.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 border-top">
        <div className="input-group gap-2">
          <input
            type="text"
            className="form-control rounded-4"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <button type="submit" className="btn btn-success rounded-4">
            Send
          </button>
        </div>
      </form>
    </>
  );
}

export default PrivateSession;
