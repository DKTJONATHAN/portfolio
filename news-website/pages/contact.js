// pages/contact.js
import Head from 'next/head';
import Header from '../components/Header';
import styles from '../styles/Article.module.css';

export default function Contact() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Contact | Jonathan Mwaniki Reports</title>
        <meta name="description" content="Get in touch with Jonathan Mwaniki News for inquiries, feedback, or story tips." />
      </Head>

      <Header />

      <main className={styles.main}>
        <article className={styles.article}>
          <div className={styles.articleHeader}>
            <h1>Contact Us</h1>
          </div>

          <div className={styles.content}>
            <p>
              We'd love to hear from you! Whether you have questions, feedback, or story tips, please reach out to us.
            </p>
            <p>
              Email: <a href="mailto:info@jonathanmwaniki.co.ke">info@jonathanmwaniki.co.ke</a>
            </p>
            <p>
              Follow us on social media:
            </p>
            <ul>
              <li><a href="https://x.com/jmwanikinews">X</a></li>
              <li><a href="https://facebook.com/jmwanikinews">Facebook</a></li>
              <li><a href="https://instagram.com/jmwanikinews">Instagram</a></li>
            </ul>
          </div>
        </article>
      </main>
    </div>
  );
}