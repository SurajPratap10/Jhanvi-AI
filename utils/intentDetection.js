// Intent Detection and Command Processing
export const detectIntent = (text) => {
  const lowerText = text.toLowerCase().trim();
  
  // Enhanced music intents with better song recognition
  const musicKeywords = ['play', 'music', 'song', 'album', 'artist', 'spotify', 'youtube music', 'yt'];
  const musicPattern = /(?:play|listen to|put on)\s+(.*?)(?:\s+(?:song|music|track|album|by|on youtube|on yt))?$/i;
  
  // Enhanced song name detection patterns
  const songRequestPattern = /(?:play|listen to|put on|start|begin)\s+(?:the\s+song\s+|a\s+song\s+)?(.+?)(?:\s+(?:song|music|track|album|by|on youtube|on yt|please))?$/i;
  const artistSongPattern = /(?:play|listen to|put on)\s+(.+?)\s+by\s+(.+?)(?:\s+(?:song|music|track|album|on youtube|on yt))?$/i;
  
  // Shopping intents with improved patterns
  const shoppingKeywords = ['buy', 'search', 'amazon', 'flipkart', 'shop', 'purchase', 'order', 'find'];
  const amazonPattern = /(?:search|buy|find|look for|shop for)\s+(.*?)(?:\s+(?:on|in)\s+amazon)?$/i;
  const explicitAmazonPattern = /(?:search|find|look for|buy)\s+(.*?)\s+(?:on|in)\s+amazon/i;
  const flipkartPattern = /(?:search|buy|find|look for|shop for)\s+(.*?)(?:\s+(?:on|in)\s+flipkart)?$/i;
  const explicitFlipkartPattern = /(?:search|find|look for|buy)\s+(.*?)\s+(?:on|in)\s+flipkart/i;
  
  // Google search intents
  const googleKeywords = ['google', 'search'];
  const googlePattern = /(?:search|google|find|look for)\s+(.*?)(?:\s+(?:on|in)\s+google)?$/i;
  const explicitGooglePattern = /(?:search|find|look for|google)\s+(.*?)\s+(?:on|in)\s+google/i;
  
  // Travel intents
  const travelKeywords = ['flight', 'flights', 'book', 'travel', 'makemytrip', 'indigo', 'air india', 'spicejet'];
  const flightPattern = /(?:show|find|book|search)\s+(?:flights?|indigo flights?)\s*(?:from\s+(.*?)\s+to\s+(.*?)|to\s+(.*?)|from\s+(.*?))?(?:\s+(?:at|from|around)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{1,2}\s*-\s*\d{1,2}\s*(?:am|pm)))?/i;
  
  // Gmail intents
  const gmailKeywords = ['gmail', 'email', 'mail', 'compose', 'send', 'write'];
  const gmailPattern = /(?:open|go to|check)\s+(?:my\s+)?gmail/i;
  const composePattern = /(?:write|compose|send)\s+(?:a\s+|an\s+)?(?:email|mail)\s+to\s+(.*?)(?:\s+(?:about|regarding|with subject)\s+(.*?))?$/i;
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  
  // WhatsApp intents
  const whatsappKeywords = ['whatsapp', 'whats app', 'what\'s app', 'message', 'text', 'chat'];
  const whatsappPattern = /(?:open|go to|launch|start)\s+(?:whatsapp|whats app|what's app)/i;
  const whatsappMessagePattern = /(?:write|send|text|message)\s+(?:a\s+)?(?:message|text|chat)\s+to\s+(.*?)(?:\s+saying\s+(.*?))?$/i;
  
  // Phone calling intents
  const phoneKeywords = ['call', 'dial', 'phone'];
  const phonePattern = /(?:call|dial|phone)\s+(?:to\s+)?(.+)/i;
  const numberPattern = /[\d\s\-\(\)\+]+/g;
  
  // Enhanced media control intents with music-specific commands
  const mediaControls = ['pause', 'stop', 'resume', 'play again', 'continue', 'next', 'previous', 'skip', 'volume up', 'volume down', 'mute', 'louder', 'quieter', 'pause music', 'stop music', 'stop the music', 'pause the song', 'stop the song', 'next song', 'previous song', 'skip song'];
  const searchReplacePattern = /search\s+(.*?)\s+instead/i;
  
  // Check for search replacement first (highest priority for active sessions)
  if (lowerText.includes('search') && lowerText.includes('instead')) {
    const match = text.match(searchReplacePattern);
    return {
      type: 'search_replace',
      query: match ? match[1].trim() : 'new search',
      originalText: text
    };
  }
  
  // Check for media controls (high priority)
  if (mediaControls.some(control => lowerText.includes(control))) {
    return {
      type: 'media_control',
      action: getMediaAction(lowerText),
      originalText: text
    };
  }
  
  // Check for music intent with enhanced song detection
  if (musicKeywords.some(keyword => lowerText.includes(keyword))) {
    let songName = '';
    let artistName = '';
    
    // Try artist-song pattern first (e.g., "play Shape of You by Ed Sheeran")
    const artistMatch = text.match(artistSongPattern);
    if (artistMatch) {
      songName = artistMatch[1].trim();
      artistName = artistMatch[2].trim();
    } else {
      // Try general song request pattern
      const songMatch = text.match(songRequestPattern) || text.match(musicPattern);
      if (songMatch) {
        songName = songMatch[1].trim();
      } else {
        songName = extractMusicQuery(text);
      }
    }
    
    // Create the search query
    const searchQuery = artistName ? `${songName} ${artistName}` : songName;
    
    return {
      type: 'music',
      action: 'play',
      query: searchQuery,
      songName: songName,
      artistName: artistName || null,
      directPlay: true, // Flag for direct video playback with auto-mute
      autoMute: true, // Flag for automatic microphone muting
      originalText: text
    };
  }
  
  // Check for explicit Amazon shopping intent
  if (lowerText.includes('amazon')) {
    const explicitMatch = text.match(explicitAmazonPattern);
    const match = explicitMatch || text.match(amazonPattern);
    return {
      type: 'shopping',
      platform: 'amazon',
      query: match ? match[1].trim() : extractShoppingQuery(text),
      originalText: text
    };
  }
  
  // Check for explicit Flipkart shopping intent
  if (lowerText.includes('flipkart')) {
    const explicitMatch = text.match(explicitFlipkartPattern);
    const match = explicitMatch || text.match(flipkartPattern);
    return {
      type: 'shopping',
      platform: 'flipkart',
      query: match ? match[1].trim() : extractShoppingQuery(text),
      originalText: text
    };
  }
  
  // Check for explicit Google search intent
  if (lowerText.includes('google') || (lowerText.includes('search') && !lowerText.includes('amazon') && !lowerText.includes('flipkart'))) {
    const explicitMatch = text.match(explicitGooglePattern);
    const match = explicitMatch || text.match(googlePattern);
    return {
      type: 'search',
      platform: 'google',
      query: match ? match[1].trim() : extractSearchQuery(text),
      originalText: text
    };
  }
  
  // Check for general shopping intent (defaults to Amazon)
  if (shoppingKeywords.some(keyword => lowerText.includes(keyword))) {
    const match = text.match(amazonPattern);
    return {
      type: 'shopping',
      platform: 'amazon',
      query: match ? match[1].trim() : extractShoppingQuery(text),
      originalText: text
    };
  }
  
  // Check for phone calling intents
  if (phoneKeywords.some(keyword => lowerText.includes(keyword))) {
    const match = text.match(phonePattern);
    if (match) {
      const target = match[1].trim();
      
      // Check if it's a number or contact name
      const numberMatch = target.match(numberPattern);
      const isNumber = numberMatch && numberMatch.join('').replace(/\D/g, '').length >= 7;
      
      return {
        type: 'phone',
        action: 'call',
        target: target,
        isNumber: isNumber,
        number: isNumber ? numberMatch.join('').replace(/\D/g, '') : null,
        contactName: !isNumber ? target : null,
        originalText: text
      };
    }
  }
  
  // Check for WhatsApp intents
  if (whatsappKeywords.some(keyword => lowerText.includes(keyword))) {
    // Check for WhatsApp messaging intent
    const messageMatch = text.match(whatsappMessagePattern);
    if (messageMatch) {
      const recipient = messageMatch[1].trim();
      const message = messageMatch[2] ? messageMatch[2].trim() : '';
      
      return {
        type: 'whatsapp',
        action: 'message',
        recipient: recipient,
        message: message,
        originalText: text
      };
    }
    
    // Check for general WhatsApp open
    if (text.match(whatsappPattern)) {
      return {
        type: 'whatsapp',
        action: 'open',
        originalText: text
      };
    }
    
    // Default WhatsApp intent
    return {
      type: 'whatsapp',
      action: 'open',
      originalText: text
    };
  }
  
  // Check for Gmail intents
  if (gmailKeywords.some(keyword => lowerText.includes(keyword))) {
    // Check for compose email intent
    const composeMatch = text.match(composePattern);
    if (composeMatch) {
      const recipientText = composeMatch[1].trim();
      const subject = composeMatch[2] ? composeMatch[2].trim() : '';
      
      // Extract email address from recipient text
      const emailMatch = recipientText.match(emailPattern);
      const recipientEmail = emailMatch ? emailMatch[0] : recipientText;
      
      return {
        type: 'gmail',
        action: 'compose',
        recipient: recipientEmail,
        subject: subject,
        originalText: text
      };
    }
    
    // Check for open Gmail intent
    if (text.match(gmailPattern)) {
      return {
        type: 'gmail',
        action: 'open',
        originalText: text
      };
    }
    
    // General Gmail intent
    return {
      type: 'gmail',
      action: 'open',
      originalText: text
    };
  }
  
  // Check for travel intent
  if (travelKeywords.some(keyword => lowerText.includes(keyword))) {
    const match = text.match(flightPattern);
    return {
      type: 'travel',
      platform: 'makemytrip',
      flightType: lowerText.includes('indigo') ? 'indigo' : 'general',
      from: match && (match[1] || match[4]) ? (match[1] || match[4]).trim() : null,
      to: match && (match[2] || match[3]) ? (match[2] || match[3]).trim() : null,
      time: match && match[5] ? match[5].trim() : null,
      originalText: text
    };
  }
  
  // Default: conversational intent
  return {
    type: 'conversation',
    originalText: text
  };
};

