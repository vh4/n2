/**
 * @type {import('next').NextConfig}
 * Next.js Configuration for N2 Japanese Mastery Studio.
 * Configured for App Router and node-compatible server execution for local database mapping.
 */
const nextConfig = {
  reactStrictMode: true,
  // Ensure fs and path can be safely handled in server routes without bundling issues
  serverExternalPackages: [],
};

export default nextConfig;
