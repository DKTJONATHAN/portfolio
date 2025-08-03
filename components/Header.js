export default function Header() {
  return (
    <header style={{ 
      position: "sticky", 
      top: 0, 
      background: "linear-gradient(to right, #003087, #4fc3f7)", 
      color: "white", 
      padding: "10px 20px", 
      zIndex: 1000 
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "1200px", margin: "0 auto" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "white" }}>
          <img src="/images/Jonathan-Mwaniki-logo.png" alt="Jonathan Mwaniki Reports" style={{ height: "40px", marginRight: "10px" }} />
          <h1 style={{ fontSize: "24px", margin: 0 }}>Jonathan Mwaniki Reports</h1>
        </a>
        <nav style={{ display: "flex", gap: "15px" }}>
          <a href="/" style={{ color: "white", textDecoration: "none" }}>Home</a>
          <a href="/category/News" style={{ color: "white", textDecoration: "none" }}>News</a>
          <a href="/category/Business" style={{ color: "white", textDecoration: "none" }}>Business</a>
          <a href="/category/Tech" style={{ color: "white", textDecoration: "none" }}>Tech</a>
          <a href="/category/Sports" style={{ color: "white", textDecoration: "none" }}>Sports</a>
          <a href="/category/Entertainment" style={{ color: "white", textDecoration: "none" }}>Entertainment</a>
          <a href="/category/Opinions" style={{ color: "white", textDecoration: "none" }}>Opinions</a>
        </nav>
      </div>
    </header>
  );
}