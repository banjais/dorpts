import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, X, Check } from 'lucide-react';
import { triggerHaptic } from '../utils/haptic';
import { speak } from '../utils/speech';
import { useLanguage } from '../context/LanguageContext';

interface VoiceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (text: string) => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

export const VoiceUpdateModal: React.FC<VoiceUpdateModalProps> = ({ isOpen, onClose, onUpdate }) => {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (isOpen) {
      speak(language === 'en' ? "Voice update module active. Please state your progress update clearly." : "आवाज अद्यावधिक मोड्युल सक्रिय छ। कृपया आफ्नो प्रगति विवरण स्पष्टसँग भन्नुहोस्।", language);
      const SpeechRecognitionConstructor = (window as unknown as { SpeechRecognition: new () => { continuous: boolean; interimResults: boolean; lang: string; onresult: (event: { resultIndex: number; results: { [key: number]: { [key: number]: { transcript: string } } } }) => void; onerror: (event: { error: string }) => void; onend: () => void; start: () => void; stop: () => void }; webkitSpeechRecognition: new () => { continuous: boolean; interimResults: boolean; lang: string; onresult: (event: { resultIndex: number; results: { [key: number]: { [key: number]: { transcript: string } } } }) => void; onerror: (event: { error: string }) => void; onend: () => void; start: () => void; stop: () => void } }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition: new () => { continuous: boolean; interimResults: boolean; lang: string; onresult: (event: { resultIndex: number; results: { [key: number]: { [key: number]: { transcript: string } } } }) => void; onerror: (event: { error: string }) => void; onend: () => void; start: () => void; stop: () => void } }).webkitSpeechRecognition;
      if (SpeechRecognitionConstructor) {
        recognitionRef.current = new SpeechRecognitionConstructor();
        if (recognitionRef.current) {
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = language === 'en' ? 'en-US' : 'ne-NP';

          recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            const current = event.resultIndex;
            const transcriptValue = event.results?.[current]?.[0]?.transcript || '';
            setTranscript(transcriptValue);
          };

          recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
            
            if (event.error === 'not-allowed') {
              setTranscript(
                language === 'en'
                  ? 'Error: Microphone access denied. Please allow permissions.'
                  : 'त्रुटि: माइक अनुमति अस्वीकार गरियो। कृपया अनुमति दिनुहोस्।'
              );
            } else {
              setTranscript(
                language === 'en'
                  ? `Speech error: ${event.error}`
                  : `आवाज पहिचानमा त्रुटि: ${event.error}`
              );
            }
          };

          recognitionRef.current.onend = () => {
            setIsListening(false);
          };
        }
      }
    }
  }, [isOpen, language]);

  const startListening = () => {
    if (recognitionRef.current) {
      triggerHaptic('light');
      setIsListening(true);
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const handleFinish = () => {
    speak(language === 'en' ? "Update recorded. Applying changes to the system." : "अद्यावधिक रेकर्ड गरियो। प्रणालीमा परिवर्तनहरू लागू गर्दैछ।", language);
    onUpdate(transcript);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Quick Update</h3>
              <button onClick={onClose}><X size={20} /></button>
            </div>
            
            <div className="flex flex-col items-center gap-4 mb-6">
              <button
                onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
                className={`p-6 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600 text-white'}`}
              >
                <Mic size={32} />
              </button>
              <p className="text-sm text-slate-500">
                {isListening ? 'Listening...' : 'Tap mic to speak'}
              </p>
            </div>
            
            {transcript && (
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl mb-6 text-sm">
                {transcript}
              </div>
            )}
            
            {transcript && (
              <button
                onClick={handleFinish}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Check size={18} /> Apply Update
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
