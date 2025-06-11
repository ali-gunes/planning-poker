/** @type {import('next').NextConfig} */
const nextConfig = {
    // This can help with some packages that use older JS syntax
    transpilePackages: ['socket.io-client'],
};

export default nextConfig;
