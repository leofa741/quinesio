// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jimenasanchezpropiedades.ar';
  
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