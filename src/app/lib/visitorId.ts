// app/lib/visitorId.ts
export const getVisitorId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let visitorId = localStorage.getItem('visitor_id');
  
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('visitor_id', visitorId);
  }
  
  return visitorId;
};