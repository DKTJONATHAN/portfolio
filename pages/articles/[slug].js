import Header from "../../components/Header";

export default function Article({ content, title }) {
  return (
    <>
      <Head>
        <title>{title} - Jonathan Mwaniki News</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
      </Head>
      <Header />
      <link rel="stylesheet" href="/styles.css" />
      <div className="container">
        <h1>{title}</h1>
        <div dangerouslySetInnerHTML={{ __html: content }} />
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
    </>
  );
}

import { Head } from "next/document";

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