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

export interface GroupConsolidationSummary {
  total_entities: number;
  consolidated_assets: number;
  consolidated_liabilities: number;
  consolidated_equity: number;
  eliminations_count: number;
  eliminations_amount: number;
  is_balanced: boolean;
  delta: number;
}

export interface TaxComplianceSummary {
  cit_rate: string;
  vat_rate: string;
  deferred_tax_asset: number;
  status: string;
  last_verification: string;
}

export interface MonthlyTransformationMetric {
  month: string;
  statements: number;
  volume_uzs: number;
  ifrs16: number;
  ifrs9: number;
}

export interface RecentActivityItem {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  entity?: string;
}

export interface DashboardData {
  compliance?: ComplianceData;
  one_c_status?: OneCStatus;
  transformation?: TransformationStats;
  consolidation?: GroupConsolidationSummary;
  tax_compliance?: TaxComplianceSummary;
  chart_data?: MonthlyTransformationMetric[];
  recent_activity: RecentActivityItem[];
}

export interface WidgetProps {
  config: WidgetConfig;
  data?: DashboardData;
}
