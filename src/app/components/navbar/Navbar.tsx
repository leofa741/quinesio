'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faXmark,
  faChevronDown,
  faChevronUp,
  faSearch,
  faPhone,
  faLocationDot,
  faArrowRight,

} from '@fortawesome/free-solid-svg-icons';
import { useSession, signOut } from 'next-auth/react';
import { AuthContext } from '@/app/context/AuthContext';
import { faInstagram, faLinkedin, faWhatsapp } from '@fortawesome/free-brands-svg-icons';


// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────
interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  scrolled: boolean;
  active?: boolean;
  onHover?: () => void;
  onLeave?: () => void;
}

interface MobileNavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  index?: number;
}

interface SocialLink {
  icon: any;
  href: string;
  label: string;
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function Navbar() {
  const { data: session } = useSession();
  const { userRole, setUserRole, userName, userEmail } = useContext(AuthContext);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktopCategoriesOpen, setIsDesktopCategoriesOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [categories, setCategories] = useState<{ name: string; slug: string; count?: number }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const watsapp = 5491132538837
  const mensaje = 'Hola,%20me%20interesa%20consultar%20por%20una%20propiedad'


  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // En tu Navbar.tsx, dentro del useEffect que carga categorías:

  // 🔹 En el useEffect que carga categorías (dentro de Navbar):
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/gestion/public/categorias');
        const data = await res.json();

        // ✅ CORREGIDO: Usar tiposPropiedad en lugar del objeto completo
        // Esto muestra: terreno, departamento, casa, etc.
        setCategories(data.tiposPropiedad || []);

        // Si querés mostrar categorías (residencial, comercial, etc.), usá:
        // setCategories(data.categorias || []);

      } catch (error) {
        console.error('Error:', error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
      if (isDesktopCategoriesOpen) setIsDesktopCategoriesOpen(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDesktopCategoriesOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.style.overflow = isMenuOpen ? 'hidden' : '';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isMenuOpen]);

  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: '/' });
    localStorage.removeItem('token');
    localStorage.removeItem('purchaseData');
    localStorage.removeItem('cart');
    setUserRole('guest');
  }, [setUserRole]);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    setMobileCategoryOpen(false);
    setIsDesktopCategoriesOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const role = session?.user?.role || userRole;
  const name = session?.user?.name || userName;
  const email = session?.user?.email || userEmail;
  const image = session?.user?.image;


  // 🎨 Paleta Premium - Gradientes sofisticados
  const gradients = {
    primary: 'from-indigo-500 via-purple-500 to-pink-500',
    accent: 'from-cyan-400 via-blue-500 to-violet-500',
    subtle: 'from-slate-900 via-slate-900 to-slate-900',
    glow: 'from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20',
  };

  const socialLinks: SocialLink[] = [
    { icon: faInstagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: faLinkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: faWhatsapp, href: `https://wa.me/${watsapp}?text=${mensaje}`, label: 'WhatsApp' },
  ];

  if (!isMounted) return null;


  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          NAVBAR PRINCIPAL - ULTRA PREMIUM
          ═══════════════════════════════════════════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${scrolled
          ? 'bg-slate-900/80 backdrop-blur-2xl shadow-2xl shadow-purple-900/20 border-b border-white/5'
          : 'bg-gradient-to-b from-slate-900/70 via-slate-900/30 to-transparent'
          }`}
      >
        {/* ✨ Glow ambiental sutil */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${gradients.glow} opacity-0 transition-opacity duration-700 ${scrolled ? 'opacity-100' : 'opacity-0'
            }`}
          style={{ filter: 'blur(150px)' }}
          aria-hidden="true"
        />



        {/* ───────── MAIN NAV ───────── */}
        <div className={`max-w-7xl mx-auto px-4 lg:px-8 transition-all duration-500 ${scrolled ? 'py-3' : 'py-6'}`}>
          <div className="flex items-center justify-between">

            {/* ✨ LOGO CON EFECTO HOVER */}
            <div className="order-1 lg:order-2">
              <Link href="/" onClick={closeMenu} className="block group">
                <div className="flex flex-col items-center lg:items-start">
                  <div className="relative">
                    {/* Glow detrás del logo */}
                    <span className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 via-purple-500/30 to-pink-500/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <Image
                      src="/img/logo-oro-removebg-preview.png"
                      alt="Luxury Real Estate"
                      width={scrolled ? 90 : 180}
                      height={scrolled ? 40 : 130}
                      priority
                      className="relative transition-all duration-500 drop-shadow-lg group-hover:drop-shadow-2xl"
                    />
                  </div>
                  <span className={`text-[15px] tracking-[0.4em] uppercase mt-0 font-light transition-colors duration-500 mt-0 ${scrolled ? 'text-slate-500' : 'text-slate-400'
                    } group-hover:text-purple-200`}>
                    S.G. Tu Look 
                  </span>
                </div>
              </Link>
            </div>

            {/* ───────── DESKTOP NAV ───────── */}
            <div className="order-3 hidden lg:flex items-center space-x-1">
              <NavLink
                href="/"
                scrolled={scrolled}
                active={hoveredLink === 'home'}
                onHover={() => setHoveredLink('home')}
                onLeave={() => setHoveredLink(null)}
              >
                Inicio
              </NavLink>


              {/* ✨ Dropdown Categorías Premium - CON DELAY Y MEJOR UX */}
              <div
                className="relative"
                onMouseEnter={() => {
                  // Limpiar timeout de cierre si existe
                  if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current);
                    closeTimeoutRef.current = null;
                  }
                  setIsDesktopCategoriesOpen(true);
                  setHoveredLink('properties');
                }}
                onMouseLeave={() => {
                  // 🔹 Delay de 200ms antes de cerrar (da tiempo de mover el mouse)
                  closeTimeoutRef.current = setTimeout(() => {
                    setIsDesktopCategoriesOpen(false);
                    setHoveredLink(null);
                  }, 200);
                }}
              >
                <button
                  className={`flex items-center space-x-1.5 text-[11px] tracking-[0.3em] uppercase font-medium transition-all duration-300 py-2 group ${scrolled ? 'text-slate-300' : 'text-white'
                    } hover:text-white`}
                  aria-haspopup="true"
                  aria-expanded={isDesktopCategoriesOpen}
                >
                  <span className="relative">
                    Propiedades
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 transition-all duration-500 group-hover:w-full" />
                  </span>
                  <FontAwesomeIcon
                    icon={isDesktopCategoriesOpen ? faChevronUp : faChevronDown}
                    className={`text-[10px] transition-all duration-300 ${isDesktopCategoriesOpen ? 'text-purple-400 rotate-180' : 'text-slate-500 group-hover:text-purple-400'
                      }`}
                  />
                </button>

                {/* 🔹 Dropdown con área de hover extendida */}
                {isDesktopCategoriesOpen && (
                  <>
                    {/* 🔹 Zona "puente" invisible entre botón y menú (evita cierre accidental) */}
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 w-72 h-4 z-40"
                      onMouseEnter={() => {
                        if (closeTimeoutRef.current) {
                          clearTimeout(closeTimeoutRef.current);
                          closeTimeoutRef.current = null;
                        }
                      }}
                      onMouseLeave={() => {
                        closeTimeoutRef.current = setTimeout(() => {
                          setIsDesktopCategoriesOpen(false);
                          setHoveredLink(null);
                        }, 200);
                      }}
                    />

                    {/* 🔹 Menú principal con animación y delay de entrada */}
                    <div
                      className="absolute top-[calc(100%+1rem)] left-1/2 -translate-x-1/2 w-72 z-50 animate-fadeInUp"
                      onMouseEnter={() => {
                        if (closeTimeoutRef.current) {
                          clearTimeout(closeTimeoutRef.current);
                          closeTimeoutRef.current = null;
                        }
                      }}
                      onMouseLeave={() => {
                        closeTimeoutRef.current = setTimeout(() => {
                          setIsDesktopCategoriesOpen(false);
                          setHoveredLink(null);
                        }, 200);
                      }}
                    >
                      {/* Glow exterior */}
                      <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradients.accent} opacity-40 blur-lg rounded-2xl transition-opacity duration-300 ${isDesktopCategoriesOpen ? 'opacity-40' : 'opacity-0'}`} />

                      <div className="relative bg-slate-900/95 backdrop-blur-2xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-900/30">
                        {/* Header con gradiente */}
                        <div className={`h-px bg-gradient-to-r ${gradients.accent} opacity-60 transition-opacity duration-300 ${isDesktopCategoriesOpen ? 'opacity-60' : 'opacity-0'}`} />

                        <div className="py-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                          {loadingCategories ? (
                            <span className="block px-6 py-4 text-slate-500 text-sm italic">Cargando...</span>
                          ) : categories.length > 0 ? (
                            categories.map((cat, index) => (
                              <Link
                                key={cat.slug}
                                href={`/propiedades?tipo=${cat.slug}`}
                                className="group/item relative block px-6 py-3.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 overflow-hidden"
                                onClick={() => {
                                  closeMenu();
                                  setIsDesktopCategoriesOpen(false);
                                }}
                                onMouseEnter={(e) => {
                                  // Efecto hover sutil en el item
                                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '';
                                }}
                                style={{ animationDelay: `${index * 25}ms` }}
                              >
                                {/* Background hover con gradiente sutil */}
                                <span className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-500/5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200" />

                                {/* Indicador lateral animado */}
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-gradient-to-b from-cyan-400 to-violet-500 group-hover/item:h-full transition-all duration-300 rounded-r" />

                                <span className="relative flex items-center justify-between pl-3">
                                  {cat.name}
                                  {/* Badge con count */}
                                  <span className="ml-2 px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-medium">
                                    {cat.count}
                                  </span>
                                  <FontAwesomeIcon icon={faArrowRight} className="text-xs text-slate-600 group-hover/item:text-purple-400 transition-all duration-300 transform group-hover/item:translate-x-1" />
                                </span>
                              </Link>
                            ))
                          ) : (
                            <span className="block px-6 py-4 text-slate-500 text-sm italic">Sin categorías</span>
                          )}
                        </div>

                        <div className={`h-px bg-gradient-to-r ${gradients.accent} opacity-30 transition-opacity duration-300 ${isDesktopCategoriesOpen ? 'opacity-30' : 'opacity-0'}`} />
                      </div>
                    </div>
                  </>
                )}
              </div>


              <NavLink href="/contact" scrolled={scrolled}>Contacto</NavLink>
              <NavLink href="/about" scrolled={scrolled}>Nosotros</NavLink>
            </div>

            {/* ───────── RIGHT ACTIONS ───────── */}
            <div className="order-2 lg:order-4 flex items-center space-x-3">





              {/* Auth - Desktop con botones premium */}
              {session ? (
                <div className="hidden lg:flex items-center space-x-4">
                  <Link href="/profile" className={`group flex items-center space-x-2.5 transition-all duration-300 ${scrolled ? 'text-slate-300' : 'text-white'
                    } hover:text-white`}>
                    <div className={`relative w-8 h-8 rounded-full bg-gradient-to-br ${gradients.accent} flex items-center justify-center text-white text-xs font-medium shadow-lg shadow-purple-900/40 group-hover:shadow-purple-900/60 transition-shadow duration-300`}>
                      <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {image ? (<img src={image} alt="Profile" className="w-8 h-8 rounded-full" />) : (name?.charAt(0) || 'U')}

                    </div>
                    <div className='flex flex-col'>
                      <span
                        className="text-xs font-light">Mi perfil</span>



                      <div>
                        <span className="font-medium tracking-wide">{name?.split(' ')[0]}</span>
                      </div>
                    </div>
                  </Link>

                  {(role === 'admin' || role === 'vendedor') && (
                    <Link
                      href="/gestion"
                      className={`group relative text-[10px] px-4 py-2 rounded-xl font-medium tracking-wide uppercase transition-all duration-500 overflow-hidden ${scrolled ? 'bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90' : `bg-gradient-to-r ${gradients.primary}`
                        } text-white hover:shadow-xl hover:shadow-purple-900/40`}
                    >
                      <span className="relative z-10">Panel</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (typeof handleLogout === "function") {
                        handleLogout();
                      }
                    }}
                    className={`
    relative z-50 pointer-events-auto cursor-pointer
    text-[10px] tracking-[0.25em] uppercase transition-all duration-300 
    ${scrolled ? 'text-slate-500 hover:text-purple-400' : 'text-slate-400 hover:text-purple-300'}
    hover:translate-x-0.5
  `}
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <div className="hidden lg:flex items-center space-x-3">
                  {/* Botón Ingresar - Estilo minimalista premium */}
                  <Link
                    href="/login"
                    className={`group relative text-[11px] tracking-[0.25em] uppercase font-medium py-2 px-1 transition-all duration-300 ${scrolled ? 'text-slate-300' : 'text-white'
                      } hover:text-white`}
                  >
                    <span className="relative z-10">Ingresar</span>
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 transition-all duration-500 group-hover:w-full" />
                  </Link>

                  {/* Botón Registrarse - Estilo premium con gradiente animado */}
                  <Link
                    href="/register"
                    className="group relative text-[10px] px-5 py-2.5 rounded-xl tracking-[0.18em] uppercase font-medium overflow-hidden"
                  >
                    {/* Gradiente base */}
                    <span className={`absolute inset-0 bg-gradient-to-r ${gradients.primary} transition-opacity duration-500`} />
                    {/* Shine effect */}
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                    {/* Border glow */}
                    <span className="absolute inset-0 rounded-xl border border-white/20 group-hover:border-white/40 transition-colors duration-300" />

                    <span className="relative z-10 text-white drop-shadow-sm">Registrarse</span>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button - Animado */}
              <button
                type="button"
                onClick={toggleMobileMenu}
                className={`lg:hidden group relative p-2.5 rounded-xl transition-all duration-300 ${scrolled ? 'text-white' : 'text-white'
                  } hover:bg-white/10`}
                aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={isMenuOpen}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-pink-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                <FontAwesomeIcon
                  icon={isMenuOpen ? faXmark : faBars}
                  className="relative text-2xl transition-transform duration-300 group-hover:scale-110"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Línea inferior animada */}
        <div className={`h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent transition-all duration-700 ${scrolled ? 'opacity-100' : 'opacity-0'
          }`} />
      </nav>

      {/* ═══════════════════════════════════════════════════════
          MOBILE MENU - ULTRA PREMIUM
          ═══════════════════════════════════════════════════════ */}
      {isMenuOpen && (
        <>
          {/* Backdrop con animación de entrada */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/90 backdrop-blur-xl lg:hidden animate-fadeIn"
            onClick={closeMenu}
          >
            {/* Orbes de gradiente animados */}
            <div className="absolute top-1/4 -left-16 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 -right-16 w-64 h-64 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Panel del menú con animación slide + stagger */}
          <div
            className="fixed top-0 right-0 h-full w-full max-w-sm z-50 bg-slate-900/95 backdrop-blur-2xl shadow-2xl lg:hidden animate-slideInRight"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">

              {/* Header elegante */}
              <div className="flex justify-between items-center p-7 border-b border-white/10">
                <span className="text-[10px] tracking-[0.35em] uppercase text-slate-500">Menú</span>
                <button
                  onClick={closeMenu}
                  className="group p-2.5 hover:bg-white/10 rounded-xl transition-all duration-300"
                  aria-label="Cerrar menú"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-xl text-slate-400 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
                </button>
              </div>


              {/* Navigation Links con stagger animation */}
              <nav className="flex-1 overflow-y-auto py-4 px-6 space-y-1">
                <MobileNavLink href="/" onClick={closeMenu} index={0}>Inicio</MobileNavLink>

                {/* Categorías - Toggle elegante */}
                <div>
                  <button
                    onClick={() => setMobileCategoryOpen(prev => !prev)}
                    className="w-full group flex justify-between items-center py-4 px-4 text-slate-200 hover:text-white transition-all duration-300 rounded-xl"
                  >
                    <span className="text-sm tracking-[0.25em] uppercase font-medium">Propiedades</span>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={mobileCategoryOpen ? faChevronUp : faChevronDown}
                        className={`text-slate-500 transition-all duration-500 ${mobileCategoryOpen ? 'text-purple-400' : 'group-hover:text-purple-400'}`}
                      />
                    </div>
                  </button>

                  {/* Submenú con animación suave */}
                  <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${mobileCategoryOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
                    }`}>
                    <div className="ml-4 pl-4 border-l border-white/10 space-y-1">
                      {loadingCategories ? (
                        <p className="py-4 px-4 text-slate-500 text-sm italic">Cargando...</p>
                      ) : categories.length > 0 ? (
                        categories.map((cat, index) => (
                          <Link
                            key={cat.slug}
                            href={`/propiedades?tipo=${cat.slug}`}

                            onClick={closeMenu}
                            className="group/item block py-3.5 px-4 text-slate-400 hover:text-white transition-all duration-300 rounded-lg text-sm relative overflow-hidden"
                            style={{ animationDelay: `${index * 25}ms` }}
                          >
                            {/* Indicador de gradiente */}
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 opacity-0 group-hover/item:opacity-100 transition-all duration-300" />
                            <span className="pl-4 relative flex items-center justify-between">
                              {cat.name}
                              <FontAwesomeIcon icon={faArrowRight} className="text-xs text-slate-600 group-hover/item:text-purple-400 transition-all duration-300 transform group-hover/item:translate-x-1" />
                            </span>
                          </Link>
                        ))
                      ) : (
                        <p className="py-4 px-4 text-slate-500 text-sm italic">Sin categorías</p>
                      )}
                    </div>
                  </div>
                </div>

                <MobileNavLink href="/contact" onClick={closeMenu} index={1}>Contacto</MobileNavLink>
                <MobileNavLink href="/about" onClick={closeMenu} index={2}>Nosotros</MobileNavLink>

                {/* Auth Mobile */}
                {session ? (
                  <div className="pt-8 mt-6 border-t border-white/10">
                    <Link
                      href="/profile"
                      onClick={closeMenu}
                      className="group flex items-center space-x-4 py-4 px-4 text-slate-200 hover:text-white hover:bg-white/5 transition-all duration-300 rounded-xl"
                    >
                      <div className={`relative w-11 h-11 rounded-full bg-gradient-to-br ${gradients.accent} flex items-center justify-center text-white text-sm font-medium shadow-lg`}>
                        <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {image ? (<img src={image} alt="Profile" className="w-8 h-8 rounded-full" />) : (name?.charAt(0) || 'U')}
                      </div>
                      <div>
                        <p className="font-medium">{name || email}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{role}</p>
                      </div>
                    </Link>

                    {(role === 'admin' || role === 'vendedor') && (
                      <Link
                        href="/gestion"
                        onClick={closeMenu}
                        className={`group block py-4 px-4 text-sm font-medium rounded-xl transition-all duration-500 bg-gradient-to-r ${gradients.primary} text-white mt-3 relative overflow-hidden`}
                      >
                        <span className="relative z-10">Panel de Gestión</span>
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      </Link>
                    )}

                    <button
                      onClick={() => { closeMenu(); handleLogout(); }}
                      className="w-full text-left py-4 px-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 rounded-xl font-medium mt-3 group"
                    >
                      <span className="flex items-center space-x-2">
                        <span>Cerrar Sesión</span>
                        <FontAwesomeIcon icon={faArrowRight} className="text-xs opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-8 mt-6 border-t border-white/10 space-y-3">
                    <Link
                      href="/login"
                      onClick={closeMenu}
                      className="group block w-full py-4 px-6 bg-gradient-to-r from-slate-800 to-slate-700 text-white text-center tracking-[0.2em] uppercase text-[11px] font-medium rounded-xl transition-all duration-500 hover:from-slate-700 hover:to-slate-600 relative overflow-hidden"
                    >
                      <span className="relative z-10">Iniciar Sesión</span>
                      <span className="absolute inset-0 rounded-xl border border-white/10 group-hover:border-purple-500/30 transition-colors duration-300" />
                    </Link>
                    <Link
                      href="/register"
                      onClick={closeMenu}
                      className={`group relative block w-full py-4 px-6 bg-gradient-to-r ${gradients.primary} text-white text-center tracking-[0.2em] uppercase text-[11px] font-medium rounded-xl transition-all duration-500 overflow-hidden`}
                    >
                      <span className="relative z-10">Crear Cuenta</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </Link>
                  </div>
                )}
              </nav>

              {/* Footer elegante */}
              <div className="p-7 border-t border-white/10 bg-slate-900/30">
                <div className="flex justify-center space-x-6">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative text-slate-500 hover:text-white transition-all duration-300"
                      aria-label={social.label}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-pink-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <FontAwesomeIcon icon={social.icon} className="relative text-lg group-hover:scale-110 transition-transform duration-300" />
                    </a>
                  ))}
                </div>
                <p className="text-center text-[10px] text-slate-600 mt-5 tracking-[0.3em] uppercase">
                  Jimena Propiedades
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// NavLink - Efectos Premium
// ─────────────────────────────────────────────────────────────
function NavLink({ href, children, scrolled, active, onHover, onLeave }: NavLinkProps) {
  return (
    <Link
      href={href}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`group relative text-[11px] tracking-[0.3em] uppercase font-medium py-3 px-2 transition-all duration-300 ${scrolled ? 'text-slate-300' : 'text-white'
        } hover:text-white`}
    >
      {children}

      {/* Underline animado con gradiente */}
      <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-px bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${active ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'
        }`} />

      {/* Glow sutil debajo */}
      <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-cyan-400/30 via-purple-500/30 to-pink-500/30 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// MobileNavLink - Con stagger animation
// ─────────────────────────────────────────────────────────────
function MobileNavLink({ href, children, onClick, index = 0 }: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group block py-4 px-4 text-slate-300 hover:text-white transition-all duration-300 rounded-xl text-sm tracking-[0.25em] uppercase font-medium relative overflow-hidden animate-fadeInUp"
      style={{ animationDelay: `${index * 50 + 100}ms`, animationFillMode: 'both' }}
    >
      {/* Indicador de gradiente lateral */}
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-cyan-400 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-r-full blur-[1px]" />
      <span className="pl-5 relative flex items-center justify-between">
        {children}
        <FontAwesomeIcon icon={faArrowRight} className="text-xs text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
      </span>
    </Link>
  );
}