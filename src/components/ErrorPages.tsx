/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, BookOpen, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';

interface ErrorPageProps {
  onBackToHome: () => void;
}

export function NotFoundPage({ onBackToHome }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col justify-center items-center p-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(90,45,26,0.2),transparent)]" />
      <div className="relative z-10 max-w-md space-y-6">
        <div className="bg-[#5A2D1A]/20 border border-[#5A2D1A]/30 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-[#D4AF37]">
          <ShieldAlert className="h-8 w-8" />
        </div>
        
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest font-mono">Código de Error: 404</span>
          <h1 className="font-display text-3xl font-bold tracking-tight">Página No Encontrada</h1>
          <p className="text-xs text-neutral-400 font-light leading-relaxed">
            La página que intenta buscar no existe o ha sido movida temporalmente. Por favor verifique el enlace de correspondencia.
          </p>
        </div>

        <button
          onClick={onBackToHome}
          className="inline-flex items-center space-x-2 bg-[#5A2D1A] hover:bg-[#7D4229] text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md"
        >
          <ArrowLeft className="h-4 w-4 text-[#D4AF37]" />
          <span>Volver al Inicio</span>
        </button>
      </div>
    </div>
  );
}

export function MaintenancePage({ onBackToHome }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col justify-center items-center p-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.06),transparent)]" />
      <div className="relative z-10 max-w-md space-y-6">
        <div className="bg-neutral-800/80 border border-neutral-700 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-[#D4AF37]">
          <Clock className="h-8 w-8" />
        </div>
        
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">Mantenimiento Preventivo</span>
          <h1 className="font-display text-3xl font-bold tracking-tight">Ecosistema en Actualización</h1>
          <p className="text-xs text-neutral-400 font-light leading-relaxed">
            Nuestros ingenieros de TI están optimizando las bases de datos de calificaciones para el periodo P4. El portal volverá a estar en línea de inmediato.
          </p>
        </div>

        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex items-center space-x-3 text-left w-fit mx-auto">
          <AlertTriangle className="h-5 w-5 text-[#D4AF37] shrink-0" />
          <span className="text-[10px] text-neutral-400 font-light leading-snug">Tiempo estimado de restablecimiento: 20 minutos.</span>
        </div>

        <button
          onClick={onBackToHome}
          className="inline-flex items-center space-x-2 text-neutral-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Inicio</span>
        </button>
      </div>
    </div>
  );
}
