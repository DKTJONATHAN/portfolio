import Header from "../../components/Header";

export default function Article({ content, title }) {
  return (
    <>
      <Header />
      <link rel="stylesheet" href="/styles.css" />
      <div className="container">
        <h1>{title}</h1>
        <div dangerouslySetInnerHTML={{ __html: content }} />
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
    </>
  );
}

export async function getStaticPaths() {
  return {
    paths: [
      { params: { slug: "sample-news" } },
      { params: { slug: "sample-tech" } },
      { params: { slug: "sample-sports" } },
    ],
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const posts = [
    { slug: "sample-news", title: "Sample News Article", content: "<p>This is a sample news article content.</p>" },
    { slug: "sample-tech", title: "Sample Tech Article", content: "<p>This is a sample tech article content.</p>" },
    { slug: "sample-sports", title: "Sample Sports Article", content: "<p>This is a sample sports article content.</p>" },
  ];
  const post = posts.find(p => p.slug === params.slug);
  return {
    props: {
      content: post ? post.content : "<p>Article Not Found</p>",
      title: post ? post.title : "Article",
    },
  };
}