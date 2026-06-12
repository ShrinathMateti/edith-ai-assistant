import { useEffect, useState, useRef } from "react";
import Messages from "./Messages";
import { askAI } from "../services/aiService";
import "../App.css";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  orderBy,
} from "firebase/firestore";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", emoji: "🌤️" };
  if (hour < 17) return { text: "Good Afternoon", emoji: "☀️" };
  if (hour < 21) return { text: "Good Evening", emoji: "🌆" };
  return { text: "Just You & Me", emoji: "🤝" };
};

export default function ChatBox({ activeChatId, onFirstMessage }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speechError, setSpeechError] = useState(null); 

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef("");
  const isLoadingRef = useRef(false);
  
  const currentMessagesRef = useRef(messages);

  const greeting = getGreeting();

  useEffect(() => {
    currentMessagesRef.current = messages;
  }, [messages]);

  // Clean up mic streams if activeChatId changes unexpectedly
  useEffect(() => {
    if (!activeChatId) return;

    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const loadMessages = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const messagesRef = collection(
        db,
        "users",
        user.uid,
        "chats",
        activeChatId,
        "messages",
      );
      const q = query(messagesRef, orderBy("createdAt", "asc"));
      const snapshot = await getDocs(q);

      const loaded = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(loaded);
    };
    loadMessages();
  }, [activeChatId]);

  // Layout Fix: Using standard 'auto' scrolling prevents thread locks
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false; 
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechError(null);
    };

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      
      if (transcript.trim()) {
        setInput(transcript);
        inputRef.current = transcript;
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      
      const finalAudioText = inputRef.current.trim();

      setTimeout(() => {
        if (finalAudioText && !isLoadingRef.current) {
          sendMessage(finalAudioText);
        }
      }, 150);
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error hook:", event.error);
      setIsListening(false);
      
      if (event.error === "no-speech") {
        setSpeechError("No speech detected. Try speaking closer to your mic.");
        setTimeout(() => setSpeechError(null), 3000);
      } else if (event.error === "not-allowed") {
        setSpeechError("Microphone blocked. Check your app permissions.");
      }
    };
    
    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []); 

  const getVoices = () =>
    new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length) return resolve(voices);
      window.speechSynthesis.onvoiceschanged = () =>
        resolve(window.speechSynthesis.getVoices());
    });

  const speak = async (text) => {
    if (!ttsEnabled || !window.speechSynthesis) return;

    const clean = text
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`{1,3}(.*?)`{1,3}/gs, "$1")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/^[-*+]\s/gm, "")
      .replace(/^\d+\.\s/gm, "")
      .replace(/>/g, "")
      .trim();

    window.speechSynthesis.cancel();
    const voices = await getVoices();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    utterance.volume = 1;

    const preferred =
      voices.find((v) => v.name === "Google UK English Female") ||
      voices.find((v) => v.name === "Samantha") ||
      voices.find((v) => v.name === "Karen") ||
      voices.find((v) => v.name === "Moira") ||
      voices.find((v) => v.name === "Google US English") ||
      voices.find(
        (v) => v.lang === "en-GB" && v.name.toLowerCase().includes("female"),
      ) ||
      voices.find(
        (v) =>
          v.lang.startsWith("en") && v.name.toLowerCase().includes("female"),
      ) ||
      voices.find((v) => v.lang.startsWith("en"));

    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    inputRef.current = e.target.value;
  };

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      stopSpeaking();
      setInput("");
      inputRef.current = "";
      
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      setTimeout(() => {
        try {
          recognition.start();
        } catch (err) {
          console.warn("Recognition engine already handling an active stream:", err.message);
        }
      }, 250); // Bumped slightly to 250ms to ensure the keyboard completely docks out of view
    }
  };
  
  const sendMessage = async (textOverride) => {
    const userText = (textOverride !== undefined && typeof textOverride === "string" ? textOverride : input).trim();
    const currentMessages = currentMessagesRef.current; 
    
    if (!userText || isLoadingRef.current) return;

    const user = auth.currentUser;
    if (!user) return;

    const messagesRef = collection(
      db,
      "users",
      user.uid,
      "chats",
      activeChatId,
      "messages",
    );

    if (currentMessages.length === 0 && onFirstMessage) {
      onFirstMessage(userText);
    }

    setInput("");
    inputRef.current = "";
    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const userDocRef = await addDoc(messagesRef, {
        role: "user",
        text: userText,
        createdAt: Date.now(),
      });

      const userMessage = { id: userDocRef.id, role: "user", text: userText };
      const updatedMessages = [...currentMessages, userMessage];
      setMessages(updatedMessages);

      const apiMessageHistory = updatedMessages.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      const aiResponse = await askAI(apiMessageHistory);

      const aiDocRef = await addDoc(messagesRef, {
        role: "ai",
        text: aiResponse,
        createdAt: Date.now(),
      });

      const aiMessage = { id: aiDocRef.id, role: "ai", text: aiResponse };
      setMessages([...updatedMessages, aiMessage]);

      speak(aiResponse);
    } catch (error) {
      console.error("Failed to fetch AI reply:", error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const hasSpeechSupport = !!(
    window.SpeechRecognition || window.webkitSpeechRecognition
  );

  return (
    <div className="flex flex-col h-full bg-[#0e1118] relative">
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-cyan-500/20 to-blue-600/5 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-950/20">
              <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.954-8.955M21 12h-6m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-cyan-400/70 font-medium tracking-wide">
                {greeting.emoji} {greeting.text}
              </p>
              <h2 className="text-2xl font-semibold text-slate-100 tracking-tight">
                How can I assist you today?
              </h2>
              <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                Ask me anything, and I'll provide the best assistance I can.
              </p>
            </div>
          </div>
        ) : (
          <Messages messages={messages} />
        )}

        {isLoading && (
          <div className="flex items-center gap-3 text-xs tracking-wide text-slate-400 bg-[#131722]/40 border border-white/4 w-fit px-4 py-3 rounded-xl rounded-tl-none shadow-sm backdrop-blur-md">
            <div className="flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
              <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse [animation-delay:200ms]" />
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse [animation-delay:400ms]" />
            </div>
            <span className="font-medium tracking-wide text-slate-300">
              Edith is thinking...
            </span>
          </div>
        )}
        {/* <div ref={messagesEndRef} /> */}
      </div>

      <div className="p-4 bg-linear-to-t from-[#0e1118] via-[#0e1118] to-transparent">
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (ttsEnabled) stopSpeaking();
                setTtsEnabled((v) => !v);
              }}
              title={ttsEnabled ? "Mute Edith" : "Unmute Edith"}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150
                ${ttsEnabled ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20" : "text-slate-500 bg-white/3 border border-white/6 hover:text-slate-300"}`}
            >
              {ttsEnabled ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M9 9H5a1 1 0 00-1 1v4a1 1 0 001 1h4l3 3V6L9 9z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
              {ttsEnabled ? "Voice on" : "Voice off"}
            </button>

            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all duration-150 animate-fade-in"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Stop
              </button>
            )}
          </div>

          {isSpeaking && (
            <div className="flex items-center gap-1 text-[11px] text-cyan-400/60 animate-fade-in">
              <span className="w-1 h-3 bg-cyan-400/60 rounded-full animate-pulse" />
              <span className="w-1 h-4 bg-cyan-400/80 rounded-full animate-pulse [animation-delay:100ms]" />
              <span className="w-1 h-2 bg-cyan-400/60 rounded-full animate-pulse [animation-delay:200ms]" />
              <span className="ml-1">Speaking...</span>
            </div>
          )}
        </div>

        <div className="relative flex items-end bg-[#131722] border border-white/6 focus-within:border-cyan-500/40 focus-within:ring-4 focus-within:ring-cyan-500/3 rounded-2xl p-2 transition-all duration-300 shadow-2xl">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            placeholder={isListening ? "Listening..." : isLoading ? "Processing parameters..." : "Message Edith..."}
            disabled={isLoading}
            className="flex-1 bg-transparent outline-none px-4 py-2 text-sm text-slate-100 placeholder-slate-500 disabled:text-slate-600 font-normal transition-colors duration-200 resize-none max-h-50 overflow-y-auto custom-scrollbar"
            onKeyDown={handleKeyDown}
          />

          {hasSpeechSupport && (
            <button
              onClick={toggleListening}
              disabled={isLoading}
              title={isListening ? "Stop listening" : "Speak"}
              className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all duration-200 mr-1 mb-0.5 shadow-md
                ${isListening ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse" : "text-slate-500 hover:text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed"}`}
            >
              {isListening ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9v6m3-8v10m3-7v4M3 12h1m17 0h-1M5.5 7.5l.7.7m12.3-.7-.7.7M5.5 16.5l.7-.7m12.3.7-.7-.7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4m-4 0h8" />
                </svg>
              )}
            </button>
          )}

          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            className="h-9 w-9 flex items-center justify-center bg-slate-100 text-[#0e1118] rounded-xl transition-all duration-200 hover:bg-white active:scale-95 disabled:bg-white/2 disabled:text-slate-600 disabled:cursor-not-allowed shadow-md mb-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </button>
        </div>

        {(isListening || speechError) && (
          <p className={`text-xs text-center mt-2 animate-fade-in ${speechError ? "text-amber-400" : "text-cyan-400/70"}`}>
            {speechError || "Speak now — sends automatically when you stop"}
          </p>
        )}
      </div>
    </div>
  );
}