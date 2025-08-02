import SEO from './SEO';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children, meta }) {
  return (
    <>
      <SEO {...meta} />
      <Header />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </>
  );
}