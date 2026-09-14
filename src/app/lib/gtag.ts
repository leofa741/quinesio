// lib/gtag.ts

// Declaración de tipos para TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_ADS_ID = 'AW-18201247782';

/**
 * Dispara un evento de conversión de Google Ads
 * @param sendTo - ID de la conversión (ej: 'AW-18201247782/5gGxCLDRi78cEKaAhOdD')
 * @param value - Valor opcional de la conversión
 * @param currency - Moneda (default: ARS)
 */
export const trackConversion = (
  sendTo: string = 'AW-18201247782/5gGxCLDRi78cEKaAhOdD',
  value?: number,
  currency: string = 'ARS'
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: sendTo,
      value: value,
      currency: currency,
    });
  }
};

/**
 * Dispara evento genérico de Google Ads
 */
export const trackAdsEvent = (
  action: string,
  params: Record<string, any> = {}
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, params);
  }
};