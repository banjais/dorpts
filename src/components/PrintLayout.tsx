import React from 'react';
import { Indicator, SystemMetadata } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { QRCodeCanvas } from 'qrcode.react';
import { Printer, Download, Share2, Check } from 'lucide-react';
import { IndicatorTable } from './IndicatorTable';
import { MetricsChart } from './MetricsChart';
import { IndicatorCard } from './IndicatorCard';
import { TrendAnalysisView } from './TrendAnalysisView';
import html2pdf from 'html2pdf.js';

interface PrintLayoutProps {
  indicators: Indicator[];
  metadata: SystemMetadata | null;
  updatesHistory: any[];
  customTitle?: string;
  showSummary?: boolean;
  viewFormat?: string;
  onClose?: () => void;
  aiSummary?: string | null;
}

export function PrintLayout({ indicators, metadata, updatesHistory, customTitle, showSummary = true, viewFormat = 'table', onClose, aiSummary }: PrintLayoutProps) {
  const [showHeader, setShowHeader] = React.useState(true);
  const [includeSummary, setIncludeSummary] = React.useState(showSummary);
  const [showData, setShowData] = React.useState(true);
  const [isPreviewDark, setIsPreviewDark] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [zoom, setZoom] = React.useState(100);
  const { language, t, translateUnit } = useLanguage();
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const now = new Date();
  const printDate = now.toLocaleDateString();
  const printTime = now.toLocaleTimeString();

  React.useEffect(() => {
    // Lock body scroll when report is open to prevent background interaction
    document.body.style.overflow = 'hidden';
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleShareReport = () => {
    const ids = indicators.map(ind => ind.id).join(',');
    
    const url = new URL(window.location.href);
    url.searchParams.set('report', 'true');
    url.searchParams.set('ids', ids);
    url.searchParams.set('format', viewFormat);
    
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const renderView = () => {
    if (!showData) return null;
    switch (viewFormat) {
      case 'table':
        return <IndicatorTable indicators={indicators} />;
      case 'chart':
        return <div className="py-8"><MetricsChart indicators={indicators} /></div>;
      case 'card':
        return (
          <div className="grid grid-cols-2 gap-4">
            {indicators.map(ind => <IndicatorCard key={ind.id} indicator={ind} onEdit={() => {}} />)}
          </div>
        );
      case 'trend':
        return <div className="py-8"><TrendAnalysisView indicators={indicators} metadata={metadata} onOpenAbout={onClose} /></div>;
      default:
        return <IndicatorTable indicators={indicators} />;
    }
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('print-content');
    if (!element) {
      alert('Error: Print content not found.');
      return;
    }
    
    setIsExporting(true);
    
    const opt = {
      margin:       [10, 10] as [number, number],
      filename:     customTitle ? `${customTitle.replace(/\s+/g, '_')}_Report.pdf` : 'DoR_Report.pdf',
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        letterRendering: true
      },
      jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    
    try {
      // @ts-ignore
      const worker = html2pdf();
      worker.set(opt).from(element).save().then(() => {
        setIsExporting(false);
        // Explicitly trigger browser print dialog after PDF is generated as per request
        setTimeout(() => {
          window.print();
        }, 500);
      }).catch((err: any) => {
        console.error('PDF Generation Error:', err);
        setIsExporting(false);
        alert('Failed to generate PDF. Please try again.');
      });
    } catch (err) {
      console.error('html2pdf initialization error:', err);
      setIsExporting(false);
      alert('PDF library initialization failed.');
    }
  };

  return (
    <div className={`fixed inset-0 z-[10000] overflow-auto font-sans transition-colors duration-300 ${isPreviewDark ? 'bg-slate-950 text-white' : 'bg-white text-black'} print:bg-white print:text-black print:p-0 print:static print:overflow-visible print:z-auto`}>
      <div id="print-controls" className="fixed top-0 left-0 right-0 p-4 bg-slate-900 text-white flex flex-wrap justify-between items-center gap-4 print:hidden z-[10001] shadow-2xl">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer whitespace-nowrap hover:text-indigo-400 transition-colors"><input type="checkbox" className="accent-indigo-500" checked={showHeader} onChange={e => setShowHeader(e.target.checked)} /> Header</label>
          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer whitespace-nowrap hover:text-indigo-400 transition-colors"><input type="checkbox" className="accent-indigo-500" checked={includeSummary} onChange={e => setIncludeSummary(e.target.checked)} /> Summary</label>
          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer whitespace-nowrap hover:text-indigo-400 transition-colors"><input type="checkbox" className="accent-indigo-500" checked={showData} onChange={e => setShowData(e.target.checked)} /> Data</label>
          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer whitespace-nowrap hover:text-indigo-400 transition-colors"><input type="checkbox" className="accent-indigo-500" checked={isPreviewDark} onChange={e => setIsPreviewDark(e.target.checked)} /> Dark Preview</label>
          <div className="flex items-center gap-2 ml-4 border-l border-white/20 pl-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zoom</span>
            <input 
              type="range" 
              min="50" 
              max="150" 
              step="5"
              value={zoom} 
              onChange={(e) => setZoom(parseInt(e.target.value))} 
              className="w-24 accent-indigo-500 cursor-pointer"
            />
            <span className="text-[10px] font-mono text-indigo-400 w-8">{zoom}%</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleShareReport} 
            className={`px-5 py-2 rounded-xl text-xs font-black whitespace-nowrap shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer ${
              copied ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-blue-600 shadow-blue-600/20 hover:bg-blue-700'
            }`}
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            {copied ? (language === 'en' ? 'Copied!' : 'प्रतिलिपि भयो!') : (language === 'en' ? 'Share Report' : 'प्रतिवेदन साझा गर्नुहोस्')}
          </button>
          <button 
            onClick={handleDownloadPDF} 
            disabled={isExporting}
            className={`px-5 py-2 rounded-xl text-xs font-black whitespace-nowrap shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer ${
              isExporting ? 'bg-emerald-800 opacity-70 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            {isExporting ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {isExporting ? (language === 'en' ? 'Exporting...' : 'निर्यात गर्दै...') : (language === 'en' ? 'Download PDF' : 'PDF डाउनलोड गर्नुहोस्')}
          </button>
          <button 
            onClick={() => window.print()} 
            className="px-5 py-2 bg-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-700 whitespace-nowrap shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer size={14} />
            Print
          </button>
          <button 
            onClick={onClose} 
            className="px-5 py-2 bg-slate-700 rounded-xl text-xs font-black hover:bg-slate-600 whitespace-nowrap active:scale-95 transition-all cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
      
      <div 
        id="print-content" 
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        className={`${isPreviewDark ? 'bg-slate-950 text-white' : 'bg-white text-black'} print:bg-white print:text-black pt-52 sm:pt-32 p-4 sm:p-12 pb-32 max-w-5xl mx-auto min-h-screen print:transform-none`}
      >
        {showHeader && (
        <div className={`flex justify-between items-start border-b-2 pb-4 mb-6 print:border-slate-900 ${isPreviewDark ? 'border-slate-700' : 'border-slate-900'}`}>
          <div className="flex items-start gap-3">
            <img 
              src="/GovtLogo.svg" 
              alt="Government of Nepal Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain filter drop-shadow-sm shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex flex-col leading-none mb-1">
                <span className="font-display text-[0.62rem] sm:text-[0.8rem] md:text-[0.9rem] font-black tracking-wide whitespace-nowrap text-brand-gradient uppercase">
                  {language === 'ne' ? 'प्रगति ट्र्याकर' : 'DORPTS'}
                </span>
                <span className="text-[0.4rem] sm:text-[0.48rem] md:text-[0.52rem] uppercase tracking-tight leading-tight whitespace-nowrap font-extrabold text-[#0099DA] dark:text-[#00ADF7]">
                  {t('deptOfRoads')}
                </span>
              </div>
              {customTitle ? (
                <div className={`mt-1.5 border-l-2 pl-2.5 py-1 ${isPreviewDark ? 'border-indigo-500' : 'border-indigo-600'}`}>
                  <h2 className={`text-sm sm:text-base font-extrabold leading-tight ${isPreviewDark ? 'text-white' : 'text-slate-900'}`}>
                    {customTitle}
                  </h2>
                  <span className={`text-[9px] uppercase tracking-wider font-bold ${isPreviewDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t('dorProgress')} - {language === 'en' ? 'Consolidated Report' : 'एकीकृत प्रतिवेदन'}
                  </span>
                </div>
              ) : (
                <h2 className={`text-sm sm:text-base font-bold mt-1 ${isPreviewDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {t('dorProgress')} - {language === 'en' ? 'Report' : 'प्रतिवेदन'}
                </h2>
              )}
            </div>
          </div>
          <div className={`text-right text-[10px] sm:text-xs ${isPreviewDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <p className={`font-bold mb-0.5 ${isPreviewDark ? 'text-slate-200' : 'text-slate-800'}`}>{t('documentControl')}</p>
            <p>{t('lastUpdate')}: <span className="font-mono">{metadata?.lastUpdateDate || 'N/A'}</span></p>
            <p className="mt-1">{language === 'en' ? 'Printed' : 'मुद्रण मिति'}: {printDate} {printTime}</p>
          </div>
        </div>
      )}

      {/* Summary Metrics */}
      {includeSummary && (() => {
        const totalWeight = indicators.reduce((acc, curr) => acc + (curr?.weight || 0), 0) || 100;
        const achievedWeight = indicators.reduce((acc, curr) => {
          if (!curr) return acc;
          const target = curr.annualTarget || 0;
          const progress = curr.annualProgress || 0;
          const achievement = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
          return acc + (achievement * ((curr.weight || 0) / 100));
        }, 0);
        const weightPercentage = totalWeight > 0 ? (achievedWeight / totalWeight) * 100 : 0;

        return (
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className={`p-4 border rounded-lg ${isPreviewDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t('overallProgress')}</p>
              <p className={`text-3xl font-black ${isPreviewDark ? 'text-indigo-400' : 'text-[#003399]'}`}>
                {weightPercentage.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {Number(achievedWeight.toFixed(1))} / {totalWeight} {language === 'en' ? 'Total Weight Completed' : 'कुल भार सम्पन्न'}
              </p>
            </div>
            <div className={`p-4 border rounded-lg ${isPreviewDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t('totalIndicators')}</p>
              <p className={`text-3xl font-black ${isPreviewDark ? 'text-slate-200' : 'text-slate-800'}`}>{indicators.length}</p>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'en' ? 'Selected monitored indicators & tasks' : 'सक्रिय अनुगमन गरिएका सूचकहरू'}
              </p>
            </div>
          </div>
        );
      })()}

      {/* AI Summary */}
      {includeSummary && aiSummary && (
        <div className={`p-5 border rounded-xl mb-8 relative overflow-hidden transition-all duration-300 ${isPreviewDark ? 'bg-slate-900/60 border-indigo-500/30 text-slate-100' : 'bg-indigo-50/20 border-indigo-100 text-slate-800'}`}>
          <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            {language === 'en' ? 'AI-Generated Executive Summary' : 'एआई-उत्पन्न कार्यकारी सारांश'}
          </p>
          <div className={`text-xs leading-relaxed whitespace-pre-wrap font-medium ${isPreviewDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {aiSummary}
          </div>
        </div>
      )}

      {/* Data View */}
      {showData && (
        <div className="mb-12">
          <h3 className={`text-lg font-bold mb-4 border-b pb-2 ${isPreviewDark ? 'text-slate-200 border-slate-700' : 'text-slate-800 border-slate-200'}`}>{t('detailedIndicators')}</h3>
          {renderView()}
        </div>
      )}

      {/* Official Footer */}
      <div className={`mt-auto pt-8 border-t-2 flex justify-between items-end pb-8 ${isPreviewDark ? 'border-slate-700' : 'border-slate-900'} print:border-slate-900 print:mt-12`} style={{ pageBreakInside: 'avoid' }}>
        <div>
          <p className={`font-bold text-sm ${isPreviewDark ? 'text-slate-200' : 'text-slate-800'}`}>{t('deptOfRoads')} ({language === 'en' ? 'DoR' : 'स.वि.'})</p>
          <p className="text-xs text-slate-500">{t('secureActionPortal')} © DOR | 2082/83 B.S</p>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">APP_ID: DOR-TRACKER-V1.0 | GEN: {now.getTime()}</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <QRCodeCanvas value={currentUrl} size={64} level="L" includeMargin={false} />
          <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">{t('scanForLive')}</span>
        </div>
      </div>
      </div>
    </div>
  );
}
