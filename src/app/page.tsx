'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { FaStar, FaArrowRight, FaShoppingBag, FaTshirt, FaWhatsapp, FaSearch } from 'react-icons/fa';
import { formatARS } from '@/app/lib/formatcurrenci';

import VideoHero from './components/ui/VideoHero';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import RotatingCircle from './components/ui/RotatingCircle';


// ─────────────────────────────────────────────────────────────
// 🔹 Tipos para INDUMENTARIA
// ─────────────────────────────────────────────────────────────

interface Product {
  _id: string;
  nombre: string;
  descripcion: string;
  categoria: 'vestidos' | 'remeras' | 'pantalones' | 'accesorios' | 'outwear';
  precio: number;
  moneda: 'ARS' | 'USD';
  imagen: string;
  slug: string;
  destacado: boolean;
  nuevo: boolean;
  caracteristicas: {
    talle: string;
    color: string;
    material: string;
  };
}

interface CategoryCount {
  slug: string;
  name: string;
  count: number;
  icon: string;
}

// ─────────────────────────────────────────────────────────────
// 🔹 Helpers de formato
// ─────────────────────────────────────────────────────────────

const formatPrice = (monto: number, moneda: 'ARS' | 'USD' = 'ARS') => {
  if (moneda === 'ARS') return formatARS ? formatARS(monto) : `$ ${monto.toLocaleString('es-AR')}`;
  return `USD ${monto.toLocaleString('es-AR')}`;
};

// ─────────────────────────────────────────────────────────────
// 🔹 Componentes de Loading LOCAL
// ─────────────────────────────────────────────────────────────

function ProductsSectionLoader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700/50">
            <div className="aspect-[3/4] bg-slate-700/50" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-slate-700/50 rounded w-3/4" />
              <div className="h-3 bg-slate-700/50 rounded w-1/2" />
              <div className="h-8 bg-slate-700/50 rounded w-1/3 mt-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}



// ─────────────────────────────────────────────────────────────
// 🔹 Componente Principal
// ─────────────────────────────────────────────────────────────

export default function HomePage() {
  return <PageContent />;
}

