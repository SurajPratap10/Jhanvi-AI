import React, { useEffect, useRef } from 'react';
import './ChatHistory.css';

const ChatHistory = ({ messages, currentTranscript, isProcessing }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTranscript]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chat-history">
      <div className="messages-container">
        {messages.length === 0 && !currentTranscript && (
          <div className="welcome-message">
            <div className="welcome-icon">🎤</div>
            <h3>Welcome to AI Voice Assistant!</h3>
            <p>Click the microphone button and start speaking. I'll listen, understand, and respond naturally.</p>
          </div>
        )}

        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.sender} ${message.isAutomation ? 'automation' : ''} ${message.automationType ? message.automationType : ''}`}
          >
            <div className="message-content">
              {message.isAutomation && (
                <div className="automation-badge">
                  {message.automationType === 'music' && '🎵'}
                  {message.automationType === 'shopping' && '🛒'}
                  {message.automationType === 'travel' && '✈️'}
                  {message.automationType === 'media_control' && '🎛️'}
                  Automation
                </div>
              )}
              <div className="message-text">{message.text}</div>
              <div className="message-time">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {/* Show current transcript while user is speaking */}
        {currentTranscript && (
          <div className="message user current-transcript">
            <div className="message-content">
              <div className="message-text">
                {currentTranscript}
                <span className="typing-indicator">▋</span>
              </div>
            </div>
          </div>
        )}

        {/* Show processing indicator */}
        {isProcessing && (
          <div className="message assistant">
            <div className="message-content">
              <div className="message-text">
                <div className="typing-animation">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatHistory; 