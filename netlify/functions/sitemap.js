exports.handler = async () => {
    try {
        // Fetch posts from list-posts endpoint
        const response = await fetch('https://www.jonathanmwaniki.co.ke/.netlify/functions/list-posts?t=' + Date.now());
        if (!response.ok) {
            throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
        }
        const { data: posts } = await response.json();

        // Define static pages
        const staticPages = [
            { url: 'https://www.jonathanmwaniki.co.ke/', lastmod: '2025-07-25', priority: '1.0' },
            { url: 'https://www.jonathanmwaniki.co.ke/blogs.html', lastmod: '2025-07-25', priority: '0.8' },
            { url: 'https://www.jonathanmwaniki.co.ke/privacy-policy', lastmod: '2025-07-25', priority: '0.5' },
            { url: 'https://www.jonathanmwaniki.co.ke/terms-of-service', lastmod: '2025-07-25', priority: '0.5' }
        ];

        // Generate post URLs
        const postUrls = posts.map(post => ({
            url: `https://www.jonathanmwaniki.co.ke/content/articles/${post.slug}.html`,
            lastmod: post.date.split('T')[0], // Use post date (e.g., 2025-07-20)
            priority: '0.7'
        }));

        // Combine static and post URLs
        const allUrls = [...staticPages, ...postUrls];

        // Generate sitemap XML
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${allUrls.map(page => `
    <url>
        <loc>${page.url}</loc>
        <lastmod>${page.lastmod}</lastmod>
        <priority>${page.priority}</priority>
        <changefreq>weekly</changefreq>
    </url>`).join('\n')}
</urlset>`;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=86400' // Cache for 1 day
            },
            body: sitemap
        };
    } catch (error) {
        console.error('Error generating sitemap:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate sitemap' })
        };
    }
};