/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
  allowedDevOrigins: ['192.168.10.28', '192.168.10.29'],
   async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8081/api/:path*",
=======
  allowedDevOrigins: [
    '192.168.10.28',
    '192.168.10.29',
  ],

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8081/api/:path*',
>>>>>>> origin/main
      },
    ];
  },
};

export default nextConfig;