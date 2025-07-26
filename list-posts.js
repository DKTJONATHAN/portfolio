import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    let files = [];
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: 'content/articles',
      });
      files = Array.isArray(data) ? data.filter((item) => item.type === 'file') : [];
    } catch (error) {
      if (error.status === 404) {
        return res.status(200).json({ data: [], error: null });
      }
      throw new Error(`GitHub API error: ${error.message}`);
    }

    const results = await Promise.allSettled(
      files
        .filter((file) => file.name.endsWith('.html'))
        .map(async (file) => {
          const { data } = await octokit.repos.getContent({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: file.path,
          });
          if (data.encoding !== 'base64') {
            throw new Error(`Unsupported encoding for ${file.name}`);
          }
          const content = Buffer.from(data.content, 'base64').toString('utf-8');

          const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i) || ['', 'Untitled'];
          const dateCategoryMatch = content.match(/<p[^>]*>(\d{4}-\d{2}-\d{2})\s*•\s*([^<]*?)(?=<|$)/i) || ['', '', 'Uncategorized'];
          const descriptionMatch = content.match(/<p[^>]*>(\d{4}-\d{2}-\d{2})\s*•\s*[^<]*<\/p>\s*<p[^>]*>(.*?)(?=<div class="tags"|$)/is) || ['', '', ''];
          const tagsMatch = content.match(/<div class="tags">([\s\S]*?)<\/div>/i) || ['', ''];
          const imageMatch = content.match(/<img[^>]+src=["'](.*?)["']/i) || ['', ''];
          const contentStart = content.indexOf('<main>') + 6;
          const contentEnd = content.indexOf('</main>');
          const postContent = contentStart > 5 && contentEnd > contentStart ? content.slice(contentStart, contentEnd).trim() : content;

          return {
            slug: file.name.replace('.html', ''),
            title: titleMatch[1],
            date: dateCategoryMatch[1],
            category: dateCategoryMatch[2].trim(),
            description: descriptionMatch[2] || '',
            tags: tagsMatch[1]
              ? tagsMatch[1]
                  .match(/<span class="tag">([\s\S]*?)<\/span>/g)
                  ?.map((tag) => tag.match(/<span class="tag">([\s\S]*?)<\/span>/)[1])
                  .join(',') || ''
              : '',
            image: imageMatch[1],
            content: postContent,
          };
        })
    );

    const posts = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value);
    const errors = results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason.message);

    return res.status(200).json({
      data: posts,
      error: errors.length > 0 ? `Partial errors: ${errors.join('; ')}` : null,
    });
  } catch (error) {
    return res.status(500).json({ data: [], error: `Failed to fetch posts: ${error.message}` });
  }
}
