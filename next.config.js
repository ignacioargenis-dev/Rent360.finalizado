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
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'], // Solo mantener errores críticos en producción
          }
        : false,
  },
  // Configuración experimental - simplificada para estabilidad
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
    optimizeCss: false, // Deshabilitado para evitar problemas con Tailwind
    scrollRestoration: true,
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // GenerateBuildId fijo para estabilidad de chunks
  generateBuildId: async () => {
    return 'rent360-stable-v1.0';
  },
  // ⚠️ TEMPORALMENTE DESHABILITADO: output standalone para debugging
  // TODO: Re-habilitar cuando se confirme que el dashboard funciona
  // output: 'standalone', // Deshabilitado para usar next start
  poweredByHeader: false,
  // Configuración webpack simplificada para estabilidad
  webpack: (config, { isServer }) => {
    // Solo mantener fallbacks críticos para evitar problemas de inicialización
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Configuración básica sin externals complejos
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
          // TEMPORALMENTE DESHABILITADO: Estos headers bloqueaban chunks de Next.js
          // {
          //   key: 'Cross-Origin-Embedder-Policy',
          //   value: 'credentialless',
          // },
          // {
          //   key: 'Cross-Origin-Opener-Policy',
          //   value: 'same-origin',
          // },
          // {
          //   key: 'Cross-Origin-Resource-Policy',
          //   value: 'cross-origin',
          // },
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
