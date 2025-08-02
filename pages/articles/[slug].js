import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Head from 'next/head';

export default function ArticlePage() {
  const router = useRouter();
  const { slug } = router.query;

  useEffect(() => {
    if (slug) {
      // Redirect to the HTML version
      window.location.href = `/articles/${slug}.html`;
    }
  }, [slug]);

  return (
    <div className="container">
      <Head>
        <title>Loading Article... | Jonathan Mwaniki Reports</title>
      </Head>
      <main>
        <h1>Loading article...</h1>
        <p>If you are not redirected automatically, <a href={`/articles/${slug}.html`}>click here</a>.</p>
      </main>
      
      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
          margin-top: 50px;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 20px;
        }
        a {
          color: #0066cc;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}