import QaPageClient from './QaPageClient';

export const metadata = {
    title: 'Audit QA — Trouvable Internal',
    robots: { index: false, follow: false },
};

export default function QaPage() {
    return <QaPageClient />;
}
