import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { adToBs, formatBs, BSDate, toNepaliNumerals } from '../utils/bsDate';
import { collection, query, where, onSnapshot, limit, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface Deadline {
  id: string;
  title: string;
  titleEn?: string;
  dueDate: string; // ISO string
  priority: 'high' | 'medium' | 'low';
  office?: string;
  description?: string;
}

const BS_MONTHS_EN = ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
const BS_MONTHS_NP = ['वैशाख', 'जेष्ठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन', 'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत'];

export const CalendarDeadlines: React.FC<{ language: 'en' | 'ne'; offices: Array<{ name: string }> }> = ({ language, offices = [] }) => {
  const { t } = useLanguage();
  const [currentBsDate, setCurrentBsDate] = useState<BSDate>(() => adToBs(new Date()) || { year: 2081, month: 1, day: 1 });
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'deadlines'),
      where('dueDate', '>=', new Date().toISOString()),
      orderBy('dueDate', 'asc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Deadline[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Deadline));
      setDeadlines(items);
    }, (err) => {
      console.error('Deadlines listener failed:', err);
    });
    return () => unsubscribe();
  }, []);

  const calendarDays = useMemo(() => {
    const year = currentBsDate.year;
    const month = currentBsDate.month;
    const daysInMonth = 30 + ((year % 4 === 0 && month <= 10) ? 1 : 0); // Simplified leap calc
    const actualDays = daysInMonth > 32 ? 32 : daysInMonth;
    
    const firstDayBs = { year, month, day: 1 };
    const firstDayAd = new Date();
    
    // Get the day of week for the 1st of the month (simplified)
    const startDayOfWeek = (month + year) % 7;
    
    const days: Array<{ day: number; dateStr: string; isCurrentMonth: boolean }> = [];
    
    // Previous month days
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const daysInPrevMonth = 30 + ((prevYear % 4 === 0 && prevMonth <= 10) ? 1 : 0);
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      days.push({ day: d, dateStr: `${prevYear}/${String(prevMonth).padStart(2, '0')}/${String(d).padStart(2, '0')}`, isCurrentMonth: false });
    }
    
    // Current month days
    for (let d = 1; d <= actualDays; d++) {
      days.push({ day: d, dateStr: `${year}/${String(month).padStart(2, '0')}/${String(d).padStart(2, '0')}`, isCurrentMonth: true });
    }
    
    // Next month days
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, dateStr: `${nextYear}/${String(nextMonth).padStart(2, '0')}/${String(d).padStart(2, '0')}`, isCurrentMonth: false });
    }
    
    return days;
  }, [currentBsDate]);

  const hasDeadline = (dateStr: string) => {
    return deadlines.some(d => d.dueDate.startsWith(dateStr));
  };

  const getDeadlineForDate = (dateStr: string) => {
    return deadlines.find(d => d.dueDate.startsWith(dateStr));
  };

  const upcomingDeadlines = useMemo(() => {
    return deadlines.filter(d => {
      if (!selectedDate) return true;
      return d.dueDate.startsWith(selectedDate);
    });
  }, [deadlines, selectedDate]);

  const changeMonth = (delta: number) => {
    setCurrentBsDate(prev => {
      let newMonth = prev.month + delta;
      let newYear = prev.year;
      if (newMonth > 12) { newMonth = 1; newYear++; }
      if (newMonth < 1) { newMonth = 12; newYear--; }
      return { year: newYear, month: newMonth, day: 1 };
    });
    setSelectedDate(null);
  };

  const goToToday = () => {
    const today = adToBs(new Date());
    if (today) {
      setCurrentBsDate(today);
      setSelectedDate(null);
    }
  };

  const monthLabel = language === 'en'
    ? `${BS_MONTHS_EN[currentBsDate.month - 1]} ${currentBsDate.year}`
    : `${BS_MONTHS_NP[currentBsDate.month - 1]} ${toNepaliNumerals(currentBsDate.year)}`;

  const weekDays = language === 'en'
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['आइत', 'सोम', 'मंगल', 'बुध', 'बिही', 'शुक्र', 'शनि'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {language === 'en' ? 'Calendar & Deadlines' : 'क्यालेन्डर र समयसीमाहरू'}
        </h3>
        <button
          onClick={goToToday}
          className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {language === 'en' ? 'Today' : 'आज'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">{monthLabel}</h4>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const isSelected = selectedDate === day.dateStr;
              const hasDeadlineMarker = hasDeadline(day.dateStr);
              const isToday = day.isCurrentMonth && day.day === new Date().getDate();
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`relative aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    !day.isCurrentMonth
                      ? 'text-slate-300 dark:text-slate-600'
                      : isSelected
                        ? 'bg-indigo-600 text-white shadow-md'
                        : isToday
                          ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {language === 'ne' ? toNepaliNumerals(day.day) : day.day}
                  {hasDeadlineMarker && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-rose-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Deadlines List */}
        <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-amber-600" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              {selectedDate 
                ? (language === 'en' ? 'Selected Date' : 'चयनित मिति')
                : (language === 'en' ? 'Upcoming Deadlines' : 'आगामी समयसीमाहरू')
              }
            </h4>
          </div>

          <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar">
            {upcomingDeadlines.length === 0 && (
              <p className="text-[11px] text-slate-400 text-center py-4">
                {language === 'en' ? 'No deadlines scheduled' : 'कुनै समयसीमा निर्धारित छैन'}
              </p>
            )}
            {upcomingDeadlines.map(deadline => {
              const priorityColors = {
                high: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300',
                medium: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300',
                low: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300',
              };
              return (
                <div key={deadline.id} className={`p-3 rounded-xl border ${priorityColors[deadline.priority]}`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">
                        {language === 'en' ? (deadline.titleEn || deadline.title) : deadline.title}
                      </div>
                      {deadline.office && (
                        <div className="text-[10px] opacity-80 mt-0.5">{deadline.office}</div>
                      )}
                      <div className="text-[10px] opacity-70 mt-1">
                        {new Date(deadline.dueDate).toLocaleDateString(language === 'ne' ? 'ne-NP' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
