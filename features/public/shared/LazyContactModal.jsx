"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const ContactModal = dynamic(() => import('@/features/public/shared/ContactModal'), {
    ssr: false,
});

export default function LazyContactModal() {
    const [shouldMount, setShouldMount] = useState(false);

    useEffect(() => {
        const onOpen = () => setShouldMount(true);
        window.addEventListener('openContactModal', onOpen);

        // Charge la modale hors chemin critique pour réduire le TBT initial.
        const idle = window.setTimeout(() => setShouldMount(true), 2500);

        return () => {
            window.removeEventListener('openContactModal', onOpen);
            window.clearTimeout(idle);
        };
    }, []);

    return shouldMount ? <ContactModal /> : null;
}