const getMediaAction = (text) => {
  const lowerText = text.toLowerCase();
  
  // Priority order for overlapping commands
  if (lowerText.includes('stop the music') || lowerText.includes('stop the song') || lowerText.includes('stop music')) return 'stop';
  if (lowerText.includes('pause the music') || lowerText.includes('pause the song') || lowerText.includes('pause music')) return 'pause';
  if (lowerText.includes('next song') || lowerText.includes('skip song')) return 'next';
  if (lowerText.includes('previous song')) return 'previous';
  
  // General commands
  if (lowerText.includes('pause')) return 'pause';
  if (lowerText.includes('stop')) return 'stop';
  if (lowerText.includes('resume') || lowerText.includes('continue') || lowerText.includes('play again')) return 'resume';
  if (lowerText.includes('next') || lowerText.includes('skip')) return 'next';
  if (lowerText.includes('previous') || lowerText.includes('back')) return 'previous';
  if (lowerText.includes('volume up') || lowerText.includes('louder')) return 'volume_up';
  if (lowerText.includes('volume down') || lowerText.includes('quieter')) return 'volume_down';
  if (lowerText.includes('mute')) return 'mute';
  
  return 'pause'; // default
};

const extractMusicQuery = (text) => {
  // Remove common music command words to get the actual song/artist
  const cleanText = text.replace(/(?:play|listen to|put on|music|song|track|album|by|on youtube|on yt)\s*/gi, '').trim();
  return cleanText || 'music';
};

