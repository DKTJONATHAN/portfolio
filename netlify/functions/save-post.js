import { Octokit } from '@octokit/rest';
import { marked } from 'marked';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { update, ...postData } = req.body;

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const filePath = `content/articles/${postData.slug}.html`;

    let htmlContent = postData.content;
    if (postData.content.trim().startsWith('---') || postData.content.includes('\n# ') || postData.content.includes('\n* ')) {
      htmlContent = marked(postData.content);
    } else if (!postData.content.includes('<') && !postData.content.includes('>')) {
      htmlContent = `<p>${postData.content.replace(/\n/g, '<br>')}</p>`;
    }

    const fileContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${postData.title}</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <article>
          <header>
            <h1>${postData.title}</h1>
            <p>${postData.date} • ${postData.category}</p>
            ${postData.image ? `<img src="${postData.image}" alt="${postData.title}" class="w-full h-64 object-cover rounded-lg mb-6">` : ''}
            ${postData.description ? `<p>${postData.description}</p>` : ''}
            ${postData.tags ? `<div class="tags">${postData.tags
              .split(',')
              .map((tag) => `<span class="tag">${tag.trim()}</span>`)
              .join('')}</div>` : ''}
          </header>
          <main>
            ${htmlContent}
          </main>
        </article>
      </body>
      </html>
    `;

    const contentBase64 = Buffer.from(fileContent).toString('base64');

    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: filePath,
      });
      sha = data.sha;
    } catch (error) {
      if (error.status !== 404) throw error;
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: filePath,
      message: update ? `Update post: ${postData.title}` : `Create post: ${postData.title}`,
      content: contentBase64,
      sha: sha || undefined,
    });

    return res.status(200).json({ message: 'Post saved successfully' });
  } catch (error) {
    return res.status(500).json({ error: `Failed to save post: ${error.message}` });
  }
}