import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

import '../../admin/sign-in/signin.css';
import EspaceSignInClient from './EspaceSignInClient';

export const dynamic = 'force-dynamic';

export default async function EspaceSignInPage() {
    const { userId } = await auth();
    if (userId) {
        redirect('/espace/apres-connexion');
    }

    return (
        <div className="admin-sign-in-page relative flex min-h-dvh flex-col overflow-x-hidden bg-[#050505]">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div className="absolute left-[-10%] top-[-20%] h-[500px] w-[500px] bg-[radial-gradient(circle,rgba(91,115,255,0.08),transparent_70%)]" />
                <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] bg-[radial-gradient(circle,rgba(147,51,234,0.06),transparent_70%)]" />
            </div>

            <main className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-center px-4 py-8">
                <div className="w-full min-w-0 max-w-[420px] rounded-2xl border border-white/[0.1] bg-[#0a0a0a] px-6 pb-6 pt-7 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:px-7">
                    <div className="mb-6 flex flex-col items-center text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-3 rounded-xl outline-none transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#5b73ff]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
                            aria-label="Trouvable — Retour au site public"
                        >
                            <Image
                                src="/logos/trouvable_logo_blanc1.png"
                                alt=""
                                width={40}
                                height={40}
                                sizes="40px"
                                className="h-10 w-10 shrink-0 object-contain"
                            />
                            <span className="text-[1.35rem] font-bold leading-none tracking-[-0.03em] text-white">
                                Trouvable
                            </span>
                        </Link>
                        <p className="mt-4 text-sm text-zinc-400">
                            Espace client : connexion unique. Vous serez redirigé vers l&apos;admin ou le portail selon votre courriel.
                        </p>
                    </div>

                    <div className="w-full min-w-0">
                        <Suspense
                            fallback={
                                <div
                                    className="min-h-[280px] w-full animate-pulse rounded-xl bg-white/[0.03]"
                                    aria-hidden
                                />
                            }
                        >
                            <EspaceSignInClient />
                        </Suspense>
                    </div>
                </div>
            </main>

            <footer className="relative z-10 shrink-0 px-4 pb-8 pt-2 text-center text-[12px] leading-relaxed text-zinc-400 md:text-[13px]">
                Connexion sécurisée (Clerk).
            </footer>
        </div>
    );
}