const extractShoppingQuery = (text) => {
  // Remove common shopping command words
  const cleanText = text.replace(/(?:search|buy|find|look for|shop for|on amazon|in amazon|on flipkart|in flipkart)\s*/gi, '').trim();
  return cleanText || 'products';
};

const extractSearchQuery = (text) => {
  // Remove common search command words
  const cleanText = text.replace(/(?:search|google|find|look for|on google|in google)\s*/gi, '').trim();
  return cleanText || 'search';
};

// Enhanced URL Generators for different services with multiple music platforms
export const generateMusicURL = (query, directPlay = false, platform = 'youtube') => {
  const encodedQuery = encodeURIComponent(query);
  
  switch (platform) {
    case 'spotify':
      return `https://open.spotify.com/search/${encodedQuery}`;
    case 'soundcloud':
      return `https://soundcloud.com/search?q=${encodedQuery}`;
    case 'youtube_music':
      return `https://music.youtube.com/search?q=${encodedQuery}`;
    case 'youtube':
    default:
      if (directPlay) {
        // Use YouTube search with enhanced parameters for auto-play
        return `https://www.youtube.com/results?search_query=${encodedQuery}&sp=EgIQAQ%253D%253D`;
      }
      return `https://music.youtube.com/search?q=${encodedQuery}`;
  }
};

