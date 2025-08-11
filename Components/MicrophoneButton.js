import React from 'react';
import './MicrophoneButton.css';

const MicrophoneButton = ({ isListening, isSpeaking, isProcessing, onClick }) => {
  const getButtonState = () => {
    if (isProcessing) return 'processing';
    if (isSpeaking) return 'speaking';
    if (isListening) return 'listening';
    return 'ready';
  };

  const getButtonText = () => {
    if (isProcessing) return 'Processing...';
    if (isSpeaking) return 'Speaking...';
    if (isListening) return 'Listening...';
    return 'Click to speak';
  };

  const buttonState = getButtonState();

  return (
    <div className="microphone-container">
      <button
        className={`microphone-button ${buttonState}`}
        onClick={onClick}
        disabled={isProcessing || isSpeaking}
        aria-label={getButtonText()}
      >
        <div className="mic-icon">
          {buttonState === 'listening' && (
            <div className="pulse-rings">
              <div className="pulse-ring"></div>
              <div className="pulse-ring"></div>
              <div className="pulse-ring"></div>
            </div>
          )}
          
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            {buttonState === 'processing' ? (
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            ) : buttonState === 'speaking' ? (
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            ) : (
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
            )}
          </svg>
        </div>
      </button>
      
      <div className="button-label">
        {getButtonText()}
      </div>
    </div>
  );
};

export default MicrophoneButton; 