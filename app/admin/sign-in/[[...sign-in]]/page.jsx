import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import SignInClient from './SignInClient';

export const metadata = {
    title: 'Connexion Admin — Trouvable',
    robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminSignInPage() {
    const { userId } = await auth();
    /* Déjà connecté : Clerk ne remonte plus le formulaire → évite la carte « vide » */
    if (userId) {
        redirect('/admin/dashboard');
    }

    return (
        <div className="admin-sign-in-page min-h-dvh bg-[#050505] flex flex-col relative overflow-x-hidden">
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(91,115,255,0.08),transparent_70%)]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(147,51,234,0.06),transparent_70%)]" />
            </div>

            <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8 w-full min-h-0">
                {/* Un seul « carré » : marque Trouvable + formulaire Clerk */}
                <div className="w-full max-w-[420px] min-w-0 rounded-2xl border border-white/[0.1] bg-[#0a0a0a] shadow-[0_24px_80px_rgba(0,0,0,0.55)] px-6 pt-7 pb-6 sm:px-7">
                    <div className="mb-6 flex flex-col items-center text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-3 rounded-xl outline-none transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#5b73ff]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
                            aria-label="Trouvable — Retour au site public"
                        >
                            <img
                                src="/logos/trouvable_logo_blanc1.png"
                                alt=""
                                width={40}
                                height={40}
                                className="h-10 w-10 shrink-0 object-contain"
                            />
                            <span className="text-[1.35rem] font-bold leading-none tracking-[-0.03em] text-white">
                                Trouvable
                            </span>
                        </Link>
                    </div>
                    <div className="w-full min-w-0">
                        <Suspense
                            fallback={
                                <div
                                    className="w-full min-h-[280px] rounded-xl bg-white/[0.03] animate-pulse"
                                    aria-hidden
                                />
                            }
                        >
                            <SignInClient />
                        </Suspense>
                    </div>
                </div>
            </main>

            <footer className="relative z-10 shrink-0 px-4 pb-8 pt-2 text-center text-[12px] leading-relaxed text-zinc-400 md:text-[13px]">
                Plateforme sécurisée — Accès réservé aux administrateurs
            </footer>
        </div>
    );
}
