import Header from "../components/Header";

export default function Custom404() {
  return (
    <div>
      <Header />
      <div style={{ padding: "10px", textAlign: "center" }}>
        <h2 style={{ color: "#333", fontSize: "24px" }}>Page Not Found</h2>
        <p style={{ color: "#666", fontSize: "16px" }}>
          The page or article you’re looking for doesn’t exist. Try searching for an article or return to the <a href="/" style={{ color: "#007bff" }}>homepage</a>.
        </p>
      </div>
    </div>
  );
}