// app/gracias/page.tsx
'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function GraciasPage() {
  useEffect(() => {
    // ✅ Fragmento de evento de Google Ads
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        'send_to': 'AW-18201247782/5gGxCLDRi78cEKaAhOdD'
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d] text-white">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-6xl mb-4">✓</div>
        <h1 className="text-3xl font-bold mb-4">¡Gracias por compartir!</h1>
        <p className="text-gray-300 mb-8">
          Encontrá la propiedad que buscás en nuestra página.
        </p>
        <Link 
          href="/"
          className="inline-block bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}