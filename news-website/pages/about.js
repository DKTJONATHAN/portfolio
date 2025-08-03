// pages/about.js
import Head from 'next/head';
import Header from '../components/Header';
import styles from '../styles/Article.module.css';

export default function About() {
  return (
    <div className={styles.container}>
      <Head>
        <title>About | Jonathan Mwaniki Reports</title>
        <meta name="description" content="Learn more about Jonathan Mwaniki News and our mission to deliver quality journalism." />
      </Head>

      <Header />

      <main className={styles.main}>
        <article className={styles.article}>
          <div className={styles.articleHeader}>
            <h1>About Jonathan Mwaniki News</h1>
          </div>

          <div className={styles.content}>
            <p>
              Jonathan Mwaniki News is dedicated to providing accurate, timely, and comprehensive news coverage across various categories including News, Business, Sports, Tech, and Entertainment.
            </p>
            <p>
              Our mission is to deliver high-quality journalism that informs, educates, and engages our readers. We strive to maintain the highest standards of integrity and objectivity in our reporting.
            </p>
            <p>
              Founded in 2025, we aim to be your trusted source for breaking news, in-depth analysis, and thought-provoking opinions from around the world.
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}