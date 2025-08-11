import React, { useState, useEffect, useCallback } from 'react';
import './AutomationControlPanel.css';

const AutomationControlPanel = ({ 
  onExecuteAutomation, 
  isProcessing = false,
  lastExecutionResult = null 
}) => {
  const [activeCategory, setActiveCategory] = useState('music');
  const [quickActions, setQuickActions] = useState([]);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Automation categories with enhanced configurations
  const automationCategories = {
    music: {
      icon: '🎵',
      label: 'Music',
      color: '#FF6B6B',
      actions: [
        { id: 'play_trending', label: 'Play Trending', query: 'play trending music', icon: '🔥' },
        { id: 'play_chill', label: 'Chill Vibes', query: 'play chill music', icon: '🌙' },
        { id: 'play_workout', label: 'Workout Mix', query: 'play workout music', icon: '💪' },
        { id: 'play_focus', label: 'Focus Music', query: 'play focus music', icon: '🧘' }
      ]
    },
    shopping: {
      icon: '🛒',
      label: 'Shopping',
      color: '#4ECDC4',
      actions: [
        { id: 'electronics', label: 'Electronics', query: 'search electronics on amazon', icon: '📱' },
        { id: 'fashion', label: 'Fashion', query: 'search fashion on flipkart', icon: '👕' },
        { id: 'books', label: 'Books', query: 'search books on amazon', icon: '📚' },
        { id: 'home', label: 'Home & Garden', query: 'search home decor', icon: '🏠' }
      ]
    },
    search: {
      icon: '🔍',
      label: 'Search',
      color: '#45B7D1',
      actions: [
        { id: 'news', label: 'Latest News', query: 'search latest news', icon: '📰' },
        { id: 'weather', label: 'Weather', query: 'search weather forecast', icon: '🌤️' },
        { id: 'recipes', label: 'Recipes', query: 'search cooking recipes', icon: '👨‍🍳' },
        { id: 'tutorials', label: 'Tutorials', query: 'search tutorials', icon: '🎓' }
      ]
    },
    travel: {
      icon: '✈️',
      label: 'Travel',
      color: '#96CEB4',
      actions: [
        { id: 'flights', label: 'Find Flights', query: 'search flights', icon: '🛫' },
        { id: 'hotels', label: 'Find Hotels', query: 'search hotels', icon: '🏨' },
        { id: 'destinations', label: 'Destinations', query: 'search travel destinations', icon: '🗺️' },
        { id: 'packages', label: 'Tour Packages', query: 'search tour packages', icon: '🎒' }
      ]
    }
  };

  // Add notification
  const addNotification = useCallback((message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  // Handle automation execution
  const handleExecuteAction = async (action) => {
    try {
      addNotification(`Executing: ${action.label}`, 'info');
      
      // Add to execution history
      const execution = {
        id: Date.now(),
        action: action.label,
        query: action.query,
        timestamp: new Date().toISOString(),
        status: 'executing'
      };
      setExecutionHistory(prev => [execution, ...prev.slice(0, 9)]);
      
      // Execute the automation
      await onExecuteAutomation(action.query);
      
      // Update history with success
      setExecutionHistory(prev => 
        prev.map(exec => 
          exec.id === execution.id 
            ? { ...exec, status: 'success' }
            : exec
        )
      );
      
      addNotification(`${action.label} executed successfully!`, 'success');
    } catch (error) {
      // Update history with error
      setExecutionHistory(prev => 
        prev.map(exec => 
          exec.id === execution.id 
            ? { ...exec, status: 'error', error: error.message }
            : exec
        )
      );
      
      addNotification(`Failed to execute ${action.label}`, 'error');
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      executing: '#FFA726',
      success: '#66BB6A',
      error: '#EF5350'
    };
    return colors[status] || '#9E9E9E';
  };

  return (
    <div className={`automation-control-panel ${isMinimized ? 'minimized' : ''}`}>
      {/* Header */}
      <div className="control-panel-header">
        <div className="header-info">
          <div className="panel-title">
            <span className="title-icon">⚡</span>
            <h3>Automation Control</h3>
          </div>
          <div className="panel-status">
            {isProcessing && (
              <div className="processing-indicator">
                <div className="pulse-dot"></div>
                Processing...
              </div>
            )}
          </div>
        </div>
        <button 
          className="minimize-btn"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          {isMinimized ? '⬆️' : '⬇️'}
        </button>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications-container">
          {notifications.map(notification => (
            <div 
              key={notification.id}
              className={`notification ${notification.type}`}
            >
              <div className="notification-content">
                <span className="notification-icon">
                  {notification.type === 'success' ? '✅' : 
                   notification.type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <span className="notification-message">
                  {notification.message}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isMinimized && (
        <>
          {/* Category Tabs */}
          <div className="category-tabs">
            {Object.entries(automationCategories).map(([key, category]) => (
              <button
                key={key}
                className={`category-tab ${activeCategory === key ? 'active' : ''}`}
                style={{ '--category-color': category.color }}
                onClick={() => setActiveCategory(key)}
              >
                <span className="tab-icon">{category.icon}</span>
                <span className="tab-label">{category.label}</span>
              </button>
            ))}
          </div>

          {/* Action Grid */}
          <div className="actions-grid">
            {automationCategories[activeCategory]?.actions.map((action, index) => (
              <button
                key={action.id}
                className="action-card"
                style={{ 
                  '--category-color': automationCategories[activeCategory].color,
                  '--delay': `${index * 0.1}s`
                }}
                onClick={() => handleExecuteAction(action)}
                disabled={isProcessing}
              >
                <div className="action-icon">{action.icon}</div>
                <div className="action-label">{action.label}</div>
                <div className="action-ripple"></div>
              </button>
            ))}
          </div>

          {/* Execution History */}
          {executionHistory.length > 0 && (
            <div className="execution-history">
              <div className="history-header">
                <span className="history-icon">📊</span>
                <h4>Recent Executions</h4>
              </div>
              <div className="history-list">
                {executionHistory.slice(0, 5).map(execution => (
                  <div key={execution.id} className="history-item">
                    <div className="history-content">
                      <div className="execution-info">
                        <span className="execution-action">{execution.action}</span>
                        <span className="execution-time">
                          {new Date(execution.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div 
                        className="execution-status"
                        style={{ color: getStatusColor(execution.status) }}
                      >
                        {execution.status === 'executing' && (
                          <div className="mini-spinner"></div>
                        )}
                        {execution.status === 'success' && '✓'}
                        {execution.status === 'error' && '✗'}
                        {execution.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Custom Action */}
          <div className="custom-action-section">
            <div className="custom-action-header">
              <span>🎯</span>
              <span>Custom Command</span>
            </div>
            <div className="custom-action-input">
              <input
                type="text"
                placeholder="Type any automation command..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    handleExecuteAction({
                      id: 'custom',
                      label: 'Custom Command',
                      query: e.target.value.trim()
                    });
                    e.target.value = '';
                  }
                }}
              />
              <button className="execute-btn">
                <span>⚡</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AutomationControlPanel; 