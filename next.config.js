/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  env: {
    GITHUB_OWNER: "DKTJONATHAN",
    GITHUB_REPO: "portfolio",
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  },
};

export default nextConfig;