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

// Strip punctuation for clean speech - no spoken punctuation marks
const normalizeText = (text: string): string => {
  // Remove special characters that should not be spoken, keep letters, numbers, spaces, and sentence-ending punctuation
  return text
    .replace(/[\/\*\(\)\[\]\{\}_#@&%=+~`|\\<>^"']/g, ' ')  // replace special chars with space
    .replace(/\.{3,}/g, ' ')  // replace ellipsis with space
    .replace(/--+/g, ' ')  // replace multiple dashes with space
    .replace(/[—–-]/g, ' ')  // replace dashes with space
    .replace(/\s+/g, ' ')  // collapse whitespace
    .trim();
};

const SENTENCE_SPLIT_RE = /(?<=[.!?])\s+/;

const splitIntoSentences = (text: string): string[] => {
  return text.split(SENTENCE_SPLIT_RE).filter(s => s.trim().length > 0);
};

const speakSentence = (sentence: string, lang: Language, onDone: () => void): void => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onDone();
    return;
  }
  const utterance = new SpeechSynthesisUtterance(sentence);
  utterance.lang = lang === 'ne' ? 'ne-NP' : 'en-US';
  utterance.rate = 0.85;
  utterance.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  if (lang === 'ne') {
    const neVoice = voices.find(v => v.lang.startsWith('ne'));
    if (neVoice) utterance.voice = neVoice;
  } else {
    const enVoice = voices.find(v => v.lang.startsWith('en'));
    if (enVoice) utterance.voice = enVoice;
  }
  utterance.onend = () => onDone();
  utterance.onerror = () => onDone();
  window.speechSynthesis.speak(utterance);
};

export const speak = (text: string, lang: Language = 'en'): void => {
  if (isMuted) return;

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  const normalized = normalizeText(text);

  try {
    window.speechSynthesis.cancel();
  } catch (e) {
    console.error('Speech synthesis cancel error:', e);
  }

  const sentences = splitIntoSentences(normalized);
  if (sentences.length === 0) return;

  let index = 0;
  const speakNext = () => {
    if (index >= sentences.length) return;
    const sentence = sentences[index];
    index++;
    if (index < sentences.length) {
      const delay = lang === 'ne' ? 600 : 400;
      speakSentence(sentence, lang, () => {
        setTimeout(speakNext, delay);
      });
    } else {
      speakSentence(sentence, lang, () => {});
    }
  };
  speakNext();
};
