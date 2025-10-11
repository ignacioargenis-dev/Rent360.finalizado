/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
  },
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optimizaciones de performance
  swcMinify: true,
  compiler: {
    removeConsole: false, // Temporalmente desactivado en producción para debugging
  },
  // Configuración experimental
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
    optimizeCss: false, // Deshabilitado para evitar problemas con Tailwind
    scrollRestoration: true,
  },
  // Forzar renderizado dinámico para páginas que usan APIs del cliente
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  // Optimizaciones de build - Usar servidor personalizado
  // output: 'standalone', // Deshabilitado para usar servidor personalizado con Socket.IO
  poweredByHeader: false,
  webpack: (config, { isServer }) => {
    // Fix for node modules in client-side code
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Exclude server-side packages from client bundle
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        redis: 'commonjs redis',
        '@redis/client': 'commonjs @redis/client',
        sqlite3: 'commonjs sqlite3',
        '@aws-sdk/client-s3': 'commonjs @aws-sdk/client-s3',
        '@google-cloud/storage': 'commonjs @google-cloud/storage',
      });
    }

    return config;
  },
  // Configuración optimizada de imágenes
  images: {
    domains: [
      'ui-avatars.com',
      'localhost',
      'rent360.cl',
      's3.amazonaws.com',
      'drive.google.com',
      'lh3.googleusercontent.com',
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    // CSP manejado por middleware - removido para evitar conflictos
  },
  // Configuración avanzada de headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=()',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
