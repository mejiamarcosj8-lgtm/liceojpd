/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Compass, Shield, Clock, Calendar, CheckSquare, GraduationCap } from 'lucide-react';

export default function Academics() {
  const [activeTab, setActiveTab] = useState<'secundaria' | 'primaria' | 'inicial'>('secundaria');

  const content = {
    inicial: {
      title: 'Nivel Inicial (Maternal, Kinder y Pre-Primaria)',
      subtitle: 'La base afectiva, psicomotora e intelectual',
      desc: 'En el Nivel Inicial, priorizamos el juego interactivo, la estimulación temprana de las destrezas de comunicación y lógica, y la socialización en base a valores de amor y respeto mutuo. Aulas acondicionadas y personal especializado.',
      schedule: 'Lunes a Viernes — 08:00 AM a 12:30 PM',
      focus: ['Estimulación Psicomotora Avanzada', 'Iniciación a la Lecto-escritura', 'Inglés Temprano por Inmersión', 'Iniciación al Arte y Música']
    },
    primaria: {
      title: 'Nivel Primaria (1ro a 6to de Primaria)',
      subtitle: 'Pensamiento lógico y competencias fundamentales',
      desc: 'Enfocamos el desarrollo de las habilidades lógicas y lectoras, el pensamiento matemático abstracto, la curiosidad por el método científico e iniciación en robótica. Formamos bases robustas para que el aprendizaje sea un proceso fascinante.',
      schedule: 'Lunes a Viernes — 07:30 AM a 01:30 PM',
      focus: ['Matemáticas Aplicadas', 'Comprensión Lectora y Redacción', 'Ciencias de la Naturaleza Integradas', 'Introducción a Robótica Educativa']
    },
    secundaria: {
      title: 'Nivel Secundaria (1ro a 6to de Secundaria / Bachillerato)',
      subtitle: 'Prestigio, especialización y competencias universitarias',
      desc: 'Formamos bachilleres con competencias rigurosas en Ciencias de la Computación, Humanidades y Áreas Técnicas. Fuerte enfoque cívico, preparación de excelencia para universidades nacionales e internacionales, y destreza analítica avanzada.',
      schedule: 'Lunes a Viernes — 07:30 AM a 02:15 PM',
      focus: ['Bachillerato Académico en Ciencias y Tecnología', 'Inglés Avanzado y Oratoria Cívica', 'Cálculo Avanzado y Física Computacional', 'Laboratorios de Ciencias Clínicas']
    }
  };

  const current = content[activeTab];

  return (
    <section id="oferta-academica" className="py-24 bg-white text-neutral-900 scroll-mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#5A2D1A] font-bold text-xs uppercase tracking-widest bg-[#5A2D1A]/5 px-3 py-1.5 rounded-full inline-block">
            Oferta Académica
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-4 tracking-tight">
            Niveles Educativos de Alto Estándar
          </h2>
          <p className="mt-4 text-neutral-600 leading-relaxed font-light">
            Nuestros planes de estudio cumplen rigurosamente con el Currículo del Ministerio de Educación de la República Dominicana, robustecidos con cátedras adicionales de tecnología avanzada y formación en liderazgo cívico.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center border-b border-neutral-100 max-w-2xl mx-auto mb-12">
          {(['inicial', 'primaria', 'secundaria'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-center font-display text-sm font-semibold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === tab
                  ? 'border-[#5A2D1A] text-[#5A2D1A]'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              Nivel {tab === 'inicial' ? 'Inicial' : tab === 'primaria' ? 'Primaria' : 'Secundaria'}
            </button>
          ))}
        </div>

        {/* Active Tab Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-neutral-50 p-8 md:p-12 rounded-3xl border border-neutral-100 shadow-sm animate-fade-in">
          
          {/* Details Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold block">{current.subtitle}</span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#5A2D1A] tracking-tight">{current.title}</h3>
            </div>
            
            <p className="text-sm text-neutral-600 leading-relaxed font-light">{current.desc}</p>
            
            <div className="flex items-center space-x-3 text-[#5A2D1A] bg-white border border-neutral-100 px-4 py-3 rounded-xl w-fit">
              <Clock className="h-5 w-5 text-[#D4AF37]" />
              <span className="text-xs font-bold">{current.schedule}</span>
            </div>

            <div className="space-y-3 pt-4 border-t border-neutral-200/50">
              <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold block">Especialidades del Plan de Estudios</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {current.focus.map((f, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs text-neutral-700">
                    <CheckSquare className="h-4 w-4 text-[#D4AF37] shrink-0" />
                    <span className="font-medium">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Graphical/Illustrative Column */}
          <div className="lg:col-span-5 relative rounded-2xl overflow-hidden aspect-square bg-neutral-200 border border-neutral-100">
            <img
              src={
                activeTab === 'inicial'
                  ? 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80'
                  : activeTab === 'primaria'
                  ? 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80'
                  : 'https://images.unsplash.com/photo-1524486361537-8ad15938e1a3?w=600&auto=format&fit=crop&q=80'
              }
              alt={current.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-[#5A2D1A]/10" />
          </div>
        </div>

        {/* Academic Calendar Callout */}
        <div className="mt-16 bg-[#5A2D1A]/5 rounded-2xl p-6 md:p-8 border border-[#5A2D1A]/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="bg-[#5A2D1A]/10 p-3 rounded-xl text-[#5A2D1A]">
              <Calendar className="h-6 w-6 text-[#5A2D1A]" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold block">Calendario Escolar Oficial</span>
              <span className="text-sm font-bold text-neutral-800 block mt-0.5">Consulte fechas de evaluaciones, feriados y ceremonias.</span>
            </div>
          </div>
          <button className="bg-[#5A2D1A] hover:bg-[#7D4229] text-white px-6 py-3 rounded-lg text-xs font-bold tracking-wider uppercase transition-colors shadow-sm shrink-0">
            Descargar Calendario (PDF)
          </button>
        </div>

      </div>
    </section>
  );
}
