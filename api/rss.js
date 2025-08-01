import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // Fetch metadata from content/articles.json
    let metadata = [];
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: 'content/articles.json',
      });
      if (data.encoding !== 'base64') {
        throw new Error('Unsupported encoding for articles.json');
      }
      metadata = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
    } catch (error) {
      if (error.status === 404) {
        return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Jonathan Mwaniki</title><link>https://jonathanmwaniki.co.ke</link><description>No posts available</description><language>en-us</language><lastBuildDate>' + new Date().toUTCString() + '</lastBuildDate></channel></rss>');
      }
      throw new Error(`GitHub API error: ${error.message}`);
    }

    // Validate and filter posts
    const allowedCategories = ['News', 'Breaking News', 'Opinions', 'Business', 'Sports', 'Tech', 'Entertainment'];
    const rssPosts = metadata
      .filter(post => post && post.slug && post.title && post.date && allowedCategories.includes(post.category))
      .map(post => ({
        title: post.title,
        pubDate: post.date && !isNaN(new Date(post.date)) ? new Date(post.date).toUTCString() : new Date().toUTCString(),
        description: post.description || 'No description available',
        link: `https://jonathanmwaniki.co.ke/articles/${post.slug}`, // Adjust if post URLs differ
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
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // Cache for 1 hour
    res.status(200).send(rss);
  } catch (error) {
    console.error('Error generating RSS:', error);
    res.status(500).send('Error generating RSS feed');
  }
}