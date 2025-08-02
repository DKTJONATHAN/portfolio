import { useEffect, useState } from "react";
import Header from "../../components/Header";

export default function CategoryPage({ category }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/list-posts-temp")
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
          setPosts([]);
        } else {
          setPosts(data.data || []);
          setError(null);
        }
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch articles");
        setPosts([]);
        setLoading(false);
        console.error("Fetch error:", err);
      });
  }, []);

  const filteredPosts = posts.filter(post => post.category === category);

  return (
    <div>
      <Header />
      <div style={{ padding: "10px" }}>
        <h2 style={{ margin: "10px 0", fontSize: "20px" }}>{category} Articles</h2>
        {loading && (
          <p style={{ color: "#666", fontSize: "14px", margin: "10px 0" }}>
            Loading articles...
          </p>
        )}
        {error && (
          <p style={{ color: "red", fontSize: "14px", margin: "10px 0" }}>
            Error: {error}
          </p>
        )}
        <ul>
          {filteredPosts.length > 0 ? (
            filteredPosts.map(post => (
              <li key={post.slug} style={{ margin: "15px 0" }}>
                <a href={`/articles/${post.slug}`} style={{ color: "#007bff" }}>
                  <h3 style={{ margin: "0", fontSize: "18px" }}>{post.title}</h3>
                  <p style={{ color: "#666", fontSize: "14px", margin: "5px 0" }}>
                    {post.description} ({post.date})
                  </p>
                </a>
              </li>
            ))
          ) : (
            !loading && <li>No articles found for this category</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export async function getStaticPaths() {
  return {
    paths: [
      { params: { category: "News" } },
      { params: { category: "Business" } },
      { params: { category: "Entertainment" } },
      { params: { category: "Tech" } },
      { params: { category: "Sports" } },
      { params: { category: "Opinions" } },
    ],
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  return {
    props: {
      category: params.category,
    },
  };
}