// components/WelcomeModal.tsx
'use client';

import { useState, useEffect } from 'react';
import AudioPlayer from '../audioplayer/AudioPlayer';


export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasVisited, setHasVisited] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya visitó el sitio
    const visited = localStorage.getItem('tumarca-welcome-shown');
    if (!visited) {
      setIsOpen(true);
    } else {
      setHasVisited(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('tumarca-welcome-shown', 'true');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full p-6 shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <h2 id="welcome-title" className="text-2xl font-bold text-white">
            ¡Bienvenido a Tu Marca AR!
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Cerrar bienvenida"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-gray-300 mb-6">
          ¿Querés escuchar una breve presentación sobre nuestros servicios?
        </p>

        <AudioPlayer
          src="/audio/presentacion-jimena.mp3"
          title="Presentación de J. Sánchez Propiedades"
          autoPlay={false}
          showTranscript={true}
          transcript="Hola...
soy Jimena Sánchez.
Gracias por visitar nuestro sitio. Desde hace más de una década ayudamos a concretar proyectos inmobiliarios con profesionalismo, transparencia y atención personalizada. Esperamos acompañarte en la búsqueda de tu próxima oportunidad.
te invito a registrarte para que podamos mandarte informacion de acuerdo a tus busquedas
estaremos en contacto"
          className="mb-6"
        />

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
          >
            Explorar el sitio
          </button>
        </div>
      </div>
    </div>
  );
}