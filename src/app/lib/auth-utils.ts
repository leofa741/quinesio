// lib/auth-utils.ts

export type UserRole = 'admin' | 'profesionales' | 'administrativos' | 'pacientes';

/**
 * ✅ Verifica si el rol es de personal interno (staff)
 */
export const isStaffRole = (role: string | null | undefined): role is Exclude<UserRole, 'pacientes'> => {
  return role === 'admin' || role === 'profesionales' || role === 'administrativos';
};

/**
 * ✅ Verifica si el rol es de paciente
 */
export const isPatientRole = (role: string | null | undefined): role is UserRole => {
  return role === 'pacientes';
};

/**
 * ✅ Obtiene la ruta de redirección por defecto según el rol
 */
export const getDefaultRouteByRole = (role: string | null | undefined): string => {
  if (isStaffRole(role)) return '/gestion';
  if (isPatientRole(role)) return '/turnos';
  return '/'; // Fallback para roles desconocidos
};