// Enhanced YouTube video finder - attempts to find and play specific video
export const generateDirectVideoURL = async (query) => {
  try {
    // Since we can't make API calls from frontend without CORS issues,
    // we'll use multiple strategies for better autoplay success
    const encodedQuery = encodeURIComponent(query);
    
    // Strategy 1: Expanded popular songs database with more hits
    const popularSongs = {
      'despacito': 'kJQP7kiw5Fk',
      'shape of you': 'JGwWNGJdvx8', 
      'perfect': 'tgPXVfcF3sY',
      'blinding lights': '4NRXx6U8ABQ',
      'watermelon sugar': 'H7bqZIpC3Pg',
      'levitating': 'TUVcZfQe-Kw',
      'drivers license': 'ZmDBbnmKpqQ',
      'stay': 'qjVBag8nPy0',
      'good 4 u': 'gNi_6U5Pm_o',
      'supreme': 'AX1zRInC_TA',
      'that girl': 'oGORM1_ziSY',
      'fell for you': 'SiKfBBoF51w',
      'aath asle': '0FnZO-U5oHo',
      'together': '7iy8iB8tu5c',
      'heat waves': 'mRD0-GxqHVo',
      'as it was': 'H5v3kku4y6Q',
      'bad habit': 'orJSJGHjBLI',
      'anti hero': 'b1kbLWvqugk',
      'flowers': 'G7KNmW9a75Y',
      'unholy': 'Uq9gPaIzbe8',
      'sunflower': 'ApXoWvfEYVU',
      'somebody that i used to know': '8UVNT4wvIGY',
      'rolling in the deep': 'rYEDA3JcQqw',
      'bohemian rhapsody': 'fJ9rUzIMcZQ',
      'imagine': 'YkgkThdzX-8',
      'hotel california': '09839DpTctU',
      'sweet child o mine': '1w7OgIMMRc4',
      'smells like teen spirit': 'hTWKbfoikeg',
      'billie jean': 'Zi_XLOBDo_Y',
      'thriller': 'sOnqjkJTMaA',
      'dancing queen': 'xFrGuyw1V8s',
      'dont stop believin': '1k8craCGpgs',
      'sweet caroline': '1vhFnTjia_I',
      'wonderwall': 'bx1Bh8ZvH84',
      'hey jude': 'A_MjCqQoLLA',
      'let it be': 'QDYfEBY9NM4'
    };
    
    const queryLower = query.toLowerCase().trim();
    
    // Check for exact matches or partial matches
    for (const [songKey, videoId] of Object.entries(popularSongs)) {
      if (queryLower.includes(songKey) || songKey.includes(queryLower)) {
        console.log(`🎯 Found direct match for: ${songKey} -> ${videoId}`);
        // Direct video URL with enhanced autoplay parameters
        return `https://www.youtube.com/watch?v=${videoId}&autoplay=1&mute=0&start=0&enablejsapi=1`;
      }
    }
    
    // Strategy 2: Enhanced search URL with aggressive autoplay parameters
    const searchUrl = `https://www.youtube.com/results?search_query=${encodedQuery}&sp=EgIQAQ%253D%253D`;
    
    // Return search URL with enhanced autoplay configuration
    return {
      url: searchUrl,
      needsAutoClick: true,
      needsAggressiveAutoplay: true,
      query: query,
      encodedQuery: encodedQuery
    };
    
  } catch (error) {
    console.error('Error generating direct video URL:', error);
    return generateMusicURL(query, true);
  }
};

export const generateAmazonURL = (query) => {
  const encodedQuery = encodeURIComponent(query);
  // Enhanced Amazon URL with better search parameters
  return `https://www.amazon.com/s?k=${encodedQuery}&ref=nb_sb_noss`;
};

export const generateFlipkartURL = (query) => {
  const encodedQuery = encodeURIComponent(query);
  // Enhanced Flipkart URL with better search parameters
  return `https://www.flipkart.com/search?q=${encodedQuery}&sort=relevance`;
};

