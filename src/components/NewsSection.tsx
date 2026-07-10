/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, User, ArrowRight, X, Clock, Newspaper } from 'lucide-react';
import { NewsItem } from '../types';

export default function NewsSection() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        setNews(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching news:", err);
        setLoading(false);
      });
  }, []);

  return (
    <section id="noticias" className="py-24 bg-white text-neutral-900 scroll-mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#5A2D1A] font-bold text-xs uppercase tracking-widest bg-[#5A2D1A]/5 px-3 py-1.5 rounded-full inline-block">
            Noticias y Boletines
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-4 tracking-tight">
            Actualidad y Comunicados Duartianos
          </h2>
          <p className="mt-4 text-neutral-600 leading-relaxed font-light">
            Manténgase al día con las informaciones, logros estudiantiles, circulares y reportajes especiales redactados por nuestra facultad escolar.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5A2D1A]" />
            <span className="block mt-4 text-xs text-neutral-500 font-medium">Cargando comunicados...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((item) => (
              <div 
                key={item.id} 
                className="bg-neutral-50 border border-neutral-100 hover:border-[#5A2D1A]/10 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-video relative overflow-hidden bg-neutral-200">
                    <img
                      src={item.imagen}
                      alt={item.titulo}
                      className="w-full h-full object-cover transform hover:scale-102 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 bg-[#D4AF37] text-[#3F1D10] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                      Comunicado
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Meta */}
                    <div className="flex items-center space-x-4 text-[10px] text-neutral-400 font-medium">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{item.fecha}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-3.5 w-3.5" />
                        <span>{item.autor}</span>
                      </div>
                    </div>

                    <h3 className="font-display font-bold text-base text-neutral-800 leading-snug line-clamp-2">
                      {item.titulo}
                    </h3>

                    <p className="text-xs text-neutral-500 font-light leading-relaxed line-clamp-3">
                      {item.resumen}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2">
                  <button
                    onClick={() => setSelectedNews(item)}
                    className="flex items-center space-x-1.5 text-xs font-bold text-[#5A2D1A] hover:text-[#7D4229] transition-colors"
                  >
                    <span>Leer comunicado completo</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for detailed view */}
        {selectedNews && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative border border-neutral-100">
              
              <button
                onClick={() => setSelectedNews(null)}
                className="absolute top-6 right-6 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 p-2.5 rounded-full transition-colors z-10"
                aria-label="Cerrar modal"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="aspect-video relative bg-neutral-100">
                <img
                  src={selectedNews.imagen}
                  alt={selectedNews.titulo}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="text-[#D4AF37] font-bold text-xs uppercase tracking-wider block mb-2">Sección de Noticias</span>
                  <h3 className="text-white font-display font-bold text-xl sm:text-2xl tracking-tight">{selectedNews.titulo}</h3>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 font-medium pb-4 border-b border-neutral-100">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>Fecha de Publicación: {selectedNews.fecha}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <User className="h-4 w-4" />
                    <span>Redactor: {selectedNews.autor}</span>
                  </div>
                </div>

                <div className="text-sm text-neutral-600 leading-relaxed font-light whitespace-pre-line space-y-4">
                  {selectedNews.contenido}
                </div>

                <div className="pt-6 border-t border-neutral-100 flex justify-end">
                  <button
                    onClick={() => setSelectedNews(null)}
                    className="bg-[#5A2D1A] hover:bg-[#7D4229] text-white px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Entendido, Cerrar
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </section>
  );
}
