export default function sitemap() {
    return [
        {
            url: 'https://trouvable.ca',
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        // Si d'autres pages (comme par exemple un blog) s'ajoutent à l'avenir, elles viendront se greffer ici.
    ]
}
