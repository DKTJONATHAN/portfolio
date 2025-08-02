import { useEffect, useState } from "react";

export default function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch("/api/list-posts")
      .then(res => res.json())
      .then(data => setPosts(data.data || []));
  }, []);

  return (
    <div>
      <h1>News</h1>
      <ul>
        {posts.map(post => (
          <li key={post.slug}>
            <a href={`/articles/${post.slug}`}>{post.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}