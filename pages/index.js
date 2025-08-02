import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

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
    <Layout>
      <div className="content">
        {loading && <p className="loading">Loading posts...</p>}
        {error && <p className="error">Error: {error}</p>}

        <div className="posts-grid">
          {posts.map(post => (
            <article key={post.slug} className="post-card">
              <h2>
                <a href={`/articles/${post.slug}`}>{post.title}</a>
              </h2>
              <p className="category">{post.category}</p>
              <p className="date">{new Date(post.date).toLocaleDateString()}</p>
            </article>
          ))}
        </div>
      </div>

      <style jsx>{`
        .content {
          padding: 20px 0;
        }
        .loading, .error {
          text-align: center;
          padding: 20px;
        }
        .error {
          color: #d32f2f;
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
          transition: transform 0.2s;
        }
        .post-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .post-card h2 {
          margin-top: 0;
          margin-bottom: 10px;
        }
        .post-card h2 a {
          color: #333;
          text-decoration: none;
        }
        .post-card h2 a:hover {
          color: #0066cc;
          text-decoration: underline;
        }
        .category {
          color: #666;
          font-weight: bold;
          margin: 5px 0;
        }
        .date {
          color: #999;
          font-size: 0.9em;
          margin: 5px 0 0;
        }
      `}</style>
    </Layout>
  );
}