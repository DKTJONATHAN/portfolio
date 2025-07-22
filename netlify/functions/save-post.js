const { Octokit } = require("@octokit/rest");
const TurndownService = require("turndown");

exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    const { token, title, slug, category, tags, image, date, content } = JSON.parse(event.body);
    if (token !== Buffer.from(process.env.ADMIN_PASSWORD).toString("base64")) {
        return { statusCode: 403, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    if (!title || !slug || !category || !date || !content) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    const turndown = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
        bulletListMarker: "-",
    });
    const markdownContent = `---
title: ${title}
slug: ${slug}
category: ${category}
tags: ${JSON.stringify(tags.split(',').map(tag => tag.trim()))}
image: ${image || ''}
date: ${date}
---
${turndown.turndown(content)}`;

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const owner = "DKTJONATHAN";
    const repo = "portfolio";
    const path = `content/blog/${slug}.md`;
    const branch = "main";

    let sha;
    try {
        const { data } = await octokit.repos.getContent({ owner, repo, path, ref: branch });
        sha = data.sha;
    } catch (error) {
        if (error.status !== 404) throw error;
    }

    try {
        const response = await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: `${sha ? "Update" : "Create"} post: ${title}`,
            content: Buffer.from(markdownContent).toString("base64"),
            branch,
            sha,
        });
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Post saved", sha: response.data.commit.sha }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Failed to save post: ${error.message}` }),
        };
    }
};