/**
 * Speech synthesis utility for the DoR Progress Tracking System.
 * Supports both English and Nepali text-to-speech.
 */

export type Language = 'en' | 'ne';

let isMuted = false;

export const setMuted = (muted: boolean) => {
  isMuted = muted;
};

export const getMuted = () => isMuted;

/**
 * Speaks the provided text using the browser's SpeechSynthesis API.
 * @param text The text to speak
 * @param lang The language ('en' or 'ne')
 */
export const speak = (text: string, lang: Language = 'en'): void => {
  if (isMuted) return;

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  try {
    window.speechSynthesis.cancel();
  } catch (e) {
    console.error('Speech synthesis cancel error:', e);
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'ne' ? 'ne-NP' : 'en-US';
  utterance.rate = 0.9; // Slightly slower for clarity
  utterance.pitch = 1;

  // Try to find a suitable voice
  const voices = window.speechSynthesis.getVoices();
  
  if (lang === 'ne') {
    const neVoice = voices.find(v => v.lang.startsWith('ne'));
    if (neVoice) utterance.voice = neVoice;
  } else {
    const enVoice = voices.find(v => v.lang.startsWith('en'));
    if (enVoice) utterance.voice = enVoice;
  }

  // Handle case where voices are not yet loaded
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      const updatedVoices = window.speechSynthesis.getVoices();
      if (lang === 'ne') {
        const neVoice = updatedVoices.find(v => v.lang.startsWith('ne'));
        if (neVoice) utterance.voice = neVoice;
      } else {
        const enVoice = updatedVoices.find(v => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
      }
      window.speechSynthesis.speak(utterance);
    };
  } else {
    window.speechSynthesis.speak(utterance);
  }
};
