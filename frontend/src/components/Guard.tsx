import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasRole } from '../lib/permissions';

interface GuardProps {
    roles?: string[];
}

export function Guard({ roles }: GuardProps) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !hasRole(user.role, roles)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
