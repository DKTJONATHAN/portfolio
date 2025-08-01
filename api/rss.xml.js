import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles.json',
    });
    const posts = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));

    const baseUrl = 'https://jonathanmwaniki.co.ke';
    const logoUrl = `${baseUrl}/images/Jonathan-Mwaniki-logo.png`; // Your custom logo
    
    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Mwaniki Reports</title>
    <link>${baseUrl}</link>
    <description>Kenya's Premier Source for Investigative Journalism and Breaking News</description>
    <language>en-ke</language>
    <copyright>${new Date().getFullYear()} Mwaniki Media Group</copyright>
    <generator>Mwaniki Reports Digital Platform</generator>
    <image>
      <url>${logoUrl}</url>
      <title>Mwaniki Reports</title>
      <link>${baseUrl}</link>
      <width>600</width>
      <height>300</height>
    </image>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>

    ${posts.map(post => `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${baseUrl}/articles/${post.slug}</link>
        <guid isPermaLink="true">${baseUrl}/articles/${post.slug}</guid>
        <pubDate>${new Date(post.date).toUTCString()}</pubDate>
        <description><![CDATA[${post.description || 'Exclusive report from Mwaniki News Team'}]]></description>
        <dc:creator>${post.author || 'Mwaniki Reports'}</dc:creator>
        <category><![CDATA[${post.category}]]></category>
        ${post.tags ? post.tags.split(',').map(tag => `
        <category><![CDATA[${tag.trim()}]]></category>
        `).join('') : ''}
        ${post.image ? `
        <media:content url="${post.image}" medium="image" type="${post.image.match(/\.(jpg|jpeg)$/i) ? 'image/jpeg' : 'image/png'}" width="1200" height="630">
          <media:description><![CDATA[${post.title}]]></media:description>
          <media:credit>Mwaniki Reports</media:credit>
        </media:content>
        ` : ''}
      </item>
    `).join('')}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'text/xml');
    res.send(rssFeed);

  } catch (error) {
    console.error('RSS generation failed:', error);
    res.status(500).send(`<error>${error.message}</error>`);
  }
}