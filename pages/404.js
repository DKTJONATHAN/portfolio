import Layout from '../components/Layout';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <Layout>
      <div className="error-container">
        <div className="error-content">
          <h1>404 - Page Not Found</h1>
          <p className="error-message">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="error-image">
            <img 
              src="/images/Jonathan-Mwaniki-logo.png" 
              alt="Jonathan Mwaniki Logo"
              className="logo"
            />
          </div>
          <Link href="/">
            <a className="home-link">
              Return to Homepage
            </a>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
          padding: 20px;
        }
        .error-content {
          text-align: center;
          max-width: 600px;
        }
        h1 {
          font-size: 2.5rem;
          color: #d32f2f;
          margin-bottom: 20px;
        }
        .error-message {
          font-size: 1.2rem;
          color: #666;
          margin-bottom: 30px;
        }
        .error-image {
          margin: 30px 0;
        }
        .logo {
          height: 100px;
          width: auto;
          opacity: 0.8;
        }
        .home-link {
          display: inline-block;
          padding: 12px 24px;
          background: #0066cc;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 500;
          transition: background 0.3s;
        }
        .home-link:hover {
          background: #0052a3;
        }
      `}</style>
    </Layout>
  );
}