import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { registerTokenGetter } from '../lib/api';

/**
 * Registers the Clerk session token getter with the API client.
 * Must be rendered inside ClerkProvider.
 */
export default function TokenProvider({ children }: { children: React.ReactNode }) {
    const { getToken } = useAuth();

    useEffect(() => {
        registerTokenGetter(async (forceRefresh = false) => {
            try {
                return await getToken({ skipCache: forceRefresh });
            } catch {
                return null;
            }
        });
    }, [getToken]);

    return <>{children}</>;
}
