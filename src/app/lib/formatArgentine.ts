// app/lib/formatArgentine.ts

// ✅ Parsear número argentino (coma decimal, punto miles) a número real
export const parseArgentineNumber = (input: string): number | null => {
  if (!input?.trim()) return null;
  
  let clean = input.replace(/[^\d.,]/g, '');
  if (!clean) return null;

  const commaCount = (clean.match(/,/g) || []).length;
  
  // Si hay más de 1 coma, es inválido
  if (commaCount > 1) return null;
  
  if (commaCount === 1) {
    // Formato argentino: 1.234,56 → 1234.56
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else {
    // Sin coma decimal: 1.234 → 1234
    clean = clean.replace(/\./g, '');
  }

  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
};

// ✅ Formateo visual MIENTRAS escribe (sin forzar decimales)
export const formatArgentineInput = (input: string): string => {
  if (!input?.trim()) return '';
  
  // Solo permitir dígitos, coma y punto
  let clean = input.replace(/[^\d.,]/g, '');
  
  // Si hay más de 1 coma, mantener solo la última como decimal
  const parts = clean.split(',');
  if (parts.length > 2) {
    clean = parts[0] + ',' + parts.slice(1).join('');
  }
  
  return clean;
};

// ✅ Formateo final AL SALIR del campo (con 2 decimales)
export const formatArgentineFinal = (value: number | null, currency = 'ARS'): string => {
  if (value === null || isNaN(value)) return '';
  
  if (currency === 'USD') {
    return `$ ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  return formatARS(value);
};

// ✅ Formato ARS ya existente (por si no lo tenés)
export const formatARS = (value: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};