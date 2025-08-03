import { useState, useEffect } from 'react';
import Head from 'next/head';
import NewsCard from '../components/NewsCard';
import CategoryFilter from '../components/CategoryFilter';
import Header from '../components/Header';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = ['All', 'News', 'Breaking News', 'Opinions', 'Business', 'Sports', 'Tech', 'Entertainment'];

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredPosts(posts);
    } else {
      setFilteredPosts(posts.filter(post => post.category === selectedCategory));
    }
  }, [posts, selectedCategory]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/list-posts');
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setPosts(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Loading... | Jonathan Mwaniki News</title>
        </Head>
        <Header />
        <div className={styles.loading}>Loading articles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Error | Jonathan Mwaniki News</title>
        </Head>
        <Header />
        <div className={styles.error}>Error loading articles: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Jonathan Mwaniki News | Latest News & Updates</title>
        <meta name="description" content="Stay updated with the latest news, opinions, business, sports, tech, and entertainment stories." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1>Latest News & Updates</h1>
          <p>Stay informed with our comprehensive coverage of current events</p>
        </div>

        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />

        <div className={styles.stats}>
          <p>
            Showing {filteredPosts.length} {selectedCategory !== 'All' ? selectedCategory.toLowerCase() : ''} articles
          </p>
        </div>

        <div className={styles.grid}>
          {filteredPosts.map((post) => (
            <NewsCard key={post.slug} post={post} />
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className={styles.noResults}>
            <h3>No articles found</h3>
            <p>No articles available in the {selectedCategory} category.</p>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2025 Jonathan Mwaniki News. All rights reserved.</p>
      </footer>
    </div>
  );
}