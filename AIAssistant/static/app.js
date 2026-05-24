const DOM = {
    authView: document.getElementById('auth-view'),
    chatView: document.getElementById('chat-view'),
    loginForm: document.getElementById('login-form'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    loginBtn: document.getElementById('login-btn'),
    authError: document.getElementById('auth-error'),
    logoutBtn: document.getElementById('logout-btn'),
    
    chatHistory: document.getElementById('chat-history'),
    chatForm: document.getElementById('chat-form'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    typingIndicator: document.getElementById('typing-indicator'),
    
    micBtn: document.getElementById('mic-btn'),
    toggleTtsBtn: document.getElementById('toggle-tts-btn'),
    suggestionChips: document.querySelectorAll('.suggestion-chip')
};

// State
let token = localStorage.getItem('kb_token');
let chatHistoryList = []; // Array of {role: 'user'|'assistant', content: string}
let isTtsEnabled = true;

// Web Speech API for TTS
const synth = window.speechSynthesis;

// Speech Recognition (STT) setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN'; // Using Indian English layout as default
} else {
    DOM.micBtn.style.display = 'none'; // Hide if not supported
}

// Init
function init() {
    if (token) {
        showChat();
    } else {
        showAuth();
    }
}

function showAuth() {
    DOM.authView.classList.add('active');
    DOM.authView.classList.remove('hidden');
    DOM.chatView.classList.add('hidden');
    DOM.chatView.classList.remove('active');
}

function showChat() {
    DOM.authView.classList.add('hidden');
    DOM.authView.classList.remove('active');
    DOM.chatView.classList.add('active');
    DOM.chatView.classList.remove('hidden');
    setTimeout(() => DOM.messageInput.focus(), 300);
}

// Authentication
DOM.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = DOM.emailInput.value.trim();
    const password = DOM.passwordInput.value;
    
    DOM.loginBtn.disabled = true;
    DOM.loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';
    DOM.authError.classList.add('hidden');

    try {
        // Replace with actual NestJS backend URL if different
        const NESTJS_URL = 'http://localhost:3000/auth/login';
        
        const response = await fetch(NESTJS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.data && data.data.token) {
            token = data.data.token;
            localStorage.setItem('kb_token', token);
            showChat();
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (err) {
        DOM.authError.textContent = err.message || 'Failed to connect to server';
        DOM.authError.classList.remove('hidden');
    } finally {
        DOM.loginBtn.disabled = false;
        DOM.loginBtn.innerHTML = '<span>Sign In</span> <i class="fa-solid fa-arrow-right"></i>';
    }
});

DOM.logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('kb_token');
    token = null;
    chatHistoryList = [];
    // Keep only the first welcome message
    while(DOM.chatHistory.children.length > 1) {
        DOM.chatHistory.removeChild(DOM.chatHistory.lastChild);
    }
    showAuth();
});

// Basic Markdown parser for chat bubbles
function parseMarkdown(text) {
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
    return html;
}

// Chat UI
function addMessage(role, content) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = role === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';
    
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = parseMarkdown(content);
    
    msgDiv.appendChild(avatar);
    msgDiv.appendChild(bubble);
    
    DOM.chatHistory.appendChild(msgDiv);
    DOM.chatHistory.scrollTop = DOM.chatHistory.scrollHeight;
}

// TTS State
let currentAudio = null;

// TTS (Text to Speech)
DOM.toggleTtsBtn.addEventListener('click', () => {
    isTtsEnabled = !isTtsEnabled;
    DOM.toggleTtsBtn.classList.toggle('active', isTtsEnabled);
    if (!isTtsEnabled && currentAudio) {
        currentAudio.pause(); // Stop speaking if turned off
    }
});

function playAudioB64(audioB64) {
    if (!isTtsEnabled || !audioB64) return;
    
    if (currentAudio) {
        currentAudio.pause();
    }
    
    // Sarvam AI returns base64 WAV audio
    const audioSrc = "data:audio/wav;base64," + audioB64;
    currentAudio = new Audio(audioSrc);
    currentAudio.play().catch(err => console.error("Audio playback failed:", err));
}

// API Call
async function sendMessage(text) {
    if (!text.trim()) return;
    
    // Cancel any ongoing speech
    if (currentAudio) {
        currentAudio.pause();
    }

    addMessage('user', text);
    DOM.messageInput.value = '';
    DOM.typingIndicator.classList.remove('hidden');
    DOM.chatHistory.scrollTop = DOM.chatHistory.scrollHeight;
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                token: token,
                history: chatHistoryList
            })
        });
        
        if (response.status === 401) {
            // Token expired
            DOM.logoutBtn.click();
            return;
        }
        
        const data = await response.json();
        if (response.ok) {
            const aiText = data.response;
            const audioB64 = data.audio_b64;
            
            addMessage('system', aiText);
            
            // Append to local history for context (keep last 10 messages)
            chatHistoryList.push({role: 'user', content: text});
            chatHistoryList.push({role: 'assistant', content: aiText});
            if (chatHistoryList.length > 10) chatHistoryList = chatHistoryList.slice(-10);
            
            if (audioB64) {
                playAudioB64(audioB64);
            }
        } else {
            addMessage('system', `Error: ${data.detail || 'Failed to process request.'}`);
        }
    } catch (err) {
        addMessage('system', `Network error: ${err.message}`);
    } finally {
        DOM.typingIndicator.classList.add('hidden');
    }
}

// Events
DOM.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage(DOM.messageInput.value);
});

DOM.suggestionChips.forEach(chip => {
    chip.addEventListener('click', () => {
        sendMessage(chip.textContent);
        // Hide suggestions after first use
        const suggestionsContainer = chip.closest('.suggestions');
        if (suggestionsContainer) suggestionsContainer.style.display = 'none';
        const label = document.querySelector('.suggestions-label');
        if (label) label.style.display = 'none';
    });
});

// Mic / STT Handling
if (recognition) {
    recognition.onstart = () => {
        DOM.micBtn.classList.add('recording');
        DOM.messageInput.placeholder = "Listening...";
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        DOM.messageInput.value = transcript;
        sendMessage(transcript);
    };
    
    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        DOM.messageInput.placeholder = "Ask anything about your shop...";
    };
    
    recognition.onend = () => {
        DOM.micBtn.classList.remove('recording');
        DOM.messageInput.placeholder = "Ask anything about your shop...";
    };

    DOM.micBtn.addEventListener('click', () => {
        if (DOM.micBtn.classList.contains('recording')) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });
}

init();
