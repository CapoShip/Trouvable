'use client';

import { useTransition } from 'react';
import { togglePublishAction } from './actions';

export default function PublishToggle({ id, isPublished }) {
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        startTransition(async () => {
            await togglePublishAction(id, isPublished);
        });
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${isPublished
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {isPending ? '...' : isPublished ? 'Publié' : 'Brouillon'}
        </button>
    );
}
