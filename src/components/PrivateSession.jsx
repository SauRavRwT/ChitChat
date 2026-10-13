import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL);

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
    if (
      !currentUserEmail ||
      currentUserEmail.trim().toLowerCase() === recipientEmail.trim().toLowerCase()
    ) {
      return undefined;
    }

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
    if (
      newMessage.trim() &&
      currentUserEmail &&
      currentUserEmail.trim().toLowerCase() !== recipientEmail.trim().toLowerCase()
    ) {
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
    <div className="conversation-view">
      <header className="conversation-header">
        <button className="icon-button back-button" type="button" onClick={onMinimize} aria-label="Minimize conversation">←</button>
        <span className="avatar-wrap conversation-avatar">
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getRecipientName(recipientEmail))}&background=7778ed&color=fff`} alt="" />
          <span className="online-dot" />
        </span>
        <div className="conversation-person">
          <strong>{getRecipientName(recipientEmail)}</strong>
          <span><i /> Active now</span>
        </div>
        <span className="secure-label">✦ Private conversation</span>
      </header>

      <div className="message-list">
        {messages.length === 0 && (
          <div className="chat-first-message"><span>✦</span><strong>Make the first move</strong><p>Send a message to start your conversation.</p></div>
        )}
        {messages.map((msg, index) => {
          const ownMessage = msg.sender === currentUserEmail;
          return (
            <div key={`${msg.timestamp}-${index}`} className={`message-row ${ownMessage ? "message-own" : ""}`}>
              <div className="message-bubble">
                <div>{msg.content}</div>
                {msg.translated_content && <div className="translated-message"><span>↳</span> {msg.translated_content}</div>}
              </div>
              <time>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="message-composer">
        <div className="composer-shell">
          <input
            type="text"
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            placeholder="Write a message…"
            aria-label="Write a message"
          />
          <button type="submit" className="send-button" aria-label="Send message" disabled={!newMessage.trim()}>↑</button>
        </div>
        <span className="composer-hint">Your message will be translated automatically</span>
      </form>
    </div>
  );
}

export default PrivateSession;
