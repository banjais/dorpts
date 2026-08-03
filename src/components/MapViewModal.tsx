import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Map as MapIcon, Loader2, Building2, Sliders, Layers, Info } from 'lucide-react';
import { Indicator } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { TOWN_COORDINATES } from '../utils/officeDetector';
import { DOR_OFFICES_LIST } from '../data';

// Fix leaflet default icon issue in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const toNepaliNumerals = (numStr: string | number): string => {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return numStr
    .toString()
    .split('')
    .map((char) => {
      const index = parseInt(char, 10);
      return !isNaN(index) ? nepaliDigits[index] : char;
    })
    .join('');
};

interface MapViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: Indicator[];
}

interface OfficePerformanceData {
  name: string;
  indicators: Indicator[];
  averageProgress: number;
  coordinates: [number, number];
  lowCount: number;
  mediumCount: number;
  highCount: number;
}

// Color-coded Leaflet DivIcon creator for individual indicators
const createIndicatorIcon = (progress: number) => {
  let color = '#f43f5e'; // rose-500 (low performance)
  if (progress >= 80) color = '#10b981'; // emerald-500 (high performance)
  else if (progress >= 50) color = '#f59e0b'; // amber-500 (medium performance)

  const svgPin = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="28" height="28" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.25));">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-leaflet-pin',
    html: `<div class="w-7 h-7 flex items-center justify-center">${svgPin}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
};

// Color-coded Leaflet DivIcon creator for DoR project offices
const createOfficeIcon = (progress: number) => {
  let colorClass = 'bg-rose-500 text-rose-50 border-rose-300';
  if (progress >= 80) {
    colorClass = 'bg-emerald-500 text-emerald-50 border-emerald-300';
  } else if (progress >= 50) {
    colorClass = 'bg-amber-500 text-amber-50 border-amber-300';
  }

  return L.divIcon({
    className: 'custom-leaflet-office-badge',
    html: `
      <div class="relative flex items-center justify-center w-9 h-9 rounded-full shadow-lg border-2 border-white dark:border-slate-800 ${colorClass} transition-all duration-300 hover:scale-110">
        <span class="absolute inset-0 rounded-full animate-ping opacity-20 ${colorClass} -m-0.5"></span>
        <span class="text-[10px] font-black tracking-tight">${progress}%</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

