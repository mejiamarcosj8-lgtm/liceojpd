/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

interface OrganItem {
  id: string;
  title: string;
  desc: string;
  funcs: string[];
  integrantes: string;
}

interface GovernanceData {
  title: string;
  subtitle: string;
  organs: OrganItem[];
}

export default function Governance() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [data, setData] = useState<GovernanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/landing')
      .then((res) => res.json())
      .then((landing) => {
        if (landing && landing.governance) {
          setData(landing.governance);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading governance data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-neutral-500 text-xs font-mono">
        Cargando órganos institucionales...
      </div>
    );
  }

  const info = data || {
    title: "Órganos Institucionales",
    subtitle: "Democracia, Participación y Co-Gestión",
    organs: [
      {
        id: "org-1",
        title: 'Consejo Estudiantil',
        desc: 'Máximo órgano de representación de los estudiantes. Vela por la sana convivencia, la defensa de los derechos estudiantiles y la organización de actividades culturales y cívicas.',
        funcs: ['Canalizar inquietudes estudiantiles ante la dirección.', 'Organizar torneos deportivos e iniciativas solidarias.', 'Colaborar en las comisiones de disciplina y mediación de conflictos.'],
        integrantes: 'Presidente: Juan Pablo Duarte Hijo; Vicepresidenta: Camila Almonte; Secretaria: Sofía Bello.'
      },
      {
        id: "org-2",
        title: 'Consejo de Padres, Madres y Tutores (APMAE)',
        desc: 'Asociación que promueve la integración activa y coordinada de los representantes legales en las directrices de mejora pedagógica y comunitaria del liceo.',
        funcs: ['Apoyar planes de desarrollo y mantenimiento de infraestructura.', 'Garantizar canales de comunicación fluidos entre el hogar y el centro.', 'Organizar charlas formativas para padres (Escuela para Padres).'],
        integrantes: 'Presidente: Sr. Marcos Duarte; Tesorera: Sra. Sofía Almonte; Vocal: Sra. Clara Martínez.'
      },
      {
        id: "org-3",
        title: 'Gobierno Escolar',
        desc: 'Instancia representativa democrática que fomenta los liderazgos, simulando los procesos cívicos de la República Dominicana para inculcar civismo y respeto al orden constitucional.',
        funcs: ['Celebrar elecciones escolares anuales con supervisión de la Junta Central Electoral.', 'Presentar planes anuales de mejora de convivencia.', 'Gestionar el presupuesto de proyectos estudiantiles.'],
        integrantes: 'Gobernador Escolar: Estudiante Juan Pablo Duarte Hijo; Vicegobernadora: Camila Almonte.'
      }
    ]
  };

  // Safe fallback if activeTab is out of bounds
  const currentTab = activeTab >= info.organs.length ? 0 : activeTab;
  const currentOrgan = info.organs[currentTab] || info.organs[0];

  return (
    <section id="organos" className="py-24 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 scroll-mt-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#5A2D1A] dark:text-[#D4AF37] font-bold text-xs uppercase tracking-widest bg-[#5A2D1A]/5 dark:bg-[#D4AF37]/10 px-3 py-1.5 rounded-full inline-block">
            {info.title}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-4 tracking-tight text-neutral-900 dark:text-white">
            {info.subtitle}
          </h2>
        </div>

        {/* Tab Selection */}
        {info.organs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-2">
              {info.organs.map((org, idx) => (
                <button
                  key={org.id}
                  onClick={() => setActiveTab(idx)}
                  className={`w-full text-left p-5 rounded-xl border transition-all flex items-center space-x-3 ${
                    currentTab === idx
                      ? 'bg-[#5A2D1A] text-white border-[#5A2D1A] shadow-md dark:bg-neutral-800 dark:border-neutral-700'
                      : 'bg-neutral-50 border-neutral-100 dark:bg-neutral-800/40 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Users className="h-5 w-5 shrink-0 text-[#D4AF37]" />
                  <span className="font-display font-semibold text-xs uppercase tracking-wider">{org.title}</span>
                </button>
              ))}
            </div>

            {/* Details Card */}
            {currentOrgan && (
              <div className="lg:col-span-8 bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-100 dark:border-neutral-800 p-8 rounded-2xl shadow-sm space-y-6 animate-fade-in text-left">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">Estructura de Co-Gestión</span>
                  <h3 className="font-display text-2xl font-bold text-[#5A2D1A] dark:text-[#D4AF37]">{currentOrgan.title}</h3>
                </div>
                
                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
                  {currentOrgan.desc}
                </p>

                {currentOrgan.funcs && currentOrgan.funcs.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold block">Funciones y Competencias</span>
                    <div className="grid grid-cols-1 gap-2">
                      {currentOrgan.funcs.map((func, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-xs text-neutral-700 dark:text-neutral-300 font-light">
                          <span className="text-[#D4AF37] font-bold shrink-0">•</span>
                          <span>{func}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
                  <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold block mb-2">Composición Actual</span>
                  <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-4 rounded-xl text-xs text-neutral-600 dark:text-neutral-300 font-medium italic">
                    {currentOrgan.integrantes}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
