// lib/config/site.ts

export const siteConfig = {
  // 🏢 Información General
  name: "Centro Kinesiológico",
  description: "Recuperación, rehabilitación y bienestar integral. Atención profesional y personalizada.",
  url: "https://www.tudominio.com", // Cambia esto por tu dominio real
  logo: "/img/KORPER-removebg-preview.png", // Ruta al logo de tu sitio
  
  // 📞 Información de Contacto (Fuente de la verdad)
  contact: {
    whatsappNumber: "5491141461312", // Formato internacional SIN el '+'
    whatsappDisplay: "11 4146-1312", // Formato legible para humanos
    email: "contacto@kinesio.ar",
    adminEmail: "admin@tumarca.ar",  // Para recibir formularios
    address: "Buenos Aires, Argentina 🇦🇷",
    whatsappMessage: "Hola, me interesa consultar por un turno o servicio kinésico.", // Mensaje predeterminado
  },


  // 🕒 Horarios
  hours: {
    display: "Lunes a Sábados: 8:00 a 20:00 hs",
  },

  // 🌐 Redes Sociales
  social: {
    instagram: "https://instagram.com/tu_cuenta",
    facebook: "https://facebook.com/tu_cuenta",
    linkedin: "https://linkedin.com/company/tu-empresa",
  },

  // 🔗 Enlaces internos frecuentes
  links: {
    privacyPolicy: "/privacidad",
    terms: "/terminos",
    booking: "/turnos",
  },
} as const; // 'as const' hace que el objeto sea de solo lectura y mejora el autocompletado de TS