export const MapViewModal: React.FC<MapViewModalProps> = ({
  isOpen,
  onClose,
  indicators
}) => {
  const { language, translateOffice, translateUnit } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'indicators' | 'offices'>('offices');

  useEffect(() => {
    if (isOpen) {
      // Delay mounting map slightly to allow modal animation to finish
      const timer = setTimeout(() => setMounted(true), 300);
      return () => clearTimeout(timer);
    } else {
      setMounted(false);
    }
  }, [isOpen]);

  // Translate Nepali town coordinates keys to check for matching office coordinates
  const getOfficeCoordinates = (officeName: string): [number, number] | null => {
    const matchedTown = Object.keys(TOWN_COORDINATES).find(town => 
      officeName.includes(town)
    );
    if (matchedTown) {
      const coords = TOWN_COORDINATES[matchedTown];
      return [coords.lat, coords.lng];
    }
    return null;
  };

  // Assign scattered dummy coordinates to prevent overlapping of indicators
  const getCoordinates = (id: string, index: number): [number, number] => {
    const latBase = 28.39;
    const lngBase = 84.12;
    const salt1 = (index * 1.5) % 3;
    const salt2 = (index * 2.1) % 5;
    
    const lat = latBase + (salt1 - 1.5) * 1.2;
    const lng = lngBase + (salt2 - 2.5) * 1.5;
    
    return [lat, lng];
  };

  // Assign scattered coordinates for unmapped offices
  const getFallbackCoordinates = (index: number): [number, number] => {
    const latBase = 28.39;
    const lngBase = 84.12;
    const salt1 = (index * 1.7) % 3.5;
    const salt2 = (index * 2.3) % 4.5;
    return [latBase + (salt1 - 1.75) * 1.5, lngBase + (salt2 - 2.25) * 1.8];
  };

  // Group indicators by DoR project offices and calculate their metrics
  const officePerformances = useMemo(() => {
    const groups: Record<string, Indicator[]> = {};
    indicators.forEach(ind => {
      const office = ind.office || (language === 'en' ? 'Department of Roads' : 'सडक विभाग');
      if (!groups[office]) {
        groups[office] = [];
      }
      groups[office].push(ind);
    });

    const list: OfficePerformanceData[] = [];
    Object.entries(groups).forEach(([officeName, officeInds]) => {
      let coords = getOfficeCoordinates(officeName);
      if (!coords) {
        // Search in Master DOR_OFFICES_LIST for corresponding match containing town name
        const matchedOffice = DOR_OFFICES_LIST.find(o => o.name === officeName || o.name.includes(officeName) || officeName.includes(o.name));
        if (matchedOffice) {
          coords = getOfficeCoordinates(matchedOffice.name);
        }
      }

      const finalCoords = coords || getFallbackCoordinates(list.length);

      let totalRate = 0;
      let lowCount = 0;
      let mediumCount = 0;
      let highCount = 0;

      officeInds.forEach(ind => {
        const target = ind.annualTarget || 1;
        const progress = ind.annualProgress || 0;
        const rate = Math.min(100, Math.round((progress / target) * 100));
        totalRate += rate;
        if (rate >= 80) highCount++;
        else if (rate >= 50) mediumCount++;
        else lowCount++;
      });

      const avgProgress = officeInds.length > 0 ? Math.round(totalRate / officeInds.length) : 0;

      list.push({
        name: officeName,
        indicators: officeInds,
        averageProgress: avgProgress,
        coordinates: finalCoords,
        lowCount,
        mediumCount,
        highCount,
      });
    });

    return list;
  }, [indicators, language]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 sm:p-6 font-sans">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 relative z-10 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <MapIcon size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                  {language === 'en' ? 'Interactive Project Map' : 'परियोजना अन्तरक्रियात्मक नक्सा'}
                </h2>
                <p className="text-xs text-slate-500">
                  {language === 'en' ? 'Geographical performance tracking of road divisions' : 'सडक डिभिजनहरूको भौगोलिक प्रदर्शन अनुगमन'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Map Container */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-950 relative z-0">
            {!mounted ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={32} className="animate-spin mb-4" />
                <span className="text-sm font-bold uppercase tracking-wider">
                  {language === 'en' ? 'Loading Map Layers...' : 'नक्सा लेयरहरू लोड हुँदैछ...'}
                </span>
              </div>
            ) : (
              <>
                {/* Floating Map Controls overlay */}
                <div className="absolute top-4 right-4 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/60 dark:border-white/5 p-1.5 rounded-2xl shadow-xl flex items-center gap-1">
                  <button
                    onClick={() => setActiveLayer('offices')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activeLayer === 'offices'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Building2 size={13} />
                    <span>{language === 'en' ? 'Project Offices' : 'आयोजना कार्यालयहरू'}</span>
                  </button>
                  <button
                    onClick={() => setActiveLayer('indicators')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activeLayer === 'indicators'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sliders size={13} />
                    <span>{language === 'en' ? 'Indicators Pin' : 'सूचक पिनहरू'}</span>
                  </button>
                </div>

                {/* Floating Map Legend overlay */}
                <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/60 dark:border-white/5 p-4 rounded-2xl shadow-xl space-y-2.5 max-w-[240px]">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <Info size={11} />
                    <span>{language === 'en' ? 'Performance Legend' : 'कार्यसम्पादन सूचक संकेत'}</span>
                  </div>
                  <div className="space-y-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white dark:border-slate-800 shadow" />
                      <span>{language === 'en' ? 'High Target (≥ 80%)' : 'उच्च प्रगतितर्फ (≥ ८०%)'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white dark:border-slate-800 shadow" />
                      <span>{language === 'en' ? 'Medium Target (50%-79%)' : 'मध्यम प्रगति (५०%-७९%)'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-white dark:border-slate-800 shadow animate-pulse" />
                      <span>{language === 'en' ? 'Low Target (< 50%)' : 'न्यून प्रगति (< ५०%)'}</span>
                    </div>
                  </div>
                </div>

                <MapContainer 
                  center={[28.2096, 83.9856]} // Pokhara/Center of Nepal for better balanced zoom center
                  zoom={7} 
                  style={{ height: '100%', width: '100%', zIndex: 0 }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {activeLayer === 'indicators' && indicators.map((indicator, index) => {
                    const pos = getCoordinates(indicator.id, index);
                    const target = indicator.annualTarget || 1;
                    const progress = indicator.annualProgress || 0;
                    const rate = Math.min(100, Math.round((progress / target) * 100));

                    return (
                      <Marker key={indicator.id} position={pos} icon={createIndicatorIcon(rate)}>
                        <Popup>
                          <div className="font-sans text-left max-w-xs p-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5">
                              <Sliders size={12} />
                              <span>{language === 'en' ? 'Road Indicator' : 'सडक विकास सूचक'}</span>
                            </div>
                            <h3 className="font-black text-sm text-slate-900 dark:text-white leading-snug mb-2">
                              {language === 'en' ? (indicator.nameEn || indicator.name) : indicator.name}
                            </h3>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-3 flex items-center gap-1">
                              <Building2 size={10} className="text-slate-400" />
                               <span className="truncate max-w-[200px]">{translateOffice(indicator.office) || (language === 'en' ? 'Department of Roads' : 'सडक विभाग')}</span>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                <span>{language === 'en' ? 'Completion' : 'उपलब्धि'}:</span>
                                <span className={`font-black ${rate >= 80 ? 'text-emerald-500' : rate >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                  {language === 'en' ? `${rate}%` : `${toNepaliNumerals(rate)}%`}
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${rate}%` }}
                                  transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.1 }}
                                  className={`h-full rounded-full ${rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                />
                              </div>
                              
                              <div className="flex justify-between items-center text-[10px] pt-1 text-slate-500 dark:text-slate-400 font-mono">
                                 <span>{language === 'en' ? 'Progress' : 'प्रगति'}: <b>{language === 'en' ? indicator.annualProgress : toNepaliNumerals(indicator.annualProgress)} {translateUnit(indicator.unit)}</b></span>
                                 <span>{language === 'en' ? 'Target' : 'लक्ष्य'}: <b>{language === 'en' ? indicator.annualTarget : toNepaliNumerals(indicator.annualTarget)} {translateUnit(indicator.unit)}</b></span>
                              </div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}

                  {activeLayer === 'offices' && officePerformances.map((office) => {
                    return (
                      <Marker key={office.name} position={office.coordinates} icon={createOfficeIcon(office.averageProgress)}>
                        <Popup>
                          <div className="font-sans text-left max-w-sm p-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5">
                              <Building2 size={12} />
                              <span>{language === 'en' ? 'DoR Project Office' : 'सडक विभाग आयोजना कार्यालय'}</span>
                            </div>
                            <h3 className="font-black text-sm text-slate-900 dark:text-white leading-snug mb-2">
                              {translateOffice(office.name)}
                            </h3>
                            
                            {/* Progress overview */}
                            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 mb-3">
                              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                <span>{language === 'en' ? 'Average Progress' : 'औसत प्रगति'}:</span>
                                <span className={office.averageProgress >= 80 ? 'text-emerald-500 font-extrabold' : office.averageProgress >= 50 ? 'text-amber-500 font-extrabold' : 'text-rose-500 font-extrabold'}>
                                  {language === 'en' ? `${office.averageProgress}%` : `${toNepaliNumerals(office.averageProgress)}%`}
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${office.averageProgress}%` }}
                                  transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.2 }}
                                  className={`h-full rounded-full ${office.averageProgress >= 80 ? 'bg-emerald-500' : office.averageProgress >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                />
                              </div>
                              
                              <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                <span>{language === 'en' ? 'Indicators Group' : 'सूचक समूह'}:</span>
                                <span className="font-mono">{language === 'en' ? `${office.indicators.length} Items` : `${toNepaliNumerals(office.indicators.length)} सूचकहरू`}</span>
                              </div>
                            </div>

                            {/* Counts */}
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px] mb-3">
                              <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg p-1.5 font-bold border border-emerald-100 dark:border-emerald-500/10">
                                <div className="font-black text-xs">{language === 'en' ? office.highCount : toNepaliNumerals(office.highCount)}</div>
                                <div>{language === 'en' ? 'High' : 'उच्च'}</div>
                              </div>
                              <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-lg p-1.5 font-bold border border-amber-100 dark:border-amber-500/10">
                                <div className="font-black text-xs">{language === 'en' ? office.mediumCount : toNepaliNumerals(office.mediumCount)}</div>
                                <div>{language === 'en' ? 'Medium' : 'मध्यम'}</div>
                              </div>
                              <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-lg p-1.5 font-bold border border-rose-100 dark:border-rose-500/10">
                                <div className="font-black text-xs">{language === 'en' ? office.lowCount : toNepaliNumerals(office.lowCount)}</div>
                                <div>{language === 'en' ? 'Low' : 'न्यून'}</div>
                              </div>
                            </div>

                            {/* Indicators List (Scrollable) */}
                            <div className="max-h-24 overflow-y-auto space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                              <div className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                                {language === 'en' ? 'Indicator Details' : 'सूचक विवरणहरू'}
                              </div>
                              {office.indicators.map((ind) => {
                                const indTarget = ind.annualTarget || 1;
                                const indProgress = ind.annualProgress || 0;
                                const rate = Math.min(100, Math.round((indProgress / indTarget) * 100));
                                return (
                                  <div key={ind.id} className="flex justify-between items-center gap-3 text-[10px] hover:bg-slate-100 dark:hover:bg-slate-800/50 p-1 rounded transition-colors">
                                    <span className="text-slate-700 dark:text-slate-300 font-bold truncate max-w-[160px]" title={language === 'en' ? ind.nameEn : ind.name}>
                                      {language === 'en' ? ind.nameEn : ind.name}
                                    </span>
                                    <span className={`font-mono font-black shrink-0 ${rate >= 80 ? 'text-emerald-500' : rate >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                      {language === 'en' ? `${rate}%` : `${toNepaliNumerals(rate)}%`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
