import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight, Users, Shield, UserCog, User, Crown } from 'lucide-react';

interface HierarchyLevel {
    level: number;
    role_name: string;
    display_name: string;
    user_count: number;
    users: Array<{
        id: string;
        email: string;
        full_name: string;
        role: string;
        is_company_owner: boolean;
        company_id: string | null;
    }>;
}

export default function HierarchyTreePage() {
    const [hierarchy, setHierarchy] = useState<HierarchyLevel[]>([]);
    const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHierarchy();
    }, []);

    const fetchHierarchy = async () => {
        try {
            const res = await api.get('/hierarchy/structure');
            setHierarchy(res.data);
        } catch (error) {
            console.error('Failed to fetch hierarchy', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleLevel = (level: number) => {
        const newExpanded = new Set(expandedLevels);
        if (newExpanded.has(level)) {
            newExpanded.delete(level);
        } else {
            newExpanded.add(level);
        }
        setExpandedLevels(newExpanded);
    };

    const getLevelIcon = (level: number) => {
        switch (level) {
            case 1: return <Crown className="h-5 w-5 text-purple-600" />;
            case 2: return <Shield className="h-5 w-5 text-blue-600" />;
            case 3: return <UserCog className="h-5 w-5 text-green-600" />;
            case 4: return <Users className="h-5 w-5 text-yellow-600" />;
            default: return <User className="h-5 w-5 text-gray-600" />;
        }
    };

    const getLevelColor = (level: number) => {
        switch (level) {
            case 1: return 'bg-purple-100 border-purple-300 text-purple-800';
            case 2: return 'bg-blue-100 border-blue-300 text-blue-800';
            case 3: return 'bg-green-100 border-green-300 text-green-800';
            case 4: return 'bg-yellow-100 border-yellow-300 text-yellow-800';
            default: return 'bg-gray-100 border-gray-300 text-gray-800';
        }
    };

    if (loading) {
        return <div className="p-6">Loading hierarchy...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Organizational Hierarchy</h1>
                <p className="text-gray-500 mt-1">View your organization's role structure</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Hierarchy Structure</CardTitle>
                    <CardDescription>
                        Click on each level to expand/collapse user details
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {hierarchy.map((level) => (
                            <div key={level.level} className="border rounded-lg overflow-hidden">
                                {/* Level Header */}
                                <div
                                    className={`p-4 cursor-pointer hover:opacity-90 transition-opacity ${getLevelColor(level.level)}`}
                                    onClick={() => toggleLevel(level.level)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {expandedLevels.has(level.level) ? (
                                                <ChevronDown className="h-5 w-5" />
                                            ) : (
                                                <ChevronRight className="h-5 w-5" />
                                            )}
                                            {getLevelIcon(level.level)}
                                            <div>
                                                <h3 className="font-semibold text-lg">{level.display_name}</h3>
                                                <p className="text-sm opacity-75">Level {level.level}</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-white/50 rounded-full text-sm font-medium">
                                            {level.user_count} {level.user_count === 1 ? 'user' : 'users'}
                                        </span>
                                    </div>
                                </div>

                                {/* Users List */}
                                {expandedLevels.has(level.level) && level.users.length > 0 && (
                                    <div className="bg-white border-t">
                                        <div className="divide-y">
                                            {level.users.map((user) => (
                                                <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium">{user.full_name || user.email}</p>
                                                                {user.is_company_owner && (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded text-xs font-medium">
                                                                        <Crown className="h-3 w-3" />
                                                                        Owner
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-500">{user.email}</p>
                                                        </div>
                                                        <span className="px-2 py-1 border border-gray-300 rounded text-xs font-medium capitalize">
                                                            {user.role.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Empty State */}
                                {expandedLevels.has(level.level) && level.users.length === 0 && (
                                    <div className="bg-gray-50 p-8 text-center text-gray-500">
                                        No users at this level
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {hierarchy.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p>No hierarchy data available</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="text-blue-900">Hierarchy Levels Explained</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-900 space-y-2">
                    <div className="flex items-start gap-2">
                        <Crown className="h-4 w-4 mt-0.5 text-purple-600" />
                        <div>
                            <strong>Level 1 - Website Super Admin:</strong> Full system access, manages all companies
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 mt-0.5 text-blue-600" />
                        <div>
                            <strong>Level 2 - Company Owner:</strong> Full access to their company
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <UserCog className="h-4 w-4 mt-0.5 text-green-600" />
                        <div>
                            <strong>Level 3 - Company Super Admin:</strong> Manages users and settings
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 mt-0.5 text-yellow-600" />
                        <div>
                            <strong>Level 4 - Company Admin:</strong> Reviews reports and manages data
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <User className="h-4 w-4 mt-0.5 text-gray-600" />
                        <div>
                            <strong>Level 5 - Auditor/Accountant:</strong> Submits and views own reports
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
