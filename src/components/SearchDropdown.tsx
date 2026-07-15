import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Mic, CornerDownLeft, Hash, X, ArrowUpDown, ArrowUpWideNarrow, ArrowDownWideNarrow, Check, Milestone, Clock, Building2, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Fuse from 'fuse.js';
import { useLanguage } from '../context/LanguageContext';
import { Indicator, ViewMode } from '../types';
import { triggerHaptic } from '../utils/haptic';
import { normalizeCategory, STANDARD_CATEGORIES } from '../utils/category';
import { speak, getMuted } from '../utils/speech';

interface SearchDropdownProps {
  indicators: Indicator[];
  onSearch: (query: string) => void;
  searchQuery: string;
  sortType: 'default' | 'low' | 'high';
  onSortChange: (sortType: 'default' | 'low' | 'high') => void;
  onViewChange?: (view: ViewMode) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedOffice?: string;
  onOfficeChange?: (office: string) => void;
  showMilestonesOnly: boolean;
  onToggleMilestonesOnly: () => void;
  viewMode?: ViewMode;
  viewOptions?: Array<{ id: string; label: string; icon: React.ReactNode }>;
  forceShowSearch?: boolean;
  hideSearchInput?: boolean;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({ 
  indicators, 
  onSearch, 
  searchQuery,
  sortType,
  onSortChange,
  onViewChange,
  selectedCategory,
  onCategoryChange,
  selectedOffice = 'All',
  onOfficeChange,
  showMilestonesOnly,
  onToggleMilestonesOnly,
  viewMode,
  viewOptions,
  forceShowSearch = false,
  hideSearchInput = false
}) => {
  const { language, t, translateOffice } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recognitionSupported, setRecognitionSupported] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const uniqueOffices = useMemo(() => {
    const offices = new Set<string>();
    indicators.forEach(ind => {
      if (ind && ind.office) offices.add(ind.office);
    });
    return Array.from(offices);
  }, [indicators]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    indicators.forEach(ind => {
      if (ind && ind.category) cats.add(ind.category);
    });
    return Array.from(cats);
  }, [indicators]);

  const searchableItems = useMemo(() => {
    const items: any[] = (indicators || []).filter(Boolean).map(ind => ({
      type: 'indicator',
      id: ind.id,
      name: ind.name,
      nameEn: ind.nameEn || ind.name,
      category: ind.category,
      data: ind
    }));

    uniqueOffices.forEach(office => {
      items.push({
        type: 'office',
        id: `office-${office}`,
        name: office,
        nameEn: translateOffice(office),
        category: 'Office'
      });
    });

    uniqueCategories.forEach(cat => {
      items.push({
        type: 'category',
        id: `cat-${cat}`,
        name: cat,
        nameEn: cat,
        category: 'Category'
      });
    });

    return items;
  }, [indicators, uniqueOffices, uniqueCategories]);

  const fuse = useMemo(() => new Fuse(searchableItems, {
    keys: ['id', 'name', 'nameEn', 'category'],
    threshold: 0.4,
    ignoreLocation: true,
    includeScore: true,
  }), [searchableItems]);

  const startListening = () => {
    setErrorMessage(null);
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Failed to stop recognition:', err);
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as unknown as { SpeechRecognition: unknown; webkitSpeechRecognition: unknown }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      setErrorMessage(
        language === 'en' 
          ? 'Speech recognition is not supported in this browser.' 
          : 'तपाईँको ब्राउजरमा आवाज पहिचान सेवा उपलब्ध छैन।'
      );
      return;
    }

    const recognition = new (SpeechRecognition as unknown as new () => { lang: string; interimResults: boolean; maxAlternatives: number; onstart: () => void; onresult: (event: { results: { [key: number]: { [key: number]: { transcript: string } } }; resultIndex: number }) => void; onerror: (event: { error: string }) => void; onend: () => void; start: () => void; stop: () => void })();
    recognitionRef.current = recognition;
    recognition.lang = language === 'ne' ? 'ne-NP' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage(null);
    };

    recognition.onresult = (event: unknown) => {
      const resultEvent = event as { results: { [key: number]: { [key: number]: { transcript: string } } }; resultIndex: number };
      let transcript = resultEvent.results?.[resultEvent.resultIndex]?.[0]?.transcript || '';
      // Remove trailing punctuation that speech recognition sometimes adds
      transcript = transcript.replace(/[.,?!]+$/, '').trim();
      
      const detectedView = detectViewCommand(transcript);
      const detectedCategory = detectCategoryCommand(transcript);

      if (detectedView && onViewChange) {
        onViewChange(detectedView);
        speakViewSwitchConfirmation(detectedView);
      } else if (detectedCategory) {
        onCategoryChange(detectedCategory);
        speakCategorySwitchConfirmation(detectedCategory);
        onSearch('');
      } else {
        onSearch(transcript);
        setIsOpen(true);
        speakConfirmation(transcript);
      }
    };

    recognition.onerror = (event: unknown) => {
      const errorEvent = event as { error: string };
      console.error('Speech recognition error:', errorEvent.error);
      setIsListening(false);
      
      if (errorEvent.error === 'not-allowed') {
        setErrorMessage(
          language === 'en'
            ? 'Microphone access denied. Please allow mic permissions.'
            : 'माइक अनुमति अस्वीकार गरियो। कृपया सेटिङमा अनुमति दिनुहोस्।'
        );
      } else if (errorEvent.error === 'no-speech') {
        setErrorMessage(
          language === 'en'
            ? 'No speech detected. Please speak clearly.'
            : 'कुनै आवाज सुनिएन। कृपया स्पष्टसँग बोल्नुहोस्।'
        );
      } else {
        setErrorMessage(
          language === 'en'
            ? `Speech recognition failed: ${errorEvent.error}`
            : `आवाज पहिचान असफल भयो: ${errorEvent.error}`
        );
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setIsListening(false);
      setErrorMessage(
        language === 'en'
          ? 'Failed to access microphone.'
          : 'माइक पहुँच गर्न असफल भयो।'
      );
    }
  };

  const speakConfirmation = (queryText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.error('Speech synthesis cancel error:', e);
    }

    const matchedItems = fuse.search(queryText).map(result => result.item).filter(Boolean);

    const matchesCount = matchedItems.length;

    let textToSpeak = '';
    if (language === 'en') {
      if (matchesCount === 0) {
        textToSpeak = `Searched for "${queryText}". No matching indicators or offices were found. Please try another search term.`;
      } else if (matchesCount === 1) {
        const item = matchedItems[0];
        const name = item.nameEn || item.name;
        const type = item.type === 'office' ? 'office' : 'indicator';
        textToSpeak = `Searched for "${queryText}". Found one matching ${type}: ${name}.`;
      } else {
        const indicatorsCount = matchedItems.filter(i => i.type === 'indicator').length;
        const officesCount = matchedItems.filter(i => i.type === 'office').length;
        textToSpeak = `Searched for "${queryText}". Found ${matchesCount} results: ${indicatorsCount} indicators and ${officesCount} offices.`;
      }
    } else {
      if (matchesCount === 0) {
        textToSpeak = `खोजिएको शब्द "${queryText}" को लागि कुनै सूचक वा कार्यालय फेला परेन। कृपया अर्को शब्द प्रयोग गर्नुहोस्।`;
      } else if (matchesCount === 1) {
        const item = matchedItems[0];
        const name = item.name;
        const type = item.type === 'office' ? 'कार्यालय' : 'सूचक';
        textToSpeak = `खोजिएको शब्द "${queryText}" को लागि एउटा ${type} फेला पर्यो, जुन "${name}" हो।`;
      } else {
        const indicatorsCount = matchedItems.filter(i => i.type === 'indicator').length;
        const officesCount = matchedItems.filter(i => i.type === 'office').length;
        textToSpeak = `खोजिएको शब्द "${queryText}" को लागि ${matchesCount} वटा नतिजाहरू फेला परे: ${indicatorsCount} सूचकहरू र ${officesCount} कार्यालयहरू।`;
      }
    }

    speak(textToSpeak, language === 'ne' ? 'ne' : 'en');
  };

  const detectViewCommand = (text: string): ViewMode | null => {
    const normalized = text.toLowerCase().trim();
    
    // Trend matches
    if (
      normalized.includes('trend') ||
      normalized.includes('प्रवृत्ति') ||
      normalized.includes('विश्लेषण') ||
      normalized.includes('trajectory')
    ) {
      return 'trend' as any;
    }
    
    // Dashboard matches
    if (
      normalized.includes('dashboard') ||
      normalized.includes('ड्यासबोर्ड')
    ) {
      return 'dashboard';
    }
    
    // Table matches
    if (
      normalized.includes('table view') ||
      normalized.includes('show table') ||
      normalized.includes('go to table') ||
      normalized.includes('table icon') ||
      normalized.includes('तालिका') ||
      normalized.includes('टेबल')
    ) {
      return 'table';
    }
    
    // Chart matches
    if (
      normalized.includes('chart view') ||
      normalized.includes('show chart') ||
      normalized.includes('go to chart') ||
      normalized.includes('चार्ट')
    ) {
      return 'chart';
    }

    // Card matches
    if (
      normalized.includes('card view') ||
      normalized.includes('show card') ||
      normalized.includes('go to card') ||
      normalized.includes('कार्ड')
    ) {
      return 'card';
    }
    
    // Heatmap matches
    if (
      normalized.includes('heatmap') ||
      normalized.includes('heat map') ||
      normalized.includes('हिटम्याप') ||
      normalized.includes('हिट म्याप')
    ) {
      return 'heatmap';
    }

    // Institutional matches
    if (
      normalized.includes('institutional') ||
      normalized.includes('organization') ||
      normalized.includes('highlight') ||
      normalized.includes('संस्थागत') ||
      normalized.includes('कार्यालय')
    ) {
      return 'institutional';
    }

    return null;
  };

  const detectCategoryCommand = (text: string): string | null => {
    const normalized = text.toLowerCase().trim();

    // Check for "Infrastructure Creation" or "भौतिक पूर्वाधार"
    if (
      normalized.includes('infrastructure') ||
      normalized.includes('creation') ||
      normalized.includes('पूर्वाधार') ||
      normalized.includes('भौतिक पूर्वाधार') ||
      normalized.includes('भौतिक')
    ) {
      return 'Infrastructure Creation';
    }

    // Check for "Maintenance" or "मर्मतसम्भार" or "मर्मत"
    if (
      normalized.includes('maintenance') ||
      normalized.includes('मर्मत') ||
      normalized.includes('मर्मतसम्भार')
    ) {
      return 'Maintenance';
    }

    // Check for "Employment Creation" or "रोजगारी"
    if (
      normalized.includes('employment') ||
      normalized.includes('job') ||
      normalized.includes('रोजगार') ||
      normalized.includes('रोजगारी')
    ) {
      return 'Employment Creation';
    }

    // Check for "Budget Utilization" or "बजेट"
    if (
      normalized.includes('budget') ||
      normalized.includes('बजेट') ||
      normalized.includes('उपयोगिता')
    ) {
      return 'Budget Utilization';
    }

    // Check for "Governance" or "सुशासन"
    if (
      normalized.includes('governance') ||
      normalized.includes('auditing') ||
      normalized.includes('सुशासन') ||
      normalized.includes('संस्थागत सबलीकरण')
    ) {
      return 'Governance';
    }

    // Check for "All" or "सबै"
    if (
      normalized === 'all' ||
      normalized === 'show all' ||
      normalized === 'clear filter' ||
      normalized === 'सबै' ||
      normalized === 'सबै सूचक'
    ) {
      return 'All';
    }

    return null;
  };

  const speakCategorySwitchConfirmation = (category: string) => {
    let textToSpeak = '';
    if (language === 'en') {
      if (category === 'All') {
        textToSpeak = "Showing all categories.";
      } else {
        const readableCategory = category === 'Maintenance' ? 'Road Maintenance' : category === 'Governance' ? 'Governance and Auditing' : category;
        textToSpeak = `Filtering indicators by ${readableCategory} category.`;
      } 
    } else {
      if (category === 'All') {
        textToSpeak = "सबै श्रेणीका सूचकहरू देखाउँदैछ।";
      } else {
        const nepaliCategory = t(category);
        textToSpeak = `${nepaliCategory} श्रेणी अनुसार फिल्टर गर्दैछ।`;
      }
    }
    speak(textToSpeak, language === 'ne' ? 'ne' : 'en');
  };

  const speakViewSwitchConfirmation = (view: ViewMode) => {
    let textToSpeak = '';
    if (language === 'en') {
      switch (view) {
        case 'dashboard':
          textToSpeak = "Switching to Dashboard View.";
          break;
        case 'card':
          textToSpeak = "Switching to Card View.";
          break;
        case 'chart':
          textToSpeak = "Switching to Chart View.";
          break;
        case 'trend' as any:
          textToSpeak = "Switching to Historical Trend Analysis.";
          break;
        case 'table':
          textToSpeak = "Switching to Table View.";
          break;
        case 'heatmap':
          textToSpeak = "Switching to Performance Heatmap View.";
          break;
        default:
          textToSpeak = `Switching to ${view} view.`;
      }
    } else {
      switch (view) {
        case 'dashboard':
          textToSpeak = "ड्यासबोर्ड दृश्यमा जाँदैछ।";
          break;
        case 'card':
          textToSpeak = "कार्ड दृश्यमा जाँदैछ।";
          break;
        case 'chart':
          textToSpeak = "चार्ट दृश्यमा जाँदैछ।";
          break;
        case 'trend' as any:
          textToSpeak = "ऐतिहासिक प्रवृत्ति विश्लेषणमा जाँदैछ।";
          break;
        case 'table':
          textToSpeak = "तालिका दृश्यमा जाँदैछ।";
          break;
        case 'heatmap':
          textToSpeak = "हिटम्याप दृश्यमा जाँदैछ।";
          break;
        default:
          textToSpeak = `${view} दृश्यमा जाँदैछ।`;
      }
    }
    speak(textToSpeak, language === 'ne' ? 'ne' : 'en');
  };

  const filteredMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query === '') return [];

    if (query.startsWith('type:')) {
      const typeQuery = query.replace('type:', '').trim();
      if (!typeQuery) return searchableItems.filter(item => item.type === 'category');
      return searchableItems.filter(item => 
        item.type === 'category' && 
        (item.name.toLowerCase().includes(typeQuery) || item.nameEn.toLowerCase().includes(typeQuery))
      ).slice(0, 6);
    }

    if (query.startsWith('office:')) {
      const officeQuery = query.replace('office:', '').trim();
      if (!officeQuery) return searchableItems.filter(item => item.type === 'office');
      return searchableItems.filter(item => 
        item.type === 'office' && 
        (item.name.toLowerCase().includes(officeQuery) || item.nameEn.toLowerCase().includes(officeQuery))
      ).slice(0, 6);
    }

    return fuse.search(searchQuery).slice(0, 6).map(result => result.item);
  }, [searchQuery, fuse, searchableItems]);

  const [isSyncIntervalOpen, setIsSyncIntervalOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const categories = ['All', ...STANDARD_CATEGORIES];
  const [syncInterval, setSyncInterval] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("syncInterval");
        return saved ? parseInt(saved) : 30;
      } catch (e) {
        return 30;
      }
    }
    return 30;
  });

  useEffect(() => {
    // Clear all legacy search history
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("searchHistory");
        localStorage.removeItem("dor_search_history");
        localStorage.removeItem("last_search_query");
      } catch (e) {
        console.error("Failed to clear search history", e);
      }
    }

    const handleSyncChange = () => {
      const interval = localStorage.getItem("syncInterval");
      setSyncInterval(interval ? parseInt(interval) : 30);
    };
    window.addEventListener("syncIntervalChanged", handleSyncChange);
    return () => window.removeEventListener("syncIntervalChanged", handleSyncChange);
  }, []);

  const handleSyncIntervalChange = (val: number) => {
    localStorage.setItem("syncInterval", val.toString());
    window.dispatchEvent(new Event("syncIntervalChanged"));
    setIsSyncIntervalOpen(false);
  };

  useEffect(() => {
    const SpeechRecognition = (window as unknown as { SpeechRecognition: unknown; webkitSpeechRecognition: unknown }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
    }
  }, []);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          // ignore
        }
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const handleSelect = (item: {
    type: string;
    id: string;
    name: string;
    nameEn: string;
    category: string;
    data: Indicator;
  }) => {
    if (item.type === 'indicator') {
      const nameToSearch = language === 'en' ? (item.nameEn || item.name) : item.name;

      onSearch(nameToSearch);
      setIsOpen(false);

      setTimeout(() => {
        const elementId = item.data.category === 'Budget Utilization' 
          ? `budget-card-${item.id}`
          : `indicator-card-${item.id}`;
        
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Temporary smooth highlight
          element.classList.add('ring-4', 'ring-indigo-500/40', 'scale-[1.01]', 'shadow-lg');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-indigo-500/40', 'scale-[1.01]', 'shadow-lg');
          }, 2000);
        } else {
          const rowElement = document.getElementById(`row-${item.id}`);
          if (rowElement) {
            rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            rowElement.classList.add('bg-indigo-50/70', 'dark:bg-indigo-950/40');
            setTimeout(() => {
              rowElement.classList.remove('bg-indigo-50/70', 'dark:bg-indigo-950/40');
            }, 2000);
          }
        }
      }, 150);
    } else if (item.type === 'office') {
      if (onOfficeChange) {
        onOfficeChange(item.name);
        onSearch('');
        if (onViewChange) {
          onViewChange('institutional' as any);
        }
      }
      setIsOpen(false);
    } else if (item.type === 'category') {
      onCategoryChange(item.name);
      onSearch('');
      setIsOpen(false);
    }
  };


  return (
    <div className="flex-1 flex items-center justify-end gap-2 p-1" ref={containerRef}>
      {/* Filter bar */}
      <div className="hidden lg:flex items-center gap-1.5">
        {/* Sort */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold uppercase tracking-wide hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowUpDown size={13} />
            <span>{sortType === 'default' ? (language === 'en' ? 'Sort' : 'क्रम') : sortType === 'low' ? (language === 'en' ? 'Low' : 'कम') : (language === 'en' ? 'High' : 'उच्च')}</span>
          </button>
          {isSortOpen && (
            <div className="absolute right-0 mt-2 w-44 z-[5100] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5">
              {([['default', t('sortDefault')], ['low', t('sortLowProgress')], ['high', t('sortHighProgress')]] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { onSortChange(val); setIsSortOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${sortType === val ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold uppercase tracking-wide outline-none"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat === 'All' ? t('all') : t(cat)}</option>
          ))}
        </select>

        {/* Office */}
        <select
          value={selectedOffice}
          onChange={(e) => onOfficeChange?.(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold uppercase tracking-wide outline-none max-w-[160px]"
        >
          <option value="All">{t('all')}</option>
          {uniqueOffices.map((o) => (
            <option key={o} value={o}>{translateOffice(o)}</option>
          ))}
        </select>

        {/* Milestones toggle */}
        <button
          type="button"
          onClick={onToggleMilestonesOnly}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-colors ${showMilestonesOnly ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
        >
          <Milestone size={13} />
          <span>{language === 'en' ? 'Milestones' : 'माइलस्टोन'}</span>
        </button>

        {/* Sync interval */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSyncIntervalOpen(!isSyncIntervalOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold uppercase tracking-wide hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Clock size={13} />
            <span>{syncInterval}m</span>
          </button>
          {isSyncIntervalOpen && (
            <div className="absolute right-0 mt-2 w-32 z-[5100] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5">
               {[5, 15, 30, 60, 120].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleSyncIntervalChange(val)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${syncInterval === val ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  {val}m
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View options */}
        {viewOptions?.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onViewChange?.(opt.id as ViewMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-colors ${viewMode === opt.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            {opt.icon}
            <span className="hidden xl:inline">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Main Search Input */}
      {(((viewMode !== 'dashboard' && viewMode !== 'institutional') || forceShowSearch) && !hideSearchInput) && (
        <div className="flex-1 relative group max-w-md">
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
            searchQuery ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400'
          }`}>
            <Search size={16} strokeWidth={2.5} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
            autoComplete="off"
            placeholder={t('searchIndicator') || 'Search...'}
            className="w-full bg-slate-100 dark:bg-slate-800/60 border-2 border-transparent focus:border-indigo-500/30 dark:focus:border-indigo-400/30 text-slate-900 dark:text-slate-100 text-xs h-10 pl-10 pr-20 rounded-2xl transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none shadow-xs hover:bg-slate-200 dark:hover:bg-slate-700/50"
          />
          
          {/* Search Actions */}
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                onClick={() => onSearch('')}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
            
            <button
              onClick={startListening}
              className={`p-1.5 rounded-lg transition-all relative ${
                isListening 
                  ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 animate-pulse' 
                  : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20'
              }`}
            >
              <Mic size={14} strokeWidth={2.5} />
              {isListening && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />}
            </button>
          </div>

          {/* Results Dropdown */}
          <AnimatePresence>
            {isOpen && searchQuery.trim() !== '' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.98 }}
                className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[5100] overflow-hidden max-h-80"
              >
                <div className="p-2">
                  {filteredMatches.length > 0 ? (
                    <div className="space-y-0.5">
                      {filteredMatches.map((item, index) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer text-left ${
                            highlightedIndex === index
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-l-4 border-indigo-500'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border-l-4 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                              item.type === 'office' 
                                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' 
                                : item.type === 'category'
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                            }`}>
                              {item.type === 'office' ? <Building2 size={16} /> : item.type === 'category' ? <Layers size={16} /> : <Hash size={16} />}
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                                {item.type === 'office' ? (language === 'en' ? 'Office' : 'कार्यालय') : item.type === 'category' ? (language === 'en' ? 'Category' : 'वर्ग') : item.id}
                              </span>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                                {language === 'en' ? item.nameEn : item.name}
                              </span>
                            </div>
                          </div>
                          {item.type === 'indicator' && item.data && (
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 ml-2">
                              {Math.round(((item.data.annualProgress || 0) / (item.data.annualTarget || 1)) * 100)}%
                            </span>
                          )}
                          {item.type === 'office' || item.type === 'category' ? (
                            <CornerDownLeft size={12} className="text-slate-300 dark:text-slate-600" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-500">
                      {t('noResults') || (language === 'en' ? 'No matching indicators or offices found' : 'कुनै नतिजा फेला परेन')}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="relative">
      </div>
    </div>
  );
};
