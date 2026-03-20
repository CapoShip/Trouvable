'use client';

import { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const RESERVED_SLUGS = ['new'];

const GeoClientContext = createContext(null);

export function useGeoClient() {
    const ctx = useContext(GeoClientContext);
    return ctx;
}

function getInitials(name) {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
    }
    return name.slice(0, 2).toUpperCase();
}

const GeoFilterContext = createContext(null);

export function useGeoFilters() {
    return useContext(GeoFilterContext);
}

export function GeoClientProvider({ children, clients: initialClients = [], filters }) {
    const pathname = usePathname();
    const router = useRouter();
    const clientId = useMemo(() => {
        const m = pathname?.match(/\/admin\/dashboard\/([^/]+)/);
        const id = m ? m[1] : null;
        if (id && RESERVED_SLUGS.includes(id)) return null;
        return id;
    }, [pathname]);

    const isNewClientPage = useMemo(() => {
        return pathname?.includes('/admin/dashboard/new');
    }, [pathname]);

    const [client, setClient] = useState(null);
    const [audit, setAudit] = useState(null);
    const [clients, setClients] = useState(initialClients);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadClient = useCallback(async (id) => {
        if (!id) {
            setClient(null);
            setAudit(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/geo/client/${id}`);
            if (!res.ok) throw new Error('Client non trouvé');
            const data = await res.json();
            setClient(data.client || null);
            setAudit(data.audit || null);
        } catch (err) {
            setError(err.message);
            setClient(null);
            setAudit(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadClient(clientId);
    }, [clientId, loadClient]);

    const loadClients = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/geo/clients');
            if (!res.ok) {
                console.error('[GeoClient] Failed to load clients:', res.status, res.statusText);
                return;
            }
            const data = await res.json();
            setClients(data.clients || []);
        } catch (err) {
            console.error('[GeoClient] Error loading clients:', err);
        }
    }, []);

    useEffect(() => {
        loadClients();
    }, [loadClients]);

    const switchClient = useCallback((id) => {
        if (id) router.push(`/admin/dashboard/${id}`);
    }, [router]);

    const value = useMemo(() => ({
        client,
        audit,
        clients,
        clientId,
        loading,
        error,
        isNewClientPage,
        switchClient,
        refetch: () => loadClient(clientId),
        getInitials: (name) => getInitials(name || client?.client_name),
    }), [client, audit, clients, clientId, loading, error, isNewClientPage, switchClient, loadClient]);

    return (
        <GeoClientContext.Provider value={value}>
            <GeoFilterContext.Provider value={filters}>
                {children}
            </GeoFilterContext.Provider>
        </GeoClientContext.Provider>
    );
}