export const generateGoogleURL = (query) => {
  const encodedQuery = encodeURIComponent(query);
  // Enhanced Google URL with better search parameters
  return `https://www.google.com/search?q=${encodedQuery}&sourceid=chrome&ie=UTF-8`;
};

export const generateMakeMyTripURL = (intent) => {
  const baseURL = 'https://www.makemytrip.com/flight/search';
  
  if (intent.flightType === 'indigo') {
    // If specifically asking for Indigo flights
    const query = intent.from && intent.to 
      ? `?from=${encodeURIComponent(intent.from)}&to=${encodeURIComponent(intent.to)}&airline=indigo`
      : '?airline=indigo';
    return baseURL + query;
  }
  
  if (intent.from && intent.to) {
    return `${baseURL}?from=${encodeURIComponent(intent.from)}&to=${encodeURIComponent(intent.to)}`;
  }
  
  if (intent.to) {
    return `${baseURL}?to=${encodeURIComponent(intent.to)}`;
  }
  
  return 'https://www.makemytrip.com/flights/';
};

export const generateGmailURL = (intent) => {
  const baseURL = 'https://mail.google.com';
  
  if (intent.action === 'compose') {
    // Generate Gmail compose URL with recipient and subject
    let composeURL = `${baseURL}/mail/u/0/#compose`;
    
    // If we have recipient, use the compose URL with parameters
    if (intent.recipient) {
      const params = new URLSearchParams();
      params.append('to', intent.recipient);
      if (intent.subject) {
        params.append('subject', intent.subject);
      }
      // Add default body message
      params.append('body', 'Hello,\n\nI am writing to you via voice command.\n\nBest regards');
      
      composeURL = `${baseURL}/mail/u/0/?${params.toString()}#compose`;
    }
    
    return composeURL;
  }
  
  // Default: open Gmail inbox
  return `${baseURL}/mail/u/0/#inbox`;
};

export const generateWhatsAppURL = (intent) => {
  if (intent && intent.action === 'message') {
    // For messaging, we'll open WhatsApp Web and provide guidance
    return 'https://web.whatsapp.com/';
  }
  // Default: WhatsApp Web URL
  return 'https://web.whatsapp.com/';
};

export const generatePhoneURL = (intent) => {
  if (intent.isNumber && intent.number) {
    // Use tel: protocol for direct calling
    return `tel:${intent.number}`;
  }
  
  // For contact names, we'll provide guidance
  return null;
};

// Enhanced window management with autoplay injection
export const openInNewWindow = (url, windowName = '_blank') => {
  const features = 'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=yes,menubar=yes';
  
  // Handle enhanced video URL object with aggressive autoplay
  if (typeof url === 'object' && url.needsAutoClick) {
    const newWindow = window.open(url.url, windowName, features);
    
    if (newWindow) {
      // Store reference for potential control later
      if (windowName !== '_blank') {
        window.lastOpenedWindow = {
          window: newWindow,
          type: windowName,
          url: url.url,
          openedAt: Date.now(),
          needsAutoClick: true,
          needsAggressiveAutoplay: url.needsAggressiveAutoplay,
          query: url.query,
          encodedQuery: url.encodedQuery
        };
      }
      
      // Focus the new window immediately
      newWindow.focus();
      
      // Multiple injection attempts for better success rate
      if (url.needsAggressiveAutoplay) {
        // Start aggressive autoplay attempts immediately
        setTimeout(() => {
          injectAutoPlayScript(newWindow, url.query);
        }, 1000);
        
        // Backup attempt
        setTimeout(() => {
          if (!newWindow.closed) {
            console.log('🔄 Backup autoplay attempt');
            injectAutoPlayScript(newWindow, url.query);
          }
        }, 5000);
      } else {
        // Standard injection
        setTimeout(() => {
          injectAutoPlayScript(newWindow, url.query);
        }, 3000);
      }
    }
    
    return newWindow;
  }
  
  // Regular URL handling
  const newWindow = window.open(url, windowName, features);
  
  // Store reference for potential control later
  if (newWindow && windowName !== '_blank') {
    window.lastOpenedWindow = {
      window: newWindow,
      type: windowName,
      url: url,
      openedAt: Date.now()
    };
  }
  
  return newWindow;
};

