import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Map as MapIcon,
  Loader2,
  Building2,
  Sliders,
  Info,
  Navigation,
  Mic,
  Compass,
  Route,
  ArrowRightLeft,
  DollarSign
} from 'lucide-react';
import { Indicator } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { TOWN_COORDINATES } from '../utils/officeDetector';
import { DOR_OFFICES_LIST } from '../data';
import {
  NATIONAL_HIGHWAYS,
  calculateTripMetrics,
  TravelCalculationResult
} from '../data/nepalGeoData';

// Leaflet default icon fix
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
  onStartVoiceSearch?: () => void;
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

// Marker Icon Creators
const createIndicatorIcon = (progress: number) => {
  let color = '#f43f5e';
  if (progress >= 80) color = '#10b981';
  else if (progress >= 50) color = '#f59e0b';

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

const createHighwayIcon = (code: string) => {
  return L.divIcon({
    className: 'custom-highway-badge',
    html: `
      <div class="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md border border-indigo-300 flex items-center justify-center">
        ${code}
      </div>
    `,
    iconSize: [32, 20],
    iconAnchor: [16, 10],
    popupAnchor: [0, -10]
  });
};

const createRoutePointIcon = (label: string, isFrom: boolean) => {
  const bg = isFrom ? 'bg-emerald-600' : 'bg-rose-600';
  return L.divIcon({
    className: 'custom-route-point',
    html: `
      <div class="${bg} text-white font-black text-[9px] px-2 py-1 rounded-full shadow-lg border-2 border-white flex items-center gap-1">
        <span>${isFrom ? 'START' : 'END'}</span>: ${label}
      </div>
    `,
    iconSize: [80, 24],
    iconAnchor: [40, 12]
  });
};

// Map Click Listener Component
function MapClickListener({
  onMapClick
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export const MapViewModal: React.FC<MapViewModalProps> = ({
  isOpen,
  onClose,
  indicators,
  onStartVoiceSearch
}) => {
  const { language, translateOffice, translateUnit } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'offices' | 'highways' | 'indicators'>('offices');

  // Search & Routing state
  const [searchDestination, setSearchDestination] = useState('');
  const [fromPoint, setFromPoint] = useState<{ lat: number; lng: number; name: string }>({
    lat: 27.7172,
    lng: 85.324,
    name: 'Kathmandu'
  });
  const [toPoint, setToPoint] = useState<{ lat: number; lng: number; name: string } | null>(null);

  const [routeSettingMode, setRouteSettingMode] = useState<'from' | 'to'>('to');

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setMounted(true), 300);
      return () => clearTimeout(timer);
    } else {
      setMounted(false);
    }
  }, [isOpen]);

  const getOfficeCoordinates = (officeName: string): [number, number] | null => {
    const matchedTown = Object.keys(TOWN_COORDINATES).find((town) => officeName.includes(town));
    if (matchedTown) {
      const coords = TOWN_COORDINATES[matchedTown];
      return [coords.lat, coords.lng];
    }
    return null;
  };

  const getCoordinates = (id: string, index: number): [number, number] => {
    const latBase = 28.39;
    const lngBase = 84.12;
    const salt1 = (index * 1.5) % 3;
    const salt2 = (index * 2.1) % 5;
    return [latBase + (salt1 - 1.5) * 1.2, lngBase + (salt2 - 2.5) * 1.5];
  };

  const getFallbackCoordinates = (index: number): [number, number] => {
    const latBase = 28.39;
    const lngBase = 84.12;
    const salt1 = (index * 1.7) % 3.5;
    const salt2 = (index * 2.3) % 4.5;
    return [latBase + (salt1 - 1.75) * 1.5, lngBase + (salt2 - 2.25) * 1.8];
  };

  // Office Performances
  const officePerformances = useMemo(() => {
    const groups: Record<string, Indicator[]> = {};
    indicators.forEach((ind) => {
      const office = ind.office || (language === 'en' ? 'Department of Roads' : 'सडक विभाग');
      if (!groups[office]) groups[office] = [];
      groups[office].push(ind);
    });

    const list: OfficePerformanceData[] = [];
    Object.entries(groups).forEach(([officeName, officeInds]) => {
      let coords = getOfficeCoordinates(officeName);
      if (!coords) {
        const matchedOffice = DOR_OFFICES_LIST.find(
          (o) => o.name === officeName || o.name.includes(officeName) || officeName.includes(o.name)
        );
        if (matchedOffice) {
          coords = getOfficeCoordinates(matchedOffice.name);
        }
      }

      const finalCoords = coords || getFallbackCoordinates(list.length);

      let totalRate = 0;
      let lowCount = 0;
      let mediumCount = 0;
      let highCount = 0;

      officeInds.forEach((ind) => {
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
        highCount
      });
    });

    return list;
  }, [indicators, language]);

  // Handle map click to set From/To
  const handleMapClick = (lat: number, lng: number) => {
    const label = `Point (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
    if (routeSettingMode === 'from') {
      setFromPoint({ lat, lng, name: label });
      setRouteSettingMode('to');
    } else {
      setToPoint({ lat, lng, name: label });
    }
  };

  // Get GPS current location for From
  const handleUseGPSLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFromPoint({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            name: language === 'en' ? 'My Location (GPS)' : 'मेरो हालको स्थान'
          });
        },
        () => {
          alert('GPS location unavailable.');
        }
      );
    }
  };

  // Search destination filter
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchDestination.trim()) return;

    const term = searchDestination.toLowerCase().trim();
    // Search in highways major hubs
    for (const hw of NATIONAL_HIGHWAYS) {
      const hub = hw.majorHubs.find(
        (h) => h.nameEn.toLowerCase().includes(term) || h.nameNp.includes(term)
      );
      if (hub) {
        setToPoint({ lat: hub.lat, lng: hub.lng, name: language === 'en' ? hub.nameEn : hub.nameNp });
        return;
      }
    }

    // Search in offices
    const off = officePerformances.find(
      (o) => o.name.toLowerCase().includes(term) || translateOffice(o.name).toLowerCase().includes(term)
    );
    if (off) {
      setToPoint({ lat: off.coordinates[0], lng: off.coordinates[1], name: translateOffice(off.name) });
    }
  };

  // Calculated route polyline & metrics
  const routeMetrics: TravelCalculationResult | null = useMemo(() => {
    if (!toPoint) return null;
    return calculateTripMetrics(fromPoint.lat, fromPoint.lng, toPoint.lat, toPoint.lng);
  }, [fromPoint, toPoint]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[5000] flex items-center justify-center p-3 sm:p-6 font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl h-[88vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <MapIcon size={22} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                  {language === 'en' ? 'Interactive Nepal Road & Navigation Map' : 'नेपाल सडक तथा नेभिगेसन नक्सा'}
                </h2>
                <p className="text-xs text-slate-500">
                  {language === 'en'
                    ? 'Click anywhere on map to route from current place to destination'
                    : 'नक्सामा थिचेर हालको स्थान वा गन्तव्य चयन गर्नुहोस्'}
                </p>
              </div>
            </div>

            {/* Search destination bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  value={searchDestination}
                  onChange={(e) => setSearchDestination(e.target.value)}
                  placeholder={language === 'en' ? 'Where to go? (e.g. Pokhara, Butwal)' : 'कहाँ जाने? (उदा. पोखरा, बुटवल)'}
                  className="w-full px-3.5 py-2 pl-9 text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                />
                <Compass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              {onStartVoiceSearch && (
                <button
                  type="button"
                  onClick={onStartVoiceSearch}
                  className="p-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
                  title={language === 'en' ? 'Voice Search' : 'आवाज खोज'}
                >
                  <Mic size={16} />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </form>
          </div>

          {/* Map Section */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-950 relative z-0">
            {!mounted ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={32} className="animate-spin mb-4" />
                <span className="text-sm font-bold uppercase tracking-wider">
                  {language === 'en' ? 'Loading OpenStreetMap Road Layers...' : 'नक्सा लेयरहरू लोड हुँदैछ...'}
                </span>
              </div>
            ) : (
              <>
                {/* Layer Control Buttons */}
                <div className="absolute top-4 right-4 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/60 dark:border-white/5 p-1.5 rounded-2xl shadow-xl flex items-center gap-1">
                  <button
                    onClick={() => setActiveLayer('offices')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activeLayer === 'offices'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Building2 size={13} />
                    <span>{language === 'en' ? 'Offices' : 'कार्यालयहरू'}</span>
                  </button>

                  <button
                    onClick={() => setActiveLayer('highways')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activeLayer === 'highways'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Route size={13} />
                    <span>{language === 'en' ? 'Highways' : 'राजमार्गहरू'}</span>
                  </button>

                  <button
                    onClick={() => setActiveLayer('indicators')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activeLayer === 'indicators'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sliders size={13} />
                    <span>{language === 'en' ? 'Indicators' : 'सूचकहरू'}</span>
                  </button>
                </div>

                {/* GPS Location Button */}
                <div className="absolute top-4 left-4 z-[1000]">
                  <button
                    onClick={handleUseGPSLocation}
                    className="px-3.5 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-black shadow-xl flex items-center gap-1.5 hover:bg-indigo-50 transition-all cursor-pointer"
                  >
                    <Navigation size={14} />
                    <span>{language === 'en' ? 'Use GPS Location' : 'जीपीएस स्थान प्रयोग'}</span>
                  </button>
                </div>

                {/* Route Result Floating Banner */}
                {routeMetrics && toPoint && (
                  <div className="absolute bottom-4 right-4 z-[1000] bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/30 max-w-xs space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-indigo-400">
                      <span>{language === 'en' ? 'Active Route Metrics' : 'सक्रिय मार्ग विवरण'}</span>
                      <button onClick={() => setToPoint(null)} className="text-slate-400 hover:text-white">
                        <X size={14} />
                      </button>
                    </div>

                    <div className="text-xs font-bold">
                      {fromPoint.name} ➔ {toPoint.name}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                      <div className="bg-white/10 p-2 rounded-xl">
                        <span className="text-[9px] text-slate-300 block uppercase font-extrabold">Distance</span>
                        <span className="font-black text-indigo-300">{routeMetrics.distanceKm} KM</span>
                      </div>
                      <div className="bg-white/10 p-2 rounded-xl">
                        <span className="text-[9px] text-slate-300 block uppercase font-extrabold">Est. Cost</span>
                        <span className="font-black text-emerald-400">NPR {routeMetrics.totalEstimatedCostNpr}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Legend overlay */}
                <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/60 dark:border-white/5 p-3 rounded-2xl shadow-xl space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300 hidden sm:block">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <Info size={11} />
                    <span>{language === 'en' ? 'Legend' : 'संकेत'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>≥ 80% Performance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span>50-79% Performance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span>&lt; 50% Low Performance</span>
                  </div>
                </div>

                {/* Leaflet Map */}
                <MapContainer
                  center={[28.2096, 83.9856]}
                  zoom={7}
                  style={{ height: '100%', width: '100%', zIndex: 0 }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <MapClickListener onMapClick={handleMapClick} />

                  {/* ROUTE POLYLINE */}
                  {toPoint && (
                    <>
                      <Marker position={[fromPoint.lat, fromPoint.lng]} icon={createRoutePointIcon(fromPoint.name, true)} />
                      <Marker position={[toPoint.lat, toPoint.lng]} icon={createRoutePointIcon(toPoint.name, false)} />
                      <Polyline
                        positions={[
                          [fromPoint.lat, fromPoint.lng],
                          [toPoint.lat, toPoint.lng]
                        ]}
                        color="#6366f1"
                        weight={5}
                        opacity={0.8}
                        dashArray="10, 8"
                      />
                    </>
                  )}

                  {/* HIGHWAYS LAYER */}
                  {activeLayer === 'highways' &&
                    NATIONAL_HIGHWAYS.map((hw) =>
                      hw.majorHubs.map((hub, idx) => (
                        <Marker
                          key={`hw_${hw.id}_${idx}`}
                          position={[hub.lat, hub.lng]}
                          icon={createHighwayIcon(hw.code)}
                        >
                          <Popup>
                            <div className="p-1 max-w-xs font-sans">
                              <span className="text-[10px] font-black text-indigo-600 uppercase block">{hw.code} - {hw.nameEn}</span>
                              <h4 className="font-black text-sm text-slate-900">{hub.nameEn} ({hub.nameNp})</h4>
                              <p className="text-[10px] text-slate-500 font-bold mt-1">
                                {hw.lengthKm} KM • {hw.surfaceType} • {hw.status}
                              </p>
                              <button
                                onClick={() => setToPoint({ lat: hub.lat, lng: hub.lng, name: hub.nameEn })}
                                className="mt-2 w-full py-1 bg-indigo-600 text-white rounded text-[10px] font-black"
                              >
                                {language === 'en' ? 'Set as Destination' : 'गन्तव्य तोक्नुहोस्'}
                              </button>
                            </div>
                          </Popup>
                        </Marker>
                      ))
                    )}

                  {/* INDICATORS LAYER */}
                  {activeLayer === 'indicators' &&
                    indicators.map((indicator, index) => {
                      const pos = getCoordinates(indicator.id, index);
                      const target = indicator.annualTarget || 1;
                      const progress = indicator.annualProgress || 0;
                      const rate = Math.min(100, Math.round((progress / target) * 100));

                      return (
                        <Marker key={indicator.id} position={pos} icon={createIndicatorIcon(rate)}>
                          <Popup>
                            <div className="font-sans text-left max-w-xs p-1">
                              <span className="text-[10px] font-black text-indigo-500 uppercase block mb-1">
                                {language === 'en' ? 'Road Indicator' : 'सडक विकास सूचक'}
                              </span>
                              <h3 className="font-black text-sm text-slate-900 mb-2">
                                {language === 'en' ? indicator.nameEn || indicator.name : indicator.name}
                              </h3>
                              <div className="bg-slate-50 p-2 rounded-xl text-xs font-bold space-y-1">
                                <div>Achievement: <span className="font-black">{rate}%</span></div>
                                <div>Progress: {indicator.annualProgress} {translateUnit(indicator.unit)}</div>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}

                  {/* OFFICES LAYER */}
                  {activeLayer === 'offices' &&
                    officePerformances.map((office) => (
                      <Marker
                        key={office.name}
                        position={office.coordinates}
                        icon={createOfficeIcon(office.averageProgress)}
                      >
                        <Popup>
                          <div className="font-sans text-left max-w-sm p-1">
                            <span className="text-[10px] font-black text-indigo-500 uppercase block mb-1">
                              {language === 'en' ? 'DoR Office' : 'सडक विभाग कार्यालय'}
                            </span>
                            <h3 className="font-black text-sm text-slate-900 mb-2">
                              {translateOffice(office.name)}
                            </h3>

                            <div className="bg-slate-50 p-2.5 rounded-xl border space-y-1.5 mb-2">
                              <div className="flex justify-between items-center text-xs font-bold">
                                <span>{language === 'en' ? 'Average Progress' : 'औसत प्रगति'}:</span>
                                <span className="font-black text-indigo-600">{office.averageProgress}%</span>
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                setToPoint({
                                  lat: office.coordinates[0],
                                  lng: office.coordinates[1],
                                  name: translateOffice(office.name)
                                })
                              }
                              className="w-full py-1.5 bg-indigo-600 text-white text-xs font-black rounded-lg"
                            >
                              {language === 'en' ? 'Route to this Office' : 'यहाँ जाने मार्ग देखाउनुहोस्'}
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                </MapContainer>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
