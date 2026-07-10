/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mail, Shield, User, Globe } from 'lucide-react';
import { User as UserType } from '../types';

export default function Staff() {
  const [management, setManagement] = useState<UserType[]>([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        // Filter administrators, directors and teachers
        const staffList = data.filter((u: UserType) => u.role === 'admin' || u.role === 'director' || u.role === 'docente');
        setManagement(staffList);
      })
      .catch(err => console.error("Error loading staff:", err));
  }, []);

  return (
    <section id="gestion" className="py-24 bg-neutral-50 text-neutral-900 scroll-mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#5A2D1A] font-bold text-xs uppercase tracking-widest bg-[#5A2D1A]/5 px-3 py-1.5 rounded-full inline-block">
            Equipo de Gestión y Docentes
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-4 tracking-tight">
            Liderazgo Académico de Primer Orden
          </h2>
          <p className="mt-4 text-neutral-600 leading-relaxed font-light">
            Nuestros líderes pedagógicos y directivos cuentan con altos niveles de especialización y una vocación irrenunciable con el crecimiento intelectual y ético de la juventud dominicana.
          </p>
        </div>

        {/* Staff cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {management.map((staff) => (
            <div 
              key={staff.id} 
              className="bg-white border border-neutral-100 hover:border-[#5A2D1A]/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-4 mb-6">
                  <img 
                    src={staff.fotografia} 
                    alt={staff.nombreCompleto} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37] shadow-sm shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-display font-bold text-base text-neutral-800 leading-tight">{staff.nombreCompleto}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-full inline-block mt-1">
                      {staff.role === 'admin' ? 'Administrador' : staff.role === 'director' ? 'Directora' : 'Docente'}
                    </span>
                    {staff.especialidad && (
                      <span className="text-[11px] block text-neutral-400 mt-1 font-medium">{staff.especialidad}</span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-neutral-500 leading-relaxed font-light mb-6 line-clamp-4">
                  {staff.biografia || "Cuerpo directivo del centro enfocado en la mejora institucional y el cumplimiento de los pilares académicos."}
                </p>
              </div>

              {/* Action info */}
              <div className="border-t border-neutral-100 pt-4 flex items-center justify-between text-xs text-neutral-400">
                <div className="flex items-center space-x-1.5">
                  <Mail className="h-4 w-4 text-neutral-300" />
                  <span className="font-mono text-[10px] tracking-tight">{staff.correo}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4 text-[#D4AF37]/60" />
                  <span className="text-[10px] font-semibold text-neutral-400">Verificado</span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
