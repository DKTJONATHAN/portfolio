import Header from "../../components/Header";

export default function CategoryPage({ category }) {
  return (
    <>
      <Header />
      <link rel="stylesheet" href="/styles.css" />
      <div className="container">
        <h2>{category} Articles</h2>
        <div className="posts" />
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