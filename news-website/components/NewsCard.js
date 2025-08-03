import Link from 'next/link';
import styles from '../styles/NewsCard.module.css';

export default function NewsCard({ post }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={styles.card}>
      <Link href={`/articles/${post.slug}`}>
        <div className={styles.imageContainer}>
          {post.image && (
            <img 
              src={post.image} 
              alt={post.title}
              onError={(e) => {
                e.target.src = '/placeholder-image.jpg';
              }}
            />
          )}
          <div className={styles.category}>{post.category}</div>
        </div>
        
        <div className={styles.content}>
          <h3 className={styles.title}>{post.title}</h3>
          <p className={styles.description}>{post.description}</p>
          
          <div className={styles.meta}>
            <time className={styles.date}>{formatDate(post.date)}</time>
            <div className={styles.tags}>
              {post.tags.split(',').slice(0, 3).map((tag, index) => (
                <span key={index} className={styles.tag}>
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}