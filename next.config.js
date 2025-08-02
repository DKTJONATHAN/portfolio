/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Enables static export for GitHub Pages compatibility
  reactStrictMode: true,
  trailingSlash: true, // Ensures URLs work with static export
};

export default nextConfig;