import Header from "../components/Header";

export default function Home() {
  return (
    <>
      <Header />
      <link rel="stylesheet" href="/styles.css" />
      <div className="container">
        <div style={{ margin: "20px 0" }}>
          <input
            type="text"
            placeholder="Search articles..."
            className="search-input"
            style={{ padding: "8px", width: "100%", maxWidth: "300px" }}
          />
          <span className="search-icon" style={{ cursor: "pointer", marginLeft: "10px" }}>🔍</span>
          <select className="category-select" style={{ padding: "8px", margin: "10px 0", width: "100%", maxWidth: "200px" }}>
            <option value="All">All</option>
            <option value="News">News</option>
            <option value="Business">Business</option>
            <option value="Tech">Tech</option>
            <option value="Sports">Sports</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Opinions">Opinions</option>
          </select>
        </div>
        <div className="posts" />
        <div className="search-overlay">
          <input type="text" className="search-input" placeholder="Search articles..." />
          <div className="search-results" />
        </div>
      </div>
      <nav className="bottom-nav">
        <a href="/">🏠</a>
        <a href="/category/News">📰</a>
        <a href="/category/Business">💼</a>
        <a href="/category/Tech">💻</a>
        <a href="/category/Sports">⚽</a>
        <a href="/category/Entertainment">🎬</a>
        <a href="/category/Opinions">💭</a>
      </nav>
      <script src="/news-script.js" />
    </>
  );
}