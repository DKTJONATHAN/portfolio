export default function RSS() { return null; }

export async function getServerSideProps({ res }) {
  const response = await fetch(`${process.env.VERCEL_URL}/api/rss`);
  const xml = await response.text();
  res.setHeader('Content-Type', 'application/rss+xml');
  res.write(xml);
  res.end();
  return { props: {} };
}