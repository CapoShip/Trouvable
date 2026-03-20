import { SignIn } from '@clerk/nextjs';

export const metadata = {
    title: 'Connexion Admin — Trouvable',
    robots: { index: false, follow: false },
};

export default function AdminSignInPage() {
    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(91,115,255,0.08),transparent_70%)]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(147,51,234,0.06),transparent_70%)]" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
                <div className="flex items-center gap-3 mb-8">
                    <img
                        src="/logos/trouvable_logo_blanc.png"
                        alt="Trouvable"
                        className="w-9 h-9 object-contain"
                    />
                    <span className="text-xl font-bold tracking-[-0.03em] text-white">
                        Trouvable
                    </span>
                </div>

                <SignIn
                    afterSignInUrl="/admin/dashboard"
                    appearance={{
                        elements: {
                            rootBox: 'w-full max-w-[420px]',
                            card: 'bg-[#0a0a0a] border border-white/[0.08] shadow-[0_24px_80px_rgba(0,0,0,0.6)] rounded-2xl',
                            headerTitle: 'text-white font-bold',
                            headerSubtitle: 'text-white/40',
                            formFieldLabel: 'text-white/50 font-medium',
                            formFieldInput: 'bg-[#141414] border-white/[0.08] text-white rounded-xl focus:ring-[#5b73ff] focus:border-[#5b73ff]/50',
                            formButtonPrimary: 'bg-[#5b73ff] hover:bg-[#4a62ee] text-white font-semibold rounded-xl shadow-[0_4px_12px_rgba(91,115,255,0.25)]',
                            footerActionLink: 'text-[#5b73ff] hover:text-[#7b93ff]',
                            identityPreviewEditButton: 'text-[#5b73ff]',
                            formFieldInputShowPasswordButton: 'text-white/30 hover:text-white/60',
                            dividerLine: 'bg-white/[0.06]',
                            dividerText: 'text-white/25',
                            socialButtonsBlockButton: 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-white/70',
                            socialButtonsBlockButtonText: 'text-white/70 font-medium',
                            footer: 'hidden',
                        },
                    }}
                />

                <p className="mt-8 text-[11px] text-white/20 tracking-wide">
                    Plateforme sécurisée — Accès réservé aux administrateurs
                </p>
            </div>
        </div>
    );
}
