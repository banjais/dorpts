import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Navigation,
  MapPin,
  Car,
  Bike,
  Bus,
  Truck,
  Zap,
  Clock,
  Compass,
  DollarSign,
  AlertTriangle,
  Route,
  ArrowRightLeft,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  NEPAL_PROVINCES,
  calculateTripMetrics,
  TravelCalculationResult
} from '../data/nepalGeoData';

interface DistanceCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOnMap?: (location: { lat: number; lng: number; name: string }) => void;
}

export const DistanceCalculatorModal: React.FC<DistanceCalculatorModalProps> = ({
  isOpen,
  onClose
}) => {
  const { language } = useLanguage();

  // "From" location state
  const [fromProvinceId, setFromProvinceId] = useState<number>(3); // Default Bagmati
  const [fromDistrictId, setFromDistrictId] = useState<string>('kathmandu');
  const [fromPalikaId, setFromPalikaId] = useState<string>('kmc');
  const [fromCustomGeo, setFromCustomGeo] = useState<{ lat: number; lng: number; label: string } | null>(null);

  // "To" location state
  const [toProvinceId, setToProvinceId] = useState<number>(4); // Default Gandaki
  const [toDistrictId, setToDistrictId] = useState<string>('kaski');
  const [toPalikaId, setToPalikaId] = useState<string>('pokhara');

  // Vehicle mode state
  const [vehicleType, setVehicleType] = useState<'car' | 'bike' | 'bus' | 'truck' | 'ev'>('car');

  // Geolocation loading state
  const [isLocating, setIsLocating] = useState(false);

  // Districts list for From & To
  const fromDistricts = useMemo(() => {
    const prov = NEPAL_PROVINCES.find((p) => p.id === fromProvinceId);
    return prov ? prov.districts : [];
  }, [fromProvinceId]);

  const fromPalikas = useMemo(() => {
    const dist = fromDistricts.find((d) => d.id === fromDistrictId);
    return dist ? dist.palikas : [];
  }, [fromDistricts, fromDistrictId]);

  const toDistricts = useMemo(() => {
    const prov = NEPAL_PROVINCES.find((p) => p.id === toProvinceId);
    return prov ? prov.districts : [];
  }, [toProvinceId]);

  const toPalikas = useMemo(() => {
    const dist = toDistricts.find((d) => d.id === toDistrictId);
    return dist ? dist.palikas : [];
  }, [toDistricts, toDistrictId]);

  // Selected Geo coordinates
  const fromCoords = useMemo(() => {
    if (fromCustomGeo) return { lat: fromCustomGeo.lat, lng: fromCustomGeo.lng, name: fromCustomGeo.label };
    const p = fromPalikas.find((item) => item.id === fromPalikaId);
    if (p) return { lat: p.lat, lng: p.lng, name: language === 'en' ? p.nameEn : p.nameNp };
    const d = fromDistricts.find((item) => item.id === fromDistrictId);
    if (d) return { lat: d.lat, lng: d.lng, name: language === 'en' ? d.nameEn : d.nameNp };
    return { lat: 27.7172, lng: 85.324, name: 'Kathmandu' };
  }, [fromCustomGeo, fromPalikaId, fromPalikas, fromDistrictId, fromDistricts, language]);

  const toCoords = useMemo(() => {
    const p = toPalikas.find((item) => item.id === toPalikaId);
    if (p) return { lat: p.lat, lng: p.lng, name: language === 'en' ? p.nameEn : p.nameNp };
    const d = toDistricts.find((item) => item.id === toDistrictId);
    if (d) return { lat: d.lat, lng: d.lng, name: language === 'en' ? d.nameEn : d.nameNp };
    return { lat: 28.2096, lng: 83.9856, name: 'Pokhara' };
  }, [toPalikaId, toPalikas, toDistrictId, toDistricts, language]);

  // Calculated Trip Results
  const tripMetrics: TravelCalculationResult = useMemo(() => {
    return calculateTripMetrics(
      fromCoords.lat,
      fromCoords.lng,
      toCoords.lat,
      toCoords.lng,
      vehicleType
    );
  }, [fromCoords, toCoords, vehicleType]);

  // Swap From and To locations
  const handleSwapLocations = () => {
    const tempProv = fromProvinceId;
    const tempDist = fromDistrictId;
    const tempPalika = fromPalikaId;

    setFromProvinceId(toProvinceId);
    setFromDistrictId(toDistrictId);
    setFromPalikaId(toPalikaId);
    setFromCustomGeo(null);

    setToProvinceId(tempProv);
    setToDistrictId(tempDist);
    setToPalikaId(tempPalika);
  };

  // Get GPS Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(
        language === 'en'
          ? 'Geolocation is not supported by your browser.'
          : 'तपाईँको ब्राउजरमा लोकेसन सेवा समर्थित छैन।'
      );
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setFromCustomGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: language === 'en' ? 'My Current Location (GPS)' : 'मेरो हालको स्थान (जीपीएस)'
        });
      },
      () => {
        setIsLocating(false);
        alert(
          language === 'en'
            ? 'Unable to retrieve your location. Showing Kathmandu default.'
            : 'स्थान पत्ता लगाउन सकिएन। काठमाडौँ स्थान रोजियो।'
        );
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

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
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 z-10"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
                <Compass size={22} className="animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  {language === 'en' ? 'Nepal Highway Distance Calculator' : 'नेपाल सडक दूरी तथा लागत क्याल्कुलेटर'}
                </h2>
                <p className="text-xs text-indigo-100/90 font-medium">
                  {language === 'en'
                    ? 'Provinces, Districts, Palika & Real-time Cost Estimation'
                    : 'प्रदेश, जिल्ला, पालिका र प्रत्यक्ष यात्रा लागत विवरण'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl text-indigo-100 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
            {/* Origin & Destination Selection Controls */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Route size={16} />
                  {language === 'en' ? 'Select Route Points' : 'मार्ग विन्दुहरू छान्नुहोस्'}
                </span>

                <button
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Navigation size={13} className={isLocating ? 'animate-bounce' : ''} />
                  <span>
                    {isLocating
                      ? language === 'en'
                        ? 'Locating...'
                        : 'खोज्दैछ...'
                      : language === 'en'
                      ? 'Current Location'
                      : 'हालको स्थान'}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                {/* FROM BOX */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <MapPin size={15} className="text-emerald-500" />
                      {language === 'en' ? 'FROM (Origin)' : 'बाट (प्रस्थान)'}
                    </label>
                    {fromCustomGeo && (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold">
                        GPS Active
                      </span>
                    )}
                  </div>

                  {fromCustomGeo ? (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <span>{fromCustomGeo.label}</span>
                      <button
                        onClick={() => setFromCustomGeo(null)}
                        className="text-xs underline text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        {language === 'en' ? 'Change' : 'फेर्नुहोस्'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Province Dropdown */}
                      <select
                        value={fromProvinceId}
                        onChange={(e) => {
                          const provId = Number(e.target.value);
                          setFromProvinceId(provId);
                          const prov = NEPAL_PROVINCES.find((p) => p.id === provId);
                          if (prov && prov.districts.length > 0) {
                            setFromDistrictId(prov.districts[0].id);
                            if (prov.districts[0].palikas.length > 0) {
                              setFromPalikaId(prov.districts[0].palikas[0].id);
                            }
                          }
                        }}
                        className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {NEPAL_PROVINCES.map((p) => (
                          <option key={p.id} value={p.id}>
                            {language === 'en' ? p.nameEn : p.nameNp}
                          </option>
                        ))}
                      </select>

                      {/* District & Palika Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={fromDistrictId}
                          onChange={(e) => {
                            const distId = e.target.value;
                            setFromDistrictId(distId);
                            const dist = fromDistricts.find((d) => d.id === distId);
                            if (dist && dist.palikas.length > 0) {
                              setFromPalikaId(dist.palikas[0].id);
                            }
                          }}
                          className="w-full px-2.5 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {fromDistricts.map((d) => (
                            <option key={d.id} value={d.id}>
                              {language === 'en' ? d.nameEn : d.nameNp}
                            </option>
                          ))}
                        </select>

                        <select
                          value={fromPalikaId}
                          onChange={(e) => setFromPalikaId(e.target.value)}
                          className="w-full px-2.5 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {fromPalikas.map((p) => (
                            <option key={p.id} value={p.id}>
                              {language === 'en' ? p.nameEn : p.nameNp}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* SWAP BUTTON */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
                  <button
                    onClick={handleSwapLocations}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-transform active:scale-90 cursor-pointer"
                    title={language === 'en' ? 'Swap From / To' : 'स्थान साट्नुहोस्'}
                  >
                    <ArrowRightLeft size={16} />
                  </button>
                </div>

                {/* TO BOX */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <MapPin size={15} className="text-rose-500" />
                    {language === 'en' ? 'TO (Destination)' : 'सम्म (गन्तव्य)'}
                  </label>

                  <div className="space-y-2">
                    {/* Province Dropdown */}
                    <select
                      value={toProvinceId}
                      onChange={(e) => {
                        const provId = Number(e.target.value);
                        setToProvinceId(provId);
                        const prov = NEPAL_PROVINCES.find((p) => p.id === provId);
                        if (prov && prov.districts.length > 0) {
                          setToDistrictId(prov.districts[0].id);
                          if (prov.districts[0].palikas.length > 0) {
                            setToPalikaId(prov.districts[0].palikas[0].id);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {NEPAL_PROVINCES.map((p) => (
                        <option key={p.id} value={p.id}>
                          {language === 'en' ? p.nameEn : p.nameNp}
                        </option>
                      ))}
                    </select>

                    {/* District & Palika Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={toDistrictId}
                        onChange={(e) => {
                          const distId = e.target.value;
                          setToDistrictId(distId);
                          const dist = toDistricts.find((d) => d.id === distId);
                          if (dist && dist.palikas.length > 0) {
                            setToPalikaId(dist.palikas[0].id);
                          }
                        }}
                        className="w-full px-2.5 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {toDistricts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {language === 'en' ? d.nameEn : d.nameNp}
                          </option>
                        ))}
                      </select>

                      <select
                        value={toPalikaId}
                        onChange={(e) => setToPalikaId(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {toPalikas.map((p) => (
                          <option key={p.id} value={p.id}>
                            {language === 'en' ? p.nameEn : p.nameNp}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Mode Selection */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                {language === 'en' ? 'Select Vehicle Mode' : 'सवारी साधन प्रकार छान्नुहोस्'}
              </span>

              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: 'car', labelEn: 'Car / SUV', labelNp: 'कार / जीप', icon: Car },
                  { id: 'bike', labelEn: 'Motorcycle', labelNp: 'मोटरसाइकल', icon: Bike },
                  { id: 'bus', labelEn: 'Bus', labelNp: 'बस', icon: Bus },
                  { id: 'truck', labelEn: 'Truck', labelNp: 'ट्रक', icon: Truck },
                  { id: 'ev', labelEn: 'EV Vehicle', labelNp: 'विद्युतीय सवारी', icon: Zap }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = vehicleType === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setVehicleType(item.id as any)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 scale-105'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-[10px] font-extrabold text-center leading-tight">
                        {language === 'en' ? item.labelEn : item.labelNp}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calculated Results Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* DISTANCE */}
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-5 rounded-2xl shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-200">
                    {language === 'en' ? 'Estimated Distance' : 'अनुमानित दूरी'}
                  </span>
                  <Route size={20} className="text-indigo-200" />
                </div>
                <div className="my-3">
                  <span className="text-3xl font-black">{tripMetrics.distanceKm}</span>
                  <span className="text-sm font-bold ml-1.5">KM</span>
                </div>
                <span className="text-[11px] font-semibold text-indigo-100">
                  {fromCoords.name} ➔ {toCoords.name}
                </span>
              </div>

              {/* DURATION */}
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-5 rounded-2xl shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-200">
                    {language === 'en' ? 'Estimated Time' : 'अनुमानित समय'}
                  </span>
                  <Clock size={20} className="text-emerald-200" />
                </div>
                <div className="my-3">
                  <span className="text-2xl font-black">
                    {language === 'en'
                      ? tripMetrics.durationFormattedEn
                      : tripMetrics.durationFormattedNp}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-100">
                  {language === 'en' ? `Average speed ~ 45 km/h` : 'औसत गति ~ ४५ किमी/घण्टा'}
                </span>
              </div>

              {/* TOTAL COST */}
              <div className="bg-gradient-to-br from-amber-500 to-amber-700 text-white p-5 rounded-2xl shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-amber-200">
                    {language === 'en' ? 'Fuel & Toll Cost' : 'इन्धन तथा महसुल खर्च'}
                  </span>
                  <DollarSign size={20} className="text-amber-200" />
                </div>
                <div className="my-3">
                  <span className="text-3xl font-black">NPR {tripMetrics.totalEstimatedCostNpr}</span>
                </div>
                <div className="text-[10px] font-semibold text-amber-100 flex justify-between">
                  <span>Fuel: NPR {tripMetrics.fuelCostNpr}</span>
                  <span>Toll: NPR {tripMetrics.tollCostNpr}</span>
                </div>
              </div>
            </div>

            {/* Road Advisory & Alternative Routes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Road Condition Warning */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 rounded-2xl flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-tight mb-1">
                    {language === 'en' ? 'Road Condition Advisory' : 'सडक स्थिति सल्लाह'}
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed font-semibold">
                    {language === 'en'
                      ? tripMetrics.roadConditionNoteEn
                      : tripMetrics.roadConditionNoteNp}
                  </p>
                </div>
              </div>

              {/* Recommended Route */}
              <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 p-4 rounded-2xl flex items-start gap-3">
                <CheckCircle2 size={20} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-tight mb-1">
                    {language === 'en' ? 'Recommended DoR Corridor' : 'सिफारिस गरिएको मुख्य राजमार्ग'}
                  </h4>
                  <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed font-semibold">
                    {language === 'en'
                      ? tripMetrics.recommendedRouteEn
                      : tripMetrics.recommendedRouteNp}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-extrabold hover:bg-slate-200 transition-all cursor-pointer"
            >
              {language === 'en' ? 'Close Calculator' : 'बन्द गर्नुहोस्'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
