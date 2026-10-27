import { ComplianceWidget } from './widgets/ComplianceWidget';
import { OneCSyncWidget } from './widgets/OneCSyncWidget';
import { TransformationWidget } from './widgets/TransformationWidget';
import { RecentActivityWidget } from './widgets/RecentActivityWidget';
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { GroupConsolidationWidget } from './widgets/GroupConsolidationWidget';
import { TransformationChartWidget } from './widgets/TransformationChartWidget';
import { TaxComplianceWidget } from './widgets/TaxComplianceWidget';
import { WidgetProps } from './types';

export const WIDGET_REGISTRY: Record<string, React.FC<WidgetProps>> = {
    'compliance-score': ComplianceWidget,
    'one-c-sync': OneCSyncWidget,
    'transformation-stats': TransformationWidget,
    'group-consolidation': GroupConsolidationWidget,
    'transformation-chart': TransformationChartWidget,
    'quick-actions': QuickActionsWidget,
    'recent-activity': RecentActivityWidget,
    'tax-compliance-card': TaxComplianceWidget
};

export const AVAILABLE_WIDGETS = [
    { id: 'compliance-score', title: 'Compliance Health' },
    { id: 'one-c-sync', title: '1C Integration' },
    { id: 'transformation-stats', title: 'Transformation Stats' },
    { id: 'group-consolidation', title: 'IFRS 10 Consolidation' },
    { id: 'transformation-chart', title: 'IFRS Dynamics Chart' },
    { id: 'quick-actions', title: 'Quick Actions Hub' },
    { id: 'recent-activity', title: 'Recent Activity Feed' },
    { id: 'tax-compliance-card', title: 'Tax & Soliq.uz Compliance' },
];
