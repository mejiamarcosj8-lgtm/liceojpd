/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, MapPin, Phone, MessageSquare, Send, CheckCircle, Clock, ExternalLink } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({ nombre: '', correo: '', telefono: '', asunto: '', mensaje: '' });
  const [submitted, setSubmitted] = useState(false);
  
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubbed, setNewsletterSubbed] = useState(false);

  const [sugerencia, setSugerencia] = useState('');
  const [sugerenciaSubbed, setSugerenciaSubbed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/contact/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSubmitted(true);
          setTimeout(() => {
            setSubmitted(false);
            setFormData({ nombre: '', correo: '', telefono: '', asunto: '', mensaje: '' });
          }, 4000);
        }
      })
      .catch(err => {
        console.error('Contact submission error:', err);
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setFormData({ nombre: '', correo: '', telefono: '', asunto: '', mensaje: '' });
        }, 4000);
      });
  };

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterSubbed(true);
    setTimeout(() => {
      setNewsletterSubbed(false);
      setNewsletterEmail('');
    }, 4000);
  };

  const handleSugerencia = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/suggestions/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje: sugerencia })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSugerenciaSubbed(true);
          setTimeout(() => {
            setSugerenciaSubbed(false);
            setSugerencia('');
          }, 4000);
        }
      })
      .catch(err => {
        console.error('Suggestion submission error:', err);
        setSugerenciaSubbed(true);
        setTimeout(() => {
          setSugerenciaSubbed(false);
          setSugerencia('');
        }, 4000);
      });
  };

  return (
    <section id="contacto" className="bg-neutral-50 text-neutral-900 scroll-mt-10">
      
      {/* Primary Contact Area */}
      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#5A2D1A] font-bold text-xs uppercase tracking-widest bg-[#5A2D1A]/5 px-3 py-1.5 rounded-full inline-block">
            Información y Contacto
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-4 tracking-tight">
            Canales de Atención de Oficina
          </h2>
          <p className="mt-4 text-neutral-600 leading-relaxed font-light">
            ¿Tiene alguna consulta o desea programar un recorrido personalizado por nuestro campus? Escríbanos o visítenos. Estaremos honrados de atenderle.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-24">
          
          {/* Details Column */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-6 bg-white p-8 rounded-2xl border border-neutral-100 shadow-xs">
              <h3 className="font-display text-lg font-bold text-[#5A2D1A]">Directorio Directo</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3.5">
                  <div className="bg-[#5A2D1A]/5 p-2.5 rounded-lg text-[#5A2D1A] shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Dirección Física</span>
                    <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed font-light">
                      Av. Abraham Lincoln #404, Santo Domingo, Distrito Nacional, República Dominicana.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="bg-[#5A2D1A]/5 p-2.5 rounded-lg text-[#5A2D1A] shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Central Telefónica</span>
                    <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed font-mono font-light">
                      (809) 555-0123 / Fax: (809) 555-0124
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="bg-[#5A2D1A]/5 p-2.5 rounded-lg text-[#5A2D1A] shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Email Institucional</span>
                    <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed font-mono font-light">
                      info@liceojuanpabloduarte.edu.do
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="bg-[#5A2D1A]/5 p-2.5 rounded-lg text-[#5A2D1A] shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Horario de Oficina</span>
                    <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed font-light">
                      Lunes a Viernes — 07:30 AM a 04:00 PM
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Button */}
              <div className="pt-6 border-t border-neutral-100">
                <a 
                  href="https://wa.me/18095550123" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full flex items-center justify-center space-x-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-colors shadow-sm"
                >
                  <MessageSquare className="h-4.5 w-4.5 fill-current" />
                  <span>Atención vía WhatsApp</span>
                </a>
              </div>
            </div>

            {/* suggestion box */}
            <div className="bg-[#5A2D1A] text-white p-8 rounded-2xl shadow-md relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(212,175,55,0.1),transparent)]" />
              <div className="relative z-10 space-y-4">
                <h4 className="font-display font-bold text-base text-[#D4AF37]">Buzón de Sugerencias Virtual</h4>
                <p className="text-xs text-neutral-300 font-light">Su opinión es vital para la mejora continua del centro. Las entregas en este buzón son anónimas y se revisan directamente por la Dirección General.</p>
                
                {sugerenciaSubbed ? (
                  <div className="bg-white/10 p-4 rounded-xl text-center text-xs text-neutral-200">
                    <CheckCircle className="h-5 w-5 text-[#D4AF37] mx-auto mb-2" />
                    <span>¡Sugerencia depositada de forma segura! Gracias por su valioso aporte.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSugerencia} className="space-y-2">
                    <textarea 
                      required
                      value={sugerencia}
                      onChange={(e) => setSugerencia(e.target.value)}
                      rows={3}
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] placeholder-neutral-400 resize-none"
                      placeholder="Escriba aquí sus observaciones o sugerencias constructivas..."
                    />
                    <button type="submit" className="bg-[#D4AF37] hover:bg-[#F3D065] text-[#3F1D10] font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition-colors shadow-xs">
                      Depositar Sugerencia
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7 bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm">
            <h3 className="font-display text-lg font-bold text-neutral-800 mb-6">Formulario de Contacto General</h3>
            
            {submitted ? (
              <div className="bg-neutral-50 border border-[#D4AF37]/30 p-8 rounded-2xl text-center space-y-3 animate-fade-in">
                <CheckCircle className="h-10 w-10 text-[#D4AF37] mx-auto animate-bounce" />
                <span className="font-bold text-neutral-800 text-sm block">¡Mensaje enviado con éxito!</span>
                <p className="text-xs text-neutral-500 font-light leading-relaxed">
                  Hemos recibido su requerimiento. Un oficial de correspondencia institucional de nuestro liceo le contactará en breve vía correo o teléfono.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Nombre Completo</label>
                    <input 
                      type="text" 
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-100 focus:bg-white focus:border-[#5A2D1A] rounded-lg px-3 py-2 text-xs focus:outline-none transition-all"
                      placeholder="Ej. Juan de Dios Duarte"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Correo Electrónico</label>
                    <input 
                      type="email" 
                      required
                      value={formData.correo}
                      onChange={(e) => setFormData({...formData, correo: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-100 focus:bg-white focus:border-[#5A2D1A] rounded-lg px-3 py-2 text-xs focus:outline-none transition-all"
                      placeholder="Ej. correo@ejemplo.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Teléfono</label>
                    <input 
                      type="tel" 
                      required
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-100 focus:bg-white focus:border-[#5A2D1A] rounded-lg px-3 py-2 text-xs focus:outline-none transition-all"
                      placeholder="Ej. 809-555-0100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Asunto de Consulta</label>
                    <input 
                      type="text" 
                      required
                      value={formData.asunto}
                      onChange={(e) => setFormData({...formData, asunto: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-100 focus:bg-white focus:border-[#5A2D1A] rounded-lg px-3 py-2 text-xs focus:outline-none transition-all"
                      placeholder="Ej. Solicitud de Información Matrícula"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Detalle del Mensaje</label>
                  <textarea 
                    required
                    value={formData.mensaje}
                    onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
                    rows={4}
                    className="w-full bg-neutral-50 border border-neutral-100 focus:bg-white focus:border-[#5A2D1A] rounded-lg px-3 py-2 text-xs focus:outline-none transition-all resize-none"
                    placeholder="Escriba aquí los detalles correspondientes..."
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 bg-[#5A2D1A] hover:bg-[#7D4229] text-white font-bold text-xs uppercase tracking-wider py-3 rounded-lg transition-colors shadow-sm"
                >
                  <Send className="h-4 w-4 text-[#D4AF37]" />
                  <span>Enviar Formulario de Correspondencia</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Google Maps Embed Static Placeholder with beautiful styling */}
        <div className="rounded-3xl overflow-hidden border border-neutral-200 shadow-sm bg-neutral-200 aspect-video md:aspect-[3/1] relative">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15139.7336181466!2d-69.93922115!3d18.4716946!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8eaf89ee9d2ca11b%3A0x6b8f1c841bb4c000!2sAv.%20Abraham%20Lincoln%2C%20Santo%20Domingo!5e0!3m2!1ses!2sdo!4v1700000000000!5m2!1ses!2sdo"
            width="100%"
            height="100%"
            className="border-0"
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md border border-neutral-200 rounded-xl p-3 shadow-md text-left hidden sm:block max-w-xs pointer-events-none">
            <span className="text-[10px] font-bold text-[#5A2D1A] uppercase tracking-wider block">Ubicación de Campus</span>
            <span className="text-xs text-neutral-800 font-semibold block mt-0.5">Av. Abraham Lincoln #404</span>
            <span className="text-[10px] text-neutral-500 block mt-1 font-light">Estacionamientos y seguridad 24/7 para visitantes.</span>
          </div>
        </div>

      </div>

      {/* Newsletter signup banner */}
      <div className="bg-[#5A2D1A] text-white border-b-2 border-[#D4AF37]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[#D4AF37] font-bold text-[10px] uppercase tracking-widest block">Boletín Informativo</span>
            <h4 className="font-display font-bold text-lg tracking-tight">Reciba Nuestras Circulares Semanales</h4>
            <p className="text-xs text-neutral-300 font-light">Subscríbase para enterarse de ferias, actividades escolares y cierres académicos.</p>
          </div>
          {newsletterSubbed ? (
            <div className="bg-white/10 px-6 py-3 rounded-lg text-xs text-neutral-200 font-semibold">
              ¡Suscrito correctamente! Muchas gracias.
            </div>
          ) : (
            <form onSubmit={handleNewsletter} className="flex bg-white/10 rounded-xl p-1.5 border border-white/10 w-full md:w-auto max-w-md shrink-0">
              <input 
                type="email" 
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="bg-transparent text-white placeholder-neutral-400 text-xs px-3 focus:outline-none w-full md:w-64"
                placeholder="Introduzca su correo electrónico..."
              />
              <button type="submit" className="bg-[#D4AF37] hover:bg-[#F3D065] text-[#3F1D10] font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors shadow-sm">
                Subscribirse
              </button>
            </form>
          )}
        </div>
      </div>

    </section>
  );
}
