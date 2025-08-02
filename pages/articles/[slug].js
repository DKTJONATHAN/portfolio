import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';

export default function ArticlePage() {
  const router = useRouter();
  const { slug } = router.query;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState([]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch('/api/posts');
        const { data } = await response.json();
        const foundPost = data.find(p => p.slug === slug);
        
        if (!foundPost) {
          router.push('/404');
          return;
        }
        
        setPost(foundPost);
        
        // Get related posts (same category)
        setRelatedPosts(
          data
            .filter(p => p.category === foundPost.category && p.slug !== slug)
            .slice(0, 3)
        );
      } catch (err) {
        console.error('Error fetching post:', err);
        router.push('/404');
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchPost();
  }, [slug]);

  if (loading) return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-gray-100 rounded-lg h-96 animate-pulse"></div>
      </div>
    </Layout>
  );

  return (
    <Layout
      meta={{
        title: post.title,
        description: post.excerpt,
        url: `https://jonathanmwaniki.co.ke/articles/${post.slug}`,
        image: post.image || "/images/Jonathan-Mwaniki-logo.png",
        type: "article"
      }}
    >
      <article className="max-w-4xl mx-auto">
        <header className="mb-12">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
            {post.category}
          </span>
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center text-gray-600">
            <span>Published: {new Date(post.date).toLocaleDateString()}</span>
            <span className="mx-2">•</span>
            <span>{post.readingTime || '5 min'} read</span>
          </div>
        </header>

        <div className="prose lg:prose-xl max-w-none">
          {/* Your article content would be rendered here */}
          <p className="text-xl mb-6">{post.excerpt}</p>
          
          {/* Example content section */}
          <p>This is where your full article content would appear. In a real implementation, you would parse and render Markdown or HTML content from your GitHub repository.</p>
          
          <h2>Detailed Analysis</h2>
          <p>More in-depth reporting and analysis would appear in this section of the article.</p>
        </div>

        {relatedPosts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">More in {post.category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map(post => (
                <ArticleCard key={post.slug} post={post} compact />
              ))}
            </div>
          </section>
        )}
      </article>
    </Layout>
  );
}