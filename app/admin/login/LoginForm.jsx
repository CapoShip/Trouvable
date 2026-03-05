'use client';

import { useActionState } from 'react';
import { loginAction } from '../actions';

export default function LoginForm() {
    const [state, formAction, isPending] = useActionState(loginAction, null);

    return (
        <form action={formAction} className="flex flex-col gap-5 w-full max-w-sm">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Mot de passe Administrateur
                </label>
                <input
                    type="password"
                    name="password"
                    required
                    autoFocus
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-ea580c focus:border-ea580c focus:bg-white outline-none transition-all shadow-sm"
                    placeholder="••••••••••••"
                />
            </div>

            {state?.error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                    {state.error}
                </div>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="w-full bg-slate-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md relative overflow-hidden group"
            >
                {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Connexion en cours...
                    </span>
                ) : (
                    'Accéder au Dashboard'
                )}
            </button>
        </form>
    );
}
