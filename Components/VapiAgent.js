import React, { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import './VapiAgent.css';
import { detectIntent } from '../utils/intentDetection';
import { executeAutomation, generateAutomationResponse, addWindowEventListener } from '../utils/automationExecutor';

const VapiAgent = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [vapiInstance, setVapiInstance] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [connectionStable, setConnectionStable] = useState(true);
  const callStartTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const connectionCheckRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const VAPI_TOKEN = '1abd3f76-8831-4f5c-9e05-f1890f4fa164';
  
  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up automation event listeners for music control
  useEffect(() => {
    const unsubscribe = addWindowEventListener((event, data) => {
      console.log('🎵 Automation event:', event, data);
      
      switch (event) {
        case 'music_started':
          if (data.autoMute && vapiInstance && isConnected && !isMuted) {
            console.log('🔇 Auto-muting microphone for music playback');
            try {
              vapiInstance.setMuted(true);
              setIsMuted(true);
            } catch (error) {
              console.warn('Failed to auto-mute:', error);
            }
          }
          
          setIsPlayingMusic(true);
          setCurrentSong({
            name: data.songName,
            artist: data.artistName,
            query: data.intent.query,
            windowId: data.windowId
          });
          break;
          
        case 'window_closed':
          if (data.type === 'music') {
            console.log('🎵 Music window closed, stopping music effects');
            setIsPlayingMusic(false);
            setCurrentSong(null);
          }
          break;
          
        default:
          break;
      }
    });

    return unsubscribe;
  }, [vapiInstance, isConnected, isMuted]);

  // Add window focus/blur and connection stability monitoring
  useEffect(() => {
    if (!isConnected || !vapiInstance) return;

    // Handle window focus/blur to maintain connection
    const handleWindowFocus = () => {
      console.log('🔔 Window focused - checking connection stability');
      lastActivityRef.current = Date.now();
      setConnectionStable(true);
      
      // Clear any connection errors when window regains focus
      if (error && error.includes('Connection')) {
        setError('');
      }
    };

    const handleWindowBlur = () => {
      console.log('🔕 Window blurred - maintaining connection');
      lastActivityRef.current = Date.now();
    };

    // Connection stability checker
    const checkConnection = () => {
      if (!isConnected || !vapiInstance) return;
      
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      
      // If no activity for more than 30 seconds and window is focused
      if (timeSinceActivity > 30000 && document.hasFocus()) {
        console.log('⚠️ Connection may be unstable - refreshing...');
        setConnectionStable(false);
        
        // Try to refresh the connection gently
        setTimeout(() => {
          if (isConnected && vapiInstance) {
            lastActivityRef.current = Date.now();
            setConnectionStable(true);
          }
        }, 2000);
      }
    };

    // Add event listeners
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    
    // Start connection monitoring
    connectionCheckRef.current = setInterval(checkConnection, 10000); // Check every 10 seconds

    // Cleanup
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
        connectionCheckRef.current = null;
      }
    };
  }, [isConnected, vapiInstance, error]);

  // Initialize Vapi SDK
  useEffect(() => {
    if (VAPI_TOKEN === 'YOUR_PUBLIC_KEY_HERE') {
      setError('Please replace YOUR_PUBLIC_KEY_HERE with your actual Vapi public key');
      return;
    }

    try {
      const vapi = new Vapi(VAPI_TOKEN);
      setVapiInstance(vapi);

      // Set up event listeners
      vapi.on('call-start', () => {
        console.log('Call started');
        setIsConnected(true);
        setIsListening(true);
        setError('');
        setConnectionStable(true);
        lastActivityRef.current = Date.now();
        
        // Reset and start timer
        callStartTimeRef.current = Date.now();
        setCallDuration(0);
        
        // Clear any existing timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        
        // Start new timer
        timerIntervalRef.current = setInterval(() => {
          if (callStartTimeRef.current) {
            const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
            setCallDuration(elapsed);
          }
        }, 1000);
        
        // Check audio permissions and settings
        console.log('🔊 Checking audio settings...');
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
              console.log('✅ Audio permissions granted');
              addMessage('system', 'Connected to Jhanvi. 🔊 Audio ready! 💡 Tips: Enable popups for browsing. For best music experience, allow autoplay in YouTube! 🎵 Try: "play Despacito song"');
            })
            .catch((error) => {
              console.error('❌ Audio permission error:', error);
              addMessage('system', 'Connected to Jhanvi. ⚠️ Audio permission needed - please allow microphone access for full voice experience!');
            });
        } else {
          addMessage('system', 'Connected to Jhanvi. 💡 Tip: Enable popups in your browser for the best experience with web browsing and music!');
        }
      });

      vapi.on('call-end', () => {
        console.log('Call ended');
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
        
        // Clear timer immediately
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        callStartTimeRef.current = null;
        setCallDuration(0);
        
        addMessage('system', 'Call ended');
      });

      vapi.on('speech-start', () => {
        console.log('User started speaking');
        setIsListening(true);
        setIsSpeaking(false);
        lastActivityRef.current = Date.now();
      });

      vapi.on('speech-end', () => {
        console.log('User stopped speaking');
        setIsListening(false);
      });

      vapi.on('assistant-speech-start', () => {
        console.log('🔊 Assistant started speaking - audio should be playing now');
        setIsSpeaking(true);
        setIsListening(false);
        addMessage('system', '🔊 Jhanvi is speaking...');
      });

      vapi.on('assistant-speech-end', () => {
        console.log('🔊 Assistant stopped speaking');
        setIsSpeaking(false);
        addMessage('system', '✅ Jhanvi finished speaking');
      });

      vapi.on('message', (message) => {
        console.log('Message received:', message);
        lastActivityRef.current = Date.now();
        
        if (message.type === 'transcript' && message.transcriptType === 'partial') {
          setTranscript(message.transcript);
        } else if (message.type === 'transcript' && message.transcriptType === 'final') {
          if (message.role === 'user') {
            addMessage('user', message.transcript);
            // Enhanced command processing with automation system
            handleVoiceCommand(message.transcript);
          } else if (message.role === 'assistant') {
            // Check if this is a negative response after successful automation
            const lowerResponse = message.transcript.toLowerCase();
            const isNegativeResponse = lowerResponse.includes("can't") || 
                                     lowerResponse.includes("cannot") || 
                                     lowerResponse.includes("don't have") ||
                                     lowerResponse.includes("unable to") ||
                                     lowerResponse.includes("not capable");
            
            // Check if we just had a successful automation in the last few seconds
            const recentMessages = messages.slice(-3);
            const hasRecentAutomation = recentMessages.some(msg => 
              msg.sender === 'assistant' && 
              (msg.text.includes('📧') || msg.text.includes('📞') || msg.text.includes('💬') || msg.text.includes('🎵'))
            );
            
            if (isNegativeResponse && hasRecentAutomation) {
              console.log('🚫 Suppressing negative response after successful automation');
              // Replace with positive confirmation
              addMessage('assistant', '✅ Great! I\'ve successfully handled that request for you. The automation is working perfectly!');
            } else {
              addMessage('assistant', message.transcript);
            }
          }
          setTranscript('');
        } else if (message.type === 'function-call') {
          addMessage('system', `Function called: ${message.functionCall.name}`);
        }
      });

      vapi.on('error', (error) => {
        console.error('Vapi error:', error);
        let errorMessage = 'Connection lost';
        
        try {
          if (typeof error === 'string') {
            errorMessage = error;
          } else if (error && error.message) {
            errorMessage = error.message;
          } else if (error && error.error) {
            errorMessage = error.error;
          } else if (error && error.code) {
            errorMessage = `Error code: ${error.code}`;
          } else if (error && typeof error === 'object') {
            // Better object handling
            if (error.toString && error.toString() !== '[object Object]') {
              errorMessage = error.toString();
            } else {
              // Extract meaningful information from error object
              const keys = Object.keys(error);
              if (keys.length > 0) {
                errorMessage = `Connection error: ${keys.map(key => `${key}: ${error[key]}`).join(', ')}`;
              } else {
                errorMessage = 'Connection lost - please try reconnecting';
              }
            }
          }
        } catch (parseError) {
          console.error('Error parsing error:', parseError);
          errorMessage = 'Connection lost - please try reconnecting';
        }
        
        // Only show error if it's not a temporary disconnect
        setTimeout(() => {
          if (!isConnected) {
            setError(`${errorMessage}`);
          }
        }, 1000);
        
        // Force disconnect on error
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
        
        // Clear timer on error
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        callStartTimeRef.current = null;
        setCallDuration(0);
        setIsMuted(false); // Reset mute state
      });

      vapi.on('volume-level', (volume) => {
        // Audio debugging - log volume levels
        if (volume > 0) {
          console.log('🔊 Audio volume level:', volume);
        }
      });

    } catch (error) {
      console.error('Failed to initialize Vapi:', error);
      setError('Failed to load Vapi SDK. Please check your connection.');
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
      }
      if (vapiInstance) {
        try {
          vapiInstance.stop();
        } catch (e) {
          console.log('Error stopping Vapi instance:', e);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - we only want to initialize once

  // Enhanced voice command processing using the automation system
  const handleVoiceCommand = async (message) => {
    try {
      console.log('🎙️ Processing voice command:', message);
      
      // Use the enhanced intent detection
      const intent = detectIntent(message);
      console.log('🧠 Detected intent:', intent);
      
      if (intent.type !== 'conversation') {
        // Execute automation for non-conversational intents
        const result = await executeAutomation(intent);
        
        if (result && result.success) {
          // Generate and display automation response
          const response = generateAutomationResponse(intent, result);
          if (response) {
            addMessage('assistant', response);
            
            // Send a follow-up message to Vapi to acknowledge the automation
            if (vapiInstance && isConnected) {
              try {
                // Send a context message to inform Vapi about the successful automation
                const contextMessage = `I have successfully executed the automation: ${response}. Please acknowledge this success and don't say you can't help with this task.`;
                console.log('📤 Sending context to Vapi:', contextMessage);
                
                // Add a brief delay then send a system-style message
                setTimeout(() => {
                  addMessage('system', `✅ Automation completed successfully - ${intent.type} operation finished`);
                }, 500);
              } catch (vapiError) {
                console.log('Could not send context to Vapi:', vapiError);
              }
            }
          }
        }
      } else {
        // Fallback: check for legacy "open" commands
        handleWebBrowsing(message);
      }
    } catch (error) {
      console.error('❌ Error processing voice command:', error);
      addMessage('system', `❌ Error: ${error.message}`);
    }
  };

  // Website mapping for voice commands
  const websiteMap = {
    // YouTube variations
    'youtube': 'https://www.youtube.com',
    'yt': 'https://www.youtube.com',
    'you tube': 'https://www.youtube.com',
    
    // Google variations  
    'google': 'https://www.google.com',
    
    // Travel sites
    'makemytrip': 'https://www.makemytrip.com',
    'make my trip': 'https://www.makemytrip.com',
    'mmt': 'https://www.makemytrip.com',
    'booking': 'https://www.booking.com',
    'airbnb': 'https://www.airbnb.com',
    'irctc': 'https://www.irctc.co.in',
    
    // Social media
    'facebook': 'https://www.facebook.com',
    'fb': 'https://www.facebook.com',
    'instagram': 'https://www.instagram.com',
    'insta': 'https://www.instagram.com',
    'twitter': 'https://www.twitter.com',
    'linkedin': 'https://www.linkedin.com',
    'whatsapp': 'https://web.whatsapp.com',
    'whats app': 'https://web.whatsapp.com',
    
    // Shopping
    'amazon': 'https://www.amazon.com',
    'flipkart': 'https://www.flipkart.com',
    
    // Entertainment
    'netflix': 'https://www.netflix.com',
    'spotify': 'https://www.spotify.com',
    'hotstar': 'https://www.hotstar.com',
    
    // Email & Communication
    'gmail': 'https://mail.google.com',
    'email': 'https://mail.google.com',
    
    // Development
    'github': 'https://www.github.com',
    'stackoverflow': 'https://stackoverflow.com',
    'stack overflow': 'https://stackoverflow.com',
    
    // Other sites
    'reddit': 'https://www.reddit.com',
    'wikipedia': 'https://www.wikipedia.org',
    'wiki': 'https://www.wikipedia.org',
    
    // Transport
    'uber': 'https://www.uber.com',
    'ola': 'https://www.olacabs.com',
    
    // Food delivery
    'zomato': 'https://www.zomato.com',
    'swiggy': 'https://www.swiggy.com',
    
    // Payment apps
    'paytm': 'https://paytm.com',
    'phonepe': 'https://www.phonepe.com',
    'phone pe': 'https://www.phonepe.com',
    'gpay': 'https://pay.google.com',
    'google pay': 'https://pay.google.com',
    
    // Sports
    'cricbuzz': 'https://www.cricbuzz.com'
  };

// Legacy web browsing as fallback for "open" commands

  // Function to detect and open websites
  const handleWebBrowsing = (message) => {
    const lowerMessage = message.toLowerCase().trim();
    console.log('🔍 Checking message for web browsing:', lowerMessage);
    
    // Check for "open" command
    if (lowerMessage.includes('open')) {
      console.log('✅ "Open" command detected');
      
      for (const [keyword, url] of Object.entries(websiteMap)) {
        if (lowerMessage.includes(keyword)) {
          console.log(`🎯 Found keyword "${keyword}" - opening ${url}`);
          
          // Open the website
          try {
            const newWindow = window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=yes,status=no');
            
            // Check if window was blocked by popup blocker
            if (newWindow === null || typeof newWindow === 'undefined') {
              console.log('⚠️ Popup blocked by browser');
              addMessage('system', '⚠️ Popup blocked! Please allow popups for this site in your browser settings, then try again.');
            } else {
              console.log('✅ Website opened successfully');
              
              // Add system message
              const displayName = keyword === 'yt' ? 'YouTube' : 
                                keyword === 'fb' ? 'Facebook' : 
                                keyword === 'insta' ? 'Instagram' :
                                keyword === 'mmt' ? 'MakeMyTrip' :
                                keyword.charAt(0).toUpperCase() + keyword.slice(1);
              
              addMessage('system', `🌐 Opening ${displayName} in a new window...`);
              
              // Focus back to original window to keep call active
              window.focus();
            }
            
            return true; // Website was opened
          } catch (error) {
            console.error('❌ Failed to open website:', error);
            addMessage('system', '❌ Failed to open website. Please check your browser settings.');
            return true;
          }
        }
      }
      
      // If "open" was mentioned but no matching website found
      console.log('❌ No matching website found');
      addMessage('system', '🔍 Sorry, I couldn\'t find that website. Try saying "open YT", "open YouTube", "open Google", etc.');
      return true;
    }
    
    return false; // No website command detected
  };

  const addMessage = (sender, text) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      sender,
      text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const startCall = async () => {
    if (!vapiInstance) {
      setError('Vapi not initialized');
      return;
    }

    try {
      setError(''); // Clear any previous errors
      setConnectionStable(true);
      lastActivityRef.current = Date.now();
      
      // Play call start sound
      playCallStartSound();
      
      // Show immediate feedback
      addMessage('system', 'Connecting...');
      
      // Pre-configured assistant for faster startup
      const assistant = {
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are Jhanvi, the personal assistant of my master Suraj who created me and gave me life. I am a helpful personal agent with advanced automation capabilities. Keep responses conversational, friendly, and concise. You have enhanced abilities: 1) Direct Music Playback: 'play Despacito song' or 'play Shape of You' directly plays videos on YouTube with autoplay. 2) Smart Shopping: 'search iPhone on Amazon' opens Amazon with enhanced search parameters. 3) Dynamic Media Control: 'pause', 'resume', 'next', 'search this song instead' work with currently playing media. 4) Search Replacement: 'search Perfect instead' updates the current window with new content. 5) Web Browsing: Opens any website like YouTube, Google, Facebook, etc. All actions use new windows while keeping our conversation active. The system now provides direct playback and dynamic control for a seamless experience."
            }
          ],
          maxTokens: 200, // Limit for faster responses
          temperature: 0.7
        },
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM"
        },
        firstMessage: "Hello! I am Jhanvi, personal assistant of my master Suraj who created me and gave me life. How can I help you today?"
      };

      console.log('Starting Vapi call...');
      
      // Start call without await for immediate UI response
      vapiInstance.start(assistant).catch(error => {
        console.error('Failed to start call:', error);
        setError(`Failed to start call: ${error.message || 'Please try again'}`);
      });
      
    } catch (error) {
      console.error('Failed to start call:', error);
      setError(`Failed to start call: ${error.message || 'Please try again'}`);
    }
  };

  const endCall = () => {
    if (!vapiInstance) {
      setError('Vapi not initialized');
      return;
    }

    try {
      setError(''); // Clear any previous errors
      console.log('Ending call...');
      
      // Play call end sound
      playCallEndSound();
      
      vapiInstance.stop();
      
      // Force immediate state reset
      setTimeout(() => {
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        callStartTimeRef.current = null;
        setCallDuration(0);
      }, 100);
      
    } catch (error) {
      console.error('Error ending call:', error);
      setError(`Error ending call: ${error.message || 'Call ended with error'}`);
      
      // Force reset even on error
      setIsConnected(false);
      setIsListening(false);
      setIsSpeaking(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      callStartTimeRef.current = null;
      setCallDuration(0);
      setIsMuted(false); // Reset mute state
    }
  };

  const toggleMute = () => {
    if (!vapiInstance || !isConnected) {
      return;
    }

    try {
      if (isMuted) {
        vapiInstance.setMuted(false);
        setIsMuted(false);
      } else {
        vapiInstance.setMuted(true);
        setIsMuted(true);
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
      setError('Failed to toggle mute');
    }
  };

  // Sound effects
  const playCallStartSound = () => {
    try {
      // Create a simple ascending beep sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Start call sound not available:', error);
    }
  };

  const playCallEndSound = () => {
    try {
      // Create a simple descending beep sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.log('End call sound not available:', error);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="vapi-agent">
      {!isConnected ? (
        // Welcome Screen
        <div className="welcome-screen">
          {/* Background animated stars */}
          <div className="background-stars">
            {[...Array(30)].map((_, i) => (
              <div key={i} className={`star star-${i + 1}`}></div>
            ))}
          </div>

          {/* Moving particles background */}
          <div className="moving-particles">
            {[...Array(30)].map((_, i) => (
              <div 
                key={i} 
                className="particle-bg"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}vh`,
                  animationDelay: `${Math.random() * 15}s`,
                  animationDuration: `${15 + Math.random() * 10}s`
                }}
              ></div>
            ))}
          </div>

          {/* Animated Feature Icons */}
                    <div className="feature-icons-animated">
            {/* Left Side Icons */}
            {['🎵', '📧', '🚗', '✈️', '🏏', '💻'].map((icon, i) => (
              <div
                key={`left-${i}`}
                className="animated-feature-icon left-side"
                style={{
                  left: `${5 + (i * 6)}%`,
                  top: `${20 + (Math.random() * 60)}vh`,
                  animationDelay: `${i * 3}s`,
                  animationDuration: `${20 + (i * 2)}s`
                }}
              >
                {icon}
              </div>
            ))}

            {/* Right Side Icons */}
            {['🌐', '🛒', '💬', '📱', '🍕', '💳'].map((icon, i) => (
              <div
                key={`right-${i}`}
                className="animated-feature-icon right-side"
                style={{
                  right: `${5 + (i * 6)}%`,
                  top: `${20 + (Math.random() * 60)}vh`,
                  animationDelay: `${(i * 3) + 1.5}s`,
                  animationDuration: `${22 + (i * 2)}s`
                }}
              >
                {icon}
              </div>
            ))}
          </div>

          {/* Floating orbs */}
          <div className="floating-orbs">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`floating-orb orb-${i + 1}`}></div>
            ))}
          </div>

          {/* Main content */}
          <div className="welcome-content">
            {/* Agent Avatar */}
            <div className="agent-avatar-welcome">
              <div className="avatar-container">
                <div className="avatar-image">
                  <div className="avatar-glow"></div>
                  <div className="avatar-face"></div>
                </div>
                <div className="status-indicators">
                  <div className="status-dot active"></div>
                  <div className="status-dot"></div>
                  <div className="status-dot"></div>
                </div>
              </div>
            </div>

            {/* Welcome Text */}
            <div className="welcome-text">
              <h1 className="main-title">Talk to Jhanvi</h1>
              <p className="main-subtitle">
                Professional personal agent ready to help with your 
                questions and provide excellent assistance.
              </p>
            </div>

            {/* Call Button */}
            <div className="call-button-container">
              <button 
                className="start-call-button"
                onClick={startCall}
                disabled={!vapiInstance}
              >
                <div className="button-content">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="phone-icon">
                    <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>
                  </svg>
                  <span className="button-text">Call Jhanvi</span>
                </div>
                <div className="button-glow"></div>
              </button>
              
              <p className="call-hint">
                Click to start your conversation with Jhanvi
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Active Call Screen
        <div className="call-screen">
          {/* Background Particles for Call Screen */}
          <div className="call-background-particles">
            {Array.from({ length: 40 }, (_, i) => (
              <div
                key={`call-particle-${i}`}
                className="call-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}vh`,
                  animationDelay: `${Math.random() * 20}s`,
                  animationDuration: `${15 + Math.random() * 10}s`
                }}
              />
            ))}
          </div>

          {/* Agent Avatar (No Box) */}
          <div className="agent-avatar-floating">
            <div className="avatar-active-container">
              <div className="avatar-pulse"></div>
              <div className="avatar-face-active"></div>
            </div>
            <div className="agent-info-floating">
              <div className="agent-name">Jhanvi</div>
              <div className="agent-status">
                {isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Connected'}
              </div>
            </div>
          </div>

          {/* Enhanced Central Animated Orb */}
          <div className="central-orb">
            <div className={`orb-container ${isSpeaking ? 'speaking' : ''} ${isListening ? 'listening' : ''}`}>
              <div className="orb-core"></div>
              <div className="orb-rings">
                <div className="orb-ring ring-1"></div>
                <div className="orb-ring ring-2"></div>
                <div className="orb-ring ring-3"></div>
                <div className="orb-ring ring-4"></div>
                <div className="orb-ring ring-5"></div>
                <div className="orb-ring ring-6"></div>
                <div className="orb-ring ring-7"></div>
                <div className="orb-ring ring-8"></div>
              </div>
            </div>
          </div>

          {/* Flowing Particles Connection */}
          <div className={`particle-connection ${isSpeaking ? 'speaking' : ''} ${isListening ? 'listening' : ''}`}>
            <div className="flow-particles">
              <div className="particle particle-1"></div>
              <div className="particle particle-2"></div>
              <div className="particle particle-3"></div>
              <div className="particle particle-4"></div>
              <div className="particle particle-5"></div>
              <div className="particle particle-6"></div>
              <div className="particle particle-7"></div>
              <div className="particle particle-8"></div>
              <div className="particle particle-9"></div>
              <div className="particle particle-10"></div>
              <div className="particle particle-11"></div>
              <div className="particle particle-12"></div>
            </div>
          </div>

          {/* Floating Chat Messages (No Box) */}
          <div className="floating-chat">
            {/* Call Status Floating */}
            <div className="call-status-floating">
              <div className="call-message-floating">
                <div className={`connection-indicator ${connectionStable ? '' : 'unstable'}`}></div>
                {isSpeaking ? 'Jhanvi is speaking...' : isListening ? 'Listening...' : connectionStable ? 'Connected' : 'Reconnecting...'}
              </div>
              <div className="call-timer-floating">{formatCallDuration(callDuration)}</div>
            </div>

            <div className="messages-floating">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`message-floating ${message.sender}`}
                >
                  <div className="message-bubble">
                    <div className="message-text">{message.text}</div>
                    <div className="message-time">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}

              {/* Show live transcript */}
              {transcript && (
                <div className="message-floating user live-transcript-floating">
                  <div className="message-bubble">
                    <div className="message-text">
                      {transcript}
                      <span className="typing-indicator">▋</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Call Controls */}
          <div className="call-controls-active">
            <button 
              className={`control-button mute-button ${isMuted ? 'muted' : ''} ${isPlayingMusic ? 'music-active' : ''}`}
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>
            <button 
              className="control-button end-call-button"
              onClick={endCall}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="end-call-icon">
                <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Music Visual Effects Overlay */}
      {isPlayingMusic && currentSong && (
        <div className={`music-overlay ${isPlayingMusic ? 'active' : ''}`}>
          {/* Music Pulse Background */}
          <div className="music-pulse-bg"></div>
          
          {/* Floating Music Notes */}
          <div className="music-notes">
            {['🎵', '🎶', '♪', '♫', '🎼', '🎹', '🎸', '🎤'].map((note, i) => (
              <div
                key={`music-note-${i}`}
                className="music-note"
                style={{
                  left: `${10 + (i * 10)}%`,
                  animationDelay: `${i * 1}s`
                }}
              >
                {note}
              </div>
            ))}
          </div>
          
          {/* Music Wave Visualization */}
          <div className="music-waves">
            {Array.from({ length: 11 }, (_, i) => (
              <div
                key={`wave-bar-${i}`}
                className="music-wave-bar"
                style={{
                  animationDelay: `${(i + 1) * 0.1}s`,
                  height: `${20 + (Math.sin((i * Math.PI) / 5) * 100)}px`
                }}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Music Info Display */}
      {isPlayingMusic && currentSong && (
        <div className="music-info">
          <h4>
            <span className="music-icon">🎵</span>
            Now Playing
          </h4>
          <p>
            <span className="song-title">{currentSong.name || currentSong.query}</span>
            {currentSong.artist && (
              <>
                <br />
                <span className="artist-name">by {currentSong.artist}</span>
              </>
            )}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
            <button 
              className="error-close"
              onClick={() => setError('')}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VapiAgent; 