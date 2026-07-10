import React, { useState, useMemo } from 'react';
import { 
  Award, Sparkles, Trophy, Search, ChevronRight, Check, Medal, Gift, Star,
  ShieldAlert, Sparkle, RefreshCw, Eye, Bookmark, GraduationCap, PlusCircle, CheckCircle2, Save, X
} from 'lucide-react';
import { User as UserType, Course, Subject, Grade } from '../types';

interface StudentMeritViewProps {
  currentUser: UserType;
  users: UserType[];
  courses: Course[];
  grades: Grade[];
  subjects: Subject[];
  syncData: () => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function StudentMeritView({
  currentUser,
  users,
  courses,
  grades,
  subjects,
  syncData,
  showNotification
}: StudentMeritViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'global' | 'courses' | 'admin'>('global');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [adminSearchTerm, setAdminSearchTerm] = useState<string>('');
  const [isSaving, setIsSaving] = useState<string | null>(null);
  
  // Custom edit fields for admin merit assignment
  const [editingMeritId, setEditingMeritId] = useState<string | null>(null);
  const [editingMotivo, setEditingMotivo] = useState<string>('');

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'director';

  // Helper to compute a student's general average from real grades
  const getStudentGeneralAverage = (studentId: string) => {
    const studentGrades = grades.filter(g => g.estudianteId === studentId);
    if (studentGrades.length === 0) return 0;
    
    // Sum only non-zero averages
    const validGrades = studentGrades.filter(g => g.promedio > 0);
    if (validGrades.length === 0) return 0;
    
    const sum = validGrades.reduce((acc, curr) => acc + curr.promedio, 0);
    return Math.round((sum / validGrades.length) * 10) / 10;
  };

  // Helper to get total subjects of student's course
  const getCourseSubjectsCount = (courseId?: string) => {
    if (!courseId) return 0;
    return subjects.filter(s => s.cursoId === courseId).length;
  };

  // Helper to get graded subjects count for student
  const getStudentGradedCount = (studentId: string) => {
    return grades.filter(g => g.estudianteId === studentId && g.promedio > 0).length;
  };

  // All active students with computed statistics
  const processedStudents = useMemo(() => {
    return users
      .filter(u => u.role === 'estudiante' && u.activo !== false)
      .map(student => {
        const promedioGeneral = getStudentGeneralAverage(student.id);
        const course = courses.find(c => c.id === student.cursoId);
        const totalAsignaturas = getCourseSubjectsCount(student.cursoId);
        const asignaturasEvaluadas = getStudentGradedCount(student.id);
        
        return {
          ...student,
          promedioGeneral,
          nombreCurso: course ? course.nombre : 'Sin Asignar',
          totalAsignaturas,
          asignaturasEvaluadas
        };
      });
  }, [users, courses, grades, subjects]);

  // Global ranking sorted by average (descending)
  const globalRanking = useMemo(() => {
    return [...processedStudents]
      .filter(s => s.promedioGeneral > 0)
      .sort((a, b) => b.promedioGeneral - a.promedioGeneral);
  }, [processedStudents]);

  // Course specific ranking
  const courseRanking = useMemo(() => {
    if (!selectedCourseId) return [];
    return [...processedStudents]
      .filter(s => s.cursoId === selectedCourseId)
      .sort((a, b) => b.promedioGeneral - a.promedioGeneral);
  }, [processedStudents, selectedCourseId]);

  // Handle setting/clearing merit manually
  const handleToggleMerit = (student: UserType, status: boolean, motivo?: string) => {
    setIsSaving(student.id);
    
    const updatedUser = {
      ...student,
      esMeritorio: status,
      motivoMerito: status ? (motivo || 'Excelencia Académica') : ''
    };

    fetch('/api/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modifier: currentUser.nombreCompleto,
        updatedUser
      })
    })
    .then(res => res.json())
    .then(data => {
      setIsSaving(null);
      if (data.success) {
        showNotification(
          status 
            ? `¡Estudiante ${student.nombreCompleto} declarado Meritorio!` 
            : `Se ha retirado la distinción a ${student.nombreCompleto}.`, 
          'success'
        );
        syncData();
      } else {
        showNotification('Error al actualizar distinción de mérito.', 'error');
      }
    })
    .catch(err => {
      setIsSaving(null);
      console.error(err);
      showNotification('Error de conexión al servidor.', 'error');
    });
  };

  const activeCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <div className="space-y-6 animate-fade-in text-neutral-100">
      
      {/* Banner de Encabezado */}
      <div className="relative bg-neutral-950 border border-neutral-800 p-6 md:p-8 rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#5A2D1A]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-[#D4AF37]/5 rounded-full blur-2xl -z-10 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-[#5A2D1A]/30 border border-[#D4AF37]/20 rounded-xl text-[#D4AF37] block">
                <Trophy className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/10 px-2.5 py-1 rounded-md border border-[#D4AF37]/20">
                Cuadro de Honor
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-black text-neutral-100 tracking-tight">
              Mérito Estudiantil & Calificaciones
            </h1>
            <p className="text-xs md:text-sm text-neutral-400 font-light max-w-xl leading-relaxed">
              Consulte el listado de estudiantes sobresalientes de nuestro centro educativo, ordenados por rendimiento escolar global y mérito académico asignado.
            </p>
          </div>

          <div className="flex bg-neutral-900 border border-neutral-800 p-1.5 rounded-2xl self-start md:self-auto">
            <button
              onClick={() => setActiveSubTab('global')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeSubTab === 'global' ? 'bg-[#5A2D1A] text-[#D4AF37] border border-[#D4AF37]/20' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span>Top Global</span>
            </button>
            <button
              onClick={() => {
                setActiveSubTab('courses');
                if (!selectedCourseId && courses.length > 0) {
                  setSelectedCourseId(courses[0].id);
                }
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeSubTab === 'courses' ? 'bg-[#5A2D1A] text-[#D4AF37] border border-[#D4AF37]/20' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Por Cursos</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveSubTab('admin')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  activeSubTab === 'admin' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/10' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Award className="h-4 w-4" />
                <span>Gestión de Méritos</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SUBTAB 1: GLOBAL RANKING */}
      {activeSubTab === 'global' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top 3 podium boxes */}
            {globalRanking.slice(0, 3).map((stud, idx) => {
              const bgColors = [
                'bg-linear-to-b from-amber-500/10 to-neutral-950 border-amber-500/40', // Gold
                'bg-linear-to-b from-slate-400/10 to-neutral-950 border-slate-500/30', // Silver
                'bg-linear-to-b from-amber-700/10 to-neutral-950 border-amber-800/30'  // Bronze
              ];
              const badgeColors = [
                'bg-amber-500/20 text-amber-300 border-amber-500/30',
                'bg-slate-400/20 text-slate-300 border-slate-400/30',
                'bg-amber-700/20 text-amber-400 border-amber-700/30'
              ];
              const medals = ['🥇 1.er Lugar', '🥈 2.º Lugar', '🥉 3.er Lugar'];

              return (
                <div key={stud.id} className={`p-6 rounded-3xl border relative flex flex-col justify-between shadow-2xl overflow-hidden ${bgColors[idx] || 'bg-neutral-950'}`}>
                  <div className="absolute top-2 right-2 p-1 text-[10px] uppercase font-bold tracking-widest rounded px-2 bg-neutral-900 border border-neutral-800">
                    Posición {idx + 1}
                  </div>
                  <div className="space-y-4">
                    <span className={`inline-block text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${badgeColors[idx]}`}>
                      {medals[idx]}
                    </span>
                    <div className="flex items-center space-x-3 pt-2">
                      <img 
                        src={stud.fotografia || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"} 
                        alt={stud.nombreCompleto} 
                        className="h-14 w-14 rounded-2xl object-cover border-2 border-neutral-800 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h3 className="font-display font-black text-sm text-neutral-100 tracking-tight leading-snug">{stud.nombreCompleto}</h3>
                        <p className="text-[11px] text-neutral-400 mt-0.5">Curso: <span className="font-semibold text-neutral-300">{stud.nombreCurso}</span></p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-end justify-between border-t border-neutral-900/60 pt-4">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-neutral-500 block">Evaluadas</span>
                      <span className="text-xs text-neutral-300 font-mono font-semibold">{stud.asignaturasEvaluadas} / {stud.totalAsignaturas} Mat.</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-wider text-[#D4AF37] block font-bold">Promedio General</span>
                      <span className="text-3xl font-black font-mono text-[#D4AF37]">{stud.promedioGeneral}%</span>
                    </div>
                  </div>

                  {stud.esMeritorio && (
                    <div className="mt-3 bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-2.5 rounded-xl flex items-start space-x-1.5">
                      <Award className="h-3.5 w-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wide block">Mérito Oficial:</span>
                        <p className="text-[10px] text-neutral-300 italic">"{stud.motivoMerito || 'Excelencia Académica'}"</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Table of full rankings */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="font-display text-base font-bold text-neutral-100 flex items-center space-x-2 mb-4">
              <Trophy className="h-4.5 w-4.5 text-[#D4AF37]" />
              <span>Clasificación General del Centro Educativo</span>
            </h3>
            
            {globalRanking.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-2xl">
                Aún no hay calificaciones registradas para computar promedios en el centro.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 font-bold">
                      <th className="py-3 px-3 text-center w-[8%]">Lugar</th>
                      <th className="py-3 px-3">Estudiante</th>
                      <th className="py-3 px-3">Curso</th>
                      <th className="py-3 px-3 text-center">Evaluadas</th>
                      <th className="py-3 px-3 text-center">Promedio Gral</th>
                      <th className="py-3 px-3 text-right">Distinciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalRanking.map((student, idx) => {
                      const isTop3 = idx < 3;
                      return (
                        <tr key={student.id} className="border-b border-neutral-900 hover:bg-white/2 transition-all">
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex items-center justify-center h-6 w-6 rounded-lg font-mono font-bold text-xs ${
                              idx === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              idx === 1 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' :
                              idx === 2 ? 'bg-amber-700/20 text-amber-400 border border-amber-700/30' :
                              'bg-neutral-900 border border-neutral-800 text-neutral-400'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2.5">
                              <img 
                                src={student.fotografia || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop"} 
                                alt={student.nombreCompleto} 
                                className="h-8 w-8 rounded-lg object-cover border border-neutral-800 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <span className="font-bold text-neutral-100">{student.nombreCompleto}</span>
                                <span className="text-[10px] text-neutral-500 block font-mono">Matrícula: {student.matricula || 'N/A'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-neutral-300 font-medium">
                            {student.nombreCurso}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-neutral-400 text-[11px]">
                            {student.asignaturasEvaluadas} / {student.totalAsignaturas}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-mono text-sm font-black text-[#D4AF37]">
                              {student.promedioGeneral}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {student.promedioGeneral >= 90 && (
                                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 rounded">
                                  Excelente
                                </span>
                              )}
                              {student.esMeritorio ? (
                                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 rounded flex items-center space-x-1" title={student.motivoMerito}>
                                  <Star className="h-2.5 w-2.5 fill-[#D4AF37] text-transparent" />
                                  <span>Mérito: {student.motivoMerito || 'Excelencia Académica'}</span>
                                </span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: COURSE SPECIFIC RANKINGS */}
      {activeSubTab === 'courses' && (
        <div className="space-y-6">
          <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-3xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest block mb-1">Filtrar Rankings</span>
              <h3 className="font-display text-base font-bold text-neutral-100">Clasificación por Grado y Sección</h3>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-xs text-neutral-400">Seleccionar Curso:</span>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-xs font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37] text-white"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="font-display text-base font-bold text-neutral-100 flex items-center space-x-2 mb-4">
              <GraduationCap className="h-4.5 w-4.5 text-[#D4AF37]" />
              <span>Cuadro de Honor para el Curso: {activeCourse ? activeCourse.nombre : 'Sin Selección'}</span>
            </h3>

            {courseRanking.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-2xl">
                No hay estudiantes asignados en este curso o todavía no registran calificaciones.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 font-bold">
                      <th className="py-3 px-3 text-center w-[8%]">Posición</th>
                      <th className="py-3 px-3">Estudiante</th>
                      <th className="py-3 px-3 text-center">Evaluadas</th>
                      <th className="py-3 px-3 text-center">Promedio General</th>
                      <th className="py-3 px-3 text-right">Estatus de Distinción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseRanking.map((student, idx) => {
                      const rankingColor = idx === 0 ? 'text-[#D4AF37] font-black' : 'text-neutral-300';
                      return (
                        <tr key={student.id} className="border-b border-neutral-900 hover:bg-white/2 transition-all">
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex items-center justify-center h-6 w-6 rounded-lg font-mono font-bold text-xs ${
                              idx === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              idx === 1 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' :
                              idx === 2 ? 'bg-amber-700/20 text-amber-400 border border-amber-700/30' :
                              'bg-neutral-900 border border-neutral-800 text-neutral-400'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2.5">
                              <img 
                                src={student.fotografia || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"} 
                                alt={student.nombreCompleto} 
                                className="h-8 w-8 rounded-lg object-cover border border-neutral-800 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <span className="font-bold text-neutral-100">{student.nombreCompleto}</span>
                                <span className="text-[10px] text-neutral-500 block font-mono">Matrícula: {student.matricula || 'N/A'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-neutral-400 text-[11px]">
                            {student.asignaturasEvaluadas} / {student.totalAsignaturas}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`font-mono text-sm font-black ${rankingColor}`}>
                              {student.promedioGeneral > 0 ? `${student.promedioGeneral}%` : 'S/C'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {student.promedioGeneral >= 90 && (
                                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 rounded">
                                  Promedio Alto
                                </span>
                              )}
                              {student.esMeritorio ? (
                                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 rounded flex items-center space-x-1" title={student.motivoMerito}>
                                  <Star className="h-2.5 w-2.5 fill-[#D4AF37] text-transparent" />
                                  <span>Mérito: {student.motivoMerito || 'Excelencia Académica'}</span>
                                </span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: ADMIN MERIT MANAGEMENT AREA */}
      {activeSubTab === 'admin' && isAdmin && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="border-b border-neutral-900 pb-4">
            <h3 className="font-display text-base font-bold text-neutral-100 flex items-center space-x-2">
              <Award className="h-5 w-5 text-[#D4AF37]" />
              <span>Declarar Distinciones de Honor (Manual)</span>
            </h3>
            <p className="text-xs text-neutral-400 font-light mt-1">
              Como administrador, usted puede declarar formalmente el mérito escolar de un estudiante e ingresar una nota de distinción que será visible para padres, docentes y alumnos.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar estudiante por nombre, matrícula o curso..."
              value={adminSearchTerm}
              onChange={(e) => setAdminSearchTerm(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-11 pr-4 py-3.5 text-xs focus:outline-none focus:border-[#D4AF37] text-white font-light placeholder:text-neutral-600"
            />
          </div>

          {/* List of matching students */}
          <div className="space-y-3">
            {processedStudents
              .filter(s => {
                if (!adminSearchTerm) return true;
                const sTerm = adminSearchTerm.toLowerCase();
                return s.nombreCompleto.toLowerCase().includes(sTerm) || 
                       (s.matricula && s.matricula.toLowerCase().includes(sTerm)) ||
                       s.nombreCurso.toLowerCase().includes(sTerm);
              })
              .slice(0, 15) // Limit view length
              .map((student) => {
                const isEditing = editingMeritId === student.id;

                return (
                  <div key={student.id} className="p-4 bg-neutral-900/55 border border-neutral-800/80 rounded-2xl hover:border-neutral-700/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={student.fotografia || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop"} 
                        alt={student.nombreCompleto} 
                        className="h-10 w-10 rounded-xl object-cover border border-neutral-800 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-neutral-100">{student.nombreCompleto}</span>
                          <span className="text-[10px] bg-neutral-800 text-neutral-400 font-mono px-1.5 py-0.5 rounded">
                            {student.nombreCurso}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-0.5 font-light">
                          Promedio Gral: <span className="text-[#D4AF37] font-semibold">{student.promedioGeneral > 0 ? `${student.promedioGeneral}%` : 'S/C'}</span> | Materias Evaluadas: {student.asignaturasEvaluadas} / {student.totalAsignaturas}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                      {student.esMeritorio ? (
                        <div className="flex flex-col items-end mr-2">
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 rounded flex items-center space-x-1">
                            <Star className="h-2.5 w-2.5 fill-[#D4AF37] text-transparent" />
                            <span>Mérito Oficial</span>
                          </span>
                          <span className="text-[9px] text-neutral-400 italic max-w-[200px] truncate mt-1">
                            "{student.motivoMerito}"
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-neutral-500">Sin distinción oficial</span>
                      )}

                      {/* Controls */}
                      {isEditing ? (
                        <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-neutral-800 w-full md:w-auto">
                          <input
                            type="text"
                            placeholder="Motivo (ej. Excelencia Académica)"
                            value={editingMotivo}
                            onChange={(e) => setEditingMotivo(e.target.value)}
                            className="bg-neutral-900 border border-neutral-800 text-[11px] rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-[#D4AF37] min-w-[200px] font-light"
                          />
                          <button
                            onClick={() => {
                              handleToggleMerit(student, true, editingMotivo);
                              setEditingMeritId(null);
                            }}
                            className="p-1.5 bg-[#D4AF37] text-neutral-950 hover:bg-[#F3D065] rounded-lg transition-all"
                            title="Guardar Mérito"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingMeritId(null)}
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-all"
                            title="Cancelar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {!student.esMeritorio ? (
                            <button
                              onClick={() => {
                                setEditingMeritId(student.id);
                                setEditingMotivo('Excelencia Académica - Alto Rendimiento');
                              }}
                              className="px-3 py-1.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-neutral-950 text-[10px] font-bold uppercase rounded-lg border border-[#D4AF37]/20 transition-all cursor-pointer flex items-center space-x-1"
                              disabled={isSaving === student.id}
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                              <span>Conceder Mérito</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleMerit(student, false)}
                              className="px-3 py-1.5 bg-red-950/20 hover:bg-red-950 border border-red-900/30 text-red-400 hover:text-white text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer"
                              disabled={isSaving === student.id}
                            >
                              {isSaving === student.id ? 'Procesando...' : 'Retirar Mérito'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            {processedStudents.length === 0 && (
              <div className="text-center py-6 text-neutral-500 text-xs">
                No se encontraron estudiantes para los criterios de búsqueda.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
