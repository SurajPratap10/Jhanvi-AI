import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ message, onClose }) => {
  return (
    <div className="error-message">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <div className="error-text">{message}</div>
        <button 
          className="error-close" 
          onClick={onClose}
          aria-label="Close error message"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ErrorMessage; 