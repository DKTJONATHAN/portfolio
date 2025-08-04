// api/fetch-posts.js

export default async function handler(req, res) {
    try {
        // Fetch articles.json from the static route
        const response = await fetch('https://jonathanmwaniki.co.ke/content/articles.json', {
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch articles.json: ${response.statusText}`);
        }

        const articles = await response.json();

        // Validate articles data
        if (!Array.isArray(articles)) {
            throw new Error('Invalid data format: articles is not an array');
        }

        // Extract query parameters
        const { page = 1, limit = 10, category, search, tag, sort = 'newest' } = req.query;

        // Filter articles
        let filteredArticles = articles;
        if (category) {
            filteredArticles = filteredArticles.filter(post => post.category === category);
        }
        if (search) {
            const searchLower = search.toLowerCase();
            filteredArticles = filteredArticles.filter(post =>
                (post.title && post.title.toLowerCase().includes(searchLower)) ||
                (post.description && post.description.toLowerCase().includes(searchLower)) ||
                (post.tags && post.tags.toLowerCase().includes(searchLower))
            );
        }
        if (tag) {
            filteredArticles = filteredArticles.filter(post => post.tags && post.tags.toLowerCase().includes(tag.toLowerCase()));
        }

        // Sort articles
        filteredArticles.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (isNaN(dateA) || isNaN(dateB)) {
                console.warn('Invalid date detected:', a.date, b.date);
                return 0;
            }
            return sort === 'newest' ? dateB - dateA : dateA - dateB;
        });

        // Paginate articles
        const postsPerPage = parseInt(limit);
        const totalPages = Math.ceil(filteredArticles.length / postsPerPage);
        const start = (parseInt(page) - 1) * postsPerPage;
        const paginatedArticles = filteredArticles.slice(start, start + postsPerPage);

        // Return response
        res.status(200).json({
            posts: paginatedArticles.map(post => ({
                slug: post.slug,
                title: post.title,
                description: post.description,
                image: post.image,
                date: post.date,
                category: post.category,
                tags: post.tags,
                url: `/articles/${post.slug}`
            })),
            totalPages
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: `Failed to fetch posts: ${error.message}` });
    }
}