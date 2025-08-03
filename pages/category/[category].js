import Header from "../../components/Header";

export default function CategoryPage({ category }) {
  return (
    <>
      <Head>
        <title>{category} - Jonathan Mwaniki News</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
      </Head>
      <Header />
      <link rel="stylesheet" href="/styles.css" />
      <div className="container">
        <h2>{category} Articles</h2>
        <div className="posts" />
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