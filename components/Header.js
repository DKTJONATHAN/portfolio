export default function Header() {
  return (
    <header style={{ background: "#f4f4f4", padding: "10px", textAlign: "center" }}>
      <h1 style={{ margin: "0", fontSize: "28px" }}>Jonathan Mwaniki News</h1>
      <nav>
        <a href="/" style={{ margin: "0 10px", color: "#007bff", textDecoration: "none" }}>
          Home
        </a>
      </nav>
    </header>
  );
}