// components/ui/ExpoHeroBanner.tsx
import React from 'react';

interface ExpoHeroBannerProps {
  videoSrc: string;
  videoPoster?: string;
  className?: string;
}

export const ExpoHeroBanner: React.FC<ExpoHeroBannerProps> = ({
  videoSrc,
  videoPoster,
  className = '',
}) => {
  return (
    <section className={`relative h-screen w-full overflow-hidden ${className}`}>
      {/* Video de fondo */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster={videoPoster}
        className="absolute z-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Overlay púrpura/magenta (como en el banner) */}
      <div className="absolute inset-0 z-10 bg-purple-900/60 mix-blend-multiply" />

      {/* Contenido - Layout de 3 columnas */}
      <div className="relative z-20 h-full flex items-center">
        <div className="container mx-auto px-4 h-full flex items-center">
          
          {/* GRID DE 3 COLUMNAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-center">
            
            {/* COLUMNA 1 - Logo/Branding */}
            <div className="text-white flex flex-col justify-center">
              <div className="space-y-2">
                <div className="rotate-180  writing-mode-vertical text-white font-black uppercase leading-none tracking-tight text-5xl opacity-90">
                  EXPO
                </div>
                <div className=" text-white font-black uppercase leading-none tracking-tight text-5xl opacity-90">
                  REAL
                </div>
                <div className="text-xl lg:text-2xl font-bold">
                  ESTATE
                </div>
                <div className="text-xs mt-4 opacity-80">
                  BY SG
                </div>
              </div>
            </div>

            {/* COLUMNA 2 - Título del evento */}
            <div className="text-white text-center md:text-left">
              <h1 className="text-2xl lg:text-4xl font-bold leading-tight">
                CONGRESO DE<br />
                DESARROLLOS<br />
                E INVERSIONES<br />
                INMOBILIARIAS
              </h1>
              <div className="mt-4 text-lg lg:text-xl font-semibold">
                — ARGENTINA —
              </div>
              <div className="text-xs mt-4 opacity-80">
                BY SG
              </div>
            </div>

            {/* COLUMNA 3 - Fecha y ubicación */}
            <div className="text-white text-center md:text-right">
              <div className="text-3xl lg:text-5xl font-bold mb-4">
                12 Y 13 DE AGOSTO<br />
                DE 2026
              </div>
              <div className="text-lg lg:text-xl font-medium">
                HILTON HOTEL, BUENOS AIRES
              </div>
              <div className="text-lg lg:text-xl mt-2">
                9 A 20HS.
              </div>
              {/* Logo Hilton (opcional - podés usar una imagen) */}
              <div className="mt-6 flex justify-center md:justify-end">
                <div className="border-2 border-white rounded-full w-16 h-16 flex items-center justify-center">
                  <span className="text-xs font-bold">Hilton</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Gradiente inferior para transición suave */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent z-20" />
    </section>
  );
};

export default ExpoHeroBanner;