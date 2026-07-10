/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GraduationCap, Shield, UserCheck, Users, LogIn } from 'lucide-react';
import { UserRole } from '../types';

interface PortalEntranceProps {
  onSelectRole: (role: UserRole) => void;
}

export default function PortalEntrance({ onSelectRole }: PortalEntranceProps) {
  const portals = [
    {
      role: 'estudiante' as UserRole,
      title: 'Portal de Estudiantes',
      desc: 'Consulta tu horario de clases, calendario institucional, avisos, tareas asignadas, calificaciones trimestrales (P1-P4) y descarga tu boletín en PDF.',
      icon: GraduationCap,
      color: '#5A2D1A'
    },
    {
      role: 'padre' as UserRole,
      title: 'Portal de Padres y Tutores',
      desc: 'Monitorea el progreso escolar de tus hijos: califiaciones en tiempo real, reportes de conducta, historial de asistencia diaria, y mantente en comunicación.',
      icon: Users,
      color: '#D4AF37'
    },
    {
      role: 'docente' as UserRole,
      title: 'Portal de Docentes',
      desc: 'Gestiona tus cursos y secciones asignadas: registra asistencia matutina, evalúa notas de los períodos P1 a P4, asigna tareas y retroalimenta entregas.',
      icon: UserCheck,
      color: '#5A2D1A'
    },
    {
      role: 'admin' as UserRole,
      title: 'Portal Administrativo / Gestión',
      desc: 'Control integral de la institución educativa: modifique datos del centro, administre estudiantes, asigne docentes a asignaturas y verifique auditoría completa.',
      icon: Shield,
      color: '#1E1E1E'
    }
  ];

  return (
    <section id="portal-academico" className="py-24 bg-white text-neutral-900 scroll-mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#5A2D1A] font-bold text-xs uppercase tracking-widest bg-[#5A2D1A]/5 px-3 py-1.5 rounded-full inline-block">
            Portal Académico
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-4 tracking-tight">
            Plataforma Integrada de Gestión
          </h2>
          <p className="mt-4 text-neutral-600 leading-relaxed font-light">
            Seleccione el portal de acceso correspondiente para ingresar a nuestro ecosistema escolar unificado. Gestione sus tareas, notas y reportes desde un solo lugar.
          </p>
        </div>

        {/* Portal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {portals.map((p, idx) => {
            const IconComponent = p.icon;
            return (
              <div 
                key={idx} 
                className="bg-neutral-50 border border-neutral-100 hover:border-[#5A2D1A]/15 rounded-3xl p-8 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-[#5A2D1A]/5 p-4 rounded-2xl text-[#5A2D1A]">
                      <IconComponent className="h-7 w-7 text-[#5A2D1A]" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-neutral-800">{p.title}</h3>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Acceso Restringido</span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed font-light">{p.desc}</p>
                </div>

                <div className="pt-8 border-t border-neutral-200/50 mt-8 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Estado: Activo</span>
                  <button
                    onClick={() => onSelectRole(p.role)}
                    className="flex items-center space-x-1.5 bg-[#5A2D1A] hover:bg-[#7D4229] text-white px-5 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors shadow-sm"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Acceder</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
