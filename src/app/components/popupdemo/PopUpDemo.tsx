'use client';

import { Gift, X } from "lucide-react";
import { useState, useEffect } from "react";






function PopUpDemo() {

    
  const [showPopup, setShowPopup] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');


     // Popup de salida
      useEffect(() => {
        const handleMouseLeave = (e: MouseEvent) => {
          if (e.clientY < 10 && !showPopup && !submitted) {
            setShowPopup(true);
          }
        };
        document.addEventListener('mouseleave', handleMouseLeave);
        return () => document.removeEventListener('mouseleave', handleMouseLeave);
      }, [showPopup, submitted]);
    
     
    
      const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
          setSubmitted(true);
          setTimeout(() => {
            window.open(`https://wa.me/5491132538837?text=Hola,%20quiero%20una%20demo%20del%20asistente%20IA.%20Mi%20email%20es%20${email}`, '_blank');
          }, 1500);
        }
      };
    return (
        <div>
          {/* ==========================================
          POPUP DE SALIDA (Exit Intent)
      ========================================== */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md mx-4 relative shadow-2xl">
            <button 
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">¡Esperá un momento!</h3>
              <p className="text-slate-400 mb-6">
                Dejá tu email y agendá una llamada con un asesor.
              </p>
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all"
                >
                  {submitted ? '¡Enviado! Redirigiendo...' : 'Agendar Demo'}
                </button>
              </form>
              <p className="text-xs text-slate-600 mt-4">
                Sin spam. Podés darte de baja cuando quieras.
              </p>
            </div>
          </div>
        </div>
      )}
        </div>
    );
}

export default PopUpDemo;
