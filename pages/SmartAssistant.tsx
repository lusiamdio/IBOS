import React, { useState, useRef, useEffect } from 'react';
import { chatWithAssistant, searchMarketIntel, findLocalSuppliers, transcribeAudio, generateSpeech } from '../services/geminiService';
import { ChatMessage, GeoLocation } from '../types';
import { AIChatBubble, Input, Button } from '../components/DesignSystem';
import { Mic, Languages, Send, Volume2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const SmartAssistant: React.FC = () => {
  // Script A: Onboarding Script (Initial Greeting)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '1', 
      role: 'model', 
      text: 'Welcome. You don’t need paperwork to start.\nJust tell me what you sold today, or ask me for advice.', 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice Recording state
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Audio Playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const [mode, setMode] = useState<'chat' | 'search' | 'maps'>('chat');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { language, setLanguage, t } = useLanguage();

  const handleModeChange = (newMode: 'chat' | 'search' | 'maps') => {
    setMode(newMode);
    if (newMode === 'search') {
      setMessages([{ id: Date.now().toString(), role: 'model', text: 'Market Intel active. What market or product trend do you want to explore?', timestamp: new Date() }]);
    } else if (newMode === 'maps') {
      setMessages([{ id: Date.now().toString(), role: 'model', text: 'Supplier mode active. Tell me what you need, and I will find nearby wholesale suppliers.', timestamp: new Date() }]);
    } else {
      setMessages([{ id: Date.now().toString(), role: 'model', text: 'Welcome. You don’t need paperwork to start.\nJust tell me what you sold today, or ask me for advice.', timestamp: new Date() }]);
    }
  };
  const [location] = useState<GeoLocation>({ lat: -26.2041, lng: 28.0473 }); // Johannesburg

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Contextual Insights (Scripts B, C, D, E)
  const insights = [
    {
      id: 'sales',
      type: 'Opportunity',
      icon: '📈',
      title: 'Sales Insight',
      text: 'You made more on Fridays. If you stock 10 more units, your income could grow by 18%.',
      color: 'bg-primary-50 border-primary-100 text-primary-800'
    },
    {
      id: 'compliance',
      type: 'Compliance',
      icon: '🌍',
      title: 'Export Ready',
      text: 'You are 60% ready to export to Botswana. I can help you complete the missing steps.',
      color: 'bg-blue-50 border-blue-100 text-blue-800'
    },
    {
      id: 'risk',
      type: 'Alert',
      icon: '⚠️',
      title: 'Risk Alert',
      text: 'Your expenses increased faster than income this week. Let’s review what changed.',
      color: 'bg-orange-50 border-orange-100 text-orange-800'
    }
  ];

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let responseText = '';
      let groundingData = undefined;

      if (mode === 'search') {
        const result = await searchMarketIntel(userMsg.text);
        responseText = result.text;
        groundingData = { search: result.sources };
      } else if (mode === 'maps') {
        const result = await findLocalSuppliers(userMsg.text, location.lat, location.lng);
        responseText = result.text;
        groundingData = { maps: result.places };
      } else {
        // Standard Chat
        const history = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));
        responseText = await chatWithAssistant(history, userMsg.text);
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date(),
        groundingMetadata: groundingData
      };
      setMessages(prev => [...prev, botMsg]);

      // Automatically generate text to speech for the response
      try {
        const audioBase64 = await generateSpeech(responseText);
        
        if (!audioContextRef.current) {
          audioContextRef.current = new window.AudioContext({ sampleRate: 24000 });
        }
        
        const binary = atob(audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        
        // Convert 16-bit PCM to Float32
        const float32 = new Float32Array(bytes.length / 2);
        for (let i = 0; i < float32.length; i++) {
          const int16 = bytes[i * 2] | (bytes[i * 2 + 1] << 8);
          const signed = int16 >= 0x8000 ? int16 - 0x10000 : int16;
          float32[i] = signed / 32768;
        }

        const audioCtx = audioContextRef.current;
        const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
        audioBuffer.getChannelData(0).set(float32);
        
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.onended = () => setIsPlayingAudio(false);
        source.start();
        
        audioSourceRef.current = source;
        setIsPlayingAudio(true);
      } catch (ttsErr) {
        console.error("Failed to generate speech for response", ttsErr);
      }

    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Sorry, I had trouble connecting. Please check your internet or try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Use a generic name since we convert blob to file
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        setIsLoading(true);
        setInput("Transcribing...");
        try {
           const transcription = await transcribeAudio(audioFile);
           setInput(transcription);
           handleSend(transcription);
        } catch (err) {
           console.error("Transcription failed", err);
           setInput("");
        } finally {
           setIsLoading(false);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const stopPlayback = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] relative space-y-4">
      {/* Top Controls: Mode & Language */}
      <div className="flex justify-between items-center pb-2 border-b border-neutral-200/80">
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl border border-neutral-200/60">
          <button 
            onClick={() => handleModeChange('chat')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${mode === 'chat' ? 'bg-white text-neutral-900 shadow-subtle' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            General Query
          </button>
          <button 
            onClick={() => handleModeChange('search')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${mode === 'search' ? 'bg-white text-neutral-900 shadow-subtle' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            Market Intel
          </button>
          <button 
            onClick={() => handleModeChange('maps')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${mode === 'maps' ? 'bg-white text-neutral-900 shadow-subtle' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            Suppliers
          </button>
        </div>

        <div className="relative">
          <button 
            type="button"
            className="h-8 px-2.5 rounded-lg border border-neutral-200/80 bg-white hover:bg-neutral-50 flex items-center gap-1.5 text-xs text-neutral-700 transition-colors"
          >
            <Languages size={13} className="text-neutral-500" />
            <span className="uppercase text-[11px] font-mono">{language}</span>
          </button>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as any)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          >
            <option value="en">English</option>
            <option value="zu">isiZulu</option>
            <option value="xh">isiXhosa</option>
            <option value="sw">Kiswahili</option>
            <option value="kg">Kikongo</option>
            <option value="ln">Lingala</option>
            <option value="yo">Yorùbá</option>
            <option value="af">Afrikaans</option>
            <option value="ig">Igbo</option>
            <option value="pt">Português</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
            <option value="es">Español</option>
          </select>
        </div>
      </div>

      {/* Proactive Context Engine (Insights) */}
      {messages.length < 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {insights.map((insight) => (
            <button
              key={insight.id}
              onClick={() => handleSend(`Tell me more about this: "${insight.text}"`)}
              className="p-3.5 rounded-xl border border-neutral-200/80 bg-white hover:border-neutral-900 text-left transition-colors shadow-card flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
                  {insight.type}
                </span>
                <h4 className="text-xs font-semibold text-neutral-900 mb-1">{insight.title}</h4>
                <p className="text-[11px] text-neutral-500 leading-relaxed">{insight.text}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1" ref={scrollRef}>
        {messages.map((msg) => (
          <AIChatBubble 
            key={msg.id}
            message={msg.text}
            isUser={msg.role === 'user'}
            timestamp={msg.timestamp}
            grounding={msg.groundingMetadata}
          />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-neutral-200/80 rounded-xl px-4 py-2.5 text-xs text-neutral-500 shadow-card flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" />
              <span>Analyzing market context...</span>
            </div>
          </div>
        )}
      </div>

      {/* Voice-First Input Area */}
      <div className="sticky bottom-0 bg-neutral-50/95 pt-2 pb-2 backdrop-blur-sm">
        {isPlayingAudio && (
          <div className="flex justify-center mb-2">
            <button 
              onClick={stopPlayback}
              className="bg-neutral-900 text-white text-[11px] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-subtle hover:bg-neutral-800 transition-colors"
            >
              <Volume2 size={12} className="animate-pulse" />
              Stop Voice Output
            </button>
          </div>
        )}

        <div className="relative flex items-center bg-white border border-neutral-200/90 rounded-2xl shadow-card focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900 transition-all p-1.5">
          <input 
            className="flex-1 h-10 bg-transparent px-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? "Listening to your dictation..." : "Type or dictate transaction or business query..."}
            disabled={isListening}
          />
          
          <div className="flex items-center gap-1 shrink-0">
            <button 
              onClick={toggleListening}
              type="button"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                isListening 
                  ? 'bg-rose-600 text-white animate-pulse' 
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              }`}
              title="Voice Dictation"
            >
              <Mic size={15} />
            </button>

            {input.trim() && !isListening && (
              <button 
                onClick={() => handleSend()}
                type="button"
                className="w-9 h-9 bg-neutral-900 hover:bg-neutral-800 rounded-xl flex items-center justify-center text-white transition-colors"
                title="Send"
              >
                <Send size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
