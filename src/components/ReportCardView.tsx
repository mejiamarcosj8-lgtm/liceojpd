import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Printer, Calendar, ShieldCheck, 
  AlertTriangle, Users, FileText, CheckCircle2, RefreshCw, Sparkles, 
  Download, FileDown, Award, BookOpen, ChevronRight, Search, CheckCircle, ArrowLeft,
  Edit, Trash2, RotateCcw, X
} from 'lucide-react';
import { User as UserType, Course, Subject, Grade, SystemConfig } from '../types';
// @ts-ignore
import logoDuarte from '../assets/images/logo_duarte_1783545572734.jpg';
// @ts-ignore
import logoCupula from '../assets/images/logo_cupula_1783655502703.jpg';

interface ReportCardViewProps {
  currentUser: UserType;
  users: UserType[];
  courses: Course[];
  subjects: Subject[];
  grades: Grade[];
  syncData: () => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  sysConfig?: SystemConfig;
}

export const isSubjectNameMatch = (name1: string, name2: string): boolean => {
  if (!name1 || !name2) return false;
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  if (n1 === n2) return true;
  
  const normalize = (s: string) => {
    return s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/\bde la\b/g, "")
      .replace(/\bdel\b/g, "")
      .replace(/\blas\b/g, "")
      .replace(/\blos\b/g, "")
      .replace(/\by\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };
  
  const norm1 = normalize(n1);
  const norm2 = normalize(n2);
  
  if (norm1 === norm2) return true;
  
  if ((norm1.includes("natural") && norm2.includes("naturaleza")) || 
      (norm1.includes("naturaleza") && norm2.includes("natural"))) {
    return true;
  }
  
  return false;
};

