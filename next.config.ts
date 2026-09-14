import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

// 🔹 Configuración del PWA
const withPWA = withPWAInit({
  // ✅ Opciones válidas de PluginOptions
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  sw: '/sw.js',
  scope: '/',
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  cacheStartUrl: true,
  dynamicStartUrl: true,
  
  // Excluir archivos grandes del precache
  publicExcludes: ['!node_modules/**/*'],
  
  // ✅ TODO lo de Workbox va DENTRO de workboxOptions
  workboxOptions: {
    skipWaiting: true,           // ✅ Aquí SÍ existe
    clientsClaim: true,          // ✅ Aquí SÍ existe
    cleanupOutdatedCaches: true, // Limpia caches viejos
    
    // ✅ runtimeCaching también va aquí
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'cloudinary-images',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|webp|svg)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-images',
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
    ],
  },
});

// 🔹 Tu configuración existente
const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    MONGODB_CNN: process.env.MONGODB_CNN,
    JWT_SECRET: process.env.JWT_SECRET,
    GOOGLE_SECRET: process.env.GOOGLE_SECRET,
    ID_GOOGLE: process.env.ID_GOOGLE,
    MAILER_SERVICE: process.env.MAILER_SERVICE,
    MAILER_EMAIL: process.env.MAILER_EMAIL,
    MAILER_SECRET_KEY: process.env.MAILER_SECRET_KEY,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

// 🔹 Exportar envuelto con PWA
export default withPWA(nextConfig);