// Enhanced aggressive auto-click script for YouTube
const injectAutoPlayScript = (targetWindow, query) => {
  try {
    if (!targetWindow || targetWindow.closed) {
      return;
    }
    
    // Focus the window first
    targetWindow.focus();
    
    // Multiple attempts with different timing
    const attemptAutoClick = (attempt = 1) => {
      if (attempt > 5) {
        console.log('🚫 Max autoplay attempts reached');
        showManualClickHelper(query);
        return;
      }
      
      console.log(`🎵 Auto-click attempt ${attempt} for: ${query}`);
      
      setTimeout(() => {
        try {
          if (targetWindow.closed) return;
          
          // Enhanced script with more aggressive clicking - build dynamically to avoid template literal issues
          const script = 
            '(function() {' +
            '  console.log("🎵 Aggressive auto-click attempt ' + attempt + ' for: ' + query + '");' +
            '  const selectors = [' +
            '    "a#video-title",' +
            '    "a[id=video-title]",' +
            '    "h3 a#video-title",' +
            '    "#video-title",' +
            '    "ytd-video-renderer a#video-title",' +
            '    ".ytd-video-renderer a#video-title",' +
            '    "ytd-video-renderer h3 a",' +
            '    "ytd-rich-item-renderer a#video-title",' +
            '    "ytd-compact-video-renderer a#video-title",' +
            '    "a.ytd-video-renderer",' +
            '    "#contents ytd-video-renderer a",' +
            '    "#contents ytd-rich-item-renderer a",' +
            '    "[id*=video-title]",' +
            '    ".style-scope.ytd-video-renderer",' +
            '    "ytd-thumbnail a",' +
            '    ".ytd-thumbnail a",' +
            '    "#search .ytd-video-renderer a",' +
            '    "#search ytd-video-renderer a#video-title",' +
            '    ".ytd-item-section-renderer a#video-title"' +
            '  ];' +
            '  let clicked = false;' +
            '  let videoElement = null;' +
            '  for (const selector of selectors) {' +
            '    const elements = document.querySelectorAll(selector);' +
            '    if (elements.length > 0 && !clicked) {' +
            '      videoElement = elements[0];' +
            '      const href = videoElement.href || videoElement.getAttribute("href");' +
            '      if (href && (href.includes("/watch?v=") || href.includes("youtube.com/watch"))) {' +
            '        console.log("🎯 Found video element with selector: " + selector);' +
            '        console.log("🔗 Video URL: " + href);' +
            '        try {' +
            '          videoElement.scrollIntoView({ behavior: "instant", block: "center" });' +
            '          videoElement.focus();' +
            '          videoElement.click();' +
            '          const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true, view: window });' +
            '          videoElement.dispatchEvent(clickEvent);' +
            '          if (href) {' +
            '            setTimeout(() => { window.location.href = href; }, 500);' +
            '          }' +
            '          console.log("✅ Successfully clicked first video!");' +
            '          clicked = true;' +
            '          break;' +
            '        } catch (clickError) {' +
            '          console.log("Click error:", clickError);' +
            '          continue;' +
            '        }' +
            '      }' +
            '    }' +
            '  }' +
            '  if (!clicked) {' +
            '    console.log("⚠️ Could not find clickable video element");' +
            '    document.body.focus();' +
            '    setTimeout(() => {' +
            '      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", code: "Tab", keyCode: 9, which: 9, bubbles: true }));' +
            '      setTimeout(() => {' +
            '        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true }));' +
            '      }, 200);' +
            '    }, 100);' +
            '    const searchResults = document.querySelector("#contents") || document.querySelector("#search");' +
            '    if (searchResults) {' +
            '      const helpDiv = document.createElement("div");' +
            '      helpDiv.innerHTML = "<div style=\\"position: fixed; top: 50px; right: 20px; background: linear-gradient(135deg, #ff1493, #8a2be2); color: white; padding: 20px; border-radius: 15px; z-index: 99999; font-family: Roboto, Arial, sans-serif; box-shadow: 0 8px 32px rgba(0,0,0,0.3); max-width: 350px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);\\">🎵 <strong>Voice Assistant</strong><br/>Ready to play \\"' + query + '\\"!<br/>👆 <strong>Just click the first video to start playing!</strong></div>";' +
            '      document.body.appendChild(helpDiv);' +
            '      setTimeout(() => { if (helpDiv.parentNode) helpDiv.parentNode.removeChild(helpDiv); }, 8000);' +
            '    }' +
            '    return false;' +
            '  }' +
            '  return true;' +
            '})();';
          
          // Execute script in target window
          const success = targetWindow.eval(script);
          
          if (!success && attempt < 5) {
            // Try again with longer delay
            attemptAutoClick(attempt + 1);
          }
          
        } catch (error) {
          console.log('Autoplay attempt ' + attempt + ' failed:', error);
          
          if (attempt < 5) {
            attemptAutoClick(attempt + 1);
          } else {
            showManualClickHelper(query);
          }
        }
      }, attempt * 1500); // Increase delay with each attempt
    };
    
    // Start the first attempt
    attemptAutoClick(1);
    
  } catch (error) {
    console.log('Error in autoplay injection:', error);
    showManualClickHelper(query);
  }
};

