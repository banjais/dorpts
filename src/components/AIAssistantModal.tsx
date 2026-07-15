import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, MicOff, Send, Sparkles, Loader2, Volume2, FileText, LayoutGrid } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE } from "../utils/apiBase";

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Ensure TypeScript knows about window.SpeechRecognition and window.webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function AIAssistantModal({ isOpen, onClose }: AIAssistantModalProps) {
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([
    { role: 'assistant', content: language === 'en' ? 'Hello! I am your AI assistant. You can ask me questions about Indicator status.' : 'नमस्ते! म तपाईंको एआई सहायक हुँ। तपाईं मलाई सूचक स्थितिको बारेमा प्रश्न सोध्न सक्नुहुन्छ।' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen) {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      return;
    }
    
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'en' ? 'en-US' : 'ne-NP';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const alt = result?.[0]?.transcript;
          if (!alt) continue;
          if (result.isFinal) {
            finalTranscript += alt;
          } else {
            interimTranscript += alt;
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript);
          handleSendMessage(finalTranscript);
        } else {
          setTranscript(interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: language === 'en' 
              ? 'Microphone access denied. Please ensure you have allowed microphone permissions in your browser and that the page is served over HTTPS.' 
              : 'माइक पहुँच अस्वीकार गरियो। कृपया तपाईंको ब्राउजरमा माइक अनुमतिहरू दिनुभएको सुनिश्चित गर्नुहोस् र पृष्ठ HTTPS मार्फत उपलब्ध भएको सुनिश्चित गर्नुहोस्।' 
          }]);
        } else if (event.error === 'no-speech') {
          // Don't necessarily add a message for no-speech, just stop listening
        } else {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: language === 'en' 
              ? `Speech recognition error: ${event.error}` 
              : `आवाज पहिचान त्रुटि: ${event.error}` 
          }]);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn('Speech recognition not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [isOpen, language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current?.start();
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    const newMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(newMessages);
    setTranscript('');
    setIsProcessing(true);
    
    try {
      // Map messages for the history format expected by the API
      const history = messages.slice(1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const response = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Network response was not ok');
      }

      const data = await response.json();
      
      let assistantReply = data.text;
      const functionCalls = data.functionCalls || [];

      // Process function calls
      if (functionCalls.length > 0) {
        for (const call of functionCalls) {
          switch (call.name) {
            case 'open_page':
              window.dispatchEvent(new CustomEvent('ai:open_page', { detail: call.args }));
              assistantReply += `\nOpening ${call.args.page} view...`;
              break;
            case 'make_report':
              window.dispatchEvent(new CustomEvent('ai:make_report', { detail: call.args }));
              assistantReply += `\nGenerating ${call.args.type} report...`;
              break;
            case 'print_screen':
              window.dispatchEvent(new CustomEvent('ai:print_screen'));
              assistantReply += '\nOpening print dialog...';
              break;
            case 'show_menu':
              window.dispatchEvent(new CustomEvent('ai:show_menu'));
              assistantReply += '\nShowing menu options...';
              break;
            case 'set_volume':
              window.dispatchEvent(new CustomEvent('ai:set_volume', { detail: call.args }));
              assistantReply += `\nVolume ${call.args.enabled ? 'enabled' : 'disabled'}.`;
              break;
          }
        }
      }

      if (!assistantReply) {
        assistantReply = language === 'en' ? 'Done.' : 'भयो।';
      }

      setMessages([...newMessages, { 
        role: 'assistant', 
        content: assistantReply
      }]);
    } catch (error: any) {
      console.error('AI processing error:', error);
      const errMsg = error?.message || "";
      const displayMessage = errMsg.includes("API key") 
        ? errMsg
        : (language === 'en' 
            ? 'Sorry, I encountered an error communicating with the server.' 
            : 'माफ गर्नुहोस्, सर्भरसँग सञ्चार गर्दा मैले एउटा त्रुटि सामना गरें।');
            
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: displayMessage
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col h-[600px] max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-indigo-600 dark:bg-indigo-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold">{language === 'en' ? 'AI Assistant' : 'एआई सहायक'}</h2>
              <p className="text-[0.625rem] text-indigo-100 uppercase tracking-wider">{language === 'en' ? 'Voice Enabled' : 'भ्वाइस सक्षम'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/50 custom-scroll">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-sm' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 rounded-bl-sm'
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-sm p-4 shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="text-indigo-600 animate-spin" />
                <span className="text-xs text-slate-500">{language === 'en' ? 'Thinking...' : 'सोच्दै हुनुहुन्छ...'}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          
            <div className="flex justify-center mb-4">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('ai:make_report'));
                  }}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors border border-indigo-100 dark:border-indigo-800/50"
                >
                  <FileText size={12} />
                  {language === 'en' ? 'Generate Report' : 'रिपोर्ट बनाउनुहोस्'}
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('ai:make_audio_report'));
                  }}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors border border-indigo-100 dark:border-indigo-800/50"
                >
                  <Volume2 size={12} />
                  {language === 'en' ? 'Audio Report' : 'अडियो रिपोर्ट'}
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('ai:print_screen'));
                  }}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors border border-indigo-100 dark:border-indigo-800/50"
                >
                  <FileText size={12} />
                  {language === 'en' ? 'Print Screen' : 'प्रिन्ट स्क्रिन'}
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('ai:show_menu'));
                  }}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors border border-indigo-100 dark:border-indigo-800/50"
                >
                  <LayoutGrid size={12} />
                  {language === 'en' ? 'View Options' : 'दृश्य विकल्पहरू'}
                </button>
              </div>
            </div>

          {/* Transcript Preview */}
          <AnimatePresence>
            {transcript && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 italic flex items-center gap-2 border border-indigo-100 dark:border-indigo-800/50"
              >
                <Volume2 size={14} className="animate-pulse shrink-0" />
                <span className="line-clamp-2">{transcript}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={isListening 
                  ? (language === 'en' ? 'Listening...' : 'सुन्दैछ...') 
                  : (language === 'en' ? 'Ask a question or use voice...' : 'प्रश्न सोध्नुहोस् वा भ्वाइस प्रयोग गर्नुहोस्...')
                }
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage(transcript);
                }}
                className={`w-full px-4 py-3.5 text-sm rounded-2xl border bg-slate-50 dark:bg-slate-900 outline-none transition-colors ${
                  isListening 
                    ? 'border-indigo-400 bg-indigo-50/30 text-indigo-800 dark:text-indigo-200 shadow-[0_0_0_4px_rgba(79,70,229,0.1)]' 
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                }`}
              />
            </div>

             <button
               onClick={toggleListening}
               className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 shadow-sm ${
                 isListening
                   ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 animate-pulse'
                   : 'bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-400 dark:border-indigo-800'
               }`}
                title={language === 'en' ? 'Voice input' : 'भ्वाइस इनपुट'}
             >
               {isListening ? <MicOff size={20} /> : <Mic size={20} />}
             </button>

            <button
              onClick={() => handleSendMessage(transcript)}
              disabled={!transcript.trim()}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 shadow-sm ${
                transcript.trim()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Send size={18} className={transcript.trim() ? 'ml-1' : ''} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}
