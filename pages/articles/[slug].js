import { Octokit } from '@octokit/rest';

export default function Article({ content, title }) {
  return content ? (
    <div>
      <h1 style={{ padding: "10px", fontSize: "20px" }}>{title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  ) : (
    <div>
      <h2>Article Not Found</h2>
      <p>Could not load the article. Please try again later.</p>
    </div>
  );
}

export async function getStaticPaths() {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  try {
    const response = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles',
    });

    const paths = Array.isArray(response.data)
      ? response.data.map(file => ({
          params: { slug: file.name.replace(".html", "") },
        }))
      : [];

    return { paths, fallback: false };
  } catch (error) {
    console.error(`getStaticPaths error: ${error.message}`);
    return { paths: [], fallback: false };
  }
}

export async function getStaticProps({ params }) {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/content/articles/${params.slug}.html`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    const content = await response.text();
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const articlesResponse = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles.json',
    });
    const articles = JSON.parse(Buffer.from(articlesResponse.data.content, 'base64').toString());
    const post = articles.find(p => p.slug === params.slug);
    return {
      props: {
        content,
        title: post?.title || "Article",
      },
    };
  } catch (error) {
    console.error(`getStaticProps error: ${error.message}`);
    return {
      props: {
        content: null,
        title: "Article",
      },
    };
  }
}