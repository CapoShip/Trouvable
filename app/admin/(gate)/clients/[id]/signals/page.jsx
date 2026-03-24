'use client';

import { Suspense } from 'react';

import GeoSignalsView from '../../../views/GeoSignalsView';

export default function ClientSignalsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-white/40 text-sm">Chargement des signaux…</div>}>
            <GeoSignalsView />
        </Suspense>
    );
}
