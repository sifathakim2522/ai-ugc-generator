import { useAuth } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isSignedIn, isLoaded } = useAuth();
    const location = useLocation();

    // Show loading state while Clerk is initializing
    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to sign-in if not authenticated, preserving the intended destination
    if (!isSignedIn) {
        return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />;
    }

    return <>{children}</>;
}
