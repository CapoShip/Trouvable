import LoginForm from './LoginForm';

export const metadata = {
    title: 'Connexion Admin - Trouvable',
    robots: { index: false, follow: false }
};

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center p-4">
            <div className="bg-[#0f0f0f] p-10 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.7)] border border-white/10 w-full max-w-md flex flex-col items-center relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#5b73ff] to-[#9333ea]" />

                <div className="w-20 h-20 bg-gradient-to-br from-[#5b73ff] to-[#9333ea] rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3">
                    <span className="text-white font-black text-4xl -rotate-3">T</span>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Accès Sécurisé</h1>
                <p className="text-[#a0a0a0] mb-8 text-center text-sm leading-relaxed">
                    Veuillez saisir votre mot de passe pour accéder <br />
                    au back-office de Trouvable.
                </p>

                <LoginForm />

                <div className="mt-8 text-xs text-white/25 font-medium">
                    Protection avancée active (HttpOnly)
                </div>
            </div>
        </div>
    );
}
