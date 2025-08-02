/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Enables static export
  reactStrictMode: true,
  trailingSlash: true, // Ensures URLs work with static export
  env: {
    GITHUB_OWNER: process.env.GITHUB_OWNER,
    GITHUB_REPO: process.env.GITHUB_REPO,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  },
};

export default nextConfig;