'use client';

import { useTransition, useState } from 'react';
import { togglePublishAction } from './actions';
import Toast from '../components/Toast';

export default function PublishToggle({ id, isPublished }) {
    const [isPending, startTransition] = useTransition();
    const [toast, setToast] = useState(null);

    const handleToggle = () => {
        startTransition(async () => {
            const result = await togglePublishAction(id, isPublished);
            if (result?.error) {
                setToast({ message: result.error, type: 'error' });
            } else if (result?.success) {
                setToast({ message: `Profil ${!isPublished ? 'publié' : 'mis en brouillon'} !`, type: 'success' });
            }
        });
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={handleToggle}
                disabled={isPending}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${isPublished
                    ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/20'
                    : 'bg-white/[0.04] text-white/40 border-white/10 hover:bg-white/[0.08]'
                    } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isPending ? '...' : isPublished ? 'Publié' : 'Brouillon'}
            </button>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
