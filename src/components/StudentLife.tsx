/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { X, Calendar, Trophy, Users, Award } from 'lucide-react';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  detailedContent?: string; // dynamic content for modal
}

interface StudentLifeData {
  title: string;
  subtitle: string;
  activities: ActivityItem[];
  patrioticTitle: string;
  patrioticDesc: string;
  nextEventTitle: string;
  nextEventDate: string;
}

export default function StudentLife() {
  const [data, setData] = useState<StudentLifeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  useEffect(() => {
    fetch('/api/landing')
      .then((res) => res.json())
      .then((landing) => {
        if (landing && landing.studentLife) {
          setData(landing.studentLife);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading studentLife:", err);
        setLoading(false);
      });
  }, []);

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('steam') || cat.includes('tecn') || cat.includes('rob')) return LucideIcons.Cpu;
    if (cat.includes('cult') || cat.includes('art') || cat.includes('mus') || cat.includes('teat')) return LucideIcons.Music;
    if (cat.includes('salu') || cat.includes('depo') || cat.includes('fut') || cat.includes('deporte')) return LucideIcons.Trophy;
    if (cat.includes('acad') || cat.includes('bibl') || cat.includes('lect')) return LucideIcons.BookOpen;
    if (cat.includes('val') || cat.includes('excu') || cat.includes('viaj')) return LucideIcons.Compass;
    if (cat.includes('soc') || cat.includes('proy') || cat.includes('solid')) return LucideIcons.Users;
    return LucideIcons.Award;
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-neutral-500 text-xs font-mono">
        Cargando vida estudiantil...
      </div>
    );
  }

  const info = data || {
    title: "Vida Estudiantil",
    subtitle: "Descubre tus Pasiones y Desarrolla tus Talentos",
    activities: [
      {
        id: "act-1",
        title: "Club de Robótica y Tecnología",
        description: "Formación en programación, electrónica y diseño 3D. Nuestros estudiantes construyen prototipos y participan en torneos nacionales.",
        image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80",
        category: "STEAM"
      },
      {
        id: "act-2",
        title: "Arte, Teatro y Música",
        description: "Coro institucional, clases de violín, artes visuales y club dramático. Fomentamos la sensibilidad artística y la expresión libre.",
        image: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=600&auto=format&fit=crop&q=80",
        category: "Cultura"
      },
      {
        id: "act-3",
        title: "Deportes de Alto Rendimiento",
        description: "Instalaciones para Baloncesto, Voleibol, Fútbol y Ajedrez. Equipos competitivos con entrenadores certificados de la federación.",
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop&q=80",
        category: "Salud"
      }
    ],
    patrioticTitle: "Actividades Cívicas y Patrióticas",
    patrioticDesc: "Cada lunes iniciamos el día con el izamiento solemne de la bandera y el canto del Himno Nacional. Organizamos conferencias históricas, representaciones cívicas y conmemoraciones de los Padres de la Patria para cimentar el amor y orgullo dominicano en cada alumno.",
    nextEventTitle: "Tributo a los Próceres",
    nextEventDate: "Lunes 16 de Julio, 07:45 AM"
  };

  return (
    <section id="vida-estudiantil" className="py-24 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 scroll-mt-10 transition-colors duration-300">
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

        {/* Grid of Student Life Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {info.activities.map((el) => {
            const IconComponent = getCategoryIcon(el.category);
            return (
              <div 
                key={el.id} 
                className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 hover:border-[#5A2D1A]/20 dark:hover:border-[#D4AF37]/20 rounded-2xl p-8 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-[#5A2D1A]/5 dark:bg-[#D4AF37]/10 p-3 rounded-xl text-[#5A2D1A] dark:text-[#D4AF37]">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-full">
                      {el.category}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-neutral-800 dark:text-white mb-3">{el.title}</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-light line-clamp-4">{el.description}</p>
                </div>
                
                {/* Action button */}
                <div className="border-t border-neutral-50 dark:border-neutral-800 pt-5 mt-6 flex items-center justify-between">
                  <button 
                    onClick={() => setSelectedActivity(el)}
                    className="text-[11px] font-semibold text-[#5A2D1A] dark:text-[#D4AF37] hover:text-[#7D4229] dark:hover:text-[#F3D065] transition-colors cursor-pointer inline-flex items-center bg-transparent border-none p-0"
                  >
                    Ver más información &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Patriotic focus banner */}
        <div className="mt-16 bg-[#5A2D1A] dark:bg-neutral-900 text-white rounded-3xl p-8 md:p-12 border-b-4 border-[#D4AF37] shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.08),transparent)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl text-left">
              <span className="text-[#D4AF37] font-bold text-xs uppercase tracking-widest">{info.patrioticTitle}</span>
              <h3 className="font-display text-2xl font-bold tracking-tight">{info.patrioticTitle}</h3>
              <p className="text-xs text-neutral-300 leading-relaxed font-light">
                {info.patrioticDesc}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center w-full md:w-auto shrink-0 backdrop-blur-sm">
              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold block">Próxima Conmemoración</span>
              <span className="text-lg font-bold block mt-2 text-white">{info.nextEventTitle}</span>
              <span className="text-xs text-neutral-300 block mt-1">{info.nextEventDate}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Dynamic Information Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative text-left">
            <button 
              onClick={() => setSelectedActivity(null)}
              className="absolute top-4 right-4 p-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full transition-colors z-10"
              aria-label="Cerrar modal"
            >
              <X className="h-4 w-4" />
            </button>
            
            {/* Modal Image */}
            <div className="aspect-video w-full relative">
              <img 
                src={selectedActivity.image} 
                alt={selectedActivity.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/20 px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
                  {selectedActivity.category}
                </span>
                <h3 className="font-display font-bold text-2xl text-white mt-2 leading-tight">
                  {selectedActivity.title}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {selectedActivity.description}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-light">
                  {selectedActivity.detailedContent || `Esta iniciativa forma parte del programa integral del Liceo Juan Pablo Duarte, diseñado para potenciar el liderazgo cívico, el pensamiento computacional y la autogestión de los alumnos. El club o actividad se reúne de manera regular fuera del horario lectivo regular, promoviendo la socialización, el debate crítico y la disciplina cooperativa.`}
                </p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl flex items-center justify-between border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center space-x-3 text-xs text-neutral-500 dark:text-neutral-400">
                  <Users className="h-5 w-5 text-[#D4AF37]" />
                  <span>Dirigido a todos los niveles</span>
                </div>
                <button 
                  onClick={() => setSelectedActivity(null)}
                  className="bg-[#5A2D1A] dark:bg-[#D4AF37] text-white dark:text-[#3F1D10] text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
