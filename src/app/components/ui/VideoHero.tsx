// components/ui/VideoHero.tsx
import React from 'react';

interface VideoHeroProps {
  videoSrc: string;
  videoPoster?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  overlayOpacity?: number; // 0 a 1
  overlayColor?: string;   // ej: 'bg-black'
  height?: 'screen' | 'auto' | string;
  children?: React.ReactNode;
  className?: string;
  videoProps?: React.VideoHTMLAttributes<HTMLVideoElement>;
}

export const VideoHero: React.FC<VideoHeroProps> = ({
  videoSrc,
  videoPoster,
  title,
  subtitle,
  ctaText,
  ctaHref,
  overlayOpacity = 0.5,
  overlayColor = 'bg-black',
  height =  'h-full',
  children,
  className = '',
  videoProps = {},
}) => {
  const heightClass = height === 'screen' 
    ? 'h-screen' 
    : height === 'auto' 
      ? 'h-auto min-h-[80vh]' 
      : height;

  return (
    <section 
      className={`relative flex items-center justify-center ${heightClass} overflow-hidden ${className}`}
      aria-label="Hero section"
    >
      {/* Video de fondo */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster={videoPoster}
        className="absolute z-0 w-auto min-w-full min-h-full max-w-none object-cover"
        {...videoProps}
      >
        <source src={videoSrc} type="video/mp4" />
        {/* Fallback para navegadores sin soporte de video */}
        <div className={`absolute inset-0 ${overlayColor}`} style={{ opacity: overlayOpacity }} />
      </video>
      

      {/* Overlay de oscuridad para legibilidad */}
      <div 
        className={`absolute inset-0 ${overlayColor} z-10`} 
        style={{ opacity: overlayOpacity }}
        aria-hidden="true"
      />

      {/* Contenido superpuesto */}
      <div className="relative z-20 container mx-auto px-4 text-center text-white">
        {title && (
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
            {title}
          </h1>
        )}
        
        {subtitle && (
          <p className="text-lg md:text-xl lg:text-2xl mb-8 max-w-3xl mx-auto drop-shadow-md">
            {subtitle}
          </p>
        )}

        {ctaText && ctaHref && (
          <a
            href={ctaHref}
            className="inline-block px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg 
                      hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl
                      focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
          >
            {ctaText}
          </a>
        )}

        {/* Slot para contenido personalizado */}
        {children}
      </div>
    </section>
  );
};

export default VideoHero;