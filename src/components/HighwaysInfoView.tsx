import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  Compass,
  MapPin,
  Building2,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Construction,
  Info,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  NATIONAL_HIGHWAYS,
  NEPAL_PROVINCES,
  NationalHighway
} from '../data/nepalGeoData';

interface HighwaysInfoViewProps {
  onSelectHighwayOnMap?: (highway: NationalHighway) => void;
}

export const HighwaysInfoView: React.FC<HighwaysInfoViewProps> = () => {
  const { language } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedHighway, setSelectedHighway] = useState<NationalHighway | null>(null);

  // Filtered Highways
  const filteredHighways = useMemo(() => {
    return NATIONAL_HIGHWAYS.filter((hw) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        hw.code.toLowerCase().includes(q) ||
        hw.nameEn.toLowerCase().includes(q) ||
        hw.nameNp.toLowerCase().includes(q) ||
        hw.startPointEn.toLowerCase().includes(q) ||
        hw.endPointEn.toLowerCase().includes(q) ||
        hw.majorHubs.some(
          (hub) =>
            hub.nameEn.toLowerCase().includes(q) || hub.nameNp.toLowerCase().includes(q)
        );

      const matchesProvince =
        selectedProvinceId === 'all' || hw.provincesCovered.includes(selectedProvinceId);

      const matchesStatus =
        selectedStatus === 'all' || hw.status === selectedStatus;

      return matchesSearch && matchesProvince && matchesStatus;
    });
  }, [searchQuery, selectedProvinceId, selectedStatus]);

  // Aggregate stats
  const totalNetworkKm = useMemo(() => {
    return NATIONAL_HIGHWAYS.reduce((acc, curr) => acc + curr.lengthKm, 0);
  }, []);

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto p-4 sm:p-6 font-sans">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-widest">
              <Compass size={16} />
              <span>{language === 'en' ? 'Department of Roads - National Network' : 'सडक विभाग - राष्ट्रिय सडक सञ्जाल'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {language === 'en' ? 'Nepal National Highways & Corridors' : 'नेपालका राष्ट्रिय राजमार्ग तथा कोरिडोरहरू'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {language === 'en'
                ? 'Comprehensive catalog of primary National Highways, Pushpalal Mid-Hill Highway, Postal Highway, Trade Corridors, Toll points and Feeder Road connections.'
                : 'नेपालका मुख्य राष्ट्रिय राजमार्गहरू, मध्यपहाडी राजमार्ग, हुलाकी सडक, व्यापारिक कोरिडोरहरू, शुल्क केन्द्र र स्थानीय सडक सञ्जालको एकीकृत विवरण।'}
            </p>
          </div>

          {/* KPI Metrics */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center">
              <span className="text-xs text-indigo-200 font-extrabold uppercase block">
                {language === 'en' ? 'Total Highways' : 'कुल राजमार्ग'}
              </span>
              <span className="text-xl font-black text-white">{NATIONAL_HIGHWAYS.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center">
              <span className="text-xs text-indigo-200 font-extrabold uppercase block">
                {language === 'en' ? 'Network Length' : 'कुल लम्बाइ'}
              </span>
              <span className="text-xl font-black text-white">{totalNetworkKm} KM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'en'
                ? 'Search highway by code (e.g. H01, H03), name or town...'
                : 'कोड (उदा. H01, H03), नाम वा सहरबाट राजमार्ग खोज्नुहोस्...'
            }
            className="w-full px-4 py-2.5 pl-10 text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Province Filter */}
          <select
            value={selectedProvinceId}
            onChange={(e) =>
              setSelectedProvinceId(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            className="px-3 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">{language === 'en' ? 'All Provinces' : 'सबै प्रदेशहरू'}</option>
            {NEPAL_PROVINCES.map((p) => (
              <option key={p.id} value={p.id}>
                {language === 'en' ? p.nameEn : p.nameNp}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">{language === 'en' ? 'All Status' : 'सबै स्थिति'}</option>
            <option value="Open">{language === 'en' ? 'Open' : 'सञ्चालनमा'}</option>
            <option value="Widening/Maintenance">{language === 'en' ? 'Widening Work' : 'विस्तार जारी'}</option>
            <option value="Single Lane">{language === 'en' ? 'Single Lane' : 'एक लेन'}</option>
            <option value="Under Construction">{language === 'en' ? 'Under Construction' : 'निर्माणाधीन'}</option>
          </select>
        </div>
      </div>

      {/* Highway Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredHighways.map((hw) => {
          let statusBadgeClass = 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200';
          let StatusIcon = CheckCircle2;

          if (hw.status === 'Widening/Maintenance') {
            statusBadgeClass = 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200';
            StatusIcon = Construction;
          } else if (hw.status === 'Single Lane' || hw.status === 'Landslide Alert') {
            statusBadgeClass = 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200';
            StatusIcon = AlertTriangle;
          } else if (hw.status === 'Under Construction') {
            statusBadgeClass = 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200';
            StatusIcon = Construction;
          }

          return (
            <motion.div
              key={hw.id}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedHighway(hw)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Code & Status */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-black tracking-wider">
                    {hw.code}
                  </span>

                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5 ${statusBadgeClass}`}>
                    <StatusIcon size={12} />
                    {language === 'en' ? hw.status : hw.statusNp}
                  </span>
                </div>

                {/* Name */}
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                    {language === 'en' ? hw.nameEn : hw.nameNp}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                    {hw.startPointEn} ➔ {hw.endPointEn}
                  </p>
                </div>

                {/* Quick Attributes */}
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">{language === 'en' ? 'Length' : 'लम्बाइ'}</span>
                    <span className="font-black text-slate-700 dark:text-slate-200">{hw.lengthKm} KM</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">{language === 'en' ? 'Surface' : 'सतह प्रकार'}</span>
                    <span className="font-black text-slate-700 dark:text-slate-200">{hw.surfaceType}</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">{language === 'en' ? 'Provinces' : 'प्रदेश संख्या'}</span>
                    <span className="font-black text-slate-700 dark:text-slate-200">{hw.provincesCovered.length}</span>
                  </div>
                </div>
              </div>

              {/* Action Link */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                <span>{language === 'en' ? 'View Route Details & Tolls' : 'पूर्ण विवरण तथा महसुल हेर्नुहोस्'}</span>
                <ChevronRight size={16} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Highway Detail Drawer/Modal */}
      <AnimatePresence>
        {selectedHighway && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-3 sm:p-6 font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHighway(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 z-10"
            >
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-white/20 rounded-xl text-sm font-black uppercase">
                    {selectedHighway.code}
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-black leading-snug">
                      {language === 'en' ? selectedHighway.nameEn : selectedHighway.nameNp}
                    </h3>
                    <p className="text-xs text-indigo-100 font-medium">
                      {selectedHighway.lengthKm} KM • {selectedHighway.surfaceType}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedHighway(null)}
                  className="p-2 hover:bg-white/10 rounded-xl text-indigo-100 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
                {/* Description */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    {language === 'en' ? 'Overview' : 'साधारण विवरण'}
                  </span>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                    {language === 'en' ? selectedHighway.descriptionEn : selectedHighway.descriptionNp}
                  </p>
                </div>

                {/* Major Hubs */}
                <div className="space-y-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block flex items-center gap-1.5">
                    <MapPin size={15} className="text-indigo-500" />
                    {language === 'en' ? 'Major Transit Hubs' : 'मुख्य ट्रान्सिट स्टेसनहरू'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedHighway.majorHubs.map((hub, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm"
                      >
                        {language === 'en' ? hub.nameEn : hub.nameNp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Local Road Connections */}
                {selectedHighway.localRoadConnections.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block flex items-center gap-1.5">
                      <Building2 size={15} className="text-emerald-500" />
                      {language === 'en' ? 'Local & Feeder Road Connections' : 'स्थानीय तथा सहायक सडक सञ्जाल'}
                    </span>
                    <div className="space-y-2">
                      {selectedHighway.localRoadConnections.map((link, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold"
                        >
                          <span className="text-slate-800 dark:text-slate-200">
                            {language === 'en' ? link.nameEn : link.nameNp}
                          </span>
                          <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg">
                            {link.connectsTo}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Toll Stations */}
                {selectedHighway.tollPoints.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block flex items-center gap-1.5">
                      <DollarSign size={15} className="text-amber-500" />
                      {language === 'en' ? 'Official Toll Stations' : 'सरकारी शुल्क संकलन केन्द्रहरू'}
                    </span>
                    <div className="space-y-2">
                      {selectedHighway.tollPoints.map((toll) => (
                        <div
                          key={toll.id}
                          className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                              {language === 'en' ? toll.nameEn : toll.nameNp}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold">
                              {toll.locationEn}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold pt-1">
                            <div className="bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border">
                              Bike: NPR {toll.ratesNpr.bike}
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border">
                              Car: NPR {toll.ratesNpr.car}
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border">
                              Bus: NPR {toll.ratesNpr.bus}
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border">
                              Truck: NPR {toll.ratesNpr.truck}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedHighway(null)}
                  className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-extrabold hover:bg-slate-200 transition-all cursor-pointer"
                >
                  {language === 'en' ? 'Close' : 'बन्द गर्नुहोस्'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
