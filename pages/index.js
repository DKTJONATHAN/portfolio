import Header from "../components/Header";

export default function Home() {
  return (
    <>
      <Head>
        <title>Jonathan Mwaniki News</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
      </Head>
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
          <span className="search-icon" style={{ cursor: "pointer", marginLeft: "10px" }}>
            <i className="fas fa-search"></i>
          </span>
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
        <a href="/"><i className="fas fa-home"></i></a>
        <a href="/category/News"><i className="fas fa-newspaper"></i></a>
        <a href="/category/Business"><i className="fas fa-briefcase"></i></a>
        <a href="/category/Tech"><i className="fas fa-laptop"></i></a>
        <a href="/category/Sports"><i className="fas fa-futbol"></i></a>
        <a href="/category/Entertainment"><i className="fas fa-film"></i></a>
        <a href="/category/Opinions"><i className="fas fa-comment"></i></a>
      </nav>
      <script src="/news-script.js" />
    </>
  );
}

import { Head } from "next/document";