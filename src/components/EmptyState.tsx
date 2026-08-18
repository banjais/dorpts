import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import {
  Inbox,
  SearchX,
  MessageSquare,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  LayoutGrid,
  LineChart as LineChartIcon,
  Activity,
} from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  inbox: <Inbox size={32} className="text-slate-300 dark:text-slate-600" />,
  search: <SearchX size={32} className="text-slate-300 dark:text-slate-600" />,
  message: <MessageSquare size={32} className="text-slate-300 dark:text-slate-600" />,
  file: <FileText size={32} className="text-slate-300 dark:text-slate-600" />,
  chart: <BarChart3 size={32} className="text-slate-300 dark:text-slate-600" />,
  pie: <PieChartIcon size={32} className="text-slate-300 dark:text-slate-600" />,
  grid: <LayoutGrid size={32} className="text-slate-300 dark:text-slate-600" />,
  line: <LineChartIcon size={32} className="text-slate-300 dark:text-slate-600" />,
  activity: <Activity size={32} className="text-slate-300 dark:text-slate-600" />,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  const { language } = useLanguage();

  return (
    <div className={`flex flex-col items-center justify-center py-10 px-4 text-center ${className}`}>
      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4 border border-slate-100 dark:border-slate-700">
        {icon || ICON_MAP.inbox}
      </div>
      {title && (
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mb-4">
          {description}
        </p>
      )}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-2">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {actionLabel}
            </button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
