import React, { useState, useEffect } from 'react';
import './AutomationDashboard.css';

const AutomationDashboard = ({ 
  openWindows = [], 
  onCloseWindow, 
  onMinimizeAll, 
  onRestoreAll,
  automationStats = {} 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animationState, setAnimationState] = useState('idle');
  const [selectedWindow, setSelectedWindow] = useState(null);

  // Auto-expand when new windows open
  useEffect(() => {
    if (openWindows.length > 0 && !isExpanded) {
      setAnimationState('pulse');
      setTimeout(() => setAnimationState('idle'), 1000);
    }
  }, [openWindows.length, isExpanded]);

  const getWindowIcon = (type) => {
    const icons = {
      music: '🎵',
      shopping: '🛒',
      search: '🔍',
      travel: '✈️',
      media_control: '🎛️'
    };
    return icons[type] || '🔧';
  };

  const getWindowColor = (type) => {
    const colors = {
      music: '#FF6B6B',
      shopping: '#4ECDC4',
      search: '#45B7D1',
      travel: '#96CEB4',
      media_control: '#FFEAA7'
    };
    return colors[type] || '#74B9FF';
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now - then) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  if (openWindows.length === 0) {
    return null;
  }

  return (
    <div className={`automation-dashboard ${animationState}`}>
      {/* Floating Action Button */}
      <div 
        className={`dashboard-fab ${isExpanded ? 'expanded' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="fab-content">
          <span className="window-count">{openWindows.length}</span>
          <div className="fab-icon">🤖</div>
        </div>
        <div className="fab-pulse"></div>
      </div>

      {/* Expanded Dashboard */}
      {isExpanded && (
        <div className="dashboard-panel">
          {/* Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <div className="header-title">
                <span className="title-icon">⚡</span>
                <h3>Automation Hub</h3>
              </div>
              <div className="header-actions">
                <button 
                  className="action-btn minimize-all"
                  onClick={onMinimizeAll}
                  title="Minimize all windows"
                >
                  <span>📱</span>
                </button>
                <button 
                  className="action-btn restore-all"
                  onClick={onRestoreAll}
                  title="Restore all windows"
                >
                  <span>🪟</span>
                </button>
                <button 
                  className="action-btn close-dashboard"
                  onClick={() => setIsExpanded(false)}
                  title="Close dashboard"
                >
                  <span>✕</span>
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Row */}
          <div className="dashboard-stats">
            <div className="stat-item">
              <div className="stat-value">{openWindows.length}</div>
              <div className="stat-label">Active</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{automationStats.totalExecuted || 0}</div>
              <div className="stat-label">Today</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{automationStats.successRate || '100%'}</div>
              <div className="stat-label">Success</div>
            </div>
          </div>

          {/* Window Grid */}
          <div className="windows-grid">
            {openWindows.map((window, index) => (
              <div 
                key={window.id}
                className={`window-card ${selectedWindow === window.id ? 'selected' : ''}`}
                style={{ 
                  '--window-color': getWindowColor(window.type),
                  '--delay': `${index * 0.1}s`
                }}
                onClick={() => setSelectedWindow(selectedWindow === window.id ? null : window.id)}
              >
                <div className="window-card-header">
                  <div className="window-type-badge">
                    <span className="type-icon">{getWindowIcon(window.type)}</span>
                    <span className="type-name">{window.type}</span>
                  </div>
                  <button
                    className="window-close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseWindow(window.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="window-content">
                  <div className="window-query">
                    {window.query || window.originalText || 'No description'}
                  </div>
                  <div className="window-meta">
                    <span className="window-time">
                      {formatTimeAgo(window.openedAt)}
                    </span>
                    <div className="window-status active">
                      <div className="status-dot"></div>
                      Active
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedWindow === window.id && (
                  <div className="window-details">
                    <div className="detail-row">
                      <span className="detail-label">Platform:</span>
                      <span className="detail-value">{window.platform || 'Default'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Window ID:</span>
                      <span className="detail-value">{window.id.slice(-8)}</span>
                    </div>
                    <div className="window-actions">
                      <button className="action-button focus">
                        <span>👁️</span> Focus
                      </button>
                      <button className="action-button refresh">
                        <span>🔄</span> Refresh
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <button className="quick-action-btn music">
              <span>🎵</span>
              <span>Music</span>
            </button>
            <button className="quick-action-btn shopping">
              <span>🛒</span>
              <span>Shop</span>
            </button>
            <button className="quick-action-btn search">
              <span>🔍</span>
              <span>Search</span>
            </button>
            <button className="quick-action-btn travel">
              <span>✈️</span>
              <span>Travel</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationDashboard; 