function PageContent() {
  // ✅ Estados para INDUMENTARIA
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Efecto para el mouse move del background
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const move = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      container.style.setProperty('--x', `${x}px`);
      container.style.setProperty('--y', `${y}px`);
    };
    container.addEventListener('mousemove', move);
    return () => container.removeEventListener('mousemove', move);
  }, []);

  // 📥 Cargar datos de productos
  useEffect(() => {
    const fetchData = async () => {
      // 1. Productos destacados
      try {
        // NOTA: Cambia esta URL por tu endpoint real de productos cuando lo tengas
        const res = await fetch('/api/gestion/public/productos?destacado=true&limit=6');
        if (res.ok) {
          const data = await res.json();
          setFeaturedProducts(data.productos || []);
        }
      } catch (err) {
        console.error('Error loading featured products:', err);
      } finally {
        setFeaturedLoading(false);
      }

      // 2. Todos los productos
      try {
        const res = await fetch('/api/gestion/public/productos?limit=12');
        if (res.ok) {
          const data = await res.json();
          setAllProducts(data.productos || []);
        }
      } catch (err) {
        console.error('Error loading all products:', err);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 🔍 Búsqueda local en frontend
  const filteredProducts = allProducts.filter(prod =>
    searchQuery === '' ||
    prod.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prod.categoria.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Categorías hardcodeadas para indumentaria (puedes moverlas a DB después)
  const clothingCategories: CategoryCount[] = [
    { slug: 'vestidos', name: 'Vestidos', count: 24, icon: '👗' },
    { slug: 'remeras', name: 'Remeras & Tops', count: 45, icon: '👚' },
    { slug: 'pantalones', name: 'Pantalones', count: 32, icon: '👖' },
    { slug: 'accesorios', name: 'Accesorios', count: 18, icon: '👜' },
  ];

  // ─────────────────────────────────────────────────────────────
  // 🔹 Componente reutilizable de beneficio (Boutique)
  // ─────────────────────────────────────────────────────────────
  const BenefitCard = ({
    icon,
    title,
    description,
    delay,
    accent = "from-amber-400 to-rose-400"
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    delay: number;
    accent?: string;
  }) => (
    <div
      className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-rose-500/30 transition-all duration-500 animate-fadeInUp"
      style={{ animationDelay: `${delay + 200}ms` }}
    >
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${accent} rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-lg -z-10 pointer-events-none`} />
      <div className="absolute inset-[1px] rounded-2xl bg-slate-900/90 -z-10" />
      <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${accent} bg-opacity-10 flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-300`}>
        <span className="text-white">{icon}</span>
      </div>
      <h3 className="relative text-lg font-semibold text-white mb-2 group-hover:text-amber-300 transition-colors duration-300">
        {title}
      </h3>
      <p className="relative text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
        {description}
      </p>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // 🔹 Product Card Inline (para evitar dependencias rotas)
  // ─────────────────────────────────────────────────────────────
  const ProductCard = ({ product }: { product: Product }) => (
    <div className="group relative bg-slate-900/50 rounded-2xl overflow-hidden border border-white/10 hover:border-rose-500/30 transition-all duration-300 hover:-translate-y-1">
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image 
          src={product.imagen || '/img/producto-destacado.jpg'} 
          alt={product.nombre} 
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105" 
        />
        {product.destacado && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-500/90 text-slate-900 text-[10px] font-bold uppercase tracking-wider shadow-lg">
            Destacado
          </span>
        )}
        {product.nuevo && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-rose-500/90 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
            Nuevo
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <button 
            onClick={() => setSelectedProduct(product)}
            className="w-full py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-rose-50 transition-colors shadow-lg"
          >
            Ver Detalles
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold truncate mb-1">{product.nombre}</h3>
        <p className="text-slate-400 text-xs mb-3 capitalize">{product.categoria}</p>
        <div className="flex items-center justify-between">
          <span className="text-amber-400 font-bold text-lg">
            {formatPrice(product.precio, product.moneda)}
          </span>
          <span className="text-slate-500 text-xs bg-white/5 px-2 py-1 rounded">
            Talle {product.caracteristicas.talle}
          </span>
        </div>
      </div>
    </div>
  );

  // ✅ Render principal
  return (
    <div ref={containerRef} className="min-h-screen bg-slate-950 text-white">
  

      {/* ═══════════════════════════════════════════════════════
          HERO CON VIDEO
          ═══════════════════════════════════════════════════════ */}
      <div className="relative w-full left-0 right-0">
        <VideoHero videoSrc="/videos/moda1.mp4" overlayOpacity={0.4}>
          <div className="max-w-7xl mx-auto px-6 pt-40 sm:pt-48">
            <RotatingCircle text="✦ SG TU LOOK ✦ NUEVA COLECCIÓN ✦ " size={200} duration={10} />
            
            <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-8 items-center">
              <div className="hidden lg:flex justify-center">
                <div 
                  className="text-white font-black uppercase leading-none tracking-tight text-5xl opacity-90 mr-10 mt-2"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  SG Tu Look
                </div>
              </div>
              <div className="text-left">
                <div className="space-y-2">
                  <div className="group relative inline-block overflow-hidden rounded-2xl">
                    <span className="absolute inset-0 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] transition-opacity duration-500" />
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out rounded-2xl" />
                    <h1 className="relative z-10 text-4xl md:text-7xl lg:text-8xl font-black uppercase leading-[0.9] tracking-tight text-white/60 group-hover:text-white/90 group-hover:[text-shadow:0_0_30px_rgba(255,255,255,0.15)] transition-all duration-500 ease-out selection:bg-white/20 rounded-2xl">
                      Tu Look para que brilles
                      <div>y te sientas <br /> única.</div>  
                    </h1>
                  </div>
                </div>
                <div className="mt-10 border-t border-white/30 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-3xl md:text-5xl font-black uppercase">
                      Bienvenidos a<br />SG Tu Look
                    </h2>
                    <p className="mt-2 text-sm md:text-lg uppercase tracking-wider text-gray-300">
                      Mendoza, Buenos Aires · 9 a 20hs
                    </p>
                  </div>
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-bold uppercase tracking-wide hover:bg-rose-200 transition-all duration-300 rounded-full"
                  >
                    Reservar Cita
                  </a>
                </div>
              </div>
            </div>
          </div>
        </VideoHero>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECCIÓN BENEFICIOS - BOUTIQUE ELEGANTE
          ═══════════════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-24 lg:py-32 overflow-hidden bg-gradient-to-b from-[#0a0612] via-[#120a1f] to-[#0a0612]">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-gradient-to-r from-amber-500/10 via-rose-500/15 to-fuchsia-500/10 opacity-60" style={{ filter: 'blur(120px)' }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 opacity-40" style={{ filter: 'blur(100px)' }} />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 animate-fadeInUp">
            <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-400/20 backdrop-blur-sm mb-6">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gradient-to-r from-amber-400 to-rose-400" />
              </span>
              <span className="text-[11px] tracking-[0.3em] uppercase bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent font-semibold">
                Nueva Colección 2026
              </span>
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">Tu Estilo,</span>
              <br className="sm:hidden" />
              <span className="bg-gradient-to-r from-amber-300 via-rose-300 to-fuchsia-300 bg-clip-text text-transparent italic font-serif"> Tu Esencia</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto px-2">
              Piezas únicas diseñadas para que brilles en cada ocasión.
              <span className="block sm:inline"> Descubrí lo que te hace </span>
              <span className="bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent font-semibold">inolvidable</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            <BenefitCard
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5L12 2z" /></svg>}
              title="Tendencias de Temporada"
              description="Renovamos nuestro stock cada semana con lo último en moda internacional."
              accent="from-amber-400 to-orange-500"
              delay={0}
            />
            <BenefitCard
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 0a5 5 0 00-5 5v2a5 5 0 0010 0v-2a5 5 0 00-5-5zm-7 15h14" /></svg>}
              title="Diseños Exclusivos"
              description="Piezas cuidadosamente seleccionadas que no vas a encontrar en cualquier lado."
              accent="from-rose-400 to-pink-500"
              delay={100}
            />
            <BenefitCard
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
              title="Calidad Premium"
              description="Telas de primera, costuras impecables y terminaciones que duran años."
              accent="from-fuchsia-400 to-purple-500"
              delay={200}
            />
            <BenefitCard
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
              title="Talles para Todas"
              description="Del XS al XXL. Creemos que la moda es para todos los cuerpos."
              accent="from-cyan-400 to-blue-500"
              delay={300}
            />
          </div>

          <div className="text-center mt-14 sm:mt-20 animate-fadeInUp" style={{ animationDelay: '600ms' }}>
            <a href="/productos" className="group relative inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-4 sm:py-5 rounded-full font-semibold text-sm tracking-wide transition-all duration-500 overflow-hidden bg-gradient-to-r from-amber-400 via-rose-400 to-fuchsia-500 text-white shadow-lg shadow-rose-500/20 hover:shadow-2xl hover:shadow-rose-500/40 hover:scale-[1.03] active:scale-[0.98]">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="absolute inset-0 rounded-full border border-white/25 group-hover:border-white/50 transition-colors duration-300" />
              <span className="relative z-10">Explorar Colección</span>
              <svg className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <p className="mt-5 text-xs text-slate-500 tracking-wide">✨ Envíos a todo el país · Cambios sin cargo</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECCIÓN VALOR - BOUTIQUE ELEGANTE
          ═══════════════════════════════════════════════════════ */}
      <section className="relative -mt-16 sm:-mt-20 py-20 sm:py-24 lg:py-28 overflow-hidden bg-gradient-to-b from-[#0a0612] via-[#120a1f] to-[#0a0612]">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-gradient-to-r from-amber-500/10 via-rose-500/15 to-fuchsia-500/10 opacity-60" style={{ filter: 'blur(120px)' }} />
          <div className="absolute top-1/4 left-10 w-56 h-56 bg-rose-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-10 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <div className="lg:w-1/2 space-y-6 sm:space-y-8 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-400/20 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r from-amber-400 to-rose-400" />
                </span>
                <span className="text-[11px] tracking-[0.3em] uppercase bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent font-semibold">
                  Tu Boutique de Confianza
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">Moda que</span>
                <br />
                <span className="bg-gradient-to-r from-amber-300 via-rose-300 to-fuchsia-300 bg-clip-text text-transparent italic font-serif">Te Define</span>
              </h2>

              <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl px-2">
                Prendas <span className="text-white font-medium">exclusivas</span>, <span className="text-white font-medium">calidad premium</span> y asesoramiento personalizado.
                Te ayudamos a encontrar el <span className="text-white">look perfecto</span> para cada ocasión.
              </p>

              <ul className="space-y-4">
                {[
                  { icon: '✦', label: 'Colecciones exclusivas renovadas cada semana', color: 'from-amber-400 to-orange-500' },
                  { icon: '✦', label: 'Asesoramiento de imagen y talle personalizado', color: 'from-rose-400 to-pink-500' },
                  { icon: '✦', label: 'Talles del XS al XXL para todos los cuerpos', color: 'from-fuchsia-400 to-purple-500' },
                ].map((feature, index) => (
                  <li key={index} className="group flex items-start gap-4 animate-fadeInUp" style={{ animationDelay: `${200 + index * 100}ms` }}>
                    <span className={`relative flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-rose-900/30 group-hover:shadow-rose-900/50 transition-shadow duration-300`}>
                      {feature.icon}
                      <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </span>
                    <span className="text-slate-300 group-hover:text-white transition-colors duration-300 pt-0.5">{feature.label}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                <a href="/productos" className="group relative inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-4 sm:py-5 rounded-full font-semibold text-sm tracking-wide transition-all duration-500 overflow-hidden bg-gradient-to-r from-amber-400 via-rose-400 to-fuchsia-500 text-white shadow-lg shadow-rose-500/20 hover:shadow-2xl hover:shadow-rose-500/40 hover:scale-[1.03] active:scale-[0.98]">
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span className="absolute inset-0 rounded-full border border-white/25 group-hover:border-white/50 transition-colors duration-300" />
                  <span className="relative z-10">Ver Colección Completa</span>
                  <svg className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
                <a href="/contact" className="group relative inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-4 sm:py-5 rounded-full font-semibold text-sm tracking-wide transition-all duration-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-rose-500/40 text-white backdrop-blur-sm active:scale-[0.98]">
                  <span>Asesoramiento Gratis</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Card de producto destacado */}
            <div className="lg:w-1/2 flex justify-center lg:justify-end animate-fadeInUp" style={{ animationDelay: '300ms' }}>
              <div className="relative group w-full max-w-md">
                <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-amber-500/30 via-rose-500/30 to-fuchsia-500/30 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-500 rounded-2xl opacity-30 group-hover:opacity-60 transition-opacity duration-500 blur-sm pointer-events-none" />
               
                <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl p-2 sm:p-3 border border-white/10 shadow-2xl shadow-rose-900/30 group-hover:shadow-rose-900/50 transition-all duration-500 group-hover:scale-[1.01]">
                  <div className="flex items-center justify-between px-3 py-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500/80" />
                      </div>
                      <span className="text-[10px] text-slate-500 tracking-wider ml-2 font-mono">producto-destacado</span>
                    </div>
                    <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/30">
                      <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-[9px] font-semibold text-amber-300 tracking-wider uppercase">Nuevo</span>
                    </span>
                  </div>

                  <div className="relative overflow-hidden rounded-xl aspect-[4/5]">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10 pointer-events-none" />
                    <Image
                      src="/img/vestido-dorado.jpg"
                      alt="Vestido Elegance Dorado"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      width={780}
                      height={975}
                      priority
                    />
                    <div className="absolute bottom-3 left-3 right-3 z-20 flex items-end justify-between gap-2">
                      <div className="px-3 py-2 rounded-lg bg-slate-900/80 backdrop-blur-md border border-white/10">
                        <span className="text-sm font-bold text-white">$ 15.990</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Vestido de noche</span>
                      </div>
                      <button className="group/btn flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 transition-all duration-300 shadow-lg shadow-rose-500/30">
                        <span className="text-[10px] font-semibold text-white tracking-wider uppercase">Ver más</span>
                        <svg className="w-3 h-3 text-white transition-transform duration-300 group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <h3 className="text-sm font-bold text-white line-clamp-1 mb-3 group-hover:text-amber-300 transition-colors duration-300">Vestido Elegance Dorado</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors duration-300">
                        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                        <span className="text-[10px] font-semibold text-white">M</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider">Talle</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors duration-300">
                        <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                        <span className="text-[10px] font-semibold text-white">Dorado</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider">Color</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors duration-300">
                        <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                        <span className="text-[10px] font-semibold text-white">Seda</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider">Material</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-amber-400/20 to-rose-500/20 rounded-2xl blur-xl animate-pulse pointer-events-none" />
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-rose-400/20 to-fuchsia-500/20 rounded-xl blur-lg animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <br />

      {/* ═══════════════════════════════════════════════════════
          🏆 COLECCIÓN DESTACADA - DINÁMICA
          ═══════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <FaStar className="text-amber-400" />
                Colección Destacada
              </h2>
              <p className="text-slate-400 mt-2 text-sm sm:text-base">Las prendas favoritas de nuestras clientas</p>
            </div>
            <Link href="/productos?destacado=true" className="text-rose-400 hover:text-rose-300 font-medium flex items-center gap-2 text-sm sm:text-base">
              Ver todas <FaArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredLoading ? (
            <ProductsSectionLoader />
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FaShoppingBag className="text-4xl mb-3 mx-auto opacity-50" />
              <p>No hay productos destacados en este momento</p>
              <Link href="/productos" className="text-rose-400 hover:text-rose-300 mt-4 inline-block text-sm">
                Ver toda la colección →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featuredProducts.map((prod) => (
                <ProductCard key={prod._id} product={prod} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          📂 EXPLORAR POR CATEGORÍA
          ═══════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
              Comprar por Categoría
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto px-2 text-sm sm:text-base">
              Encontrá exactamente lo que buscás para armar tu look perfecto
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {clothingCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/productos?categoria=${cat.slug}`}
                className="group p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-700/50 hover:border-rose-500/40 hover:bg-slate-800/90 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl sm:text-3xl">{cat.icon}</span>
                  <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-rose-500/20 text-rose-400 text-[10px] sm:text-xs font-medium">
                    {cat.count}
                  </span>
                </div>
                <h3 className="text-white font-semibold group-hover:text-rose-400 transition-colors text-sm sm:text-base">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          🛍️ NUEVA COLECCIÓN - LISTADO GENERAL
          ═══════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                Nueva Colección
              </h2>
              <p className="text-slate-400 mt-2 text-sm">
                {productsLoading ? 'Cargando...' : `${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''} disponible${filteredProducts.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <Link href="/productos" className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium transition-all shadow-lg shadow-rose-900/30 text-sm">
              <FaSearch className="w-4 h-4" />
              Ver todos los filtros
            </Link>
          </div>

          {productsLoading ? (
            <ProductsSectionLoader />
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FaSearch className="text-4xl mb-3 mx-auto opacity-50" />
              <p>{searchQuery ? `No se encontraron productos para "${searchQuery}"` : 'No hay productos disponibles'}</p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="mt-4 text-rose-400 hover:text-rose-300 font-medium text-sm">
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.slice(0, 6).map((prod) => (
                <ProductCard key={prod._id} product={prod} />
              ))}
            </div>
          )}

          <div className="text-center mt-8 sm:mt-10">
            <Link href="/productos" className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:border-rose-500/40 hover:text-white transition-all font-medium text-sm">
              Ver más productos
              <FaArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          📞 CTA SECTION - ASESORAMIENTO
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            ¿Necesitás ayuda para encontrar tu talle o estilo ideal?
          </h2>
          <p className="text-base sm:text-xl text-slate-400 mb-8 sm:mb-10 px-2">
            Nuestro equipo de estilistas está listo para asesorarte y encontrar la prenda perfecta que te haga brillar.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <a
              href="https://wa.me/5491132538837?text=Hola,%20me%20interesa%20consultar%20por%20un%20producto%20y%20necesito%20asesoramiento%20de%20talle"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all shadow-lg shadow-emerald-900/30 text-sm"
            >
              <FaWhatsapp className="w-4 h-4 sm:w-5 h-5" />
              Consultar por WhatsApp
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:border-rose-500/40 hover:text-white transition-all font-semibold text-sm"
            >
              Enviar consulta por mail
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          🎯 MODAL DE PRODUCTO (VISTA RÁPIDA)
          ═══════════════════════════════════════════════════════ */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-rose-900/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-slate-900/95 backdrop-blur-xl border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500/80" />
                </div>
                <span className="text-[10px] text-slate-500 tracking-wider ml-2 font-mono">vista-rapida-producto</span>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid md:grid-cols-2">
              <div className="relative aspect-square md:aspect-auto">
                <Image
                  src={selectedProduct.imagen || '/img/producto-destacado.jpg'}
                  alt={selectedProduct.nombre}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:hidden" />
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <span className="text-xs text-rose-400 uppercase tracking-wider font-semibold">{selectedProduct.categoria}</span>
                  <h2 className="text-2xl font-bold text-white mt-1 mb-2">{selectedProduct.nombre}</h2>
                  <p className="text-3xl font-bold text-amber-400">
                    {formatPrice(selectedProduct.precio, selectedProduct.moneda)}
                  </p>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {selectedProduct.descripcion}
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                    <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Talle</span>
                    <p className="text-lg font-bold text-white">{selectedProduct.caracteristicas.talle}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                    <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Color</span>
                    <p className="text-lg font-bold text-white">{selectedProduct.caracteristicas.color}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                    <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Material</span>
                    <p className="text-lg font-bold text-white">{selectedProduct.caracteristicas.material}</p>
                  </div>
                </div>

                <a
                  href={`https://wa.me/5491132538837?text=${encodeURIComponent(`Hola, me interesa el producto: ${selectedProduct.nombre} (Talle: ${selectedProduct.caracteristicas.talle})`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold hover:from-emerald-500 hover:to-emerald-400 transition-all duration-300 shadow-lg shadow-emerald-500/30 inline-flex items-center justify-center gap-2"
                >
                  <FaWhatsapp className="w-5 h-5" />
                  Consultar Stock por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}