export interface Indicator {
  id: string; // Trimmed indicators keys or numeric index or string slugs
  name: string; // Nepali name
  nameEn: string; // English translation
  sdg: string; // SDG alignment
  period: string; // review cycle
  weight: number; // weight value (can be 0 or null if non-weighted)
  unit: string; // measurement unit
  baseline: string | number; // baseline stats
  totalTarget: number | null;
  totalProgress: number | null;
  annualTarget: number;
  annualProgress: number;
  updatedAt?: string; // ISO date
  updatedBy?: string; // user email
  isMilestone?: boolean;
  category: 'Infrastructure Creation' | 'Maintenance' | 'Employment Creation' | 'Budget Utilization' | 'Governance';
  office?: string; // Concerned office responsible for updates
  gmail?: string; // User email from sheet
}

export interface AdminUser {
  uid: string;
  email: string;
  role: 'superadmin' | 'admin' | 'data_updater';
  createdAt: string;
  office?: string | null;
}

export interface UserActivity {
  id: string;
  userId: string;
  email: string;
  actionType: 'login' | 'view_dashboard' | 'edit_indicator' | 'sync_sheets' | 'role_change' | 'otp_login';
  details: string;
  timestamp: string;
}

export interface CategoryTheme {
  primary: string; // Hex color
  bg?: string; // Optional tailwind bg class (will be derived if missing)
}

export interface SystemMetadata {
  id: string;
  lastUpdateDate: string;
  nextUpdateDate: string;
  totalWeight: number;
  totalWeightProgress: number;
  lastSyncedAt?: string;
  lastSyncedBy?: string;
  categoryThemes?: Record<string, string>; // Category Name -> Hex Color
}

export interface SystemSettings {
  fiscalYear: string;
  sheetUrl: string;
  appNameEn: string;
  appNameNp: string;
  subHeaderEn: string;
  subHeaderNp: string;
  themeColor: string;
  updatedAt: string;
  updatedBy: string;
}

export interface EmailOTPSession {
  email: string;
  role: 'superadmin' | 'admin' | 'data_updater' | 'viewer';
  token: string;
  createdAt: string;
  expiresAt?: string;
  userAgent?: string;
}

export interface Toast {
  id: string;
  message: string; // Nepali/Primary message
  messageEn?: string; // English translation
  type: 'success' | 'info' | 'error' | 'warning';
  duration?: number;
}

export type ViewMode = 'hierarchy' | 'dashboard' | 'card' | 'chart' | 'table' | 'heatmap' | 'compare' | 'data-health' | 'institutional' | 'unified';

export type MainView = 'dashboard' | 'insights' | 'institutional' | 'trends' | 'heatmap' | 'action-portal';

export interface WidgetVisibility {
  radialChart: boolean;
  summaryCards: boolean;
  trendsGraph: boolean;
  budgetUtilization: boolean;
  performanceHeatmap: boolean;
}

export interface IndicatorComment {
  id: string;
  indicatorId: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  category?: string; // Tag for comment (e.g., 'general', 'update', 'issue', 'question')
  parentId?: string; // Optional parent comment ID for discussion threads
  createdAt: string; // ISO string
}


