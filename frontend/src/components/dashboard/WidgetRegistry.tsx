import { ComplianceWidget } from './widgets/ComplianceWidget';
import { OneCSyncWidget } from './widgets/OneCSyncWidget';
import { TransformationWidget } from './widgets/TransformationWidget';
import { RecentActivityWidget } from './widgets/RecentActivityWidget';
import { WidgetProps } from './types';

export const WIDGET_REGISTRY: Record<string, React.FC<WidgetProps>> = {
    'compliance-score': ComplianceWidget,
    'one-c-sync': OneCSyncWidget,
    'transformation-stats': TransformationWidget,
    'recent-activity': RecentActivityWidget,
    'quick-actions': () => <div className="p-4 border rounded">Quick Actions (Coming Soon)</div>
};

export const AVAILABLE_WIDGETS = [
    { id: 'compliance-score', title: 'Compliance Score' },
    { id: 'one-c-sync', title: '1C Integration' },
    { id: 'transformation-stats', title: 'Transformation Stats' },
    { id: 'recent-activity', title: 'Recent Activity' },
    { id: 'quick-actions', title: 'Quick Actions' },
];
