/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ClipboardList, FileText, Download, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

interface StepItem {
  num: string;
  title: string;
  desc: string;
}

interface AttachmentItem {
  id: string;
  title: string;
  url: string;
  date: string;
  type: string;
}

interface AdmissionsData {
  title: string;
  subtitle: string;
  steps?: StepItem[];
  requirements: string[];
  faqs: FaqItem[];
  attachments?: AttachmentItem[];
}

export default function Admissions() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [data, setData] = useState<AdmissionsData | null>(null);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/landing')
      .then((res) => res.json())
      .then((landing) => {
        if (landing) {
          setData(landing.admissions);
          if (landing.attachments) {
            setAttachments(landing.attachments);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading admissions dynamic data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-neutral-500 text-xs font-mono">
        Cargando sección de admisiones...
      </div>
    );
  }

  const info = data || {
    title: "Únete a Nuestra Familia Educativa",
    subtitle: "Descubra las pautas necesarias para iniciar el proceso de inscripción y asegurar el porvenir académico de su hijo.",
    requirements: [
      'Acta de Nacimiento original y certificada.',
      'Récord de calificaciones del último año escolar (firmado y sellado).',
      'Carta de conducta del centro educativo de procedencia.',
      'Certificado médico oficial actualizado (con firma y exequátur).',
      'Dos (2) fotos tamaño 2x2 del estudiante.',
      'Copia de la cédula de identidad de ambos padres o tutores legales.'
    ],
    faqs: [
      { q: '¿Cuándo inicia el proceso de admisiones para el nuevo ciclo?', a: 'El proceso inicia formalmente en marzo de cada año y cierra al agotarse el cupo disponible de las respectivas aulas para garantizar un límite óptimo por salón.' },
      { q: '¿Tienen facilidades de pago para familias con múltiples hijos?', a: 'Sí, contamos con un plan especial de descuentos corporativos y familiares: 10% de descuento en la matrícula del segundo hijo y un 15% a partir del tercer hijo inscrito.' },
      { q: '¿Cuál es el costo de la evaluación de admisión?', a: 'La prueba diagnóstica y psicopedagógica tiene un costo único no reembolsable de RD$1,500, el cual se liquida el día de la cita evaluativa.' },
      { q: '¿Ofrecen becas por excelencia académica o deportiva?', a: 'Sí, anualmente el Consejo de Directores otorga becas parciales y completas a estudiantes sobresalientes que califiquen en nuestras convocatorias de honores.' }
    ]
  };

  const steps = info.steps || [
    { num: '01', title: 'Solicitud en Línea', desc: 'Consulte las pautas, descargue la ficha de requisitos y prepare la documentación.' },
    { num: '02', title: 'Evaluación Diagnóstica', desc: 'El estudiante tomará un examen de aptitud académica en áreas de matemáticas, lengua española e inglés.' },
    { num: '03', title: 'Entrevista de Orientación', desc: 'Se coordinará una reunión con el departamento de orientación psicopedagógica junto a los tutores.' },
    { num: '04', title: 'Inscripción Formal', desc: 'Entrega de documentación física requerida, firma de convenios y pago de matrícula correspondiente.' }
  ];

  return (
    <section id="admisiones" className="py-24 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 scroll-mt-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#5A2D1A] dark:text-[#D4AF37] font-bold text-xs uppercase tracking-widest bg-[#5A2D1A]/5 dark:bg-[#D4AF37]/10 px-3 py-1.5 rounded-full inline-block">
            Admisiones
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-4 tracking-tight text-neutral-900 dark:text-white">
            {info.title}
          </h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
            {info.subtitle}
          </p>
        </div>

        {/* 4-Step Process */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          {steps.map((st, idx) => (
            <div key={idx} className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-8 rounded-2xl relative shadow-sm hover:shadow-md transition-shadow text-left">
              <span className="font-display text-4xl font-extrabold text-[#D4AF37]/20 absolute top-4 right-4">{st.num}</span>
              <h4 className="font-display font-bold text-lg text-[#5A2D1A] dark:text-[#D4AF37] mt-4">{st.title}</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 leading-relaxed font-light">{st.desc}</p>
            </div>
          ))}
        </div>

        {/* Requisites & Download documents */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24 items-start text-left">
          
          {/* Requisites */}
          <div className="lg:col-span-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-8 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center space-x-3 text-[#5A2D1A] dark:text-[#D4AF37]">
              <FileText className="h-6 w-6 text-[#D4AF37]" />
              <h3 className="font-display text-xl font-bold text-neutral-900 dark:text-white">Documentos y Requisitos</h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-light">
              Para formalizar el expediente de admisión, es requisito indispensable consignar la siguiente lista de documentos en nuestras oficinas administrativas:
            </p>
            
            <div className="space-y-3">
              {info.requirements.map((req, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-xs text-neutral-700 dark:text-neutral-300">
                  <CheckCircle className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span className="font-medium">{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Attached Documents block */}
          <div className="lg:col-span-6 bg-[#5A2D1A] dark:bg-neutral-900/40 text-white dark:text-neutral-100 p-8 rounded-3xl shadow-xl relative overflow-hidden border border-neutral-800">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.1),transparent)] pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
              <div>
                <span className="text-[#D4AF37] font-bold text-xs uppercase tracking-widest block">Expediente Escolar</span>
                <h3 className="font-display text-2xl font-bold tracking-tight mt-1 text-white">Archivos y Documentos Adjuntos</h3>
                <p className="text-xs text-neutral-300 dark:text-neutral-400 mt-2 font-light">
                  Descargue los archivos oficiales adjuntados por el equipo administrativo y de gestión del centro.
                </p>
              </div>

              {attachments.length > 0 ? (
                <div className="space-y-3">
                  {attachments.map((file) => (
                    <div 
                      key={file.id} 
                      className="flex items-center justify-between p-4 rounded-xl bg-white/10 dark:bg-neutral-800/60 border border-white/5 dark:border-neutral-800 hover:bg-white/15 transition-all"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-2 bg-white/10 rounded-lg text-[#D4AF37]">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold block text-white truncate">{file.title}</span>
                          <span className="text-[10px] text-neutral-300 dark:text-neutral-400 block mt-0.5">{file.type} • {file.date}</span>
                        </div>
                      </div>
                      
                      <a 
                        href={file.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center space-x-1.5 bg-[#D4AF37] hover:bg-[#F3D065] text-[#3F1D10] px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0"
                      >
                        <Download className="h-3 w-3" />
                        <span>PDF</span>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-white/20 dark:border-neutral-800 rounded-xl">
                  <span className="text-xs text-neutral-300 dark:text-neutral-400 font-light">No hay documentos adicionales adjuntos en este momento.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Accordion FAQ */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="font-display text-2xl font-bold text-[#5A2D1A] dark:text-[#D4AF37]">Preguntas Frecuentes</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-light">Respuestas rápidas a las consultas recurrentes de nuestra comunidad.</p>
          </div>

          <div className="space-y-4">
            {info.faqs.map((f, idx) => (
              <div key={idx} className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs text-left">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left focus:outline-none hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <span className="font-display font-semibold text-neutral-800 dark:text-neutral-200 text-sm">{f.q}</span>
                  {activeFaq === idx ? <ChevronUp className="h-4 w-4 text-[#5A2D1A] dark:text-[#D4AF37]" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-5 pt-1 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-light border-t border-neutral-100 dark:border-neutral-800 animate-fade-in">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
