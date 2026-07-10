/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  AlertCircle, Trash, RotateCcw, FileText, CheckCircle, Search, 
  User, Filter, Plus, Calendar, Clock, Download, X, Printer, 
  ShieldAlert, BookOpen, AlertTriangle, Check, Award, Loader2
} from 'lucide-react';
import { User as UserType, Course, Observation, Citation, ObservationImportance } from '../types';
// @ts-ignore
import logoDuarte from '../assets/images/logo_duarte_1783545572734.jpg';
// @ts-ignore
import logoCupula from '../assets/images/logo_cupula_1783655502703.jpg';

interface DisciplineReportViewProps {
  currentUser: UserType;
  users: UserType[];
  courses: Course[];
  observations: Observation[];
  citations: Citation[];
  syncData: () => void;
  showNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function DisciplineReportView({
  currentUser,
  users,
  courses,
  observations,
  citations,
  syncData,
  showNotification
}: DisciplineReportViewProps) {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedImportance, setSelectedImportance] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Active student total observations counter
  const getStudentObsCount = (studentId: string) => {
    return observations.filter(o => o.estudianteId === studentId).length;
  };

  // Check if any student has reached 3 or more observations (Urgent alert trigger)
  const getUrgentStudents = () => {
    const studentCounts: { [key: string]: { user: UserType; count: number } } = {};
    
    observations.forEach(obs => {
      if (!studentCounts[obs.estudianteId]) {
        const studentObj = users.find(u => u.id === obs.estudianteId);
        if (studentObj) {
          studentCounts[obs.estudianteId] = { user: studentObj, count: 0 };
        }
      }
      if (studentCounts[obs.estudianteId]) {
        studentCounts[obs.estudianteId].count += 1;
      }
    });

    return Object.values(studentCounts).filter(item => item.count >= 3);
  };

  const urgentStudents = getUrgentStudents();

  // Create citation state
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [citationStudent, setCitationStudent] = useState<UserType | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [citationForm, setCitationForm] = useState({
    fechaCitacion: '',
    horaCitacion: '',
    motivo: '',
    consecuencias: 'Amonestación disciplinaria y firma de acuerdo de conducta para mejorar el comportamiento escolar del alumno.',
    opinionOrientador: '',
  });

