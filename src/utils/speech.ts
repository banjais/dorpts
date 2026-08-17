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

const normalizeText = (text: string): string => {
  return text
    .replace(/[/*()\[\]{}_#@&%=+~`|\\<>^"']/g, ' ')
    .replace(/\.{3,}/g, ' ')
    .replace(/--+/g, ' ')
    .replace(/[—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const SENTENCE_SPLIT_RE = /(?<=[.!?])\s+/;

const splitIntoSentences = (text: string): string[] => {
  return text.split(SENTENCE_SPLIT_RE).filter(s => s.trim().length > 0);
};

const speakSentence = (sentence: string, lang: Language, onDone?: () => void): void => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onDone?.();
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
  utterance.onend = () => onDone?.();
  utterance.onerror = () => onDone?.();
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

export interface SpeechPlayerState {
  sentences: string[];
  currentIndex: number;
  totalSentences: number;
  isPlaying: boolean;
  isMuted: boolean;
  lang: Language;
}

type PlayerListener = (state: SpeechPlayerState) => void;

const playerState: SpeechPlayerState = {
  sentences: [],
  currentIndex: 0,
  totalSentences: 0,
  isPlaying: false,
  isMuted: false,
  lang: 'en',
};

let playerListeners: PlayerListener[] = [];

const notifyPlayer = () => {
  playerListeners.forEach(l => l({ ...playerState }));
};

const speakCurrentSentence = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (playerState.isMuted) return;
  const sentence = playerState.sentences[playerState.currentIndex];
  if (!sentence) {
    playerState.isPlaying = false;
    notifyPlayer();
    return;
  }
  const utterance = new SpeechSynthesisUtterance(sentence);
  utterance.lang = playerState.lang === 'ne' ? 'ne-NP' : 'en-US';
  utterance.rate = 0.85;
  utterance.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  if (playerState.lang === 'ne') {
    const neVoice = voices.find(v => v.lang.startsWith('ne'));
    if (neVoice) utterance.voice = neVoice;
  } else {
    const enVoice = voices.find(v => v.lang.startsWith('en'));
    if (enVoice) utterance.voice = enVoice;
  }
  utterance.onend = () => {
    if (playerState.currentIndex < playerState.sentences.length - 1) {
      playerState.currentIndex++;
      notifyPlayer();
      const delay = playerState.lang === 'ne' ? 600 : 400;
      setTimeout(speakCurrentSentence, delay);
    } else {
      playerState.isPlaying = false;
      notifyPlayer();
    }
  };
  utterance.onerror = () => {
    playerState.isPlaying = false;
    notifyPlayer();
  };
  window.speechSynthesis.speak(utterance);
};

export const speechPlayer = {
  getState: (): SpeechPlayerState => ({ ...playerState }),

  subscribe: (listener: PlayerListener): (() => void) => {
    playerListeners.push(listener);
    return () => {
      playerListeners = playerListeners.filter(l => l !== listener);
    };
  },

  play: (text: string, lang: Language = 'en'): void => {
    if (playerState.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.error('Speech synthesis cancel error:', e);
    }
    const normalized = normalizeText(text);
    const sentences = splitIntoSentences(normalized);
    if (sentences.length === 0) return;
    playerState.sentences = sentences;
    playerState.currentIndex = 0;
    playerState.totalSentences = sentences.length;
    playerState.isPlaying = true;
    playerState.lang = lang;
    notifyPlayer();
    setTimeout(speakCurrentSentence, 100);
  },

  stop: (): void => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    playerState.isPlaying = false;
    notifyPlayer();
  },

  next: (): void => {
    if (playerState.currentIndex < playerState.sentences.length - 1) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      playerState.currentIndex++;
      notifyPlayer();
      if (playerState.isPlaying) {
        setTimeout(speakCurrentSentence, 100);
      }
    }
  },

  prev: (): void => {
    if (playerState.currentIndex > 0) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      playerState.currentIndex--;
      notifyPlayer();
      if (playerState.isPlaying) {
        setTimeout(speakCurrentSentence, 100);
      }
    }
  },

  repeat: (): void => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    notifyPlayer();
    if (playerState.isPlaying) {
      setTimeout(speakCurrentSentence, 100);
    }
  },

  setMuted: (muted: boolean): void => {
    playerState.isMuted = muted;
    if (muted && playerState.isPlaying) {
      speechPlayer.stop();
    }
    notifyPlayer();
  },

  toggleMute: (): void => {
    speechPlayer.setMuted(!playerState.isMuted);
  },

  togglePlay: (text?: string, lang?: Language): void => {
    if (playerState.isPlaying) {
      speechPlayer.stop();
    } else {
      if (text) {
        speechPlayer.play(text, lang || playerState.lang);
      }
    }
  },
};

export const buildDashboardSummaryText = (
  total: number,
  weightedRate: number,
  lowIndicatorNames: string[],
  language: Language
): string => {
  if (language === 'en') {
    let text = `System Dashboard Summary. Tracking ${total} performance indicators. The overall weighted achievement rate is ${weightedRate} percent. `;
    if (lowIndicatorNames.length > 0) {
      text += `Attention required: There are ${lowIndicatorNames.length} indicators performing below the 20 percent threshold. `;
      const listNames = lowIndicatorNames.slice(0, 5).join(', ');
      text += `These critical indicators include: ${listNames}. `;
      if (lowIndicatorNames.length > 5) {
        text += `and ${lowIndicatorNames.length - 5} other indicators. `;
      }
      text += "Please review these indicators for recovery actions.";
    } else {
      text += "Outstanding performance. All active indicators are currently performing above the 20 percent threshold.";
    }
    return text;
  } else {
    const nepaliTotal = total.toString().replace(/\d/g, d => '०१२३४५६७८९'[parseInt(d)]);
    const nepaliRate = weightedRate.toString().replace(/\d/g, d => '०१२३४५६७८९'[parseInt(d)]);
    const nepaliLowCount = lowIndicatorNames.length.toString().replace(/\d/g, d => '०१२३४५६७८९'[parseInt(d)]);
    let text = `प्रणाली ड्यासबोर्ड सारांश। कुल ${nepaliTotal} कार्यसम्पादन सूचकहरू ट्र्याक गरिएको छ। समग्र भारित उपलब्धि दर ${nepaliRate} प्रतिशत रहेको छ। `;
    if (lowIndicatorNames.length > 0) {
      text += `विशेष ध्यान दिनुहोस्: ${nepaliLowCount} वटा सूचकहरू बीस प्रतिशतको थ्रेसहोल्ड भन्दा कम प्रदर्शनमा छन्। `;
      const listNames = lowIndicatorNames.slice(0, 5).join(', ');
      text += `यी सूचकहरूमा: ${listNames} समावेश छन्। `;
      if (lowIndicatorNames.length > 5) {
        text += `र अन्य ${(lowIndicatorNames.length - 5).toString().replace(/\d/g, d => '०१२३४५६७८९'[parseInt(d)])} सूचकहरू। `;
      }
      text += "कृपया यी सूचकहरूको सुधारका लागि आवश्यक कदमहरू चाल्नुहोला।";
    } else {
      text += "उत्कृष्ट कार्यसम्पादन। सबै सूचकहरू हाल बीस प्रतिशतको न्यूनतम थ्रेसहोल्ड भन्दा माथि रहेका छन्।";
    }
    return text;
  }
};
