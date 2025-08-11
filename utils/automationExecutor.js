import { 
  generateMusicURL, 
  generateDirectVideoURL,
  generateAmazonURL,
  generateFlipkartURL,
  generateGoogleURL,
  generateMakeMyTripURL,
  generateGmailURL,
  generateWhatsAppURL,
  generatePhoneURL,
  openInNewWindow, 
  controlMedia 
} from './intentDetection';

// Window event system for better UI integration
const windowEventListeners = new Set();

export const addWindowEventListener = (callback) => {
  windowEventListeners.add(callback);
  return () => windowEventListeners.delete(callback);
};

const triggerWindowEvent = (event, data) => {
  windowEventListeners.forEach(callback => {
    try {
      callback(event, data);
    } catch (error) {
      console.warn('Window event listener error:', error);
    }
  });
};

export const executeAutomation = async (intent) => {
  let success = false;
  let error = null;
  let result = null;

  try {
    // Notify start of execution
    triggerWindowEvent('automation_started', { intent });

    switch (intent.type) {
      case 'music':
        result = await executeMusicIntent(intent);
        break;
      
      case 'shopping':
        result = await executeShoppingIntent(intent);
        break;
      
      case 'search':
        result = await executeSearchIntent(intent);
        break;
      
      case 'travel':
        result = await executeTravelIntent(intent);
        break;
      
      case 'gmail':
        result = await executeGmailIntent(intent);
        break;
      
      case 'whatsapp':
        result = await executeWhatsAppIntent(intent);
        break;
      
      case 'phone':
        result = await executePhoneIntent(intent);
        break;
      
      case 'media_control':
        result = await executeMediaControl(intent);
        break;
      
      case 'search_replace':
        result = await executeSearchReplace(intent);
        break;
      
      case 'conversation':
        // Return null to indicate this should be handled by the regular chat
        return null;
      
      default:
        throw new Error(`Unknown automation type: ${intent.type}`);
    }

    success = result && result.success;
    
    // Notify success
    triggerWindowEvent('automation_completed', { intent, result, success: true });
    
    return result;
  } catch (err) {
    error = err;
    success = false;
    
    console.error('Automation execution error:', err);
    
    // Notify error
    triggerWindowEvent('automation_completed', { intent, error: err, success: false });
    
    throw new Error(`Failed to execute ${intent.type} command: ${err.message}`);
  } finally {
    // Update statistics regardless of success/failure
    updateAutomationStats(intent, success, error);
  }
};