export default function ReportCardView({
  currentUser,
  users,
  courses,
  subjects,
  grades,
  syncData,
  showNotification,
  sysConfig
}: ReportCardViewProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showDocument, setShowDocument] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Custom confirmation modal state (safe for iframes)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      }
    });
  };

  // Admin grade editing states
  const [isEditingGrades, setIsEditingGrades] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingGradesForm, setEditingGradesForm] = useState<{
    [subjectId: string]: Partial<Grade>
  }>({});

  const handleResetCourseGrades = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    triggerConfirm(
      "Reinicio de Calificaciones del Curso",
      `⚠️ ADVERTENCIA CRÍTICA: ¿Está completamente seguro de que desea REINICIAR TODAS las calificaciones de TODOS los estudiantes del curso "${course.nombre}"? Esta acción eliminará de forma irreversible todas las calificaciones (P1, P2, P3, P4) registradas para este curso en el sistema.`,
      () => {
        fetch('/api/grades/reset-course', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, modifier: currentUser.nombreCompleto })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            showNotification(`¡Éxito! Se han restablecido las calificaciones del curso. Registros eliminados: ${data.removedCount}`, 'success');
            syncData();
          } else {
            showNotification('Error al reiniciar las calificaciones del curso.', 'error');
          }
        })
        .catch(err => {
          console.error(err);
          showNotification('Error de conexión con el servidor.', 'error');
        });
      }
    );
  };

  const handleResetStudentGrades = (studentId: string) => {
    const student = users.find(u => u.id === studentId);
    if (!student) return;

    triggerConfirm(
      "Reinicio de Calificaciones del Estudiante",
      `⚠️ ADVERTENCIA: ¿Está seguro de que desea REINICIAR TODAS las calificaciones de ${student.nombreCompleto}? Se restablecerán a vacío de forma irreversible.`,
      () => {
        fetch('/api/grades/reset-student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, modifier: currentUser.nombreCompleto })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            showNotification(`¡Éxito! Se han restablecido las calificaciones de ${student.nombreCompleto}.`, 'success');
            syncData();
          } else {
            showNotification('Error al reiniciar las calificaciones del estudiante.', 'error');
          }
        })
        .catch(err => {
          console.error(err);
          showNotification('Error de conexión con el servidor.', 'error');
        });
      }
    );
  };

  const startEditingGrades = (studentId: string) => {
    const student = users.find(u => u.id === studentId);
    if (!student) return;

    const courseSubs = subjects.filter(s => s.cursoId === student.cursoId);
    const studentGrds = grades.filter(g => g.estudianteId === studentId);

    const initialForm: typeof editingGradesForm = {};
    courseSubs.forEach(sub => {
      const g = studentGrds.find(gr => gr.materiaId === sub.id || isSubjectNameMatch(gr.materiaNombre, sub.nombre));
      initialForm[sub.id] = g ? { ...g } : {};
    });

    setEditingGradesForm(initialForm);
    setEditingStudentId(studentId);
    setIsEditingGrades(true);
  };

  const handleSaveEditedGrades = () => {
    if (!editingStudentId) return;

    const student = users.find(u => u.id === editingStudentId);
    if (!student) return;

    const courseSubs = subjects.filter(s => s.cursoId === student.cursoId);
    const gradesList = courseSubs.map(sub => {
      const formVal = editingGradesForm[sub.id] || {};
      return {
        materiaId: sub.id,
        materiaNombre: sub.nombre,
        comp1_p1: Number(formVal.comp1_p1 || 0),
        comp1_p2: Number(formVal.comp1_p2 || 0),
        comp1_p3: Number(formVal.comp1_p3 || 0),
        comp1_p4: Number(formVal.comp1_p4 || 0),
        comp2_p1: Number(formVal.comp2_p1 || 0),
        comp2_p2: Number(formVal.comp2_p2 || 0),
        comp2_p3: Number(formVal.comp2_p3 || 0),
        comp2_p4: Number(formVal.comp2_p4 || 0),
        comp3_p1: Number(formVal.comp3_p1 || 0),
        comp3_p2: Number(formVal.comp3_p2 || 0),
        comp3_p3: Number(formVal.comp3_p3 || 0),
        comp3_p4: Number(formVal.comp3_p4 || 0),
        comp4_p1: Number(formVal.comp4_p1 || 0),
        comp4_p2: Number(formVal.comp4_p2 || 0),
        comp4_p3: Number(formVal.comp4_p3 || 0),
        comp4_p4: Number(formVal.comp4_p4 || 0),
      };
    });

    fetch('/api/grades/update-bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modifier: currentUser.nombreCompleto,
        studentId: editingStudentId,
        gradesList
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showNotification(`¡Calificaciones de ${student.nombreCompleto} guardadas con éxito!`, 'success');
        setIsEditingGrades(false);
        setEditingStudentId(null);
        syncData();
      } else {
        showNotification('Error al actualizar las calificaciones.', 'error');
      }
    })
    .catch(err => {
      console.error(err);
      showNotification('Error de conexión al guardar calificaciones.', 'error');
    });
  };

  // Filter active courses
  const activeCourses = courses.filter(c => c.activo !== false);

  // Sync data handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    syncData();
    setTimeout(() => {
      setIsRefreshing(false);
      showNotification('Calificaciones y boletines actualizados desde el servidor.', 'success');
    }, 800);
  };

  // Get active student details
  const selectedStudent = users.find(u => u.id === selectedStudentId && u.role === 'estudiante');
  const selectedCourse = courses.find(c => c.id === (selectedCourseId || selectedStudent?.cursoId));

  // Get subjects for selected course
  const courseSubjects = subjects.filter(s => s.cursoId === selectedCourseId);

  // Get grades for a specific student
  const getStudentGrades = (studentId: string) => {
    return grades.filter(g => g.estudianteId === studentId);
  };

  // Get completion percentage of grading for a course
  const getCourseGradingStats = (courseId: string) => {
    const courseSubs = subjects.filter(s => s.cursoId === courseId);
    const courseSts = users.filter(u => u.cursoId === courseId && u.role === 'estudiante');
    
    if (courseSubs.length === 0 || courseSts.length === 0) {
      return { total: 0, completed: 0, percent: 100, isComplete: true };
    }

    const totalExpectedGrades = courseSubs.length * courseSts.length;
    let completedGradesCount = 0;

    courseSts.forEach(student => {
      const studentGrds = grades.filter(g => g.estudianteId === student.id);
      courseSubs.forEach(sub => {
        const hasGrd = studentGrds.some(g => g.materiaId === sub.id && (g.p1 > 0 || g.p2 > 0 || g.p3 > 0 || g.p4 > 0));
        if (hasGrd) {
          completedGradesCount++;
        }
      });
    });

    const percent = Math.round((completedGradesCount / totalExpectedGrades) * 100);
    return {
      total: totalExpectedGrades,
      completed: completedGradesCount,
      percent,
      isComplete: percent === 100
    };
  };

  // Get grading completion for a single student
  const getStudentGradingStats = (studentId: string, courseId: string) => {
    const studentSubs = subjects.filter(s => s.cursoId === courseId);
    const studentGrds = grades.filter(g => g.estudianteId === studentId);

    if (studentSubs.length === 0) return { completed: 0, total: 0, percent: 100, isComplete: true };

    let completed = 0;
    studentSubs.forEach(sub => {
      // Considered graded if at least one period has a non-zero mark
      const g = studentGrds.find(gr => gr.materiaId === sub.id || isSubjectNameMatch(gr.materiaNombre, sub.nombre));
      if (g && (g.p1 > 0 || g.p2 > 0 || g.p3 > 0 || g.p4 > 0)) {
        completed++;
      }
    });

    const percent = Math.round((completed / studentSubs.length) * 100);
    return {
      completed,
      total: studentSubs.length,
      percent,
      isComplete: completed === studentSubs.length
    };
  };

  // Calculate student average across all subjects
  const getStudentGeneralAverage = (studentId: string) => {
    const studentGrds = grades.filter(g => g.estudianteId === studentId);
    if (studentGrds.length === 0) return 0;
    
    const sum = studentGrds.reduce((acc, curr) => acc + curr.promedio, 0);
    return Math.round(sum / studentGrds.length);
  };

  // Trigger browser print
  const handlePrint = () => {
    try {
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        showNotification('Nota: Para imprimir o guardar en PDF, si el cuadro de diálogo no se abre, utilice el botón "Abrir en nueva pestaña" en la esquina superior derecha o presione Ctrl+P / Cmd+P.', 'info');
      }
      window.print();
    } catch (e) {
      console.error(e);
      window.print();
    }
  };

  // Download boletin as Word .doc
  const handleDownloadDoc = () => {
    try {
      const element = document.getElementById('boletin-calificaciones-oficial');
      if (!element) {
        showNotification('Error: No se encontró el boletín para exportar.', 'error');
        return;
      }
      
      const htmlContent = element.innerHTML;
      
      const styles = `
        <style>
          body { font-family: Arial, sans-serif; font-size: 11pt; color: #333333; line-height: 1.4; margin: 1in; }
          .header-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
          .header-table td { border: none; padding: 5px; }
          h1 { color: #5a2d1a; font-size: 15pt; font-weight: bold; margin-bottom: 3px; text-transform: uppercase; text-align: center; }
          h2 { color: #111827; font-size: 12pt; font-weight: bold; margin-top: 5px; margin-bottom: 5px; text-align: center; }
          h3 { color: #5a2d1a; font-size: 11pt; font-weight: bold; margin-top: 15px; border-bottom: 1px solid #dddddd; padding-bottom: 2px; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .meta-table td { border: 1px solid #e5e7eb; padding: 6px; font-size: 9.5pt; }
          table.grades-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
          table.grades-table th { background-color: #f3f4f6; color: #111827; font-weight: bold; border: 1px solid #cccccc; padding: 6px; text-align: left; font-size: 9.5pt; }
          table.grades-table td { border: 1px solid #e5e7eb; padding: 6px; text-align: left; font-size: 9.5pt; }
          .font-bold { font-weight: bold; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-[#D4AF37] { color: #b45309; }
          .bg-emerald-50 { background-color: #ecfdf5; color: #047857; }
          .bg-red-50 { background-color: #fef2f2; color: #b91c1c; }
          .footer-signs { width: 100%; margin-top: 50px; }
          .footer-signs td { width: 50%; text-align: center; border: none; padding: 20px; font-size: 10pt; }
          .footer-signs .line { border-top: 1px solid #000000; width: 200px; margin: 0 auto 5px auto; }
        </style>
      `;

      const documentContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <meta charset="utf-8">
            <title>Boletín Académico - ${selectedStudent?.nombreCompleto}</title>
            ${styles}
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + documentContent], {
        type: 'application/msword;charset=utf-8'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Boletin_${selectedStudent?.nombreCompleto.replace(/\s+/g, '_')}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('¡Boletín oficial (.doc) descargado! Se puede editar y firmar en Microsoft Word o Google Docs.', 'success');
    } catch (error) {
      console.error(error);
      showNotification('Error al exportar boletín a Word.', 'error');
    }
  };

  // Download boletin as formatted HTML
  const handleDownloadHtml = () => {
    try {
      const element = document.getElementById('boletin-calificaciones-oficial');
      if (!element) {
        showNotification('Error: No se encontró el boletín para exportar.', 'error');
        return;
      }
      
      const htmlContent = element.innerHTML;
      const fullHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boletín de Calificaciones - ${selectedStudent?.nombreCompleto}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body { background: white !important; color: black !important; padding: 0 !important; }
      .no-print { display: none !important; }
      #print-canvas { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
    }
  </style>
</head>
<body class="bg-neutral-100 py-10 px-4 font-sans text-neutral-900">
  <div class="max-w-4xl mx-auto mb-6 flex justify-between items-center no-print">
    <div class="text-xs text-neutral-500">
      <strong>Boletín Digital:</strong> Este archivo es un documento escolar imprimible 100% independiente.
    </div>
    <div class="flex gap-2">
      <button onclick="window.close()" class="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer">
        Cerrar pestaña
      </button>
      <button onclick="window.print()" class="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-600/20">
        Imprimir / Guardar PDF
      </button>
    </div>
  </div>
  <div id="print-canvas" class="bg-white text-neutral-900 p-8 sm:p-12 md:p-16 rounded-2xl shadow-xl max-w-4xl mx-auto border border-neutral-200">
    ${htmlContent}
  </div>
</body>
</html>
      `;

      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Boletin_Academico_${selectedStudent?.nombreCompleto.replace(/\s+/g, '_')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('¡Archivo web (.html) del boletín descargado con éxito!', 'success');
    } catch (e) {
      console.error(e);
      showNotification('Error al exportar a HTML.', 'error');
    }
  };

  // Filter students in the selected course
  const studentsInCourse = users.filter(u => 
    u.role === 'estudiante' && 
    u.cursoId === selectedCourseId &&
    (searchTerm === '' || u.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) || u.matricula?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in print:bg-white print:text-black">
      
      {/* 1. Header (No se imprime) */}
      {!showDocument && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/10 text-[#D4AF37] border border-amber-500/20 rounded-2xl">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                Boletines de Calificaciones
                <span className="text-[10px] bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                  Admin Vista
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-1 font-light">
                Audite la carga de calificaciones por asignaturas y genere boletines oficiales de notas por estudiante.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-xs font-semibold text-neutral-200 transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sincronizar Notas</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Global Course Grading Upload Status Dashboard (No se imprime) */}
      {!showDocument && !selectedCourseId && (
        <div className="space-y-6 print:hidden">
          {/* Card descriptiva general */}
          <div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-850 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-[#D4AF37]">
              <Sparkles className="h-32 w-32" />
            </div>
            <div className="relative z-10 space-y-4 max-w-3xl">
              <span className="text-[10px] bg-amber-500/15 text-[#D4AF37] border border-amber-500/30 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider inline-block">
                Estado General de Carga Académica
              </span>
              <h1 className="text-xl md:text-2xl font-display font-black text-white leading-tight">
                Boletines de Rendimiento Periódico
              </h1>
              <p className="text-xs text-neutral-300 leading-relaxed font-light">
                Bienvenido al panel de auditoría de calificaciones del Liceo Juan Pablo Duarte. Aquí puede revisar en tiempo real si los docentes de cada materia han completado la carga de notas de todos los alumnos de los distintos cursos. Una vez completado o durante el transcurso, puede generar y descargar el boletín individual del estudiante para uso del centro o entrega a padres.
              </p>
            </div>
          </div>

          {/* Grid de Cursos y su porcentaje de carga */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-400 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#D4AF37]" />
              <span>Progreso de Carga de Calificaciones por Grado / Sección</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCourses.map(course => {
                const stats = getCourseGradingStats(course.id);
                const studentsCount = users.filter(u => u.cursoId === course.id && u.role === 'estudiante').length;
                const subjectsCount = subjects.filter(s => s.cursoId === course.id).length;

                return (
                  <div 
                    key={course.id}
                    onClick={() => setSelectedCourseId(course.id)}
                    className="bg-neutral-950 hover:bg-neutral-900/80 border border-neutral-850 hover:border-neutral-700 p-5 rounded-2xl transition-all cursor-pointer group shadow-md flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                          {course.nivel || 'Secundaria'}
                        </span>
                        <h4 className="text-base font-bold text-white group-hover:text-[#D4AF37] transition-colors mt-0.5">
                          {course.nombre}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-neutral-400">
                          <span>{studentsCount} Alumnos</span>
                          <span className="text-neutral-600">•</span>
                          <span>{subjectsCount} Asignaturas</span>
                        </div>
                      </div>

                      {stats.isComplete ? (
                        <div className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg shrink-0" title="Carga Completa">
                          <CheckCircle className="h-4.5 w-4.5" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg shrink-0" title="Carga en Progreso">
                          <ClockIcon className="h-4.5 w-4.5" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-[10px] font-bold text-neutral-400">
                        <span>Carga Académica</span>
                        <span className={stats.isComplete ? "text-emerald-400" : "text-amber-500"}>{stats.percent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${stats.isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${stats.percent}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-neutral-500 italic mt-1 leading-normal">
                        {stats.isComplete 
                          ? 'Todas las materias han subido calificaciones para este grado.' 
                          : 'Pendiente de subir notas periódicas en algunas materias.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-[#D4AF37] pt-2 border-t border-neutral-900 group-hover:translate-x-1 transition-transform duration-300">
                      <span>Ver Estudiantes</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Student list of selected Course (No se imprime) */}
      {!showDocument && selectedCourseId && (
        <div className="space-y-6 print:hidden">
          {/* Back button and title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-850 pb-4">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => {
                  setSelectedCourseId(null);
                  setSelectedStudentId(null);
                  setSearchTerm('');
                }}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">Boletines Académicos</span>
                <h3 className="text-base font-bold text-white">
                  Alumnos en {selectedCourse?.nombre}
                </h3>
              </div>
            </div>

            {/* Search and Reset Row */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {(currentUser.role === 'admin' || currentUser.role === 'director' || currentUser.role === 'registro') && (
                <button
                  onClick={() => handleResetCourseGrades(selectedCourseId!)}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-red-950/40 hover:bg-red-900/45 border border-red-900/30 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer shrink-0"
                  title="Reiniciar todas las calificaciones de este grado"
                >
                  <RotateCcw className="h-3.5 w-3.5 animate-spin-hover" />
                  <span className="hidden md:inline">Reiniciar Curso</span>
                </button>
              )}

              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Buscar estudiante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Students Grid */}
          {studentsInCourse.length === 0 ? (
            <div className="bg-neutral-950 border border-neutral-850 rounded-2xl p-12 text-center text-xs text-neutral-500">
              No se encontraron estudiantes para este grado o filtro.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studentsInCourse.map(student => {
                const stats = getStudentGradingStats(student.id, selectedCourseId);
                const generalAverage = getStudentGeneralAverage(student.id);

                return (
                  <div 
                    key={student.id}
                    className="bg-neutral-950 border border-neutral-850 rounded-2xl p-5 hover:border-neutral-700 transition-all shadow-md flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={student.fotografia || `https://api.dicebear.com/7.x/initials/svg?seed=${student.nombreCompleto}&backgroundColor=5A2D1A&textColor=ffffff`}
                          alt={student.nombreCompleto} 
                          className="h-10 w-10 rounded-full object-cover border border-neutral-800"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-white">{student.nombreCompleto}</h4>
                          <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">Matrícula: {student.matricula || 'N/A'}</span>
                        </div>
                      </div>
                      
                      {stats.isComplete ? (
                        <span className="text-[9px] bg-emerald-950/50 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          Completo
                        </span>
                      ) : (
                        <span className="text-[9px] bg-amber-950/50 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          {stats.completed}/{stats.total} Mat.
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-1 border-y border-neutral-900/60 text-xs">
                      <div>
                        <span className="block text-[10px] text-neutral-500 uppercase tracking-wider">Promedio General</span>
                        <span className={`text-base font-display font-black block mt-0.5 ${
                          generalAverage >= 70 ? 'text-[#D4AF37]' : generalAverage > 0 ? 'text-red-400' : 'text-neutral-500'
                        }`}>
                          {generalAverage > 0 ? `${generalAverage} pts` : 'Sin notas'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-neutral-500 uppercase tracking-wider">Estado Académico</span>
                        <span className={`text-[10px] font-bold block mt-1.5 uppercase ${
                          generalAverage >= 70 ? 'text-emerald-400' : generalAverage > 0 ? 'text-red-400' : 'text-neutral-500'
                        }`}>
                          {generalAverage >= 70 ? 'Aprobado Prom.' : generalAverage > 0 ? 'Reprobado Prom.' : 'Pendiente'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedStudentId(student.id);
                          setShowDocument(true);
                          showNotification(`Abriendo boletín de calificaciones de ${student.nombreCompleto}...`, 'info');
                        }}
                        className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-600/10"
                      >
                        <FileCheckIcon className="h-4 w-4" />
                        <span>Generar Boletín</span>
                      </button>

                      {(currentUser.role === 'admin' || currentUser.role === 'director' || currentUser.role === 'registro') && (
                        <>
                          <button
                            onClick={() => startEditingGrades(student.id)}
                            className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[#D4AF37] hover:text-[#f3d065] rounded-xl transition-colors cursor-pointer"
                            title="Editar calificaciones directamente"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleResetStudentGrades(student.id)}
                            className="p-2 bg-red-950/40 hover:bg-red-900/45 border border-red-900/30 text-red-400 hover:text-red-300 rounded-xl transition-colors cursor-pointer"
                            title="Reiniciar calificaciones de este estudiante"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Official Report Card Preview & Print Screen (Se imprime) */}
      {showDocument && selectedStudent && (
        <div className="space-y-6">
          
          {/* Action Toolbar (No se imprime) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-950 border border-neutral-850 p-4 rounded-2xl shadow-xl print:hidden">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500/10 text-[#D4AF37] border border-amber-500/20 rounded-xl shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="text-left">
                <span className="text-[9px] bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                  Boletín Oficial de Calificaciones
                </span>
                <p className="text-xs text-neutral-400 mt-1">
                  Estudiante: <strong className="text-white">{selectedStudent.nombreCompleto}</strong> ({selectedCourse?.nombre})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowDocument(false)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Cerrar Previa
              </button>
              
              <button
                onClick={handleDownloadDoc}
                className="flex items-center space-x-1.5 bg-blue-650 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                title="Descargar como documento de Microsoft Word editable (.doc)"
              >
                <Download className="h-4 w-4" />
                <span>Descargar Word (.doc)</span>
              </button>

              <button
                onClick={handleDownloadHtml}
                className="flex items-center space-x-1.5 bg-emerald-650 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                title="Descargar como página web independiente para imprimir sin restricciones"
              >
                <FileDown className="h-4 w-4" />
                <span>Descargar Web Imprimible (.html)</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center space-x-1.5 bg-[#D4AF37] hover:bg-[#F3D065] text-neutral-950 font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>

          {/* Printable container sheet */}
          <div 
            id="boletin-calificaciones-oficial"
            className="bg-white text-neutral-900 p-8 sm:p-12 md:p-16 rounded-2xl shadow-2xl max-w-4xl mx-auto border border-neutral-200 font-sans print:p-0 print:border-none print:shadow-none"
          >
            {/* Header section with school seal logo */}
            <div className="flex items-start justify-between border-b-2 border-[#5A2D1A] pb-6">
              <div className="flex items-start space-x-5">
                {/* School Logo without vectorization */}
                <img 
                  src={logoDuarte} 
                  alt="Liceo Juan Pablo Duarte" 
                  className="h-20 w-20 object-contain rounded-xl shrink-0" 
                  referrerPolicy="no-referrer"
                />
                <div className="text-left">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-500">MINISTERIO DE EDUCACIÓN DE LA REPÚBLICA DOMINICANA</span>
                  <h1 className="text-lg md:text-xl font-bold text-[#5A2D1A] uppercase tracking-tight mt-0.5">
                    {sysConfig?.nombreCentro || 'Liceo Juan Pablo Duarte'}
                  </h1>
                  <p className="text-[11px] text-neutral-600 font-light mt-0.5 italic">
                    "{sysConfig?.eslogan || 'Educación, Perseverancia, Libertad'}" • Tel: {sysConfig?.telefono}
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    Dirección: {sysConfig?.direccion || 'Santo Domingo, República Dominicana'}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 flex items-start space-x-3">
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-neutral-100 text-[#5A2D1A] border border-[#5A2D1A]/10 text-[9px] font-mono font-bold rounded uppercase tracking-wider">
                    Boletín Oficial
                  </span>
                  <p className="text-[10px] text-neutral-500 mt-2 font-mono">
                    Año Lectivo: {sysConfig?.anoEscolar || '2026-2027'}
                  </p>
                </div>
                <img 
                  src={logoCupula} 
                  alt="Sello Dome Liceo Duarte" 
                  className="h-20 w-20 object-contain rounded-xl shrink-0" 
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Document title */}
            <div className="my-6 text-center">
              <h2 className="text-base font-bold text-neutral-800 uppercase tracking-widest">
                Boletín Académico de Calificaciones
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Registro Oficial de Evaluaciones de los Periodos Escolares
              </p>
            </div>

            {/* Student metadata table */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs text-neutral-700 mb-6">
              <div>
                <span className="block font-bold text-[10px] text-neutral-400 uppercase tracking-wider">Estudiante</span>
                <span className="font-bold text-neutral-900 block mt-0.5">{selectedStudent.nombreCompleto}</span>
              </div>
              <div>
                <span className="block font-bold text-[10px] text-neutral-400 uppercase tracking-wider">Matrícula / ID</span>
                <span className="font-mono text-neutral-900 block mt-0.5">{selectedStudent.matricula || 'N/A'}</span>
              </div>
              <div>
                <span className="block font-bold text-[10px] text-neutral-400 uppercase tracking-wider">Curso / Grado</span>
                <span className="font-semibold text-neutral-900 block mt-0.5">{selectedCourse?.nombre || '6to Secundaria'}</span>
              </div>
              <div>
                <span className="block font-bold text-[10px] text-neutral-400 uppercase tracking-wider">Tutor Registrado</span>
                <span className="font-semibold text-neutral-900 block mt-0.5">{selectedStudent.tutor || 'No asignado'}</span>
              </div>
            </div>

            {/* Table of Grades */}
            <div className="space-y-4 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
              <table className="w-full text-[11px] text-left border-collapse border border-neutral-350 min-w-[700px]">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-350">
                    <th className="p-2.5 font-bold text-neutral-800 border-r border-neutral-350 w-[24%]">Asignatura / Área</th>
                    <th className="p-2.5 font-bold text-neutral-800 border-r border-neutral-350 w-[36%]">Competencia Fundamental (Área)</th>
                    <th className="p-2.5 text-center font-bold text-neutral-800 border-r border-neutral-350 w-[6%]">P1</th>
                    <th className="p-2.5 text-center font-bold text-neutral-800 border-r border-neutral-350 w-[6%]">P2</th>
                    <th className="p-2.5 text-center font-bold text-neutral-800 border-r border-neutral-350 w-[6%]">P3</th>
                    <th className="p-2.5 text-center font-bold text-neutral-800 border-r border-neutral-350 w-[6%]">P4</th>
                    <th className="p-2.5 text-center font-bold text-neutral-800 border-r border-neutral-350 w-[8%]">Prom. Comp.</th>
                    <th className="p-2.5 text-center font-bold text-neutral-800 w-[14%]">Calificación Final Área</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Map subjects or grades */}
                  {subjects.filter(s => s.cursoId === (selectedCourseId || selectedStudent.cursoId)).map((sub) => {
                    const grd = grades.find(g => 
                      g.estudianteId === selectedStudent.id && 
                      (g.materiaId === sub.id || isSubjectNameMatch(g.materiaNombre, sub.nombre))
                    ) || {
                      comp1_p1: 0, comp1_p2: 0, comp1_p3: 0, comp1_p4: 0, pc1: 0,
                      comp2_p1: 0, comp2_p2: 0, comp2_p3: 0, comp2_p4: 0, pc2: 0,
                      comp3_p1: 0, comp3_p2: 0, comp3_p3: 0, comp3_p4: 0, pc3: 0,
                      comp4_p1: 0, comp4_p2: 0, comp4_p3: 0, comp4_p4: 0, pc4: 0,
                      promedio: 0, estado: 'Pendiente'
                    };

                    const displayVal = (v: number) => (v > 0 ? v : '-');

                    const compRows = [
                      { id: 1, name: 'Competencia Comunicativa', p1: grd.comp1_p1, p2: grd.comp1_p2, p3: grd.comp1_p3, p4: grd.comp1_p4, pc: grd.pc1 },
                      { id: 2, name: 'Pensamiento Lógico, Crítico y Creativo / Resolución de Problemas', p1: grd.comp2_p1, p2: grd.comp2_p2, p3: grd.comp2_p3, p4: grd.comp2_p4, pc: grd.pc2 },
                      { id: 3, name: 'Científica y Tecnológica / Ambiental y de la Salud', p1: grd.comp3_p1, p2: grd.comp3_p2, p3: grd.comp3_p3, p4: grd.comp3_p4, pc: grd.pc3 },
                      { id: 4, name: 'Ética y Ciudadana / Desarrollo Personal y Espiritual', p1: grd.comp4_p1, p2: grd.comp4_p2, p3: grd.comp4_p3, p4: grd.comp4_p4, pc: grd.pc4 },
                    ];

                    return compRows.map((comp, cIdx) => {
                      return (
                        <tr key={`${sub.id}-${comp.id}`} className="border-b border-neutral-350 hover:bg-neutral-50/30">
                          {cIdx === 0 && (
                            <td rowSpan={4} className="p-2.5 font-bold text-neutral-900 border-r border-neutral-350 align-middle bg-neutral-50/20 text-xs">
                              {sub.nombre}
                            </td>
                          )}
                          <td className="p-2 text-neutral-700 border-r border-neutral-350 text-[10px] leading-relaxed">
                            {comp.name}
                          </td>
                          <td className="p-2 text-center border-r border-neutral-350 font-mono text-[10.5px]">{displayVal(comp.p1)}</td>
                          <td className="p-2 text-center border-r border-neutral-350 font-mono text-[10.5px]">{displayVal(comp.p2)}</td>
                          <td className="p-2 text-center border-r border-neutral-350 font-mono text-[10.5px]">{displayVal(comp.p3)}</td>
                          <td className="p-2 text-center border-r border-neutral-350 font-mono text-[10.5px]">{displayVal(comp.p4)}</td>
                          <td className="p-2 text-center border-r border-neutral-350 font-bold font-mono text-[10.5px] bg-neutral-50/30 text-neutral-850">{displayVal(comp.pc)}</td>
                          {cIdx === 0 && (
                            <td rowSpan={4} className="p-2.5 text-center border-neutral-350 font-black text-[11px] font-mono text-[#5A2D1A] bg-[#5A2D1A]/5 align-middle">
                              {grd.promedio > 0 ? (
                                <div className="space-y-1">
                                  <div className="text-xs font-black">{grd.promedio} pts</div>
                                  <div className={`text-[8.5px] font-extrabold uppercase ${grd.promedio >= 70 ? 'text-emerald-700' : 'text-red-600'}`}>
                                    {grd.promedio >= 70 ? 'Aprobado' : 'Reprobado'}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-neutral-450 font-normal italic">Pendiente</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>

              {/* Ministry of Education Additional Sections (Left empty as they are filled by hand later) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-xs text-neutral-700 print:grid-cols-3">
                <div className="border border-neutral-300 rounded-xl p-3 bg-neutral-50/45">
                  <span className="block font-bold text-[9px] text-neutral-500 uppercase tracking-wider">Evaluación Completiva</span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <span className="text-[9px] text-neutral-400 block">Calif. (30%)</span>
                      <div className="h-6 border-b border-dashed border-neutral-400"></div>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-400 block">Puntaje Final</span>
                      <div className="h-6 border-b border-dashed border-neutral-400"></div>
                    </div>
                  </div>
                </div>

                <div className="border border-neutral-300 rounded-xl p-3 bg-neutral-50/45">
                  <span className="block font-bold text-[9px] text-neutral-500 uppercase tracking-wider">Calificación Extraordinaria</span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <span className="text-[9px] text-neutral-400 block">Examen (70%)</span>
                      <div className="h-6 border-b border-dashed border-neutral-400"></div>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-400 block">Puntaje Final</span>
                      <div className="h-6 border-b border-dashed border-neutral-400"></div>
                    </div>
                  </div>
                </div>

                <div className="border border-neutral-300 rounded-xl p-3 bg-neutral-50/45 font-sans">
                  <span className="block font-bold text-[9px] text-neutral-500 uppercase tracking-wider">Evaluación Especial / Situación Final</span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <span className="text-[9px] text-neutral-400 block">Eval. Especial</span>
                      <div className="h-6 border-b border-dashed border-neutral-400"></div>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-400 block">Situación Final</span>
                      <div className="h-6 border-b border-dashed border-neutral-400 font-extrabold text-[#5A2D1A]"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* General Summary row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-50 border border-neutral-200 p-4 rounded-xl text-xs">
                <div className="space-y-1">
                  <span className="block font-bold text-neutral-800">Nota de Auditoría de Carga Académica por Competencias:</span>
                  <p className="text-[10px] text-neutral-500 leading-normal">
                    Este boletín oficial registra el rendimiento de las competencias fundamentales del estudiante por periodo escolar (P1, P2, P3 y P4). El promedio final de cada competencia se obtiene del promedio simple de sus periodos calificados.
                  </p>
                </div>
                <div className="shrink-0 text-left sm:text-right font-display p-3 bg-[#5A2D1A]/5 border border-[#5A2D1A]/10 rounded-xl">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">PROMEDIO ACADÉMICO GLOBAL</span>
                  <span className="text-lg font-black text-[#5A2D1A] block mt-0.5">
                    {getStudentGeneralAverage(selectedStudent.id) > 0 ? `${getStudentGeneralAverage(selectedStudent.id)} pts` : 'Por Evaluar'}
                  </span>
                </div>
              </div>
            </div>

            {/* Official signature lines */}
            <table className="w-full mt-16 border-none">
              <tbody>
                <tr className="border-none">
                  <td className="w-1/2 text-center border-none py-10 px-6 text-xs text-neutral-600 font-light">
                    <div className="border-t border-neutral-400 w-48 mx-auto mb-2"></div>
                    <strong>Docente Titular / Guía</strong>
                    <p className="text-[9px] text-neutral-400 mt-1">Liceo Juan Pablo Duarte</p>
                  </td>
                  <td className="w-1/2 text-center border-none py-10 px-6 text-xs text-neutral-600 font-light">
                    <div className="border-t border-neutral-400 w-48 mx-auto mb-2"></div>
                    <strong>Sello y Firma de Dirección</strong>
                    <p className="text-[9px] text-neutral-400 mt-1">Oficina de Registro Escolar</p>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Document timestamp */}
            <div className="border-t border-neutral-100 mt-10 pt-4 flex justify-between items-center text-[9px] text-neutral-400 font-mono">
              <span>Documento de Control Interno del Centro Educativo</span>
              <span>Generado el: {new Date().toLocaleDateString('es-DO')}</span>
            </div>

          </div>
        </div>
      )}

      {/* 5. Direct Grades Editor Modal for Admin */}
      {isEditingGrades && editingStudentId && (() => {
        const student = users.find(u => u.id === editingStudentId);
        const course = courses.find(c => c.id === student?.cursoId);
        const courseSubs = subjects.filter(s => s.cursoId === student?.cursoId);
        
        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl max-w-3xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative my-8 animate-fade-in max-h-[90vh] flex flex-col text-left">
              
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-neutral-850 pb-4 shrink-0">
                <div>
                  <span className="text-[10px] bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                    Modificación Directa Académica
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    Calificaciones de {student?.nombreCompleto}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Modificando calificaciones para el grado: <strong className="text-white">{course?.nombre}</strong>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsEditingGrades(false);
                    setEditingStudentId(null);
                  }}
                  className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body (Scrollable form) */}
              <div className="overflow-y-auto pr-2 space-y-4 flex-1 py-2" style={{ scrollbarWidth: 'thin' }}>
                <div className="bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-2xl text-xs text-neutral-300 flex items-start gap-2.5">
                  <AlertTriangle className="h-4.5 w-4.5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-light">
                    Como administrador, puede modificar directamente las 4 competencias fundamentales para cada asignatura del alumno. Ingrese las notas periódicas de P1 a P4 de cada competencia. El sistema calculará automáticamente los promedios parciales y la calificación final del área.
                  </p>
                </div>

                <div className="space-y-5">
                  {courseSubs.map(sub => {
                    const formVal = editingGradesForm[sub.id] || {};
                    
                    const competenciesDef = [
                      { id: 1, key: 'comp1', label: '1. Competencia Comunicativa' },
                      { id: 2, key: 'comp2', label: '2. Pensamiento Lógico, Crítico...' },
                      { id: 3, key: 'comp3', label: '3. Científica y Tecnológica...' },
                      { id: 4, key: 'comp4', label: '4. Ética y Ciudadana...' },
                    ];

                    return (
                      <div key={sub.id} className="border border-neutral-800 p-4 rounded-2xl bg-neutral-900/20 space-y-3">
                        <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider border-b border-neutral-800 pb-1.5 flex justify-between">
                          <span>{sub.nombre}</span>
                          <span className="text-[10px] text-neutral-500 normal-case">Código: {sub.id}</span>
                        </h4>
                        
                        <div className="space-y-2">
                          {/* Inner headers */}
                          <div className="grid grid-cols-12 text-[9px] font-bold text-neutral-500 uppercase tracking-wider pb-1">
                            <span className="col-span-4">Competencia Fundamental</span>
                            <span className="col-span-1.5 text-center">P1</span>
                            <span className="col-span-1.5 text-center">P2</span>
                            <span className="col-span-1.5 text-center">P3</span>
                            <span className="col-span-1.5 text-center">P4</span>
                            <span className="col-span-2 text-center">Prom. Comp.</span>
                          </div>

                          {competenciesDef.map(comp => {
                            const p1Key = `${comp.key}_p1`;
                            const p2Key = `${comp.key}_p2`;
                            const p3Key = `${comp.key}_p3`;
                            const p4Key = `${comp.key}_p4`;

                            const p1 = formVal[p1Key as keyof Grade] !== undefined ? Number(formVal[p1Key as keyof Grade]) : 0;
                            const p2 = formVal[p2Key as keyof Grade] !== undefined ? Number(formVal[p2Key as keyof Grade]) : 0;
                            const p3 = formVal[p3Key as keyof Grade] !== undefined ? Number(formVal[p3Key as keyof Grade]) : 0;
                            const p4 = formVal[p4Key as keyof Grade] !== undefined ? Number(formVal[p4Key as keyof Grade]) : 0;
                            
                            const filled = [p1, p2, p3, p4].filter(p => p > 0);
                            const livePc = filled.length > 0 ? Math.round(filled.reduce((a, b) => a + b, 0) / filled.length) : 0;

                            const handleCompFieldChange = (field: string, valStr: string) => {
                              let val = parseInt(valStr, 10);
                              if (isNaN(val) || val < 0) val = 0;
                              if (val > 100) val = 100;

                              setEditingGradesForm(prev => ({
                                ...prev,
                                [sub.id]: {
                                  ...prev[sub.id],
                                  [field]: val
                                }
                              }));
                            };

                            return (
                              <div key={comp.id} className="grid grid-cols-12 items-center gap-2 text-[11px] py-1 border-b border-neutral-900 last:border-b-0">
                                <span className="col-span-4 text-neutral-450 font-light truncate">
                                  {comp.label}
                                </span>
                                <div className="col-span-1.5 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={p1 || ''}
                                    onChange={(e) => handleCompFieldChange(p1Key, e.target.value)}
                                    placeholder="-"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1 px-1 text-center text-white text-[11px] font-mono focus:outline-none focus:border-[#D4AF37]"
                                  />
                                </div>
                                <div className="col-span-1.5 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={p2 || ''}
                                    onChange={(e) => handleCompFieldChange(p2Key, e.target.value)}
                                    placeholder="-"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1 px-1 text-center text-white text-[11px] font-mono focus:outline-none focus:border-[#D4AF37]"
                                  />
                                </div>
                                <div className="col-span-1.5 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={p3 || ''}
                                    onChange={(e) => handleCompFieldChange(p3Key, e.target.value)}
                                    placeholder="-"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1 px-1 text-center text-white text-[11px] font-mono focus:outline-none focus:border-[#D4AF37]"
                                  />
                                </div>
                                <div className="col-span-1.5 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={p4 || ''}
                                    onChange={(e) => handleCompFieldChange(p4Key, e.target.value)}
                                    placeholder="-"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1 px-1 text-center text-white text-[11px] font-mono focus:outline-none focus:border-[#D4AF37]"
                                  />
                                </div>
                                <div className="col-span-2 text-center font-bold text-[#D4AF37] font-mono bg-neutral-950/40 py-1 rounded">
                                  {livePc > 0 ? livePc : '-'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-850 shrink-0">
                <button
                  onClick={() => {
                    setIsEditingGrades(false);
                    setEditingStudentId(null);
                  }}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEditedGrades}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-600/10"
                >
                  Guardar Cambios
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="space-y-2">
              <h3 className="font-display text-base font-bold text-[#D4AF37] tracking-wider uppercase border-b border-neutral-900 pb-2">
                {confirmModal.title}
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed font-light">
                {confirmModal.message}
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                No, cancelar
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-red-600/10 cursor-pointer"
              >
                Sí, confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Icon fallbacks inside the component
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function FileCheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  );
}
