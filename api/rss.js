export default async function handler(req, res) {
  try {
    // Fetch posts from the existing list-posts API
    const response = await fetch('https://jonathanmwaniki.co.ke/api/list-posts');
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }
    const { data: posts, error } = await response.json();
    if (error) {
      throw new Error(error);
    }

    // Transform posts for RSS
    const rssPosts = posts.map(post => ({
      title: post.title,
      pubDate: post.date && !isNaN(new Date(post.date)) ? new Date(post.date).toUTCString() : new Date().toUTCString(),
      description: post.description || 'No description available',
      link: `https://jonathanmwaniki.co.ke/articles/${post.slug}`, // Adjust if your post URLs differ
      guid: `https://jonathanmwaniki.co.ke/articles/${post.slug}`,
      category: post.category,
      image: post.image || '',
    }));

    // Generate RSS feed
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Jonathan Mwaniki</title>
    <link>https://jonathanmwaniki.co.ke</link>
    <description>Blog by Jonathan Mwaniki covering News, Opinions, Business, Sports, Tech, and Entertainment</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://jonathanmwaniki.co.ke/rss.xml" rel="self" type="application/rss+xml" />
    ${rssPosts.map(post => `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${post.link}</link>
        <guid>${post.guid}</guid>
        <pubDate>${post.pubDate}</pubDate>
        <description><![CDATA[${post.description}]]></description>
        <category>${post.category}</category>
        ${post.image ? `<enclosure url="${post.image}" type="image/jpeg" />` : ''}
      </item>
    `).join('')}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/rss+xml');
    res.status(200).send(rss);
  } catch (error) {
    console.error('Error generating RSS:', error);
    res.status(500).send('Error generating RSS feed');
  }
}