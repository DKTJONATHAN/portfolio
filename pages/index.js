import { useEffect, useState } from "react";
import Header from "../components/Header";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const categories = ["All", "News", "Business", "Entertainment", "Tech", "Sports", "Opinions"];
  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(search.toLowerCase()) &&
    (category === "All" || post.category === category)
  );

  return (
    <div>
      <Header />
      <div style={{ padding: "10px" }}>
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px", margin: "10px 0", width: "100%", maxWidth: "300px" }}
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{ padding: "8px", margin: "10px 0", width: "100%", maxWidth: "200px" }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <div style={{ margin: "10px 0" }}>
          {categories.slice(1).map(cat => (
            <a
              key={cat}
              href={`/category/${cat}`}
              style={{ margin: "0 10px", color: "#007bff", textDecoration: "none" }}
            >
              {cat}
            </a>
          ))}
        </div>
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
                  <h2 style={{ margin: "0", fontSize: "18px" }}>{post.title}</h2>
                  <p style={{ color: "#666", fontSize: "14px", margin: "5px 0" }}>
                    {post.description} ({post.category}, {post.date})
                  </p>
                </a>
              </li>
            ))
          ) : (
            !loading && <li>No articles found</li>
          )}
        </ul>
      </div>
    </div>
  );
}