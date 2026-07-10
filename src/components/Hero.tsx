/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Trophy, Users, BookOpen, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroProps {
  onLearnMore: () => void;
  onAdmissions: () => void;
}

interface SlideItem {
  image: string;
  title: string;
  subtitle: string;
}

export default function Hero({ onLearnMore, onAdmissions }: HeroProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/landing')
      .then((res) => res.json())
      .then((landing) => {
        if (landing && landing.hero && landing.hero.slides && landing.hero.slides.length > 0) {
          setSlides(landing.hero.slides);
        } else {
          // fallback
          setSlides([
            {
              image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&auto=format&fit=crop&q=80",
              title: "Liceo de Prestigio y Excelencia Académica",
              subtitle: "Educamos para el futuro con raíces firmes en los valores de nuestra patria.",
            },
            {
              image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&auto=format&fit=crop&q=80",
              title: "Innovación Tecnológica y Competencias STEAM",
              subtitle: "Nuevas aulas de robótica y laboratorios equipados para forjar los líderes científicos de mañana.",
            },
            {
              image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&auto=format&fit=crop&q=80",
              title: "Formación de Líderes Integrales",
              subtitle: "Fomentamos el deporte, el arte y la cultura cívica en un entorno de primer nivel.",
            }
          ]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching hero slides:", err);
        setSlides([
          {
            image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&auto=format&fit=crop&q=80",
            title: "Liceo de Prestigio y Excelencia Académica",
            subtitle: "Educamos para el futuro con raíces firmes en los valores de nuestra patria.",
          }
        ]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (loading || slides.length === 0) {
    return (
      <div className="bg-neutral-900 min-h-screen flex items-center justify-center text-white">
        <span className="font-mono text-xs text-neutral-400">Preparando presentación principal...</span>
      </div>
    );
  }

  return (
    <section id="inicio" className="relative bg-neutral-900 min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background Slideshow */}
      {slides.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === activeSlide ? 'opacity-40' : 'opacity-0'
          }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover transform scale-105 transition-transform duration-6000"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-900/60 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 py-16 lg:py-24">
        <div className="max-w-3xl text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 bg-white/10 text-[#D4AF37] px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 border border-white/10"
          >
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>Inscripciones Abiertas — Año Escolar 2026-2027</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight"
          >
            {slides[activeSlide].title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 text-lg sm:text-xl text-neutral-200 leading-relaxed font-light max-w-2xl"
          >
            {slides[activeSlide].subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <button
              onClick={onLearnMore}
              className="flex items-center space-x-2 bg-[#5A2D1A] hover:bg-[#7D4229] text-white px-7 py-4 rounded-xl text-sm font-bold tracking-wide uppercase transition-all duration-300 shadow-xl hover:shadow-[#5A2D1A]/20"
            >
              <span>Conoce nuestro centro</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onAdmissions}
              className="flex items-center space-x-2 bg-transparent hover:bg-white/10 text-[#D4AF37] border border-[#D4AF37] hover:border-[#F3D065] px-7 py-4 rounded-xl text-sm font-bold tracking-wide uppercase transition-all duration-300"
            >
              <span>Proceso de Admisión</span>
            </button>
          </motion.div>
        </div>

        {/* School Statistics Board */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 bg-neutral-950/80 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md max-w-5xl">
          <div className="flex flex-col items-center text-center p-3">
            <div className="bg-[#5A2D1A]/60 p-3 rounded-lg mb-3">
              <Users className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <span className="text-3xl font-display font-bold text-white block">+800</span>
            <span className="text-xs uppercase tracking-wider text-neutral-400 mt-1 font-medium">Estudiantes</span>
          </div>

          <div className="flex flex-col items-center text-center p-3">
            <div className="bg-[#5A2D1A]/60 p-3 rounded-lg mb-3">
              <GraduationCap className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <span className="text-3xl font-display font-bold text-white block">+50</span>
            <span className="text-xs uppercase tracking-wider text-neutral-400 mt-1 font-medium">Docentes</span>
          </div>

          <div className="flex flex-col items-center text-center p-3">
            <div className="bg-[#5A2D1A]/60 p-3 rounded-lg mb-3">
              <BookOpen className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <span className="text-3xl font-display font-bold text-white block">20</span>
            <span className="text-xs uppercase tracking-wider text-neutral-400 mt-1 font-medium">Aulas Modernas</span>
          </div>

          <div className="flex flex-col items-center text-center p-3">
            <div className="bg-[#5A2D1A]/60 p-3 rounded-lg mb-3">
              <Trophy className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <span className="text-3xl font-display font-bold text-white block">15+</span>
            <span className="text-xs uppercase tracking-wider text-neutral-400 mt-1 font-medium">Años Formando Líderes</span>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === activeSlide ? 'w-8 bg-[#D4AF37]' : 'w-2.5 bg-white/40'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
