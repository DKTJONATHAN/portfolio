import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/posts');
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setPosts(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="container">
      <Head>
        <title>Jonathan Mwaniki Reports</title>
        <meta name="description" content="Latest news and reports" />
      </Head>

      <header>
        <h1>Jonathan Mwaniki Reports</h1>
      </header>

      <main>
        {loading && <p>Loading posts...</p>}
        {error && <p>Error: {error}</p>}

        <div className="posts-grid">
          {posts.map(post => (
            <article key={post.slug} className="post-card">
              <h2>
                <Link href={`/articles/${post.slug}`}>
                  <a>{post.title}</a>
                </Link>
              </h2>
              <p className="category">{post.category}</p>
              <p className="date">{new Date(post.date).toLocaleDateString()}</p>
            </article>
          ))}
        </div>
      </main>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .posts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }
        .post-card {
          border: 1px solid #ddd;
          padding: 20px;
          border-radius: 8px;
        }
        .post-card h2 {
          margin-top: 0;
        }
        .category {
          color: #666;
          font-weight: bold;
        }
        .date {
          color: #999;
          font-size: 0.9em;
        }
      `}</style>
    </div>
  );
}