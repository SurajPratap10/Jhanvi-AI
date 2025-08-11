import React, { useState, useEffect } from 'react';
import './NotificationSystem.css';

const NotificationSystem = ({ notifications = [], onRemoveNotification }) => {
  const getNotificationIcon = (type) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      automation: '🤖',
      music: '🎵',
      shopping: '🛒',
      search: '🔍',
      travel: '✈️'
    };
    return icons[type] || icons.info;
  };

  const getNotificationColor = (type) => {
    const colors = {
      success: '#4CAF50',
      error: '#F44336',
      warning: '#FF9800',
      info: '#2196F3',
      automation: '#9C27B0',
      music: '#E91E63',
      shopping: '#00BCD4',
      search: '#607D8B',
      travel: '#4CAF50'
    };
    return colors[type] || colors.info;
  };

  return (
    <div className="notification-system">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`notification-item ${notification.type}`}
          style={{ 
            '--notification-color': getNotificationColor(notification.type),
            '--delay': `${index * 0.1}s`
          }}
        >
          <div className="notification-content">
            <div className="notification-header">
              <span className="notification-icon">
                {getNotificationIcon(notification.type)}
              </span>
              <span className="notification-title">
                {notification.title || 'Notification'}
              </span>
              <button
                className="notification-close"
                onClick={() => onRemoveNotification(notification.id)}
              >
                ×
              </button>
            </div>
            
            <div className="notification-message">
              {notification.message}
            </div>
            
            {notification.action && (
              <div className="notification-actions">
                <button 
                  className="notification-action-btn"
                  onClick={notification.action.callback}
                >
                  {notification.action.label}
                </button>
              </div>
            )}
            
            <div className="notification-progress">
              <div 
                className="progress-bar"
                style={{ 
                  animationDuration: `${notification.duration || 5000}ms`
                }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationSystem; 