import SeoHealthView from '../../../../views/SeoHealthView';

export const metadata = {
    title: 'Santé SEO',
    description: 'Lecture technique SEO du mandat: indexation, canonical, robots, schema et problèmes prioritaires.',
};

export default function ClientSeoHealthPage() {
    return <SeoHealthView />;
}
