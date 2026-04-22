'use client';

import dynamic from 'next/dynamic';

const ZipView = dynamic(() => import('@/components/zip-pages/geo/llms-txt'), {
    ssr: false,
    loading: () => <div className="min-h-[60vh] bg-[#06070a]" />,
});

export default function GeoLlmsTxtView() {
    return <ZipView />;
}
