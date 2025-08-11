import React, { useState } from 'react';
import './VapiAgent.css';

const VapiDemo = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([]);

  const addMessage = (sender, text) => {
    const newMessage = {
      id: Date.now(),
      sender,
      text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const startDemo = () => {
    addMessage('system', 'Demo mode: Simulating Vapi connection...');
    setIsConnected(true);
    
    setTimeout(() => {
      addMessage('system', 'Connected to Vapi agent');
      setIsListening(true);
      
      // Simulate first message
      setTimeout(() => {
        addMessage('assistant', "Hello! I'm your voice assistant demo. This shows how the Vapi integration would work with a valid public key.");
        setIsListening(false);
        
        // Simulate user interaction
        setTimeout(() => {
          setTranscript('Hello, how are you?');
          setTimeout(() => {
            addMessage('user', 'Hello, how are you?');
            setTranscript('');
            setIsListening(true);
            
            setTimeout(() => {
              addMessage('assistant', "I'm doing great! This is a demo of the Vapi voice assistant. In the real version, you would speak and I would respond with actual AI-powered voice.");
              setIsListening(false);
            }, 1000);
          }, 1000);
        }, 2000);
      }, 1000);
    }, 1000);
  };

  const endDemo = () => {
    setIsConnected(false);
    setIsListening(false);
    setTranscript('');
    addMessage('system', 'Demo ended');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="vapi-agent">
      <div className="header">
        <h1>🎤 Vapi Voice Agent Demo</h1>
        <p className="subtitle">Demo mode - Shows how Vapi integration works</p>
      </div>

      <div className="chat-container">
        <div className="messages">
          {messages.length === 0 && (
            <div className="welcome-message">
              <div className="welcome-icon">🤖</div>
              <h3>Vapi Voice Agent Demo</h3>
              <p>This demo shows how the Vapi integration would work. Click "Start Demo" to see the voice assistant interface in action.</p>
              <div style={{marginTop: '20px', padding: '15px', background: '#fef3c7', borderRadius: '10px', fontSize: '0.9rem'}}>
                <strong>⚠️ Note:</strong> You provided a private key, but the web client needs a public key. 
                Get your public key from <a href="https://dashboard.vapi.ai/" target="_blank" rel="noopener noreferrer">Vapi Dashboard</a>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.sender}`}
            >
              <div className="message-content">
                <div className="message-text">{message.text}</div>
                <div className="message-time">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {transcript && (
            <div className="message user live-transcript">
              <div className="message-content">
                <div className="message-text">
                  {transcript}
                  <span className="typing-indicator">▋</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="controls">
        <div className="call-controls">
          {!isConnected ? (
            <button 
              className="call-button start-call"
              onClick={startDemo}
            >
              <span className="call-icon">📞</span>
              Start Demo
            </button>
          ) : (
            <button 
              className="call-button end-call"
              onClick={endDemo}
            >
              <span className="call-icon">📞</span>
              End Demo
            </button>
          )}
        </div>

        <div className="status">
          {isConnected && (
            <div className={`status-indicator ${isListening ? 'listening' : 'connected'}`}>
              <div className="status-dot"></div>
              <span>{isListening ? 'Listening...' : 'Connected'}</span>
            </div>
          )}
          {!isConnected && (
            <div className="status-indicator ready">
              <div className="status-dot"></div>
              <span>Ready for demo</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VapiDemo; 