// app/lib/jwt.ts

// ✅ Decodificar JWT (Base64URL → JSON) de forma segura
export const parseJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) throw new Error('Token mal formado');
    
    const base64 = base64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT:', e);
    throw new Error('Token JWT inválido o expirado');
  }
};