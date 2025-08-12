# 🎤 AI Voice Agent - Jhanvi

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5-orange.svg)](https://openai.com/)
[![Vapi](https://img.shields.io/badge/Vapi-Voice%20AI-purple.svg)](https://vapi.ai/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **A sophisticated AI-powered voice assistant that brings seamless automation to your digital life. Meet Jhanvi - your personal conversational agent for voice-controlled browsing, music playback, communication, and smart automation.**

## 🌟 Overview

Jhanvi is a cutting-edge voice assistant built with modern web technologies, featuring real-time voice recognition, intelligent intent detection, and powerful automation capabilities. From playing your favorite music to managing emails and making calls, Jhanvi transforms how you interact with the web.

## 🏗️ System Architecture

The diagram below shows how voice commands flow through the system, from speech recognition to automation execution and user feedback.

![Alt text](https://drive.google.com/uc?export=view&id=1u6FuSzIIc1rzXHbd3LJbEDRU_OvgVa5H)

## ✨ Demo

![Alt text](https://drive.google.com/uc?export=view&id=1shbVAs3bgTRM9dRRsuhVjC6qNfDAGEGe)
![Alt text](https://drive.google.com/uc?export=view&id=1nEU9MmWVS_2fixvOZw_-9lJ57_aVtine)


## ✨ Key Features

### 🎵 **Smart Music & Media Control**
- **Direct YouTube Playback**: "play Despacito song" → Instantly plays with autoplay
- **Intelligent Song Search**: Advanced pattern matching for artist + song combinations  
- **Real-time Media Control**: Pause, resume, next, previous with voice commands
- **Dynamic Content Replacement**: "search Perfect instead" → Updates current window
- **Auto-mute Management**: Automatically mutes mic during music playback

### 🛒 **Enhanced Shopping Automation**
- **Multi-platform Support**: Amazon, Flipkart with optimized search parameters
- **Smart Query Processing**: Natural language to structured search queries
- **Enhanced URLs**: Platform-specific parameters for better search results
- **Window Management**: Tracks and manages multiple shopping windows

### 📧 **Communication Hub**
- **Gmail Integration**: Compose emails with voice, auto-fill templates
- **WhatsApp Web**: Direct messaging with contact guidance
- **Phone Call Assistance**: Smart number detection and calling options
- **Enhanced UI Helpers**: Visual guides for each communication platform

### 🌐 **Intelligent Web Browsing**
- **40+ Website Support**: YouTube, Google, Facebook, Instagram, GitHub, etc.
- **Voice Navigation**: "open GitHub" → Direct site access
- **Travel Booking**: MakeMyTrip integration with flight search
- **Developer Tools**: Stack Overflow, GitHub quick access

### 🎛️ **Advanced Automation Engine**
- **Intent Detection System**: NLP-powered command understanding
- **Window State Management**: Track and control multiple browser windows
- **Cross-window Control**: Keyboard events for external site control
- **Automation Statistics**: Performance tracking and analytics
- **Error Recovery**: Robust error handling with user feedback

## 🚀 Example Voice Commands

### Music & Entertainment
```
"play Despacito song on YouTube"
"play music Imagine Dragons"
"listen to Taylor Swift"
"pause"
"next song"
"search Billie Eilish instead"
```

### Shopping
```
"search iPhone 15 on Amazon"
"find wireless headphones on Flipkart"
"buy gaming laptop"
"search MacBook instead"
```

### General Search
```
"search React hooks tutorial on Google"
"google TypeScript documentation"
"find JavaScript courses"
```

### Web Browsing
```
"open YouTube"
"open Gmail"
"open Instagram"
"open GitHub"
```

### Media Control
```
"pause the video"
"resume playing"
"skip to next"
"make it louder"
"mute the audio"
```

## 🛠️ Tech Stack

### **Frontend**
- **React 18** - Modern component-based UI
- **Vapi Web SDK** - Real-time voice recognition and synthesis
- **CSS3 Animations** - Beautiful visual effects and transitions
- **Advanced State Management** - Complex automation state handling

### **Backend** 
- **Node.js + Express** - RESTful API server
- **OpenAI GPT-3.5** - Intelligent conversation handling
- **CORS & Helmet** - Security and cross-origin support
- **Environment Management** - Secure API key handling

### **AI & Voice Services**
- **Vapi AI Platform** - Voice recognition and synthesis
- **ElevenLabs Voice** - High-quality text-to-speech
- **GPT-3.5 Turbo** - Natural language understanding
- **Advanced Intent Detection** - Custom NLP processing

### **Automation & Integration**
- **YouTube API Integration** - Direct video playback
- **Multiple Platform APIs** - Amazon, Flipkart, Google search
- **Web Automation** - Cross-window control and management
- **Real-time Event System** - Automation status tracking

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm or yarn** - Package manager
- **Modern Browser** - Chrome/Edge recommended for best voice support
- **Microphone Access** - Required for voice commands

### 1. **Clone & Install**
```bash
# Clone the repository
git clone <repository-url>
cd ai-voice-agent

# Install all dependencies (root, client, server)
npm run install-all
```

### 2. **Environment Setup**

#### Server Configuration
```bash
# Navigate to server directory
cd server

# Copy environment template
cp env.example .env

# Edit .env with your API keys
nano .env
```

**Required Environment Variables:**
```env
# OpenAI API Key (Get from https://platform.openai.com/api-keys)
OPENAI_API_KEY="your_openai_api_key_here"

# Server Port (default: 5000)
PORT=5000
```

#### Client Configuration  
```bash
# Navigate to client directory
cd ../client

# Copy environment template
cp env.example .env.local

# Edit if needed (default should work)
nano .env.local
```

### 3. **Get Vapi API Token**
1. Visit [Vapi Dashboard](https://dashboard.vapi.ai)
2. Create account and get your public API token
3. Update token in `/client/src/components/VapiAgent.js`:
```javascript
const VAPI_TOKEN = 'your_vapi_token_here';
```

### 4. **Launch Application**
```bash
# From project root - starts both client and server
npm run dev

# OR start separately:
# Terminal 1 - Backend server
cd server && npm start

# Terminal 2 - Frontend client  
cd client && npm start
```

### 5. **Access Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 🎯 Usage Guide

### **Starting Your First Conversation**
1. **Click "Call Jhanvi"** on the welcome screen
2. **Allow microphone access** when prompted
3. **Enable popups** for web browsing features
4. **Start speaking** - Jhanvi will respond with voice and text

### **Essential Voice Commands**

#### 🎵 Music & Entertainment
```bash
"play Despacito song"              # Direct YouTube playback
"play Shape of You by Ed Sheeran"  # Artist + song search
"listen to Bohemian Rhapsody"      # Alternative phrasing
"pause"                            # Pause current media
"resume" / "continue"              # Resume playback
"next song" / "skip"               # Next track
"search Perfect instead"           # Replace current song
```

#### 🛒 Shopping & E-commerce
```bash
"search iPhone 15 on Amazon"       # Amazon product search
"find wireless headphones on Flipkart"  # Flipkart search
"buy gaming laptop"                # Default Amazon search
"search MacBook instead"           # Update current search
```

#### 📧 Communication & Email
```bash
"open Gmail"                       # Access Gmail inbox
"compose email to john@example.com"    # New email with recipient
"write email to sarah about meeting"   # Email with subject
"open WhatsApp"                    # WhatsApp Web access
"message John on WhatsApp"         # WhatsApp messaging
```

#### 📞 Phone & Calling
```bash
"call 555-123-4567"               # Direct number calling
"call John Smith"                  # Contact name calling
"dial +1-555-987-6543"            # International numbers
```

#### 🌐 Web Browsing
```bash
"open YouTube" / "open YT"         # Video platform
"open Google"                      # Search engine
"open Facebook" / "open FB"        # Social media
"open Instagram" / "open Insta"    # Photo sharing
"open GitHub"                      # Developer platform
"open Amazon"                      # Shopping
"open Netflix"                     # Streaming
```

#### ✈️ Travel & Booking
```bash
"book flights from Delhi to Mumbai"    # Flight search
"show Indigo flights to Bangalore"     # Specific airline
"find hotels in Goa"                   # Accommodation
```

#### 🔍 Search & Information
```bash
"search React tutorials on Google"     # Web search
"google JavaScript documentation"      # Direct Google search
"find Python courses"                  # Educational content
```

## 🎨 Feature Highlights

### **Advanced Voice Recognition**
- **Real-time Speech Processing**: Instant command recognition
- **Natural Language Understanding**: Conversational command style
- **Multi-language Pattern Matching**: Support for various phrasings
- **Context-aware Processing**: Understands command intentions

### **Intelligent Automation**
- **Cross-window Control**: Manage multiple browser windows
- **Dynamic Content Updates**: Replace searches without new windows
- **Auto-click Technology**: Automatic video/link selection
- **Smart Error Recovery**: Graceful handling of failures

### **Professional UI/UX**
- **Modern Design System**: Beautiful gradients and animations
- **Real-time Visual Feedback**: Status indicators and progress
- **Responsive Layout**: Works on desktop and mobile
- **Accessibility Features**: Screen reader compatible

### **Enterprise-grade Security**
- **Secure API Management**: Environment-based key handling
- **CORS Protection**: Secure cross-origin requests  
- **Input Validation**: Sanitized user inputs
- **Error Logging**: Comprehensive error tracking

## 📊 Automation Statistics

The system tracks detailed analytics:
- **Total Commands Executed**: Real-time counters
- **Success/Failure Rates**: Performance metrics
- **Daily Usage Statistics**: Usage patterns
- **Intent Type Distribution**: Popular command categories
- **Execution History**: Last 50 operations logged

## 🔧 Advanced Configuration

### **Custom Voice Settings**
```javascript
// In VapiAgent.js - customize voice parameters
voice: {
  provider: "11labs",
  voiceId: "21m00Tcm4TlvDq8ikWAM",  // Change for different voice
  stability: 0.75,                   // Voice consistency
  similarityBoost: 0.85              // Voice clarity
}
```

### **Intent Detection Tuning**
```javascript
// In intentDetection.js - modify command patterns
const musicKeywords = ['play', 'music', 'song', 'artist'];
const musicPattern = /(?:play|listen to|put on)\s+(.*?)(?:\s+(?:song|music))?$/i;
```

## 🌐 Deployment

### **Development Mode**
```bash
npm run dev  # Concurrent client + server
```

### **Production Build**
```bash
# Build client for production
npm run build

# Start production server
cd server && npm start
```

### **Environment Variables for Production**
```env
NODE_ENV=production
OPENAI_API_KEY=your_production_key
PORT=5000
```

### **Deployment Platforms**
- **Frontend**: Netlify, Vercel, GitHub Pages
- **Backend**: Heroku, Railway, DigitalOcean
- **Full-stack**: AWS, Google Cloud Platform

## 🎯 Browser Compatibility

| Browser | Voice Recognition | Automation | Overall Support |
|---------|------------------|------------|-----------------|
| **Chrome** | ✅ Excellent | ✅ Full | ✅ Recommended |
| **Edge** | ✅ Excellent | ✅ Full | ✅ Recommended |
| **Firefox** | ⚠️ Limited | ✅ Full | ⚠️ Partial |
| **Safari** | ⚠️ Limited | ⚠️ Limited | ⚠️ Basic |

### **Required Permissions**
- **Microphone Access**: Essential for voice commands
- **Popup Permission**: Required for web browsing automation
- **Media Autoplay**: Recommended for music playback

## 🚨 Troubleshooting

### **Common Issues & Solutions**

#### **Voice Not Working**
```bash
Problem: Microphone not detected
Solution: 
1. Check browser permissions (🔒 icon in address bar)
2. Ensure microphone is connected and working
3. Try refreshing the page
4. Use Chrome/Edge for best compatibility
```

#### **Popups Blocked**
```bash
Problem: Websites not opening
Solution:
1. Click popup blocked icon in address bar
2. Allow popups for your domain
3. Disable popup blockers temporarily
4. Add site to browser exceptions
```

#### **Music Not Playing**
```bash
Problem: YouTube videos not auto-playing
Solution:
1. Enable autoplay in browser settings
2. Visit YouTube and allow autoplay permission
3. Use "play [song name] song" format
4. Click the first video manually if needed
```

#### **API Errors**
```bash
Problem: OpenAI API errors
Solution:
1. Check API key in server/.env
2. Verify OpenAI account has credits
3. Check internet connection
4. Review server logs for details
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### **Development Guidelines**
- Follow existing code style
- Add comments for complex logic
- Test voice commands thoroughly
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** - GPT-3.5 language model
- **Vapi AI** - Voice recognition platform
- **ElevenLabs** - High-quality voice synthesis
- **React Team** - Frontend framework
- **Node.js Community** - Backend runtime

## 💬 Support & Contact

- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)
- **Email**: surajpratap20002003@gmail.com

---

<div align="center">

**Made with ❤️ by Suraj Pratap**

*Bringing the future of voice interaction to the present*

</div> 
