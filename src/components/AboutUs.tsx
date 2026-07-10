/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Eye, Target, Award, Play, History, Shield, CheckCircle } from 'lucide-react';

interface ValueItem {
  name: string;
  desc: string;
}

interface AboutUsData {
  title: string;
  subtitle: string;
  whoWeAre: string;
  philosophy: string;
  mission: string;
  vision: string;
  history: string;
  directorName: string;
  directorRole: string;
  directorPhoto: string;
  directorMsg: string;
  values: ValueItem[];
}

export default function AboutUs() {
  const [showVideo, setShowVideo] = useState(false);
  const [data, setData] = useState<AboutUsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/landing')
      .then((res) => res.json())
      .then((landing) => {
        if (landing && landing.aboutUs) {
          setData(landing.aboutUs);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading aboutUs data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-neutral-500 text-xs font-mono">
        Cargando sección institucional...
      </div>
    );
  }

  // Fallback defaults in case of empty data
  const info = data || {
    title: "Nuestra Institución",
    subtitle: "Formación con Rigor Académico y Conciencia Ciudadana",
    whoWeAre: "Fundado con la firme convicción de proveer una formación del más alto nivel, el Centro Educativo Juan Pablo Duarte conjuga las corrientes psicopedagógicas más innovadoras con el fomento del patriotismo dominicano. Nos dedicamos a guiar a niños, niñas y jóvenes por una ruta de excelencia integral.",
    philosophy: "El verdadero conocimiento sirve a la patria y promueve la libertad de pensamiento. Forjamos el carácter tanto como el intelecto.",
    mission: "Proveer una educación integral, innovadora y de calidad que promueva el desarrollo del pensamiento crítico, las habilidades científicas y el fomento de valores cívicos y patrióticos.",
    vision: "Ser reconocidos a nivel nacional e internacional como un centro educativo modelo por nuestra excelencia académica, el uso de tecnologías aplicadas, y la sólida formación ética.",
    history: "Fundado en honor a nuestro prócer de la patria Juan Pablo Duarte, nacimos como una respuesta académica a la demanda de excelencia en Santo Domingo.",
    directorName: "Dra. Altagracia Mercedes",
    directorRole: "Directora General / Ph.D en Educación",
    directorPhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    directorMsg: "Estimada comunidad educativa duartiana, nos honra darles la bienvenida a este espacio virtual. Nuestra labor diaria se fundamenta en un compromiso irrenunciable con la excelencia.",
    values: [
      { name: 'Patriotismo', desc: 'Inculcamos el amor a los símbolos patrios, a la historia nacional y al legado de Juan Pablo Duarte.' },
      { name: 'Excelencia', desc: 'Buscamos el máximo rendimiento académico e intelectual a través de la disciplina y la innovación.' },
      { name: 'Integridad', desc: 'Formamos ciudadanos con firmes principios éticos, honradez y responsabilidad social.' },
      { name: 'Innovación', desc: 'Abrazamos metodologías modernas, ciencias computacionales y aprendizaje STEAM.' },
    ]
  };

  return (
    <section id="nosotros" className="py-24 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 scroll-mt-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Block */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#5A2D1A] dark:text-[#D4AF37] font-bold text-xs uppercase tracking-widest bg-[#5A2D1A]/5 dark:bg-[#D4AF37]/10 px-3 py-1.5 rounded-full inline-block">
            {info.title}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-4 tracking-tight text-neutral-900 dark:text-white">
            {info.subtitle}
          </h2>
        </div>

        {/* Quiénes somos & Director Message */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          <div className="lg:col-span-7 space-y-6">
            <h3 className="font-display text-2xl font-bold text-[#5A2D1A] dark:text-[#D4AF37]">¿Quiénes Somos?</h3>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
              {info.whoWeAre}
            </p>
            
            <div className="border-l-4 border-[#D4AF37] pl-4 bg-neutral-50 dark:bg-neutral-800/40 py-3 pr-2 rounded-r-lg">
              <span className="text-sm font-semibold text-[#5A2D1A] dark:text-[#D4AF37] block">Nuestra Filosofía</span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-light italic">
                &ldquo;{info.philosophy}&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-[#D4AF37] mt-0.5 shrink-0" />
                <div>
                  <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Acreditación Nacional</span>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-light">Avalados por el Ministerio de Educación con categoría Sobresaliente.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-[#D4AF37] mt-0.5 shrink-0" />
                <div>
                  <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Docentes Certificados</span>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-light">Cuerpo docente con postgrados y amplia vocación pedagógica.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Director Card with Photo */}
          <div className="lg:col-span-5 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-4 mb-4">
              <img 
                src={info.directorPhoto} 
                alt={`Directora ${info.directorName}`} 
                className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37] shadow-sm shrink-0"
                referrerPolicy="no-referrer"
              />
              <div>
                <h4 className="font-display font-bold text-[#5A2D1A] dark:text-[#D4AF37] text-lg">{info.directorName}</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{info.directorRole}</p>
              </div>
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-light italic">
              &ldquo;{info.directorMsg}&rdquo;
            </div>
          </div>
        </div>

        {/* Misión, Visión, Valores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          
          {/* Misión */}
          <div className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800 hover:border-[#5A2D1A]/30 dark:hover:border-[#D4AF37]/30 p-8 rounded-2xl transition-all duration-300">
            <div className="bg-[#5A2D1A] dark:bg-neutral-800 w-12 h-12 rounded-xl flex items-center justify-center text-white mb-6 shadow-md">
              <Target className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <h4 className="font-display font-bold text-lg text-[#5A2D1A] dark:text-[#D4AF37]">Nuestra Misión</h4>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
              {info.mission}
            </p>
          </div>

          {/* Visión */}
          <div className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800 hover:border-[#5A2D1A]/30 dark:hover:border-[#D4AF37]/30 p-8 rounded-2xl transition-all duration-300">
            <div className="bg-[#5A2D1A] dark:bg-neutral-800 w-12 h-12 rounded-xl flex items-center justify-center text-white mb-6 shadow-md">
              <Eye className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <h4 className="font-display font-bold text-lg text-[#5A2D1A] dark:text-[#D4AF37]">Nuestra Visión</h4>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
              {info.vision}
            </p>
          </div>

          {/* Historia */}
          <div className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800 hover:border-[#5A2D1A]/30 dark:hover:border-[#D4AF37]/30 p-8 rounded-2xl transition-all duration-300">
            <div className="bg-[#5A2D1A] dark:bg-neutral-800 w-12 h-12 rounded-xl flex items-center justify-center text-white mb-6 shadow-md">
              <History className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <h4 className="font-display font-bold text-lg text-[#5A2D1A] dark:text-[#D4AF37]">Nuestra Historia</h4>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
              {info.history}
            </p>
          </div>
        </div>

        {/* Valores Grid */}
        <div className="bg-neutral-900 dark:bg-neutral-950 text-white rounded-3xl p-8 md:p-12 mb-24 border border-neutral-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4">
              <span className="text-[#D4AF37] font-bold text-xs uppercase tracking-widest block">Pilares Morales</span>
              <h4 className="font-display text-2xl md:text-3xl font-bold mt-2 tracking-tight">Valores que nos Definen</h4>
              <p className="text-xs text-neutral-400 mt-4 leading-relaxed font-light">
                Modelamos el comportamiento de nuestros estudiantes bajo principios éticos sólidos para asegurar que su éxito intelectual esté acompañado de una sólida dimensión moral.
              </p>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {info.values.map((v, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                  <span className="text-sm font-bold text-[#D4AF37] block">{v.name}</span>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed font-light">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Video Institucional Placeholder */}
        <div>
          <div className="text-center mb-8">
            <h3 className="font-display text-2xl font-bold text-[#5A2D1A] dark:text-[#D4AF37]">Video Institucional</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-light">Un recorrido audiovisual por la vida y el aprendizaje en nuestro centro.</p>
          </div>
          <div className="relative aspect-video max-w-4xl mx-auto rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-md">
            {showVideo ? (
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="Video Institucional"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <img
                  src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1000&auto=format&fit=crop&q=80"
                  alt="Vista del liceo"
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-[#3F1D10]/40 backdrop-blur-[2px]" />
                <button
                  onClick={() => setShowVideo(true)}
                  className="relative bg-[#D4AF37] hover:bg-[#F3D065] text-neutral-950 p-5 rounded-full shadow-2xl transition-transform duration-300 hover:scale-110 z-10 animate-pulse"
                  aria-label="Reproducir video"
                >
                  <Play className="h-6 w-6 fill-current" />
                </button>
                <span className="relative text-white font-display font-semibold mt-4 text-sm tracking-wider uppercase z-10">
                  Reproducir Presentación Virtual
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
