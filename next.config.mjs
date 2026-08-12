/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["192.168.2.112", "192.168.29.246",'192.168.2.117','192.168.1.10','192.168.1.10:3000','192.168.2.117:3000','192.168.1.17'],
  serverExternalPackages: ["knex"],
};

export default nextConfig;