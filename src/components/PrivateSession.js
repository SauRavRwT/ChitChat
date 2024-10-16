import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const socket = io(process.env.REACT_APP_BACKEND_URL);

function PrivateSession({
  recipientEmail,
  currentUserEmail,
  onNewMessage,
  onMinimize,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const getRecipientName = (email) => {
    if (!email) return "";
    return email.split("@")[0];
  };

  const storageKey = `private_chat_${currentUserEmail}_${recipientEmail}`;

  const saveMessagesToStorage = useCallback(
    (messages) => {
      const messagesToStore = messages.map(
        ({ sender, content, timestamp, translated_content }) => ({
          sender,
          content,
          timestamp,
          translated_content,
        })
      );
      localStorage.setItem(storageKey, JSON.stringify(messagesToStore));
    },
    [storageKey]
  );

  const loadMessagesFromStorage = useCallback(() => {
    const storedChat = localStorage.getItem(storageKey);
    return storedChat ? JSON.parse(storedChat) : [];
  }, [storageKey]);

  useEffect(() => {
    socket.emit("join_private_room", {
      email: currentUserEmail,
      recipientEmail,
    });

    setMessages(loadMessagesFromStorage());

    const handlePrivateMessage = (message) => {
      setMessages((prevMessages) => {
        const messageExists = prevMessages.some(
          (msg) =>
            msg.timestamp === message.timestamp && msg.sender === message.sender
        );
        if (!messageExists) {
          const newMessages = [...prevMessages, message];
          saveMessagesToStorage(newMessages);
          if (message.sender !== currentUserEmail) {
            onNewMessage(recipientEmail);
          }
          return newMessages;
        }
        return prevMessages;
      });
    };

    socket.on("private_message", handlePrivateMessage);

    // Listen for storage events to sync messages across tabs
    const handleStorageChange = (e) => {
      if (e.key === storageKey) {
        setMessages(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      socket.off("private_message", handlePrivateMessage);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [
    currentUserEmail,
    recipientEmail,
    onNewMessage,
    saveMessagesToStorage,
    loadMessagesFromStorage,
    storageKey,
  ]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && currentUserEmail) {
      const messageData = {
        sender: currentUserEmail,
        recipient: recipientEmail,
        content: newMessage,
        timestamp: new Date().toISOString(),
      };
      socket.emit("send_private_message", messageData);

      setMessages((prevMessages) => {
        const newMessages = [...prevMessages, messageData];
        saveMessagesToStorage(newMessages);
        return newMessages;
      });
      setNewMessage("");
    }
  };

  // Periodic sync with localStorage
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const storedMessages = loadMessagesFromStorage();
      setMessages((prevMessages) => {
        if (JSON.stringify(prevMessages) !== JSON.stringify(storedMessages)) {
          return storedMessages;
        }
        return prevMessages;
      });
    }, 5000); // Sync every 5 seconds

    return () => clearInterval(syncInterval);
  }, [loadMessagesFromStorage]);

  return (
    <div className="d-flex flex-column h-100">
      <div className="p-3 border-bottom d-flex align-items-center">
        <button
          className="btn btn-outline-secondary me-3 rounded-circle"
          onClick={onMinimize}
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        <img
          src={`https://ui-avatars.com/api/?name=${getRecipientName(
            recipientEmail
          )}&background=random`}
          alt={getRecipientName(recipientEmail)}
          className="rounded-circle me-2"
          width="40"
          height="40"
        />
        <div className="d-flex flex-column">
          <h4
            className="mb-0 text-truncate"
            style={{ maxWidth: "150px" }}
            title={getRecipientName(recipientEmail)}
          >
            {getRecipientName(recipientEmail)}
          </h4>
          <small
            className="text-muted text-truncate"
            style={{ maxWidth: "150px" }}
            title={recipientEmail}
          >
            {recipientEmail}
          </small>
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
              style={{ maxWidth: "80%", wordWrap: "break-word" }}
            >
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

      <form onSubmit={sendMessage} className="p-3 border-top mt-auto">
        <div className="input-group">
          <input
            type="text"
            className="form-control rounded-start"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <button type="submit" className="btn btn-success rounded-end">
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default PrivateSession;
