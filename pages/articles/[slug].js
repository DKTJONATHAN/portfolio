import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';

export default function ArticlePage() {
  const router = useRouter();
  const { slug } = router.query;
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!slug) return;

    // Start countdown
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    // Redirect after 5 seconds
    const redirectTimer = setTimeout(() => {
      window.location.href = `/articles/${slug}.html`;
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [slug]);

  return (
    <Layout>
      <div className="redirect-container">
        <h1>Taking you to the article...</h1>
        <div className="countdown">Redirecting in {countdown} seconds</div>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${(5 - countdown) * 20}%` }}></div>
        </div>
        <p className="manual-redirect">
          If you are not redirected automatically, <br />
          <a href={`/articles/${slug}.html`}>click here to view the article</a>
        </p>
      </div>

      <style jsx>{`
        .redirect-container {
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          text-align: center;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 20px;
          color: #333;
        }
        .countdown {
          font-size: 1.2rem;
          margin-bottom: 15px;
          color: #666;
        }
        .progress-bar {
          height: 6px;
          background: #e0e0e0;
          border-radius: 3px;
          margin: 20px 0;
          overflow: hidden;
        }
        .progress {
          height: 100%;
          background: #0066cc;
          transition: width 1s linear;
        }
        .manual-redirect {
          margin-top: 30px;
          color: #666;
        }
        .manual-redirect a {
          color: #0066cc;
          text-decoration: none;
          font-weight: 500;
        }
        .manual-redirect a:hover {
          text-decoration: underline;
        }
      `}</style>
    </Layout>
  );
}