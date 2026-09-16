// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.kinesio.ar';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/gestion/',      // Área privada de gestión
          '/api/',          // Endpoints de API
          '/admin/',        // Panel de admin (si existe)
          '/app/',          // Rutas internas
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}