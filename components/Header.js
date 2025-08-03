export default function Header() {
  return (
    <header style={{ background: "linear-gradient(to right, #003087, #4fc3f7)", color: "white", padding: "20px 0", textAlign: "center" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "48px", margin: "0", fontFamily: "'Georgia', serif", fontWeight: "bold", letterSpacing: "1px" }}>
          Jonathan Mwaniki News
        </h1>
        <p style={{ fontSize: "18px", margin: "10px 0", fontStyle: "italic" }}>
          Your Source for Truthful Reporting in Kenya and Beyond
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
          <img src="/images/Jonathan-Mwaniki-logo.png" alt="Jonathan Mwaniki News" style={{ height: "50px" }} />
          <nav style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/" style={{ color: "white", textDecoration: "none" }}><i className="fas fa-home"></i> Home</a>
            <a href="/category/News" style={{ color: "white", textDecoration: "none" }}><i className="fas fa-newspaper"></i> News</a>
            <a href="/category/Business" style={{ color: "white", textDecoration: "none" }}><i className="fas fa-briefcase"></i> Business</a>
            <a href="/category/Tech" style={{ color: "white", textDecoration: "none" }}><i className="fas fa-laptop"></i> Tech</a>
            <a href="/category/Sports" style={{ color: "white", textDecoration: "none" }}><i className="fas fa-futbol"></i> Sports</a>
            <a href="/category/Entertainment" style={{ color: "white", textDecoration: "none" }}><i className="fas fa-film"></i> Entertainment</a>
            <a href="/category/Opinions" style={{ color: "white", textDecoration: "none" }}><i className="fas fa-comment"></i> Opinions</a>
          </nav>
        </div>
      </div>
    </header>
  );
}