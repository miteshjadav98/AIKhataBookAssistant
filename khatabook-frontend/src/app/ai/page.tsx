"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import LedgerCard from "@/components/ai/LedgerCard";
import InvoicePreviewCard from "@/components/ai/InvoicePreviewCard";
import SalesSummaryCard from "@/components/ai/SalesSummaryCard";
import LowStockAlertCard from "@/components/ai/LowStockAlertCard";
import { v4 as uuidv4 } from 'uuid';

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  visual_type?: string;
  data?: any;
}

export default function AIOperatingSystem() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useSarvam, setUseSarvam] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [userName, setUserName] = useState<string>("Shopkeeper");
  const [sttLang, setSttLang] = useState<string>("en-IN");
  
  const threadIdRef = useRef<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<string>("");

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) {
      router.push("/auth/login");
      return;
    }
    
    try {
        const parsedUser = JSON.parse(userStr);
        setUserName(parsedUser.name || "Shopkeeper");
        setMessages([{ 
            role: "system", 
            content: `Hello ${parsedUser.name || ''}! I am your AI Business Copilot. How can I help you manage your shop today?` 
        }]);
    } catch (e) {
        setMessages([{ role: "system", content: "Hello! I am your AI Business Copilot. How can I help you manage your shop today?" }]);
    }
    
    // Generate a unique thread ID for LangGraph memory
    threadIdRef.current = uuidv4();
    
    audioRef.current = new Audio();
    
    // Setup Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';
      
      recognitionRef.current.onstart = () => setIsRecording(true);
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
      };
      recognitionRef.current.onerror = (event: any) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          console.error("Speech recognition error", event.error);
        }
        setIsRecording(false);
      };
      recognitionRef.current.onend = () => {
        setIsRecording(false);
        // Auto-send when the browser naturally stops listening (silence detected)
        if (inputRef.current.trim()) {
          handleSend(inputRef.current);
        }
      };
    }
  }, [router]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = sttLang;
    }
  }, [sttLang]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleRecording = async () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      // Mobile audio unlock for voice inputs (Must be synchronous!)
      if (audioRef.current) {
        try {
          audioRef.current.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              if (audioRef.current) audioRef.current.pause();
            }).catch(() => {});
          }
        } catch (e) {}
      }

      // Force microphone permission prompt if it's missing (fixes audio-capture error on mobile)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error("Mic permission denied", err);
        alert("Microphone access denied! Please allow microphone permissions in your phone's browser settings (Site Settings -> Microphone) to use voice input.");
        return;
      }

      try {
        recognitionRef.current?.start();
      } catch(e) {
        console.error("Failed to start recognition:", e);
      }
    }
  };

  const clearChat = () => {
    setMessages([{ role: "system", content: "Chat cleared. I'm ready for your next request!" }]);
    threadIdRef.current = uuidv4(); // Generate new thread id to reset backend memory
    if (audioRef.current) audioRef.current.pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    router.push('/dashboard');
  };

  const playAudioB64 = (audioB64: string) => {
    if (!ttsEnabled || !audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.src = "data:audio/wav;base64," + audioB64;
    audioRef.current.play().catch(e => console.error("Audio play error", e));
  };

  const speakNative = (text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (text: string = inputRef.current || input) => {
    if (!text.trim()) return;
    
    // Ensure thread ID exists before sending
    if (!threadIdRef.current) {
        threadIdRef.current = uuidv4();
    }

    if (audioRef.current) {
      audioRef.current.pause();
      // Mobile Safari/Chrome Autoplay Hack: Unlock the audio element during the user tap event
      // by playing a tiny silent base64 wav file and immediately pausing it.
      try {
        audioRef.current.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            if (audioRef.current) audioRef.current.pause();
          }).catch(() => {});
        }
      } catch (e) {}
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    
    // Clear synchronously to prevent onend from double-sending
    setInput("");
    inputRef.current = "";
    
    setMessages(prev => [...prev, { role: "user" as const, content: text }]);
    setIsLoading(true);

    const token = localStorage.getItem("token");
    
    try {
      // Using proxied path /ai-api for the FastAPI AI server
      const response = await fetch("/ai-api/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          token: token,
          thread_id: threadIdRef.current,
          user_name: userName,
          use_sarvam: useSarvam && ttsEnabled
        })
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        router.push("/auth/login");
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.response || "", 
          visual_type: data.visual_type,
          data: data.data
        }]);
        
        if (data.audio_b64) {
          playAudioB64(data.audio_b64);
        } else if (data.response) {
          speakNative(data.response);
        }
      } else {
        const errorMsg = typeof data.detail === 'object' ? JSON.stringify(data.detail) : (data.detail || 'Failed');
        setMessages(prev => [...prev, { role: "system", content: `Error: ${errorMsg}` }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "system", content: `Network error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderVisualComponent = (msg: Message) => {
    if (!msg.visual_type || !msg.data) return null;
    
    switch (msg.visual_type) {
      case 'ledger_summary':
        return <LedgerCard data={msg.data} />;
      case 'invoice_preview':
        return <InvoicePreviewCard data={msg.data} />;
      case 'sales_summary':
        return <SalesSummaryCard data={msg.data} />;
      case 'low_stock_alert':
        return <LowStockAlertCard data={msg.data} />;
      default:
        return null;
    }
  };

  return (
    <div className={`page-container ${theme === "light" ? "light-theme" : ""}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 0, backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="glass-panel" style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 0, borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem', cursor: 'pointer' }} onClick={() => router.push('/workspace')}>⬅️</div>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>AI Khatabook Assistant</h2>
            <span style={{ fontSize: '0.8rem', color: '#10b981' }}>● Online Copilot</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="icon-btn"
            style={{ color: 'var(--text-secondary)' }}
            title="Toggle Light/Dark Theme"
          >
            <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`}></i>
          </button>
          <button 
            onClick={() => {
              const next = !ttsEnabled;
              setTtsEnabled(next);
              setUseSarvam(next);
              if (!next) {
                if (audioRef.current) audioRef.current.pause();
                if (window.speechSynthesis) window.speechSynthesis.cancel();
              }
            }} 
            style={{ 
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              border: `1px solid ${ttsEnabled ? '#10b981' : 'var(--border-color)'}`,
              background: ttsEnabled ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: ttsEnabled ? '#10b981' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
            title="Toggle Voice & Sarvam AI"
          >
            <i className={`fa-solid ${ttsEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i> TTS {ttsEnabled ? 'ON' : 'OFF'}
          </button>
          <button 
            onClick={clearChat}
            className="icon-btn"
            style={{ color: '#ef4444' }}
            title="Clear Chat & Reset Memory"
          >
            <i className="fa-solid fa-trash"></i> End Chat
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ 
            display: 'flex', 
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' 
          }}>
            <div style={{ 
              maxWidth: '70%', 
              padding: '1rem', 
              borderRadius: '12px',
              background: msg.role === 'user' ? 'var(--accent-primary)' : (msg.role === 'system' ? 'rgba(0,0,0,0.1)' : 'var(--glass-bg)'),
              color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {msg.role !== 'user' && (
                <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.8rem', opacity: 0.8 }}>
                  <i className={`fa-solid ${msg.role === 'system' ? 'fa-info-circle' : 'fa-robot'}`}></i> {msg.role === 'system' ? 'System' : 'AI Copilot'}
                </div>
              )}
              {msg.content && <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br>') }} />}
              
              {/* Structured UI Components */}
              {msg.role === 'assistant' && msg.visual_type && (
                <div style={{ marginTop: '1rem' }}>
                  {renderVisualComponent(msg)}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '1rem', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <div className="dot-typing" style={{ color: 'var(--text-primary)'}}>...</div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>

      {/* Input Area */}
      <footer className="glass-panel" style={{ padding: '1.5rem', borderRadius: 0, display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <select 
          value={sttLang} 
          onChange={(e) => setSttLang(e.target.value)}
          title="Speech Recognition Language"
          style={{
            padding: '0.8rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="en-IN">EN</option>
          <option value="hi-IN">HI</option>
          <option value="gu-IN">GU</option>
        </select>
        <button 
          onClick={toggleRecording}
          title={isRecording ? "Stop Listening" : "Start Voice Input"}
          style={{ 
            borderRadius: '50%', 
            width: '60px', 
            height: '60px', 
            padding: 0, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            background: isRecording ? '#ef4444' : 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: isRecording ? '0 0 15px rgba(239, 68, 68, 0.6)' : 'var(--shadow-md)',
            transition: 'all 0.3s ease',
            animation: isRecording ? 'pulse 1.5s infinite' : 'none'
          }}
        >
          <i className="fa-solid fa-microphone" style={{ fontSize: '1.5rem' }}></i>
        </button>
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} suppressHydrationWarning style={{ flex: 1, display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRecording ? "Listening... (Will auto-send when you pause)" : "Ask your AI Copilot..."}
            style={{ 
              flex: 1, 
              padding: '1rem', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '1.1rem'
            }}
          />
          <button type="submit" className="btn-primary" disabled={!input.trim() || isLoading} style={{ padding: '0 2rem' }}>
            <i className="fa-solid fa-paper-plane"></i> Send
          </button>
        </form>
      </footer>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 15px rgba(239, 68, 68, 0.6); }
          50% { transform: scale(1.1); box-shadow: 0 0 25px rgba(239, 68, 68, 0.9); }
          100% { transform: scale(1); box-shadow: 0 0 15px rgba(239, 68, 68, 0.6); }
        }
      `}} />
    </div>
  );
}