// Show enhanced manual click helper in the main window when autoplay fails
const showManualClickHelper = (query) => {
  console.log(`💡 Showing enhanced manual click helper for: ${query}`);
  
  // Create an enhanced helpful notification in the main window
  const helpDiv = document.createElement('div');
  helpDiv.innerHTML = `
    <div style="
      position: fixed; 
      top: 100px; 
      right: 20px; 
      background: linear-gradient(135deg, #ff1493 0%, #8a2be2 100%); 
      color: white; 
      padding: 25px; 
      border-radius: 20px; 
      z-index: 99999;
      font-family: 'Roboto Flex', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 
        0 10px 40px rgba(0,0,0,0.4),
        0 0 20px rgba(255, 20, 147, 0.3);
      max-width: 380px;
      backdrop-filter: blur(15px);
      border: 2px solid rgba(255,255,255,0.2);
      animation: slideInBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    ">
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        🎵 <strong style="margin-left: 10px; font-size: 18px;">Music Ready!</strong>
      </div>
      <div style="margin-bottom: 15px; font-size: 16px;">
        YouTube opened for <strong>"${query}"</strong>
      </div>
      <div style="
        background: rgba(255,255,255,0.15); 
        padding: 15px; 
        border-radius: 12px; 
        margin-bottom: 15px;
        border: 1px solid rgba(255,255,255,0.2);
      ">
        <div style="font-size: 15px; margin-bottom: 8px; display: flex; align-items: center;">
          👆 <strong style="margin-left: 8px;">Quick Action Needed:</strong>
        </div>
        <div style="font-size: 14px; line-height: 1.4;">
          Click the <strong>first video</strong> in the YouTube window to start playing!
        </div>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px; opacity: 0.8;">
        <span>🎶 Auto-click didn't work</span>
        <span>⏱️ Closes in 10s</span>
      </div>
      <style>
        @keyframes slideInBounce {
          0% { 
            transform: translateX(100%) scale(0.8); 
            opacity: 0; 
          }
          60% { 
            transform: translateX(-10px) scale(1.05); 
            opacity: 0.8; 
          }
          100% { 
            transform: translateX(0) scale(1); 
            opacity: 1; 
          }
        }
      </style>
    </div>
  `;
  
  document.body.appendChild(helpDiv);
  
  // Add a pulsing effect after 2 seconds
  setTimeout(() => {
    if (helpDiv.firstElementChild) {
      helpDiv.firstElementChild.style.animation += ', pulse 2s ease-in-out infinite 2s';
      helpDiv.innerHTML += `
        <style>
          @keyframes pulse {
            0%, 100% { box-shadow: 0 10px 40px rgba(0,0,0,0.4), 0 0 20px rgba(255, 20, 147, 0.3); }
            50% { box-shadow: 0 10px 40px rgba(0,0,0,0.4), 0 0 30px rgba(255, 20, 147, 0.6); }
          }
        </style>
      `;
    }
  }, 2000);
  
  // Remove after 10 seconds
  setTimeout(() => {
    if (helpDiv.parentNode) {
      // Fade out animation
      helpDiv.firstElementChild.style.transition = 'all 0.5s ease-out';
      helpDiv.firstElementChild.style.transform = 'translateX(100%) scale(0.8)';
      helpDiv.firstElementChild.style.opacity = '0';
      
      setTimeout(() => {
        if (helpDiv.parentNode) {
          helpDiv.parentNode.removeChild(helpDiv);
        }
      }, 500);
    }
  }, 10000);
};

