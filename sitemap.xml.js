export default function Sitemap() { return null; }

export async function getServerSideProps({ res }) {
  const response = await fetch(`${process.env.VERCEL_URL}/api/sitemap`);
  const xml = await response.text();
  res.setHeader('Content-Type', 'text/xml');
  res.write(xml);
  res.end();
  return { props: {} };
}