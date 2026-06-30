/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit reads its font (.afm) files from disk using __dirname at runtime;
  // bundling it breaks that path resolution, so keep it as a real dependency.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
