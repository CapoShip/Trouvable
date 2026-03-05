import LoginForm from './LoginForm';

export const metadata = {
    title: 'Connexion Admin - Trouvable',
    robots: { index: false, follow: false }
};

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md flex flex-col items-center relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-ea580c to-db2777" />

                <div className="w-20 h-20 bg-gradient-to-br from-ea580c to-db2777 rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3">
                    <span className="text-white font-black text-4xl -rotate-3">T</span>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">Accès Sécurisé</h1>
                <p className="text-slate-500 mb-8 text-center text-sm leading-relaxed">
                    Veuillez saisir votre mot de passe pour accéder <br />
                    au back-office de Trouvable.
                </p>

                <LoginForm />

                <div className="mt-8 text-xs text-slate-400 font-medium">
                    Protection avancée active (HttpOnly)
                </div>
            </div>
        </div>
    );
}
