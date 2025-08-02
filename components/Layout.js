import Head from 'next/head';
import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
      </Head>

      <header className="header">
        <div className="header-content">
          <Link href="/">
            <a className="logo-link">
              <img 
                src="/images/Jonathan-Mwaniki-logo.png" 
                alt="Jonathan Mwaniki Reports" 
                className="logo"
              />
            </a>
          </Link>
          <nav className="navigation">
            <Link href="/"><a>Home</a></Link>
            <Link href="/categories/news"><a>News</a></Link>
            <Link href="/categories/opinions"><a>Opinions</a></Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} Jonathan Mwaniki Reports</p>
          <p>Email: info@jonathanmwaniki.co.ke</p>
          <p>Twitter: <a href="https://twitter.com/maestropuns" target="_blank" rel="noopener">@maestropuns</a></p>
        </div>
      </footer>

      <style jsx>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .header {
          background: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 1rem 0;
        }
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo-link {
          display: block;
        }
        .logo {
          height: 50px;
          width: auto;
        }
        .navigation {
          display: flex;
          gap: 1.5rem;
        }
        .navigation a {
          color: #333;
          font-weight: 500;
          text-decoration: none;
        }
        .navigation a:hover {
          color: #0066cc;
        }
        main {
          flex: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          width: 100%;
        }
        .footer {
          background: #f5f5f5;
          padding: 2rem 0;
          margin-top: 2rem;
        }
        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          text-align: center;
          color: #666;
        }
        .footer a {
          color: #0066cc;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}