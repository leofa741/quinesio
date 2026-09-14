// components/FloatingAudioButton.tsx
'use client';

import { useState } from 'react';
import AudioPlayer from '../audioplayer/AudioPlayer';


export default function FloatingAudioButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-19 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full p-4 shadow-lg z-40 transition-all transform hover:scale-110 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
        aria-label={isOpen ? 'Cerrar reproductor de audio' : 'Escuchar presentación'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        )}
      </button>

      {/* Reproductor expandible */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] z-40 shadow-2xl">
          <AudioPlayer
            src="/audio/presentacion-jimena-2.mp3"
            title="Conocé J. Sánchez Propiedades"
            description="Hacé click en play para escuchar"
          //  autoPlay={true} // ✅ Ahora SÍ funciona porque el usuario hizo click
            showTranscript={true}
            transcript={`Hola...
soy Jimena Sánchez.
Gracias por visitar nuestro sitio. Desde hace más de una década ayudamos a concretar proyectos inmobiliarios con profesionalismo, transparencia y atención personalizada. Esperamos acompañarte en la búsqueda de tu próxima oportunidad.
te invito a registrarte para que podamos mandarte informacion de acuerdo a tus busquedas
estaremos en contacto`}
          />
        </div>
      )}
    </>
  );
}