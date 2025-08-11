import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatHistory from './ChatHistory';
import MicrophoneButton from './MicrophoneButton';
import TextInput from './TextInput';
import ErrorMessage from './ErrorMessage';
import AutomationDashboard from './AutomationDashboard';
import AutomationControlPanel from './AutomationControlPanel';
import { sendMessageToAssistant } from '../utils/api';
import { detectIntent } from '../utils/intentDetection';
import { 
  executeAutomation, 
  generateAutomationResponse, 
  trackWindow, 
  closeWindow, 
  closeAllWindows,
  getAutomationStats,
  loadAutomationStats,
  addWindowEventListener,
  getOpenWindows
} from '../utils/automationExecutor';
import './VoiceAssistant.css';

const VoiceAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [openWindows, setOpenWindows] = useState([]);
  const [automationStats, setAutomationStats] = useState({});
  const [lastExecutionResult, setLastExecutionResult] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const recognitionRef = useRef(null);
  const autoRestartTimeoutRef = useRef(null);

  // Initialize Speech Recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setError('');
      setCurrentTranscript('');
    };

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setCurrentTranscript(interimTranscript);

      if (finalTranscript) {
        handleUserMessage(finalTranscript.trim());
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access to use voice features.');
      } else if (event.error === 'no-speech') {
        // Auto-restart for no-speech errors
        setTimeout(() => {
          if (!isSpeaking && !isProcessing) {
            startListening();
          }
        }, 1000);
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      setCurrentTranscript('');
      
      // Auto-restart listening after the assistant finishes speaking
      if (!isSpeaking && !isProcessing) {
        autoRestartTimeoutRef.current = setTimeout(() => {
          startListening();
        }, 1500);
      }
    };

    return true;
  }, [isSpeaking, isProcessing]);

  // Handle user message (works for both voice and text)
  const handleUserMessage = async (transcript, isTextInput = false) => {
    if (!transcript || isProcessing) return;

    setIsProcessing(true);
    
    // Only stop listening if it's voice input
    if (!isTextInput && recognitionRef.current) {
      setIsListening(false);
      recognitionRef.current.stop();
    }

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: transcript,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Detect intent first
      const intent = detectIntent(transcript);
      console.log('Detected intent:', intent);

      let assistantMessage;

      // Try automation first
      if (intent.type !== 'conversation') {
        try {
          const automationResult = await executeAutomation(intent);
          
          if (automationResult && automationResult.success) {
            // Track opened windows
            if (automationResult.windowReference) {
              const windowId = trackWindow(automationResult.windowReference, intent.type, intent.query || intent.originalText);
              if (windowId) {
                setOpenWindows(prev => [...prev, {
                  id: windowId,
                  type: intent.type,
                  query: intent.query || intent.originalText,
                  openedAt: new Date()
                }]);
              }
            }

            // Generate automation response
            const automationResponse = generateAutomationResponse(intent, automationResult);
            
            assistantMessage = {
              id: Date.now() + 1,
              text: automationResponse,
              sender: 'assistant',
              timestamp: new Date().toISOString(),
              isAutomation: true,
              automationType: intent.type
            };

            setMessages(prev => [...prev, assistantMessage]);
            
            // Only speak if it was voice input
            if (!isTextInput) {
              speakText(automationResponse);
            }
            
            setIsProcessing(false);
            return;
          }
        } catch (automationError) {
          console.error('Automation failed:', automationError);
          // Fall back to regular conversation
        }
      }

      // Regular conversation flow
      const response = await sendMessageToAssistant(transcript, messages);
      
      assistantMessage = {
        id: Date.now() + 1,
        text: response.message,
        sender: 'assistant',
        timestamp: response.timestamp
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Only speak if it was voice input
      if (!isTextInput) {
        speakText(response.message);
      }

    } catch (error) {
      console.error('Error getting assistant response:', error);
      const errorMessage = error.response?.data?.error || 'Sorry, I encountered an error. Please try again.';
      setError(errorMessage);
      
      // Auto-restart listening even after an error
      setTimeout(() => {
        if (!isSpeaking) {
          startListening();
        }
      }, 2000);
    }

    setIsProcessing(false);
  };

  // Text-to-Speech function
  const speakText = (text) => {
    if (!text) return;

    // Cancel any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings for natural sound
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;
    
    // Try to use a more natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.name.includes('Alex') ||
      voice.name.includes('Samantha')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      // Auto-restart listening after speaking
      setTimeout(() => {
        startListening();
      }, 500);
    };

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      setIsSpeaking(false);
      setTimeout(() => {
        startListening();
      }, 1000);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Start listening
  const startListening = () => {
    if (isProcessing || isSpeaking) return;

    if (!recognitionRef.current) {
      if (!initializeSpeechRecognition()) {
        return;
      }
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      if (error.name !== 'InvalidStateError') {
        console.error('Error starting recognition:', error);
        setError('Failed to start listening. Please try again.');
      }
    }
  };

  // Stop listening
  const stopListening = () => {
    if (autoRestartTimeoutRef.current) {
      clearTimeout(autoRestartTimeoutRef.current);
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setCurrentTranscript('');
  };

  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Handle closing automation windows
  const handleCloseWindow = (windowId) => {
    if (closeWindow(windowId)) {
      setOpenWindows(prev => prev.filter(window => window.id !== windowId));
    }
  };

  // Handle automation events
  const handleAutomationExecution = useCallback(async (query) => {
    const intent = detectIntent(query);
    try {
      setIsProcessing(true);
      const result = await executeAutomation(intent);
      setLastExecutionResult(result);
      return result;
    } catch (error) {
      console.error('Automation execution failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Handle window operations
  const handleMinimizeAll = useCallback(() => {
    // Minimize all windows (implementation depends on browser capabilities)
    console.log('Minimizing all automation windows');
  }, []);

  const handleRestoreAll = useCallback(() => {
    // Restore all windows
    console.log('Restoring all automation windows');
  }, []);

  // Initialize on component mount
  useEffect(() => {
    initializeSpeechRecognition();
    
    // Load automation statistics
    loadAutomationStats();
    setAutomationStats(getAutomationStats());
    
    // Set up window event listener
    const removeEventListener = addWindowEventListener((event, data) => {
      switch (event) {
        case 'window_opened':
          setOpenWindows(prev => [...prev, {
            id: data.windowId,
            type: data.type,
            query: data.query,
            platform: data.platform,
            openedAt: new Date()
          }]);
          break;
        case 'window_closed':
          setOpenWindows(prev => prev.filter(w => w.id !== data.windowId));
          break;
        case 'automation_completed':
          setAutomationStats(getAutomationStats());
          break;
      }
    });
    
    // Load available voices
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Update open windows periodically
    const updateInterval = setInterval(() => {
      const currentWindows = getOpenWindows();
      setOpenWindows(currentWindows.map(([id, data]) => ({
        id,
        type: data.type,
        query: data.query,
        platform: data.platform,
        openedAt: data.openedAt
      })));
    }, 5000);

    return () => {
      if (autoRestartTimeoutRef.current) {
        clearTimeout(autoRestartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
      removeEventListener();
      clearInterval(updateInterval);
    };
  }, [initializeSpeechRecognition]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="voice-assistant">
      <div className="header">
        <h1>AI Voice Assistant</h1>
        <p className="subtitle">Speak naturally and get intelligent responses</p>
      </div>

      <ChatHistory 
        messages={messages} 
        currentTranscript={currentTranscript}
        isProcessing={isProcessing}
      />

      <div className="controls">
        <MicrophoneButton
          isListening={isListening}
          isSpeaking={isSpeaking}
          isProcessing={isProcessing}
          onClick={toggleListening}
        />
        
        <div className="status">
          {isProcessing && <span className="processing">Processing...</span>}
          {isSpeaking && <span className="speaking">Speaking...</span>}
          {isListening && <span className="listening">Listening...</span>}
          {!isListening && !isSpeaking && !isProcessing && (
            <span className="ready">Click the microphone to start</span>
          )}
        </div>

        {openWindows.length > 0 && (
          <div className="automation-status active">
            <div style={{ fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px' }}>
              🤖 Active Automations ({openWindows.length})
            </div>
            <div className="open-windows">
              {openWindows.map((window) => (
                <div key={window.id} className="window-item">
                  <div>
                    <span className={`window-type ${window.type}`}>
                      {window.type.toUpperCase()}
                    </span>
                    <span>{window.query}</span>
                  </div>
                  <button
                    className="close-window-btn"
                    onClick={() => handleCloseWindow(window.id)}
                    title="Close window"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Text Input Chatbox - Right Side Only */}
      <div style={{
        position: 'fixed',
        right: '30px',
        top: '100px',
        width: '380px',
        zIndex: 9999,
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '20px',
        borderRadius: '20px',
        boxShadow: '0 15px 50px rgba(0, 0, 0, 0.25)',
        border: '2px solid rgba(102, 126, 234, 0.3)'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '15px',
          fontWeight: '600'
        }}>
          💬 Type your message here
        </div>
        
        <textarea 
          placeholder="Type a message..."
          style={{
            width: '100%',
            minHeight: '44px',
            border: 'none',
            outline: 'none',
            background: 'rgba(248, 250, 252, 0.8)',
            borderRadius: '12px',
            padding: '12px',
            resize: 'none',
            fontFamily: 'inherit',
            fontSize: '1rem'
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (e.target.value.trim()) {
                handleUserMessage(e.target.value.trim(), true);
                e.target.value = '';
              }
            }
          }}
        />
        
        <button 
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            color: 'white',
            cursor: 'pointer',
            marginTop: '10px',
            fontWeight: '600'
          }}
          onClick={(e) => {
            const textarea = e.target.parentElement.querySelector('textarea');
            if (textarea.value.trim()) {
              handleUserMessage(textarea.value.trim(), true);
              textarea.value = '';
            }
          }}
        >
          Send 📤
        </button>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}
      
      {/* Modern Automation Dashboard */}
      <AutomationDashboard
        openWindows={openWindows}
        onCloseWindow={handleCloseWindow}
        onMinimizeAll={handleMinimizeAll}
        onRestoreAll={handleRestoreAll}
        automationStats={automationStats}
      />
      
      {/* Automation Control Panel */}
      <AutomationControlPanel
        onExecuteAutomation={handleAutomationExecution}
        isProcessing={isProcessing}
        lastExecutionResult={lastExecutionResult}
      />
    </div>
  );
};

export default VoiceAssistant; 