// Enhanced media control functions
export const controlMedia = (action) => {
  console.log(`Attempting media control: ${action}`);
  
  // Try to control the last opened window first
  if (window.lastOpenedWindow && window.lastOpenedWindow.window && !window.lastOpenedWindow.window.closed) {
    try {
      controlWindowMedia(window.lastOpenedWindow.window, action);
    } catch (error) {
      console.log('Could not control external window media:', error);
    }
  }
  
  // Use Media Session API where available
  if ('mediaSession' in navigator) {
    try {
      switch (action) {
        case 'pause':
          if (navigator.mediaSession.playbackState === 'playing') {
            navigator.mediaSession.setActionHandler('pause', () => {});
            // Trigger pause action via keyboard event
            document.dispatchEvent(new KeyboardEvent('keydown', { 
              key: ' ', 
              code: 'Space', 
              keyCode: 32,
              which: 32,
              bubbles: true 
            }));
          }
          break;
        case 'resume':
          if (navigator.mediaSession.playbackState === 'paused') {
            navigator.mediaSession.setActionHandler('play', () => {});
            document.dispatchEvent(new KeyboardEvent('keydown', { 
              key: ' ', 
              code: 'Space', 
              keyCode: 32,
              which: 32,
              bubbles: true 
            }));
          }
          break;
        case 'next':
          navigator.mediaSession.setActionHandler('nexttrack', () => {});
          // Try keyboard shortcut for next
          document.dispatchEvent(new KeyboardEvent('keydown', { 
            key: 'ArrowRight', 
            code: 'ArrowRight',
            shiftKey: true,
            bubbles: true 
          }));
          break;
        case 'previous':
          navigator.mediaSession.setActionHandler('previoustrack', () => {});
          // Try keyboard shortcut for previous
          document.dispatchEvent(new KeyboardEvent('keydown', { 
            key: 'ArrowLeft', 
            code: 'ArrowLeft',
            shiftKey: true,
            bubbles: true 
          }));
          break;
        default:
          break;
      }
    } catch (error) {
      console.log('Media Session API control failed:', error);
    }
  }
  
  // Fallback: try to find and control HTML5 audio/video elements
  const mediaElements = document.querySelectorAll('audio, video');
  mediaElements.forEach(element => {
    try {
      switch (action) {
        case 'pause':
        case 'stop':
          if (!element.paused) {
          element.pause();
          }
          break;
        case 'resume':
          if (element.paused) {
          element.play();
          }
          break;
        case 'volume_up':
          element.volume = Math.min(1.0, element.volume + 0.1);
          break;
        case 'volume_down':
          element.volume = Math.max(0.0, element.volume - 0.1);
          break;
        case 'mute':
          element.muted = !element.muted;
          break;
        default:
          break;
      }
    } catch (error) {
      console.log('Could not control media element:', error);
    }
  });
};

// Control media in external windows (like YouTube)
const controlWindowMedia = (targetWindow, action) => {
  if (!targetWindow || targetWindow.closed) {
    return;
  }
  
  try {
    // Try to send keyboard events to the target window
    switch (action) {
      case 'pause':
      case 'resume':
        // Space bar toggles play/pause on most video platforms
        targetWindow.focus();
        targetWindow.document.dispatchEvent(new targetWindow.KeyboardEvent('keydown', {
          key: ' ',
          code: 'Space',
          keyCode: 32,
          which: 32,
          bubbles: true
        }));
        break;
      case 'next':
        // Shift + Right arrow for next video on YouTube
        targetWindow.focus();
        targetWindow.document.dispatchEvent(new targetWindow.KeyboardEvent('keydown', {
          key: 'ArrowRight',
          code: 'ArrowRight',
          shiftKey: true,
          bubbles: true
        }));
        break;
      case 'previous':
        // Shift + Left arrow for previous video on YouTube
        targetWindow.focus();
        targetWindow.document.dispatchEvent(new targetWindow.KeyboardEvent('keydown', {
          key: 'ArrowLeft',
          code: 'ArrowLeft',
          shiftKey: true,
          bubbles: true
        }));
        break;
    }
  } catch (error) {
    console.log('Cross-origin media control blocked:', error);
  }
}; 