export interface WidgetConfig {
  id: string;
  enabled: boolean;
  order: number;
  settings?: Record<string, any>;
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
}

export interface ComplianceData {
  score: number;
  status: string;
  pending_tasks: number;
}

export interface OneCStatus {
  connected: boolean;
  last_sync: string | null;
  errors: number;
}

export interface TransformationStats {
  total_processed: number;
  saved_hours: number;
}

export interface RecentActivityItem {
  id: string;
  action: string;
  timestamp: string;
  details: string;
}

export interface DashboardData {
  compliance?: ComplianceData;
  one_c_status?: OneCStatus;
  transformation?: TransformationStats;
  recent_activity: RecentActivityItem[];
}

export interface WidgetProps {
  config: WidgetConfig;
  data?: DashboardData;
}