const executeMusicIntent = async (intent) => {
  try {
    let musicURL;
    let isDirectVideo = false;
    const platform = intent.platform || 'youtube';
    
    if (intent.directPlay) {
      // Try to get a direct playable URL
      musicURL = await generateDirectVideoURL(intent.query);
      
      // Check if we got a direct video URL
      if (typeof musicURL === 'string' && musicURL.includes('watch?v=')) {
        isDirectVideo = true;
      }
    } else {
      musicURL = generateMusicURL(intent.query, false, platform);
    }
    
    const musicWindow = openInNewWindow(musicURL, 'youtube_player');
    
    if (musicWindow) {
      // Enhanced tracking with metadata
      const windowId = trackWindow(musicWindow, 'music', intent.query, platform);
      
      // Store additional metadata for better control
      if (window.lastOpenedWindow) {
        window.lastOpenedWindow.songQuery = intent.query;
        window.lastOpenedWindow.songName = intent.songName;
        window.lastOpenedWindow.artistName = intent.artistName;
        window.lastOpenedWindow.intentType = 'music';
        window.lastOpenedWindow.isDirectVideo = isDirectVideo;
        window.lastOpenedWindow.windowId = windowId;
        window.lastOpenedWindow.autoMute = intent.autoMute;
        window.lastOpenedWindow.isPlaying = true;
      }
      
      // Trigger music playing event for UI effects
      triggerWindowEvent('music_started', { 
        intent, 
        windowId, 
        songName: intent.songName, 
        artistName: intent.artistName,
        autoMute: intent.autoMute 
      });
      
      let message;
      const songDisplay = intent.artistName ? `"${intent.songName}" by ${intent.artistName}` : `"${intent.query}"`;
      
      if (isDirectVideo) {
        message = `🎵 Playing ${songDisplay} directly on YouTube! Music starting automatically with enhanced playback.`;
      } else if (typeof musicURL === 'object' && musicURL.needsAutoClick) {
        message = `🎶 Smart search for ${songDisplay} on YouTube. Auto-clicking first result with AI selection!`;
      } else {
        message = `🎧 Found ${songDisplay} on YouTube. Click the first result for instant playback.`;
      }
      
      if (intent.autoMute) {
        message += ' 🎤 Microphone automatically muted during playback.';
      }
      
      return {
        success: true,
        message: message,
        action: 'music_playing',
        windowReference: musicWindow,
        windowId: windowId,
        query: intent.query,
        songName: intent.songName,
        artistName: intent.artistName,
        platform: platform,
        isDirectVideo: isDirectVideo,
        autoMute: intent.autoMute,
        metadata: {
          searchType: isDirectVideo ? 'direct' : 'search',
          autoClick: typeof musicURL === 'object' && musicURL.needsAutoClick,
          url: typeof musicURL === 'string' ? musicURL : musicURL.url,
          songName: intent.songName,
          artistName: intent.artistName,
          autoMute: intent.autoMute,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      throw new Error('Unable to open YouTube player. Please check if popups are blocked.');
    }
  } catch (error) {
    console.error('Music playback error:', error);
    throw new Error(`Failed to play music: ${error.message}`);
  }
};

const executeShoppingIntent = async (intent) => {
  let shoppingURL;
  let platformName;
  
  switch (intent.platform) {
    case 'flipkart':
      shoppingURL = generateFlipkartURL(intent.query);
      platformName = 'Flipkart';
      break;
    case 'amazon':
    default:
      shoppingURL = generateAmazonURL(intent.query);
      platformName = 'Amazon';
      break;
  }
  
  const shoppingWindow = openInNewWindow(shoppingURL, `${intent.platform}_shopping`);
  
  if (shoppingWindow) {
    // Store shopping context with enhanced tracking
    const windowId = trackWindow(shoppingWindow, 'shopping', intent.query, intent.platform);
    
    if (window.lastOpenedWindow) {
      window.lastOpenedWindow.searchQuery = intent.query;
      window.lastOpenedWindow.intentType = 'shopping';
      window.lastOpenedWindow.platform = intent.platform;
      window.lastOpenedWindow.windowId = windowId;
    }
    
    return {
      success: true,
      message: `🛒 Searching for "${intent.query}" on ${platformName}. Enhanced search with smart filters opened in new window.`,
      action: 'shopping_opened',
      windowReference: shoppingWindow,
      windowId: windowId,
      query: intent.query,
      platform: intent.platform,
      metadata: {
        platformName,
        searchURL: shoppingURL,
        timestamp: new Date().toISOString()
      }
    };
  } else {
    throw new Error(`Unable to open ${platformName} search. Please check if popups are blocked.`);
  }
};

const executeSearchIntent = async (intent) => {
  let searchURL;
  let platformName;
  
  switch (intent.platform) {
    case 'google':
    default:
      searchURL = generateGoogleURL(intent.query);
      platformName = 'Google';
      break;
  }
  
  const searchWindow = openInNewWindow(searchURL, `${intent.platform}_search`);
  
  if (searchWindow) {
    // Store search context
    if (window.lastOpenedWindow) {
      window.lastOpenedWindow.searchQuery = intent.query;
      window.lastOpenedWindow.intentType = 'search';
      window.lastOpenedWindow.platform = intent.platform;
    }
    
    return {
      success: true,
      message: `Searching for "${intent.query}" on ${platformName}. Results will open in a new window.`,
      action: 'search_opened',
      windowReference: searchWindow,
      query: intent.query,
      platform: intent.platform
    };
  } else {
    throw new Error(`Unable to open ${platformName} search. Please check if popups are blocked.`);
  }
};

const executeTravelIntent = async (intent) => {
  const travelURL = generateMakeMyTripURL(intent);
  const travelWindow = openInNewWindow(travelURL, 'makemytrip_flights');
  
  let message = 'Opening MakeMyTrip for flight search.';
  
  if (intent.flightType === 'indigo') {
    message = 'Searching for Indigo flights on MakeMyTrip.';
  } else if (intent.from && intent.to) {
    message = `Searching for flights from ${intent.from} to ${intent.to} on MakeMyTrip.`;
  } else if (intent.to) {
    message = `Searching for flights to ${intent.to} on MakeMyTrip.`;
  }
  
  if (intent.time) {
    message += ` Looking for flights around ${intent.time}.`;
  }
  
  if (travelWindow) {
    return {
      success: true,
      message: message + ' The search will open in a new window while our conversation continues here.',
      action: 'travel_opened',
      windowReference: travelWindow
    };
  } else {
    throw new Error('Unable to open MakeMyTrip. Please check if popups are blocked.');
  }
};

const executeGmailIntent = async (intent) => {
  try {
    const gmailURL = generateGmailURL(intent);
    const gmailWindow = openInNewWindow(gmailURL, 'gmail_window');
    
    let message = '';
    
    if (intent.action === 'compose') {
      if (intent.recipient) {
        message = `📧 Opening Gmail to compose an email to ${intent.recipient}.`;
        if (intent.subject) {
          message += ` Subject: "${intent.subject}".`;
        }
        message += ' The compose window will open automatically!';
        
        // Auto-fill additional automation features
        setTimeout(() => {
          try {
            if (gmailWindow && !gmailWindow.closed) {
              // Focus the Gmail window
              gmailWindow.focus();
              
              // Add automation hint
              console.log('📧 Gmail automation: Compose window should be pre-filled');
              
              // Inject automation script after Gmail loads
              setTimeout(() => {
                injectGmailAutomation(gmailWindow, intent);
              }, 3000);
            }
          } catch (error) {
            console.log('Gmail automation enhancement failed:', error);
          }
        }, 1000);
        
      } else {
        message = '📧 Opening Gmail compose window. Please specify the recipient email address.';
      }
    } else {
      message = '📧 Opening your Gmail inbox. All emails are now accessible in the new window.';
    }
    
    if (gmailWindow) {
      // Store Gmail context
      const windowId = trackWindow(gmailWindow, 'gmail', intent.recipient || 'inbox', 'gmail');
      
      if (window.lastOpenedWindow) {
        window.lastOpenedWindow.intentType = 'gmail';
        window.lastOpenedWindow.gmailAction = intent.action;
        window.lastOpenedWindow.recipient = intent.recipient;
        window.lastOpenedWindow.subject = intent.subject;
        window.lastOpenedWindow.windowId = windowId;
      }
      
      return {
        success: true,
        message: message,
        action: 'gmail_opened',
        windowReference: gmailWindow,
        windowId: windowId,
        gmailAction: intent.action,
        recipient: intent.recipient,
        subject: intent.subject,
        metadata: {
          action: intent.action,
          recipient: intent.recipient || null,
          subject: intent.subject || null,
          url: gmailURL,
          timestamp: new Date().toISOString(),
          userEmail: 'surajpratap20002003@gmail.com' // Your email
        }
      };
    } else {
      throw new Error('Unable to open Gmail. Please check if popups are blocked or sign in to your Google account.');
    }
  } catch (error) {
    console.error('Gmail automation error:', error);
    throw new Error(`Failed to open Gmail: ${error.message}`);
  }
};

// Gmail automation injection for enhanced functionality
const injectGmailAutomation = (gmailWindow, intent) => {
  try {
    if (!gmailWindow || gmailWindow.closed) {
      return;
    }
    
    console.log('🤖 Injecting Gmail automation enhancements...');
    
    // Enhanced Gmail automation script
    const automationScript = `
      (function() {
        console.log('📧 Gmail Voice Assistant Automation Active');
        
        // Wait for Gmail to fully load
        const waitForGmail = () => {
          return new Promise((resolve) => {
            const checkGmail = () => {
              if (document.querySelector('[role="main"]') || document.querySelector('.nH')) {
                resolve();
              } else {
                setTimeout(checkGmail, 500);
              }
            };
            checkGmail();
          });
        };
        
        waitForGmail().then(() => {
          console.log('✅ Gmail loaded, applying voice automation...');
          
          // Add voice assistant indicator
          const indicator = document.createElement('div');
          indicator.innerHTML = \`
            <div style="
              position: fixed;
              top: 20px;
              right: 20px;
              background: linear-gradient(135deg, #4285f4, #34a853);
              color: white;
              padding: 12px 20px;
              border-radius: 25px;
              z-index: 9999;
              font-family: 'Google Sans', sans-serif;
              font-size: 14px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              display: flex;
              align-items: center;
              gap: 8px;
              backdrop-filter: blur(10px);
            ">
              🎤 <strong>Voice Assistant</strong>
              <span style="opacity: 0.9;">Gmail Ready</span>
            </div>
          \`;
          document.body.appendChild(indicator);
          
          // Remove indicator after 5 seconds
          setTimeout(() => {
            if (indicator.parentNode) {
              indicator.parentNode.removeChild(indicator);
            }
          }, 5000);
          
          // If composing, enhance the compose experience
          ${intent.action === 'compose' ? `
            // Look for compose window
            setTimeout(() => {
              const composeElements = [
                'div[role="dialog"] textarea',
                'div[aria-label*="compose"] textarea',
                'textarea[aria-label*="message"]',
                '.Am[role="textbox"]'
              ];
              
              let composeFound = false;
              for (const selector of composeElements) {
                const composeBox = document.querySelector(selector);
                if (composeBox && !composeFound) {
                  composeFound = true;
                  composeBox.focus();
                  
                  // Add helpful message
                  if (composeBox.value.trim() === '') {
                    composeBox.value = 'Hello,\\n\\nI am writing to you via voice command.\\n\\nBest regards';
                    
                    // Trigger input event
                    composeBox.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                  
                  console.log('✅ Enhanced compose window with voice assistant message');
                  break;
                }
              }
              
              if (!composeFound) {
                console.log('⚠️ Compose window not found, Gmail interface may have changed');
              }
            }, 2000);
          ` : ''}
        });
      })();
    `;
    
    // Execute the script in the Gmail window
    setTimeout(() => {
      try {
        gmailWindow.eval(automationScript);
      } catch (error) {
        console.log('Cross-origin Gmail automation blocked:', error);
        
        // Show helpful message in main window
        showGmailHelper(intent);
      }
    }, 1000);
    
  } catch (error) {
    console.log('Gmail automation injection failed:', error);
    showGmailHelper(intent);
  }
};

// Show Gmail helper message
const showGmailHelper = (intent) => {
  const helpDiv = document.createElement('div');
  
  const recipientMessage = intent.action === 'compose' && intent.recipient 
    ? `Gmail opened to compose email to <strong>${intent.recipient}</strong>`
    : 'Gmail opened successfully';
    
  const tipMessage = intent.action === 'compose' 
    ? '💡 <strong>Tip:</strong> The compose window should open automatically with a pre-filled message!'
    : '💡 <strong>Tip:</strong> Your Gmail inbox is now ready to use!';
  
  helpDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 120px;
      right: 20px;
      background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      max-width: 320px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    ">
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        📧 <strong style="margin-left: 8px;">Gmail Voice Assistant</strong>
      </div>
      <div style="margin-bottom: 12px;">
        ${recipientMessage}
      </div>
      <div style="font-size: 14px; opacity: 0.9;">
        ${tipMessage}
      </div>
      <div style="font-size: 12px; opacity: 0.7; margin-top: 8px;">
        This message will disappear in 8 seconds.
      </div>
    </div>
  `;
  
  document.body.appendChild(helpDiv);
  
  setTimeout(() => {
    if (helpDiv.parentNode) {
      helpDiv.parentNode.removeChild(helpDiv);
    }
  }, 8000);
};

const executeWhatsAppIntent = async (intent) => {
  try {
    const whatsappURL = generateWhatsAppURL(intent);
    const whatsappWindow = openInNewWindow(whatsappURL, 'whatsapp_web');
    
    if (whatsappWindow) {
      // Store WhatsApp context
      const windowId = trackWindow(whatsappWindow, 'whatsapp', intent.recipient || 'whatsapp_web', 'whatsapp');
      
      if (window.lastOpenedWindow) {
        window.lastOpenedWindow.intentType = 'whatsapp';
        window.lastOpenedWindow.whatsappAction = intent.action;
        window.lastOpenedWindow.recipient = intent.recipient;
        window.lastOpenedWindow.message = intent.message;
        window.lastOpenedWindow.windowId = windowId;
      }
      
      let message = '';
      if (intent.action === 'message') {
        message = `💬 Opening WhatsApp to send message to ${intent.recipient}.`;
        if (intent.message) {
          message += ` Message: "${intent.message}"`;
        } else {
          message += ' Please dictate your message when WhatsApp opens.';
        }
        
        // Add enhanced WhatsApp messaging helper
        setTimeout(() => {
          showWhatsAppMessagingHelper(intent);
        }, 1000);
      } else {
        message = '💬 Opening WhatsApp Web. You can now access all your chats and conversations!';
        
        // Add regular WhatsApp helper
        setTimeout(() => {
          showWhatsAppHelper();
        }, 1000);
      }
      
      return {
        success: true,
        message: message,
        action: intent.action === 'message' ? 'whatsapp_message' : 'whatsapp_opened',
        windowReference: whatsappWindow,
        windowId: windowId,
        recipient: intent.recipient,
        messageContent: intent.message,
        metadata: {
          platform: 'whatsapp_web',
          action: intent.action,
          url: whatsappURL,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      throw new Error('Unable to open WhatsApp Web. Please check if popups are blocked.');
    }
  } catch (error) {
    console.error('WhatsApp automation error:', error);
    throw new Error(`Failed to open WhatsApp: ${error.message}`);
  }
};

// Show WhatsApp helper message
const showWhatsAppHelper = () => {
  const helpDiv = document.createElement('div');
  
  helpDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 140px;
      right: 20px;
      background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      max-width: 320px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    ">
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        💬 <strong style="margin-left: 8px;">WhatsApp Voice Assistant</strong>
      </div>
      <div style="margin-bottom: 12px;">
        WhatsApp Web opened successfully!
      </div>
      <div style="font-size: 14px; opacity: 0.9;">
        💡 <strong>Tip:</strong> Scan the QR code with your phone to access your chats and start messaging!
      </div>
      <div style="font-size: 12px; opacity: 0.7; margin-top: 8px;">
        This message will disappear in 8 seconds.
      </div>
    </div>
  `;
  
  document.body.appendChild(helpDiv);
  
  setTimeout(() => {
    if (helpDiv.parentNode) {
      helpDiv.parentNode.removeChild(helpDiv);
    }
  }, 8000);
};

// Show WhatsApp messaging helper
const showWhatsAppMessagingHelper = (intent) => {
  const helpDiv = document.createElement('div');
  
  helpDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 140px;
      right: 20px;
      background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      max-width: 340px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    ">
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        💬 <strong style="margin-left: 8px;">WhatsApp Messaging</strong>
      </div>
      <div style="margin-bottom: 12px;">
        Ready to message <strong>${intent.recipient}</strong>!
      </div>
      <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">
        📱 <strong>Steps:</strong><br/>
        1. Scan QR code with your phone<br/>
        2. Search for "${intent.recipient}" in contacts<br/>
        3. Open the chat and type your message
      </div>
      ${intent.message ? `
        <div style="font-size: 13px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px; margin-top: 8px;">
          <strong>Suggested message:</strong><br/>
          "${intent.message}"
        </div>
      ` : ''}
      <div style="font-size: 12px; opacity: 0.7; margin-top: 8px;">
        This helper will disappear in 10 seconds.
      </div>
    </div>
  `;
  
  document.body.appendChild(helpDiv);
  
  setTimeout(() => {
    if (helpDiv.parentNode) {
      helpDiv.parentNode.removeChild(helpDiv);
    }
  }, 10000);
};

const executePhoneIntent = async (intent) => {
  try {
    if (intent.isNumber) {
      // Enhanced phone number calling with multiple methods
      const phoneURL = generatePhoneURL(intent);
      
      // Show enhanced calling helper with multiple options
      showEnhancedCallingHelper(intent);
      
      // Try multiple calling methods
      try {
        // Method 1: tel: protocol (works on mobile/some desktop apps)
        if (phoneURL) {
          window.open(phoneURL, '_self');
        }
        
        // Method 2: Also try opening in new window
        setTimeout(() => {
          if (phoneURL) {
            window.open(phoneURL, '_blank');
          }
        }, 500);
        
      } catch (telError) {
        console.log('Tel protocol failed:', telError);
      }
      
      return {
        success: true,
        message: `📞 Attempting to call ${intent.number}. Check your device for calling options or dial manually if needed.`,
        action: 'phone_call',
        number: intent.number,
        target: intent.target,
        metadata: {
          callType: 'direct',
          number: intent.number,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      // Contact name calling - provide guidance
      showPhoneHelper(intent);
      
      return {
        success: true,
        message: `📞 Ready to help you call ${intent.contactName}! Check the helper popup for guidance.`,
        action: 'phone_guidance',
        contactName: intent.contactName,
        target: intent.target,
        metadata: {
          callType: 'contact',
          contactName: intent.contactName,
          timestamp: new Date().toISOString()
        }
      };
    }
    
  } catch (error) {
    console.error('Phone automation error:', error);
    throw new Error(`Failed to make phone call: ${error.message}`);
  }
};

// Show phone helper message
const showPhoneHelper = (intent) => {
  const helpDiv = document.createElement('div');
  
  helpDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 160px;
      right: 20px;
      background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      max-width: 320px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    ">
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        📞 <strong style="margin-left: 8px;">Phone Call Assistant</strong>
      </div>
      <div style="margin-bottom: 12px;">
        Want to call <strong>${intent.contactName}</strong>?
      </div>
      <div style="font-size: 14px; opacity: 0.9;">
        💡 <strong>Options:</strong><br/>
        • Open your phone's contacts app<br/>
        • Search for "${intent.contactName}"<br/>
        • Or say "call" followed by the actual number
      </div>
      <div style="font-size: 12px; opacity: 0.7; margin-top: 8px;">
        This message will disappear in 8 seconds.
      </div>
    </div>
  `;
  
  document.body.appendChild(helpDiv);
  
  setTimeout(() => {
    if (helpDiv.parentNode) {
      helpDiv.parentNode.removeChild(helpDiv);
    }
  }, 8000);
};

// Show enhanced calling helper with multiple options
const showEnhancedCallingHelper = (intent) => {
  const helpDiv = document.createElement('div');
  const formattedNumber = intent.number.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  
  helpDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 160px;
      right: 20px;
      background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      max-width: 350px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    ">
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        📞 <strong style="margin-left: 8px;">Call ${formattedNumber}</strong>
      </div>
      <div style="margin-bottom: 12px;">
        Choose how to make the call:
      </div>
      
      <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
        <div style="font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 8px;">
          ${formattedNumber}
        </div>
        <button onclick="navigator.clipboard.writeText('${intent.number}'); this.innerHTML='📋 Copied!'; setTimeout(() => this.innerHTML='📋 Copy Number', 2000);" 
                style="width: 100%; padding: 8px; background: rgba(255,255,255,0.2); border: none; border-radius: 6px; color: white; cursor: pointer; font-size: 14px;">
          📋 Copy Number
        </button>
      </div>
      
      <div style="font-size: 14px; opacity: 0.9; margin-bottom: 10px;">
        <strong>📱 Options:</strong><br/>
        • If popup appeared, click to call<br/>
        • Copy number and dial manually<br/>
        • Use your phone's dialer app<br/>
        • If on mobile, calling should work directly
      </div>
      
      <div style="display: flex; gap: 8px; margin-bottom: 8px;">
        <button onclick="window.open('tel:${intent.number}', '_blank');" 
                style="flex: 1; padding: 8px; background: rgba(255,255,255,0.2); border: none; border-radius: 6px; color: white; cursor: pointer; font-size: 12px;">
          🔄 Try Call Again
        </button>
        <button onclick="this.parentElement.parentElement.parentElement.remove();" 
                style="flex: 1; padding: 8px; background: rgba(255,255,255,0.1); border: none; border-radius: 6px; color: white; cursor: pointer; font-size: 12px;">
          ❌ Close
        </button>
      </div>
      
      <div style="font-size: 12px; opacity: 0.7; text-align: center;">
        This helper will disappear in 15 seconds.
      </div>
    </div>
  `;
  
  document.body.appendChild(helpDiv);
  
  setTimeout(() => {
    if (helpDiv.parentNode) {
      helpDiv.parentNode.removeChild(helpDiv);
    }
  }, 15000);
};

const executeMediaControl = async (intent) => {
  try {
    console.log(`Executing media control: ${intent.action}`);
    
    // Enhanced media control with feedback
    const result = controlMedia(intent.action);
    
    const actionMessages = {
      pause: 'Pausing current media playback.',
      stop: 'Stopping current media playback.',
      resume: 'Resuming media playback.',
      next: 'Skipping to next track/video.',
      previous: 'Going to previous track/video.',
      volume_up: 'Increasing volume.',
      volume_down: 'Decreasing volume.',
      mute: 'Toggling audio mute.'
    };
    
    // Check if we have an active window to control
    let windowInfo = '';
    if (window.lastOpenedWindow && !window.lastOpenedWindow.window.closed) {
      const windowType = window.lastOpenedWindow.intentType || 'media';
      const query = window.lastOpenedWindow.songQuery || window.lastOpenedWindow.searchQuery || '';
      if (query) {
        windowInfo = ` (controlling ${windowType}: "${query}")`;
      }
    }
    
    return {
      success: true,
      message: (actionMessages[intent.action] || 'Media control executed.') + windowInfo,
      action: 'media_controlled',
      controlAction: intent.action
    };
  } catch (error) {
    throw new Error(`Failed to control media: ${error.message}`);
  }
};

const executeSearchReplace = async (intent) => {
  try {
    console.log(`Executing search replacement with query: ${intent.query}`);
    
    // If we have an active window, try to replace its content
    if (window.lastOpenedWindow && !window.lastOpenedWindow.window.closed) {
      const windowType = window.lastOpenedWindow.intentType;
      const platform = window.lastOpenedWindow.platform;
      
      if (windowType === 'music') {
        // Replace with new music search
        const newMusicURL = await generateDirectVideoURL(intent.query);
        window.lastOpenedWindow.window.location.href = newMusicURL;
        window.lastOpenedWindow.songQuery = intent.query;
        
        return {
          success: true,
          message: `Searching for "${intent.query}" instead. Updating the current YouTube window.`,
          action: 'search_replaced',
          query: intent.query,
          windowType: 'music'
        };
      } else if (windowType === 'shopping') {
        // Replace with new shopping search
        let newShoppingURL;
        let platformName;
        
        if (platform === 'flipkart') {
          newShoppingURL = generateFlipkartURL(intent.query);
          platformName = 'Flipkart';
        } else {
          newShoppingURL = generateAmazonURL(intent.query);
          platformName = 'Amazon';
        }
        
        window.lastOpenedWindow.window.location.href = newShoppingURL;
        window.lastOpenedWindow.searchQuery = intent.query;
        
        return {
          success: true,
          message: `Searching for "${intent.query}" instead on ${platformName}. Updating the current shopping window.`,
          action: 'search_replaced',
          query: intent.query,
          windowType: 'shopping'
        };
      } else if (windowType === 'search') {
        // Replace with new Google search
        const newSearchURL = generateGoogleURL(intent.query);
        window.lastOpenedWindow.window.location.href = newSearchURL;
        window.lastOpenedWindow.searchQuery = intent.query;
        
        return {
          success: true,
          message: `Searching for "${intent.query}" instead on Google. Updating the current search window.`,
          action: 'search_replaced',
          query: intent.query,
          windowType: 'search'
        };
      }
    }
    
    // If no active window, open new music search by default
    const musicURL = await generateDirectVideoURL(intent.query);
    const musicWindow = openInNewWindow(musicURL, 'youtube_player');
    
    if (musicWindow) {
      return {
        success: true,
        message: `Searching for "${intent.query}" on YouTube in a new window.`,
        action: 'new_search_opened',
        windowReference: musicWindow,
        query: intent.query
      };
    } else {
      throw new Error('Unable to open new search. Please check if popups are blocked.');
    }
  } catch (error) {
    throw new Error(`Failed to replace search: ${error.message}`);
  }
};

// Enhanced window tracking with better state management and analytics
const openWindows = new Map();
let currentActiveWindow = null;
const automationStats = {
  totalExecutions: 0,
  successfulExecutions: 0,
  failedExecutions: 0,
  executionHistory: [],
  dailyStats: new Map()
};

// Get today's date key
const getTodayKey = () => new Date().toISOString().split('T')[0];

// Update automation statistics
export const updateAutomationStats = (intent, success = true, error = null) => {
  const today = getTodayKey();
  const execution = {
    id: Date.now(),
    intent: intent.type,
    query: intent.query || intent.originalText,
    timestamp: new Date().toISOString(),
    success,
    error: error?.message || null
  };

  // Update global stats
  automationStats.totalExecutions++;
  if (success) {
    automationStats.successfulExecutions++;
  } else {
    automationStats.failedExecutions++;
  }

  // Update daily stats
  if (!automationStats.dailyStats.has(today)) {
    automationStats.dailyStats.set(today, {
      total: 0,
      successful: 0,
      failed: 0,
      types: new Map()
    });
  }

  const dailyStat = automationStats.dailyStats.get(today);
  dailyStat.total++;
  if (success) {
    dailyStat.successful++;
  } else {
    dailyStat.failed++;
  }

  // Update intent type stats
  const currentTypeCount = dailyStat.types.get(intent.type) || 0;
  dailyStat.types.set(intent.type, currentTypeCount + 1);

  // Add to history (keep last 50)
  automationStats.executionHistory.unshift(execution);
  if (automationStats.executionHistory.length > 50) {
    automationStats.executionHistory.pop();
  }

  // Save to localStorage for persistence
  try {
    localStorage.setItem('automationStats', JSON.stringify({
      ...automationStats,
      dailyStats: Array.from(automationStats.dailyStats.entries())
    }));
  } catch (error) {
    console.warn('Failed to save automation stats:', error);
  }
};

// Load automation statistics from localStorage
export const loadAutomationStats = () => {
  try {
    const saved = localStorage.getItem('automationStats');
    if (saved) {
      const data = JSON.parse(saved);
      Object.assign(automationStats, {
        ...data,
        dailyStats: new Map(data.dailyStats || [])
      });
    }
  } catch (error) {
    console.warn('Failed to load automation stats:', error);
  }
};

// Get automation statistics
export const getAutomationStats = () => {
  const today = getTodayKey();
  const todayStats = automationStats.dailyStats.get(today) || {
    total: 0,
    successful: 0,
    failed: 0
  };

  return {
    ...automationStats,
    todayExecutions: todayStats.total,
    todaySuccessful: todayStats.successful,
    todayFailed: todayStats.failed,
    successRate: automationStats.totalExecutions > 0 
      ? Math.round((automationStats.successfulExecutions / automationStats.totalExecutions) * 100) + '%'
      : '100%'
  };
};

export const trackWindow = (windowRef, type, query, platform = null) => {
  if (windowRef) {
    const windowId = Date.now().toString();
    const windowData = {
      window: windowRef,
      type,
      query,
      platform,
      openedAt: new Date(),
      isActive: true,
      focused: false,
      minimized: false,
      lastActivity: new Date()
    };
    
    openWindows.set(windowId, windowData);
    currentActiveWindow = windowId;
    
    // Enhanced cleanup with state tracking and activity monitoring
    const checkClosed = setInterval(() => {
      if (windowRef.closed) {
        openWindows.delete(windowId);
        if (currentActiveWindow === windowId) {
          currentActiveWindow = null;
        }
        clearInterval(checkClosed);
        
        // Notify about window closure
        triggerWindowEvent('window_closed', { windowId, type, query });
      } else {
        // Update activity status
        windowData.lastActivity = new Date();
        try {
          windowData.focused = windowRef.document.hasFocus();
        } catch (e) {
          // Cross-origin restriction - ignore
        }
      }
    }, 1000);
    
    // Notify about new window
    triggerWindowEvent('window_opened', { windowId, type, query, platform });
    
    return windowId;
  }
  return null;
};

export const getActiveWindow = () => {
  if (currentActiveWindow && openWindows.has(currentActiveWindow)) {
    const windowData = openWindows.get(currentActiveWindow);
    if (!windowData.window.closed) {
      return windowData;
    } else {
      // Clean up closed window
      openWindows.delete(currentActiveWindow);
      currentActiveWindow = null;
    }
  }
  return null;
};

export const getOpenWindows = () => {
  // Clean up closed windows
  for (const [id, windowData] of openWindows.entries()) {
    if (windowData.window.closed) {
      openWindows.delete(id);
      if (currentActiveWindow === id) {
        currentActiveWindow = null;
      }
    }
  }
  return Array.from(openWindows.entries());
};

export const closeWindow = (windowId) => {
  const windowData = openWindows.get(windowId);
  if (windowData && !windowData.window.closed) {
    windowData.window.close();
    openWindows.delete(windowId);
    if (currentActiveWindow === windowId) {
      currentActiveWindow = null;
    }
    return true;
  }
  return false;
};

export const closeAllWindows = () => {
  for (const [id, windowData] of openWindows.entries()) {
    if (!windowData.window.closed) {
      windowData.window.close();
    }
    triggerWindowEvent('window_closed', { windowId: id, type: windowData.type, query: windowData.query });
  }
  openWindows.clear();
  currentActiveWindow = null;
  triggerWindowEvent('all_windows_closed', {});
};

// Initialize stats on module load
loadAutomationStats();

// Smart response generation based on automation results
export const generateAutomationResponse = (intent, result) => {
  if (!result || !result.success) {
    return null;
  }
  
  const responses = {
    music: [
      `🎵 ${result.message}`,
      `Great choice! ${result.message}`,
      `🎶 ${result.message}`,
      `🎧 ${result.message}`
    ],
    shopping: [
      `🛒 ${result.message}`,
      `Perfect! ${result.message}`,
      `🔍 ${result.message}`,
      `🛍️ ${result.message}`
    ],
    search: [
      `🔍 ${result.message}`,
      `Found it! ${result.message}`,
      `🌐 ${result.message}`,
      `📝 ${result.message}`
    ],
    travel: [
      `✈️ ${result.message}`,
      `Excellent! ${result.message}`,
      `🧳 ${result.message}`,
      `🌍 ${result.message}`
    ],
    media_control: [
      `🎛️ ${result.message}`,
      `Done! ${result.message}`,
      `✅ ${result.message}`,
      `🎮 ${result.message}`
    ],
    search_replace: [
      `🔄 ${result.message}`,
      `Updated! ${result.message}`,
      `🆕 ${result.message}`,
      `✨ ${result.message}`
    ],
    gmail: [
      `📧 ${result.message}`,
      `Perfect! ${result.message}`,
      `✅ ${result.message}`,
      `📬 ${result.message}`
    ],
    whatsapp: [
      `💬 ${result.message}`,
      `Great! ${result.message}`,
      `✅ ${result.message}`,
      `📱 ${result.message}`
    ],
    phone: [
      `📞 ${result.message}`,
      `Calling! ${result.message}`,
      `✅ ${result.message}`,
      `📱 ${result.message}`
    ]
  };
  
  const typeResponses = responses[intent.type] || [`✅ ${result.message}`];
  return typeResponses[Math.floor(Math.random() * typeResponses.length)];
}; 