  // Print view state for generated citation
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeCitationForPrint, setActiveCitationForPrint] = useState<Citation | null>(null);

  // Custom Confirmation Dialog State (replacing window.confirm)
  const [customConfirm, setCustomConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void, confirmText = 'Confirmar', cancelText = 'Cancelar') => {
    setCustomConfirm({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirm();
        setCustomConfirm(null);
      }
    });
  };

  // Submitting citation
  const handleCreateCitation = () => {
    if (!citationStudent || !citationForm.fechaCitacion || !citationForm.horaCitacion || !citationForm.motivo) {
      showNotification('Complete todos los campos de la citación.', 'error');
      return;
    }

    const linkedObs = observations.filter(o => o.estudianteId === citationStudent.id);
    const obsDetails = linkedObs.map(o => `[${o.fecha.substring(0,10)}] ${o.tipo.toUpperCase()}: ${o.detalle}`).join('\n');

    const newCitationPayload = {
      estudianteId: citationStudent.id,
      estudianteNombre: citationStudent.nombreCompleto,
      tutorNombre: citationStudent.tutor || 'Padre, Madre o Tutor',
      fechaCitacion: citationForm.fechaCitacion,
      horaCitacion: citationForm.horaCitacion,
      motivo: `${citationForm.motivo}\n\nDetalles de Conducta Registrados:\n${obsDetails}`,
      consecuencias: citationForm.consecuencias,
      realizada: false,
      opinionOrientador: citationForm.opinionOrientador
    };

    fetch('/api/citations/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        citation: newCitationPayload,
        authorName: currentUser.nombreCompleto
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showNotification('Citación para padres emitida correctamente.', 'success');
        setShowCitationModal(false);
        setActiveCitationForPrint(data.citation);
        setShowPrintModal(true);
        syncData();
      } else {
        showNotification('Error al crear la citación.', 'error');
      }
    })
    .catch(() => {
      showNotification('Error de conexión al guardar citación.', 'error');
    });
  };

  // Delete an observation
  const handleDeleteObservation = (obsId: string) => {
    triggerConfirm(
      '¿Retirar Observación?',
      '¿Está seguro de que desea retirar permanentemente esta observación disciplinaria? Esta acción no se puede deshacer.',
      () => {
        fetch('/api/observations/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: obsId,
            authorName: currentUser.nombreCompleto
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            showNotification('Observación retirada con éxito.', 'success');
            syncData();
          } else {
            showNotification('No se pudo retirar la observación.', 'error');
          }
        })
        .catch(() => showNotification('Error de conexión.', 'error'));
      },
      'Sí, Retirar',
      'Cancelar'
    );
  };

  // Reset/Clear observations for student
  const handleResetObservations = (studentId: string, studentName: string) => {
    triggerConfirm(
      '¿Reiniciar Ficha Conductual?',
      `¿Está seguro de reiniciar la ficha de conducta de ${studentName}? Esto borrará permanentemente todas sus observaciones y citaciones asociadas.`,
      () => {
        fetch('/api/observations/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estudianteId: studentId,
            authorName: currentUser.nombreCompleto
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            showNotification(`Se reinició con éxito la ficha disciplinaria del estudiante.`, 'success');
            syncData();
          } else {
            showNotification('No se pudo reiniciar la ficha.', 'error');
          }
        })
        .catch(() => showNotification('Error de conexión.', 'error'));
      },
      'Sí, Reiniciar',
      'Cancelar'
    );
  };

  // Deleting citation
  const handleDeleteCitation = (citationId: string) => {
    triggerConfirm(
      '¿Cancelar Citación?',
      '¿Desea cancelar y eliminar esta citación permanentemente?',
      () => {
        fetch('/api/citations/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: citationId,
            authorName: currentUser.nombreCompleto
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            showNotification('Citación cancelada correctamente.', 'success');
            syncData();
          } else {
            showNotification('Error al cancelar la citación.', 'error');
          }
        })
        .catch(() => showNotification('Error de conexión.', 'error'));
      },
      'Sí, Cancelar',
      'Mantener'
    );
  };

  // Filter and sort logic for observations list
  const getFilteredObservations = () => {
    let list = [...observations];

    // Filter by role constraints
    if (currentUser.role === 'estudiante') {
      list = list.filter(o => o.estudianteId === currentUser.id);
    } else if (currentUser.role === 'padre') {
      const childIds = currentUser.estudiantesVinculadosIds || [];
      list = list.filter(o => childIds.includes(o.estudianteId));
    } else if (currentUser.role === 'docente') {
      // Teachers can see everything or focus on theirs, let's keep all but provide sorting or filter
    }

    // Filter search
    if (searchTerm.trim() !== '') {
      list = list.filter(o => 
        o.estudianteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.docenteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.detalle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter course
    if (selectedCourseId !== '') {
      list = list.filter(o => o.cursoId === selectedCourseId);
    }

    // Filter importance
    if (selectedImportance !== '') {
      list = list.filter(o => o.importancia === selectedImportance);
    }

    // Filter type
    if (selectedType !== '') {
      list = list.filter(o => o.tipo === selectedType);
    }

    // Sort: "Muy importante" first, then "Importante", then "Regular"
    const priorityWeight = {
      'Muy importante': 3,
      'Importante': 2,
      'Regular': 1
    };

    list.sort((a, b) => {
      const weightA = priorityWeight[a.importancia] || 0;
      const weightB = priorityWeight[b.importancia] || 0;
      if (weightA !== weightB) {
        return weightB - weightA; // Descending priority
      }
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime(); // Newest first
    });

    return list;
  };

  const filteredObs = getFilteredObservations();

  // Get active citations for Parent/Student or Orientador
  const getFilteredCitations = () => {
    let list = [...citations];
    if (currentUser.role === 'estudiante') {
      list = list.filter(c => c.estudianteId === currentUser.id);
    } else if (currentUser.role === 'padre') {
      const childIds = currentUser.estudiantesVinculadosIds || [];
      list = list.filter(c => childIds.includes(c.estudianteId));
    }
    return list;
  };

  const filteredCitations = getFilteredCitations();

  // Printable Citation report action
  const handlePrint = () => {
    try {
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        showNotification('Nota: Para imprimir o guardar en PDF, si el cuadro de diálogo del sistema no se abre automáticamente, utilice el botón "Abrir en nueva pestaña" en la esquina superior derecha o presione Ctrl+P / Cmd+P.', 'info');
      }
      window.print();
    } catch (e) {
      console.error('Error triggering native print:', e);
      window.print();
    }
  };

  const handleDownloadDoc = () => {
    try {
      const element = document.getElementById('reporte-citacion-institucional');
      if (!element) {
        showNotification('Error: No se encontró el reporte para exportar.', 'error');
        return;
      }
      
      const htmlContent = element.innerHTML;
      
      const styles = `
        <style>
          body { font-family: Arial, sans-serif; font-size: 11pt; color: #333333; line-height: 1.4; margin: 1in; }
          h1 { color: #5a2d1a; font-size: 16pt; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; text-align: center; }
          h2 { color: #5a2d1a; font-size: 12pt; font-weight: bold; margin-top: 15px; text-transform: uppercase; border-bottom: 2px solid #5a2d1a; padding-bottom: 4px; text-align: center; }
          h3 { color: #5a2d1a; font-size: 11pt; font-weight: bold; margin-top: 15px; border-bottom: 1px solid #dddddd; padding-bottom: 2px; }
          p { margin: 0 0 8px 0; font-size: 10pt; }
          .font-bold { font-weight: bold; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-xs { font-size: 8.5pt; }
          .text-sm { font-size: 9.5pt; }
          .uppercase { text-transform: uppercase; }
          .border { border: 1px solid #cccccc; padding: 10px; border-radius: 8px; background-color: #fafafa; }
          .grid { display: table; width: 100%; }
          .col { display: table-cell; width: 50%; padding: 10px; }
          .signature-grid { display: table; width: 100%; margin-top: 50px; }
          .signature-col { display: table-cell; width: 50%; text-align: center; padding-top: 30px; height: 100px; }
        </style>
      `;

      const documentContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <meta charset="utf-8">
            <title>Reporte de Citación y Situación Conductual - ERP Duarte</title>
            \${styles}
          </head>
          <body>
            \${htmlContent}
          </body>
        </html>
      `;

      const blob = new Blob(['\\ufeff' + documentContent], {
        type: 'application/msword;charset=utf-8'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Reporte_Citacion_\${activeCitationForPrint?.estudianteNombre.replace(/\\s+/g, '_') || 'Estudiante'}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('¡Documento de Word (.doc) descargado con éxito! Ábralo en Word o Google Docs para firmar o imprimir.', 'success');
    } catch (error) {
      console.error(error);
      showNotification('Error al exportar a Word.', 'error');
    }
  };

  const isManagementRole = currentUser.role === 'orientacion' || currentUser.role === 'admin' || currentUser.role === 'director';

  if (currentUser.role === 'estudiante') {
    const studentObs = filteredObs.filter(o => o.estudianteId === currentUser.id);
    const totalCount = studentObs.length;

    return (
      <div className="space-y-6 animate-fade-in text-left">
        {/* Student Welcome Header */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/20">
              Liceo Juan Pablo Duarte • Mi Cuenta
            </span>
            <h2 className="font-display text-xl md:text-2xl font-black text-neutral-100 mt-2">
              Ficha Disciplinaria de {currentUser.nombreCompleto}
            </h2>
            <p className="text-xs text-neutral-500 font-light max-w-2xl">
              Portal de convivencia escolar. Recuerda que la disciplina y el respeto mutuo son la base de la excelencia académica.
            </p>
          </div>
          <div className="shrink-0">
            <Award className="h-10 w-10 text-[#D4AF37]" />
          </div>
        </div>

        {/* Observation Count Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-neutral-950 border border-neutral-800 p-6 rounded-3xl space-y-4 flex flex-col justify-center items-center text-center shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#D4AF37]" />
            <span className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Total de Observaciones</span>
            <div className="font-display text-5xl font-black text-[#D4AF37]">{totalCount}</div>
            <p className="text-xs text-neutral-500 font-light max-w-[200px]">
              {totalCount === 0 
                ? "Felicidades, mantienes un expediente conductual impecable." 
                : totalCount >= 3 
                ? "Atención: Has acumulado un límite crítico de faltas. Se requiere tutoría inmediata."
                : "Recuerda mantener un comportamiento alineado al reglamento escolar."}
            </p>
          </div>

          <div className="md:col-span-2 bg-neutral-950 border border-neutral-800 p-6 rounded-3xl space-y-4 shadow-xl">
            <h3 className="font-display font-bold text-sm text-neutral-200 uppercase tracking-wider">Historial de Observaciones de Conducta</h3>
            {totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <Check className="h-10 w-10 text-emerald-500 bg-emerald-500/10 p-2 rounded-full" />
                <p className="text-xs text-neutral-400 font-light">No tienes observaciones disciplinarias registradas.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                {studentObs.map(obs => (
                  <div key={obs.id} className="border border-neutral-800 rounded-xl p-4 bg-neutral-900/40 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[10px] bg-neutral-900 text-neutral-400 border border-neutral-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                          {obs.tipo}
                        </span>
                        <div className="text-[10px] text-neutral-500 mt-1">
                          Fecha: {obs.fecha.substring(0, 10)} • Profesor/a: {obs.docenteNombre}
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                        {obs.importancia}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed font-light mt-3 whitespace-pre-line bg-neutral-950/40 p-3 rounded-lg border border-neutral-800/40">
                      {obs.detalle}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Citations Box for Student */}
        {filteredCitations.length > 0 && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-xl">
            <h3 className="font-display font-bold text-sm text-[#D4AF37] uppercase tracking-wider mb-4">Citaciones Oficiales Convocadas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCitations.map(cit => (
                <div key={cit.id} className="border border-neutral-850 p-4 rounded-xl bg-neutral-900/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold bg-neutral-900 text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded">
                      ID: {cit.id}
                    </span>
                    <span className="text-[9px] text-amber-500 font-bold uppercase">CONVOCATORIA ACTIVA</span>
                  </div>
                  <div className="text-xs space-y-1 text-neutral-300">
                    <p><strong>Fecha:</strong> {cit.fechaCitacion} • <strong>Hora:</strong> {cit.horaCitacion}</p>
                    <p><strong>Tutor Citado:</strong> {cit.tutorNombre}</p>
                    <p className="text-[11px] text-neutral-400 italic mt-1 font-mono leading-relaxed bg-neutral-950/40 p-2.5 rounded border border-neutral-850">
                      Motivo: {cit.motivo}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* HEADER SECTION */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/20">
            Departamento de Orientación & Psicología
          </span>
          <h2 className="font-display text-xl md:text-2xl font-black text-neutral-100 mt-2">
            Control de Conducta y Disciplina Estudiantil
          </h2>
          <p className="text-xs text-neutral-500 font-light max-w-2xl">
            Monitoree la convivencia escolar, registre incidencias, emita citaciones formales y promueva un ambiente escolar seguro, respetuoso y de excelencia académica.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <ShieldAlert className="h-10 w-10 text-[#D4AF37] animate-pulse" />
        </div>
      </div>

      {/* URGENT NOTIFICATIONS (3 OR MORE OBSERVATIONS TRIGGER) */}
      {isManagementRole && urgentStudents.length > 0 && (
        <div className="bg-amber-950/20 border-2 border-amber-500/30 rounded-3xl p-6 space-y-4 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500 text-neutral-950 rounded-xl">
              <AlertTriangle className="h-5 w-5 font-black" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-amber-400">🚨 NOTIFICACIÓN CRÍTICA: Alumnos con Límite de Faltas</h3>
              <p className="text-xs text-neutral-400 font-light">Se han detectado estudiantes con tres o más observaciones registradas. Es obligatorio emitir una citación formal inmediata.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {urgentStudents.map(item => (
              <div key={item.user.id} className="bg-neutral-950 border border-amber-900/40 p-4 rounded-2xl flex flex-col justify-between space-y-3">
                <div className="flex items-center space-x-3">
                  <img src={item.user.fotografia || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"} alt={item.user.nombreCompleto} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs text-neutral-100">{item.user.nombreCompleto}</h4>
                    <span className="text-[10px] text-amber-500 font-medium">Acumula: {item.count} observaciones</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={async () => {
                      setCitationStudent(item.user);
                      const studentObsList = observations.filter(o => o.estudianteId === item.user.id);
                      const combinedDetails = studentObsList.map(o => o.detalle).join('; ');
                      setCitationForm({
                        fechaCitacion: new Date().toISOString().split('T')[0],
                        horaCitacion: '08:00',
                        motivo: `Citar al apoderado debido a la acumulación de ${item.count} observaciones conductuales que afectan el rendimiento y la convivencia del estudiante en el centro académico.`,
                        consecuencias: 'Amonestación disciplinaria escrita y firma de acta de compromiso de tutor y alumno.',
                        opinionOrientador: 'Cargando análisis institucional de faltas acumuladas...'
                      });
                      setShowCitationModal(true);
                      setIsGeneratingAI(true);
                      try {
                        const response = await fetch('/api/ai/analyze-conduct', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            estudianteNombre: item.user.nombreCompleto,
                            detalle: `Acumulación de ${item.count} faltas conductuales. Detalle de incidentes registrados: ${combinedDetails}`,
                            docenteNombre: 'Varios docentes',
                            tipo: 'Acumulación de indisciplinas'
                          })
                        });
                        const data = await response.json();
                        if (data.paragraph) {
                          setCitationForm(prev => ({
                            ...prev,
                            opinionOrientador: data.paragraph
                          }));
                        }
                      } catch (error) {
                        console.error('Error generating AI text:', error);
                      } finally {
                        setIsGeneratingAI(false);
                      }
                    }}
                    className="flex-1 py-1.5 bg-[#5A2D1A] hover:bg-[#7D4229] border border-[#D4AF37]/50 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all text-center"
                  >
                    Citar Tutor
                  </button>
                  <button
                    onClick={() => handleResetObservations(item.user.id, item.user.nombreCompleto)}
                    className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-all"
                    title="Reiniciar Ficha Disciplinaria"
                  >
                    <RotateCcw className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DUAL WORKSPACE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: FILTERS & CONTROLS */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center space-x-2 pb-3 border-b border-neutral-900">
              <Filter className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="font-display font-bold text-xs uppercase tracking-wider">Filtros de Búsqueda</h3>
            </div>

            {/* General search */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">Palabra Clave</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Buscar alumno, docente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Course Filter (Admins & Orientación) */}
            {isManagementRole && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">Por Curso</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="">Todos los Cursos</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Severity Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">Por Gravedad</label>
              <select
                value={selectedImportance}
                onChange={(e) => setSelectedImportance(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="">Todas las Gravedades</option>
                <option value="Regular">Regular</option>
                <option value="Importante">Importante</option>
                <option value="Muy importante">Muy importante</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">Por Tipo de Reporte</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="">Todos los tipos</option>
                <option value="conducta">Conducta / Disciplina</option>
                <option value="excusa">Excusa / Licencia</option>
                <option value="rendimiento">Rendimiento Académico</option>
                <option value="otra">Otra incidencia</option>
              </select>
            </div>

            {/* Clear filters */}
            {(searchTerm || selectedCourseId || selectedImportance || selectedType) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCourseId('');
                  setSelectedImportance('');
                  setSelectedType('');
                }}
                className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Limpiar Filtros
              </button>
            )}
          </div>

          {/* CITATIONS LIST (NOTICES FOR TUTORS) */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-[#D4AF37]" />
                <h3 className="font-display font-bold text-xs uppercase tracking-wider">Citaciones Emitidas</h3>
              </div>
              <span className="text-[10px] bg-neutral-900 text-neutral-400 font-bold px-2 py-0.5 rounded-md">
                {filteredCitations.length}
              </span>
            </div>

            {filteredCitations.length === 0 ? (
              <p className="text-xs text-neutral-500 font-light py-6 text-center">No hay citaciones programadas.</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {filteredCitations.map(cit => (
                  <div key={cit.id} className="bg-neutral-900/50 border border-neutral-800/80 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-xs text-neutral-200">{cit.estudianteNombre}</h4>
                        <span className="text-[9px] text-neutral-500 block">Tutor: {cit.tutorNombre}</span>
                      </div>
                      {isManagementRole && (
                        <button
                          onClick={() => handleDeleteCitation(cit.id)}
                          className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                          title="Cancelar citación"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-[10px] text-[#D4AF37] font-mono bg-neutral-950/40 p-2 rounded-lg border border-neutral-800/40">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{cit.fechaCitacion}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{cit.horaCitacion}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-neutral-400 font-light leading-relaxed line-clamp-3">
                      {cit.motivo}
                    </p>
                    <button
                      onClick={() => {
                        setActiveCitationForPrint(cit);
                        setShowPrintModal(true);
                      }}
                      className="w-full py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5"
                    >
                      <Printer className="h-3 w-3" />
                      <span>Ver Reporte de Situación</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN OBSERVATIONS REGISTER FEED */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div>
                <h3 className="font-display font-bold text-sm text-[#D4AF37] uppercase tracking-wider">Bitácora de Observaciones Registradas</h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">Mostrando incidencias ordenadas por gravedad (prioridad máxima primero).</p>
              </div>
              <span className="text-xs bg-neutral-900 text-[#D4AF37] font-bold border border-neutral-800 px-3 py-1 rounded-xl">
                {filteredObs.length} Registros
              </span>
            </div>

            {filteredObs.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-neutral-800 rounded-2xl">
                <AlertCircle className="h-8 w-8 text-neutral-600 mx-auto mb-3" />
                <p className="text-xs text-neutral-400">No se encontraron observaciones que coincidan con los filtros.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredObs.map(obs => {
                  const studentTotalObs = getStudentObsCount(obs.estudianteId);
                  const isAuthor = obs.docenteId === currentUser.id;
                  const canDelete = isManagementRole || (currentUser.role === 'docente' && isAuthor);

                  return (
                    <div 
                      key={obs.id} 
                      className={`border rounded-2xl p-5 md:p-6 transition-all duration-300 relative overflow-hidden ${
                        obs.importancia === 'Muy importante'
                          ? 'bg-rose-950/10 border-rose-900/30 hover:border-rose-800/50 shadow-sm'
                          : obs.importancia === 'Importante'
                          ? 'bg-amber-950/10 border-amber-900/30 hover:border-amber-800/50 shadow-sm'
                          : 'bg-neutral-900/20 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {/* Priority accent ribbon */}
                      <div className={`absolute top-0 left-0 w-1 h-full ${
                        obs.importancia === 'Muy importante'
                          ? 'bg-rose-500'
                          : obs.importancia === 'Importante'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`} />

                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        {/* Student Details */}
                        <div className="flex items-start space-x-3.5">
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-neutral-400 font-bold overflow-hidden">
                              <User className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-sm text-neutral-100">{obs.estudianteNombre}</span>
                              <span className="text-[10px] bg-neutral-900 text-neutral-400 font-bold border border-neutral-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                                {obs.cursoNombre || 'General'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-neutral-500 font-light">
                              <span>Fecha: {obs.fecha.substring(0, 10)}</span>
                              <span>•</span>
                              <span>Docente: {obs.docenteNombre}</span>
                              <span>•</span>
                              <span className="font-bold text-amber-500">Historial: {studentTotalObs} obs.</span>
                            </div>
                          </div>
                        </div>

                        {/* Badges and Actions */}
                        <div className="flex items-center space-x-2 shrink-0 self-end md:self-start">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                            obs.importancia === 'Muy importante'
                              ? 'bg-rose-950/50 text-rose-400 border-rose-900/40'
                              : obs.importancia === 'Importante'
                              ? 'bg-amber-950/50 text-amber-400 border-amber-900/40'
                              : 'bg-emerald-950/50 text-emerald-400 border-emerald-900/40'
                          }`}>
                            {obs.importancia}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-neutral-900 text-neutral-400 border border-neutral-800">
                            {obs.tipo}
                          </span>
                        </div>
                      </div>

                      {/* Detail Text content */}
                      <div className="mt-4 bg-neutral-950/40 p-4 rounded-xl border border-neutral-800/40">
                        <p className="text-xs text-neutral-300 leading-relaxed font-light whitespace-pre-line">
                          {obs.detalle}
                        </p>
                      </div>

                      {/* Action buttons at bottom right */}
                      {canDelete && (
                        <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-neutral-900">
                          {isManagementRole && (
                            <button
                              onClick={async () => {
                                const stud = users.find(u => u.id === obs.estudianteId);
                                if (stud) {
                                  setCitationStudent(stud);
                                  setCitationForm({
                                    fechaCitacion: new Date().toISOString().split('T')[0],
                                    horaCitacion: '08:00',
                                    motivo: `Citación al tutor debido a la observación disciplinaria del ${obs.fecha.substring(0,10)}:\n"${obs.detalle}"`,
                                    consecuencias: 'Compromiso firmado de mejoramiento escolar inmediato.',
                                    opinionOrientador: 'Cargando análisis institucional...'
                                  });
                                  setShowCitationModal(true);
                                  setIsGeneratingAI(true);
                                  try {
                                    const response = await fetch('/api/ai/analyze-conduct', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        estudianteNombre: stud.nombreCompleto,
                                        detalle: obs.detalle,
                                        docenteNombre: obs.docenteNombre,
                                        tipo: obs.tipo
                                      })
                                    });
                                    const data = await response.json();
                                    if (data.paragraph) {
                                      setCitationForm(prev => ({
                                        ...prev,
                                        opinionOrientador: data.paragraph
                                      }));
                                    }
                                  } catch (error) {
                                    console.error('Error generating AI text:', error);
                                  } finally {
                                    setIsGeneratingAI(false);
                                  }
                                }
                              }}
                              className="px-3.5 py-1.5 bg-[#5A2D1A] hover:bg-[#7D4229] text-[#D4AF37] hover:text-white border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center space-x-1.5"
                            >
                              <FileText className="h-3 w-3" />
                              <span>Generar Citación</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteObservation(obs.id)}
                            className="px-3.5 py-1.5 bg-neutral-900 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 border border-neutral-800 hover:border-rose-900 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center space-x-1.5"
                          >
                            <Trash className="h-3 w-3" />
                            <span>{currentUser.role === 'docente' ? 'Retirar' : 'Eliminar'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: REGISTRAR CITACIÓN PARA PADRES */}
      {showCitationModal && citationStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider block">Psicología & Orientación</span>
                <h3 className="font-display text-lg font-bold text-neutral-100">Crear Reporte de Situación y Citación</h3>
              </div>
              <button onClick={() => setShowCitationModal(false)} className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-left">
              <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 flex items-center space-x-3">
                <div className="w-10 h-10 bg-neutral-950 border border-neutral-800 text-[#D4AF37] rounded-full flex items-center justify-center font-bold text-xs">
                  {citationStudent.nombreCompleto.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-neutral-100">{citationStudent.nombreCompleto}</h4>
                  <p className="text-[10px] text-neutral-500 font-light">Tutor Responsable: <span className="text-neutral-300 font-medium">{citationStudent.tutor || 'No asignado'}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Fecha de la Cita</label>
                  <input
                    type="date"
                    value={citationForm.fechaCitacion}
                    onChange={(e) => setCitationForm({ ...citationForm, fechaCitacion: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Hora de la Cita</label>
                  <input
                    type="time"
                    value={citationForm.horaCitacion}
                    onChange={(e) => setCitationForm({ ...citationForm, horaCitacion: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Motivo Formal de la Cita</label>
                <textarea
                  value={citationForm.motivo}
                  onChange={(e) => setCitationForm({ ...citationForm, motivo: e.target.value })}
                  placeholder="Detalle por qué se cita al apoderado de forma explícita..."
                  rows={4}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-[#D4AF37] placeholder-neutral-600 resize-none font-light leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Consecuencias / Compromisos Sugeridos</label>
                <input
                  type="text"
                  value={citationForm.consecuencias}
                  onChange={(e) => setCitationForm({ ...citationForm, consecuencias: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-bold flex items-center space-x-1.5">
                    <span>Opinión y Dictamen Psicopedagógico (IA)</span>
                  </label>
                  {isGeneratingAI && (
                    <span className="text-[9px] text-[#D4AF37] flex items-center space-x-1 animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Analizando conducta...</span>
                    </span>
                  )}
                </div>
                <textarea
                  value={citationForm.opinionOrientador}
                  onChange={(e) => setCitationForm({ ...citationForm, opinionOrientador: e.target.value })}
                  placeholder="La IA está redactando la postura oficial y dictamen psicopedagógico del departamento..."
                  rows={4}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-[#D4AF37] placeholder-neutral-600 resize-none font-light leading-relaxed font-sans"
                  disabled={isGeneratingAI}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-900">
              <button
                type="button"
                onClick={() => setShowCitationModal(false)}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateCitation}
                className="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#5A2D1A] text-white hover:bg-[#7D4229] transition-colors shadow-md"
              >
                Guardar e Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE IMPRESIÓN: REPORTE DE SITUACIÓN IMPRIMIBLE COMPLETO */}
      {showPrintModal && activeCitationForPrint && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4 sm:p-6 md:p-10 overflow-y-auto">
          <div className="bg-white text-neutral-900 rounded-3xl max-w-3xl w-full p-6 md:p-10 space-y-8 shadow-2xl relative mx-auto my-4 md:my-8">
            
            {/* Non-printable action header */}
            <div className="print:hidden flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-neutral-200 mb-6">
              <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1.5">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>Documento generado con éxito</span>
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleDownloadDoc}
                  className="px-4 py-2 bg-[#5A2D1A] hover:bg-[#7D4229] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center space-x-2 shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Descargar Word (.doc)</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center space-x-2 shadow-sm"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* PRINT-FRIENDLY CONTAINER */}
            <div id="reporte-citacion-institucional" className="print-content space-y-8 border-4 border-double border-neutral-300 p-8 rounded-xl font-sans text-left">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-neutral-800 pb-4">
                <div className="flex items-center space-x-4">
                  <img src={logoDuarte} alt="Logo Duarte" className="h-16 w-16 object-contain shrink-0" referrerPolicy="no-referrer" />
                  <div className="space-y-1">
                    <h1 className="font-bold text-lg tracking-wider text-neutral-900 uppercase">Liceo Juan Pablo Duarte</h1>
                    <p className="text-[10px] text-neutral-600 uppercase font-bold tracking-widest font-mono">"Estudio • Perseverancia • Libertad"</p>
                    <p className="text-[10px] text-neutral-500">Unidad de Orientación Escolar & Convivencia Disciplinaria</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold block bg-neutral-100 border border-neutral-300 px-3 py-1.5 rounded-lg text-neutral-800">
                      ID REPORTE: {activeCitationForPrint.id}
                    </span>
                    <span className="text-[9px] text-neutral-400 block mt-1">Fecha Emisión: {new Date().toLocaleDateString('es-ES')}</span>
                  </div>
                  <img src={logoCupula} alt="Logo Cúpula" className="h-16 w-16 object-contain shrink-0" referrerPolicy="no-referrer" />
                </div>
              </div>

              {/* Document Title */}
              <div className="text-center space-y-1 py-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                <h2 className="font-black text-sm uppercase tracking-wider text-neutral-900">Acta de Citación y Reporte de Situación Conductual</h2>
                <p className="text-[10px] text-neutral-600">Notificación disciplinaria formal obligatoria para Padres y Apoderados</p>
              </div>

              {/* Student info box */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="border border-neutral-200 p-4 rounded-xl space-y-1.5">
                  <h3 className="font-bold text-[10px] text-neutral-500 uppercase tracking-wider">Datos del Estudiante</h3>
                  <p><strong className="text-neutral-700">Nombre Completo:</strong> {activeCitationForPrint.estudianteNombre}</p>
                  <p><strong className="text-neutral-700">Matrícula:</strong> {users.find(u => u.id === activeCitationForPrint.estudianteId)?.matricula || 'N/A'}</p>
                  <p><strong className="text-neutral-700">Curso:</strong> {users.find(u => u.id === activeCitationForPrint.estudianteId)?.seccion ? `Sección ${users.find(u => u.id === activeCitationForPrint.estudianteId)?.seccion}` : 'Regular'}</p>
                </div>
                <div className="border border-neutral-200 p-4 rounded-xl space-y-1.5">
                  <h3 className="font-bold text-[10px] text-neutral-500 uppercase tracking-wider">Datos de la Citación</h3>
                  <p><strong className="text-neutral-700">Tutor Convocado:</strong> {activeCitationForPrint.tutorNombre}</p>
                  <p><strong className="text-neutral-700">Fecha Citación:</strong> {activeCitationForPrint.fechaCitacion}</p>
                  <p><strong className="text-neutral-700">Hora Citación:</strong> {activeCitationForPrint.horaCitacion}</p>
                </div>
              </div>

              {/* Motivo de la Cita */}
              <div className="space-y-2 text-xs border border-neutral-200 p-4 rounded-xl">
                <h3 className="font-bold text-[10px] text-neutral-500 uppercase tracking-wider">Motivos y Evidencias Conductuales Registradas</h3>
                <p className="text-neutral-800 leading-relaxed font-mono whitespace-pre-line text-[11px] bg-neutral-50/50 p-3 rounded-lg border border-neutral-100">
                  {activeCitationForPrint.motivo}
                </p>
              </div>

              {/* Dictamen Psicopedagógico (Análisis de Orientación) */}
              {activeCitationForPrint.opinionOrientador && (
                <div className="space-y-2 text-xs border border-neutral-200 p-4 rounded-xl bg-neutral-50/20">
                  <h3 className="font-bold text-[10px] text-neutral-500 uppercase tracking-wider">Dictamen Psicopedagógico de Orientación y Psicología</h3>
                  <p className="text-neutral-800 leading-relaxed text-[11px] font-sans">
                    {activeCitationForPrint.opinionOrientador}
                  </p>
                </div>
              )}

              {/* Consequences and agreements */}
              <div className="space-y-2 text-xs border border-neutral-200 p-4 rounded-xl">
                <h3 className="font-bold text-[10px] text-neutral-500 uppercase tracking-wider">Consecuencias Disciplinarias y Compromisos</h3>
                <p className="text-neutral-800 leading-relaxed font-light">
                  {activeCitationForPrint.consecuencias}
                </p>
                <p className="text-[10px] text-neutral-500 leading-normal mt-2 italic">
                  * El tutor firmante se compromete a supervisar de forma activa el comportamiento diario del estudiante, colaborando estrechamente con el equipo de orientación del centro educativo.
                </p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-x-12 gap-y-16 pt-12 text-xs">
                <div className="text-center border-t border-neutral-400 pt-3">
                  <span className="font-bold text-neutral-800 block">Licda. Clara Luz Cabrera</span>
                  <span className="text-[10px] text-neutral-500 block">Unidad de Orientación y Psicología</span>
                </div>
                <div className="text-center border-t border-neutral-400 pt-3">
                  <span className="font-bold text-neutral-800 block">Firma de Docente Autor</span>
                  <span className="text-[10px] text-neutral-500 block">Registro de Observaciones</span>
                </div>
                <div className="text-center border-t border-neutral-400 pt-3">
                  <span className="font-bold text-neutral-800 block">Firma de Padre, Madre o Tutor</span>
                  <span className="text-[10px] text-neutral-500 block">Tutor Responsable del Alumno</span>
                </div>
                <div className="text-center border-t border-neutral-400 pt-3">
                  <span className="font-bold text-neutral-800 block">{activeCitationForPrint.estudianteNombre}</span>
                  <span className="text-[10px] text-neutral-500 block">Firma del Estudiante</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {customConfirm?.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl text-left">
            <div className="flex items-center space-x-3 text-[#D4AF37]">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <h4 className="font-display font-bold text-sm text-neutral-100">{customConfirm.title}</h4>
            </div>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              {customConfirm.message}
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setCustomConfirm(null)}
                className="px-3.5 py-1.5 rounded-lg text-[11px] font-semibold bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white transition-all"
              >
                {customConfirm.cancelText || 'Cancelar'}
              </button>
              <button
                onClick={customConfirm.onConfirm}
                className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-rose-950 hover:bg-rose-800 text-white transition-all shadow-md shadow-rose-950/20"
              >
                {customConfirm.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
