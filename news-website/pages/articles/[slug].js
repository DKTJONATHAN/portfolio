import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../../components/Header';
import styles from '../../styles/Article.module.css';

export default function Article() {
  const router = useRouter();
  const { slug } = router.query;
  const [article, setArticle] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      
      // First get the article metadata
      const postsResponse = await fetch('/api/list-posts');
      const postsResult = await postsResponse.json();
      
      if (postsResult.error) {
        throw new Error(postsResult.error);
      }
      
      const foundArticle = postsResult.data.find(post => post.slug === slug);
      if (!foundArticle) {
        throw new Error('Article not found');
      }
      
      setArticle(foundArticle);
      
      // Then fetch the HTML content
      const contentResponse = await fetch(`/api/article-content?slug=${slug}`);
      const contentResult = await contentResponse.json();
      
      if (contentResult.error) {
        throw new Error(contentResult.error);
      }
      
      setContent(contentResult.content);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.loading}>Loading article...</div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.error}>
          <h2>Article not found</h2>
          <p>{error || 'The requested article could not be found.'}</p>
          <button onClick={() => router.push('/')} className={styles.backButton}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>{article.title} | Jonathan Mwaniki News</title>
        <meta name="description" content={article.description} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.description} />
        <meta property="og:image" content={article.image} />
        <meta property="og:type" content="article" />
      </Head>

      <Header />

      <main className={styles.main}>
        <article className={styles.article}>
          <div className={styles.articleHeader}>
            <div className={styles.category}>{article.category}</div>
            <h1>{article.title}</h1>
            <p className={styles.description}>{article.description}</p>
            <div className={styles.meta}>
              <time dateTime={article.date}>
                {new Date(article.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
              <div className={styles.tags}>
                {article.tags.split(',').map((tag, index) => (
                  <span key={index} className={styles.tag}>{tag.trim()}</span>
                ))}
              </div>
            </div>
          </div>

          {article.image && (
            <div className={styles.imageContainer}>
              <img src={article.image} alt={article.title} />
            </div>
          )}

          <div 
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </article>

        <div className={styles.navigation}>
          <button onClick={() => router.push('/')} className={styles.backButton}>
            ← Back to All Articles
          </button>
        </div>
      </main>
    </div>
  );
}