import { useState } from 'react'

export default function LandingPage({ onOpenAuth }) {
  const [emailInput, setEmailInput] = useState('');

  const handleQuickRegister = (e) => {
    e.preventDefault();
    if (emailInput) {
      onOpenAuth('signup', emailInput);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center border-b border-slate-800/80 sticky top-0 bg-slate-950/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-slate-800 flex items-center justify-center font-black text-white text-sm shadow-sm border border-rose-500/20">
            V
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-100 tracking-tight leading-none">
              LA VITRINA <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">del Coleccionista</span>
            </span>
            <span className="text-[9px] font-mono font-semibold text-rose-400 mt-0.5">● BARBIE DIVISION</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onOpenAuth('login')}
            className="text-slate-300 hover:text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            Acceso Miembros
          </button>
          <button 
            onClick={() => onOpenAuth('signup')}
            className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition border border-rose-500/30"
          >
            Registro Beta
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300 text-xs font-medium">Plataforma de Inteligencia de Activos • Módulo Barbie</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
          Gestión de Portafolios y Valoración en Tiempo Real para <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-rose-500 to-pink-500">Coleccionistas de Barbie</span>
        </h1>
        
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Indexación automatizada, tasación peritada multicanal e identificación por visión artificial adaptada a piezas vintage y colecciones modernas.
        </p>

        {/* Captura de Licencia */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md mx-auto text-left">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-300">Programa Fundadores</span>
            <span className="text-[11px] font-mono font-medium text-rose-400 bg-rose-950/60 border border-rose-800/50 px-2.5 py-0.5 rounded-md">
              12 / 50 Licencias Vitalicias
            </span>
          </div>

          <form onSubmit={handleQuickRegister} className="space-y-3">
            <input 
              type="email" 
              required
              placeholder="correo@ejemplo.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
            />
            <button 
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-3.5 rounded-xl shadow-lg transition tracking-wide"
            >
              Solicitar Licencia Vitalicia Gratuita
            </button>
          </form>
          <p className="text-[10px] text-slate-500 mt-3 text-center">
            Acceso garantizado de por vida sin cuotas recurrentes para las primeras 50 plazas.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t border-slate-800/80 bg-slate-900/40 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-mono text-sm mb-4">
                01
              </div>
              <h3 className="text-sm font-bold text-white mb-2">Reconocimiento Visión AI</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Algoritmos multimodales para la identificación de moldes faciales, líneas de colección y validación de conservación NFRB/NRFB.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-mono text-sm mb-4">
                02
              </div>
              <h3 className="text-sm font-bold text-white mb-2">Auditoría Multicanal</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Monitoreo cruzado de precios en Vinted Europa, Amazon Retail, Wallapop y subastas peritadas de Catawiki e eBay.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-mono text-sm mb-4">
                03
              </div>
              <h3 className="text-sm font-bold text-white mb-2">Certificación para Seguros</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generación de informes de activos con desglose de inventario para coberturas de seguros de hogar y peritajes de colección.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-slate-900 text-center text-xs text-slate-600">
        © 2026 La Vitrina del Coleccionista. Todos los derechos reservados.
      </footer>
    </div>
  );
}