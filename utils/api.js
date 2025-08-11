import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('Making API request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API response received:', response.status);
    return response;
  },
  (error) => {
    console.error('API error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Send a message to the AI assistant
 * @param {string} message - The user's message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<Object>} - The assistant's response
 */
export const sendMessageToAssistant = async (message, conversationHistory = []) => {
  try {
    if (!message || typeof message !== 'string') {
      throw new Error('Message is required and must be a string');
    }

    // Format conversation history for the API
    const formattedHistory = conversationHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    const response = await api.post('/chat', {
      message: message.trim(),
      conversationHistory: formattedHistory
    });

    return response.data;
  } catch (error) {
    // Enhanced error handling
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.error || 'Server error occurred';
      throw new Error(errorMessage);
    } else if (error.request) {
      // Network error
      throw new Error('Unable to connect to the server. Please check your internet connection.');
    } else {
      // Other errors
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
};

/**
 * Check if the server is running
 * @returns {Promise<boolean>} - True if server is healthy
 */
export const checkServerHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.status === 200;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

export default api; 
