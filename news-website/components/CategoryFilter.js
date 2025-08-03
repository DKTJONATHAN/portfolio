import styles from '../styles/CategoryFilter.module.css';

export default function CategoryFilter({ categories, selectedCategory, onCategoryChange }) {
  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        {categories.map((category) => (
          <button
            key={category}
            className={`${styles.filterButton} ${selectedCategory === category ? styles.active : ''}`}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}