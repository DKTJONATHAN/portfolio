import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ArticleCard from '../components/ArticleCard';
import CategoryFilter from '../components/CategoryFilter';
import SearchBar from '../components/SearchBar';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/posts');
        const { data, categories } = await response.json();
        setPosts(data);
        setFilteredPosts(data);
        setCategories(categories);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    let results = posts;
    
    // Apply category filter
    if (activeCategory) {
      results = results.filter(post => post.category === activeCategory);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(post => 
        post.title.toLowerCase().includes(query) || 
        post.excerpt.toLowerCase().includes(query)
      );
    }
    
    setFilteredPosts(results);
  }, [activeCategory, searchQuery, posts]);

  return (
    <Layout
      meta={{
        title: "Latest News and Reports",
        description: "Stay updated with the latest news, breaking stories, and in-depth reports from Jonathan Mwaniki",
        url: "https://jonathanmwaniki.co.ke",
        image: "/images/Jonathan-Mwaniki-logo.png"
      }}
    >
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-6">Jonathan Mwaniki Reports</h1>
        <p className="text-xl mb-8">Your trusted source for breaking news and in-depth reporting</p>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <SearchBar onSearch={setSearchQuery} />
          <CategoryFilter 
            categories={categories} 
            activeCategory={activeCategory}
            onChange={setActiveCategory}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map(post => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      {!loading && filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold">No articles found</h2>
          <p className="mt-2">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </Layout>
  );
}