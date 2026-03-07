export const metadata = {
    title: 'Admin - Connexion',
    robots: { index: false, follow: false }
};

export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen bg-[#080808] text-[#f0f0f0] flex flex-col justify-center items-center p-6">
            <div className="w-full max-w-md">
                {children}
            </div>
        </div>
    );
}
