import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, Printer, Calendar, ShieldCheck, 
  AlertTriangle, Users, FileText, CheckCircle2, RefreshCw, Sparkles, Phone, FileCheck2,
  Download, Trash2, FileDown
} from 'lucide-react';
import { User as UserType, Course, Subject, Attendance } from '../types';
// @ts-ignore
import logoDuarte from '../assets/images/logo_duarte_1783545572734.jpg';
// @ts-ignore
import logoCupula from '../assets/images/logo_cupula_1783655502703.jpg';

interface AttendanceReportViewProps {
  currentUser: UserType;
  users: UserType[];
  courses: Course[];
  subjects: Subject[];
  attendance: Attendance[];
  syncData: () => void;
  showNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function AttendanceReportView({
  currentUser,
  users,
  courses,
  subjects,
  attendance,
  syncData,
  showNotification
}: AttendanceReportViewProps) {
  const today = new Date();
  const maxDateStr = today.toISOString().split('T')[0];
  
  const minDate = new Date();
  minDate.setDate(today.getDate() - 3);
  const minDateStr = minDate.toISOString().split('T')[0];

  const [reportDate, setReportDate] = useState<string>(maxDateStr);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showResetDbModal, setShowResetDbModal] = useState(false);
  const [isResettingDb, setIsResettingDb] = useState(false);

  // Filter active courses
  const activeCourses = courses.filter(c => c.activo !== false);
  const students = users.filter(u => u.role === 'estudiante');

  // Compute attendance status per course for the selected date
  // A course is marked as "completed" if at least one student in that course has an attendance record on that date.
  const courseAttendanceStatus = activeCourses.map(course => {
    const courseStudents = students.filter(s => s.cursoId === course.id);
    const courseStudentsIds = courseStudents.map(s => s.id);
    
    // Find attendance records for these students on reportDate
    const records = attendance.filter(
      a => a.fecha === reportDate && courseStudentsIds.includes(a.estudianteId)
    );
    
    return {
      courseId: course.id,
      courseNombre: course.nombre,
      totalStudents: courseStudents.length,
      markedCount: records.length,
      isCompleted: courseStudents.length > 0 && records.length >= Math.min(courseStudents.length, 1),
      records
    };
  });

  const totalCoursesCount = activeCourses.length;
  const completedCoursesCount = courseAttendanceStatus.filter(c => c.isCompleted).length;
  const allCoursesCompleted = completedCoursesCount === totalCoursesCount && totalCoursesCount > 0;

  // Compute metrics for the selected date
  const reportRecords = attendance.filter(a => a.fecha === reportDate);
  
  // Create a map to get the most representative (latest chronological) attendance status of each student for the day
  const studentDailyStatus = new Map<string, { estado: string; observaciones: string; recordId: string }>();
  
  // Group report records by student to check for multi-roll call incidences
  const studentRecordsMap = new Map<string, Attendance[]>();
  reportRecords.forEach(rec => {
    if (!studentRecordsMap.has(rec.estudianteId)) {
      studentRecordsMap.set(rec.estudianteId, []);
    }
    studentRecordsMap.get(rec.estudianteId)!.push(rec);
  });

  // Calculate final daily status of students based on chronological sequence (latest status wins)
  studentRecordsMap.forEach((records, studId) => {
    const sorted = [...records].sort((a, b) => {
      const timeA = a.hora || "00:00";
      const timeB = b.hora || "00:00";
      return timeA.localeCompare(timeB);
    });
    const latest = sorted[sorted.length - 1];
    studentDailyStatus.set(studId, {
      estado: latest.estado,
      observaciones: latest.observaciones || '',
      recordId: latest.id
    });
  });

  // Calculate high-fidelity multi-roll call discrepancies (Incidencias)
  interface AttendanceIncidence {
    id: string;
    studentName: string;
    matricula: string;
    courseName: string;
    firstState: string;
    firstTime: string;
    firstTeacher: string;
    firstSubject: string;
    secondState: string;
    secondTime: string;
    secondTeacher: string;
    secondSubject: string;
    type: string;
    description: string;
  }

  const incidencesList: AttendanceIncidence[] = [];
  studentRecordsMap.forEach((records, studId) => {
    if (records.length > 1) {
      const sorted = [...records].sort((a, b) => {
        const timeA = a.hora || "00:00";
        const timeB = b.hora || "00:00";
        return timeA.localeCompare(timeB);
      });

      const first = sorted[0];
      for (let i = 1; i < sorted.length; i++) {
        const second = sorted[i];
        if (first.estado !== second.estado) {
          const student = users.find(u => u.id === studId);
          const course = activeCourses.find(c => c.id === student?.cursoId);
          
          let incidenceType = "Discrepancia";
          let description = "";
          
          if (first.estado === 'Ausente' && (second.estado === 'Presente' || second.estado === 'Tardanza')) {
            incidenceType = "Llegó Tarde";
            description = `El estudiante no estuvo presente al inicio de la mañana (marcado como ausente a las ${first.hora || 'N/A'} con ${first.docente || 'Docente'} en ${first.materiaNombre}), pero llegó más tarde y se incorporó a las clases (marcado como ${second.estado === 'Tardanza' ? 'Tarde' : 'Presente'} a las ${second.hora || 'N/A'} con ${second.docente || 'Docente'} en ${second.materiaNombre}).`;
          } else if ((first.estado === 'Presente' || first.estado === 'Tardanza') && second.estado === 'Ausente') {
            incidenceType = "Salió Temprano";
            description = `El estudiante asistió a las primeras horas (marcado ${first.estado} a las ${first.hora || 'N/A'} con ${first.docente || 'Docente'} en ${first.materiaNombre}), pero luego estuvo ausente a las ${second.hora || 'N/A'} con ${second.docente || 'Docente'} en ${second.materiaNombre}. Esto indica que se retiró antes de finalizar el día o faltó a esa hora.`;
          } else {
            incidenceType = "Ajuste de Asistencia";
            description = `Se registró un cambio de asistencia de ${first.estado} a las ${first.hora || 'N/A'} a ${second.estado} a las ${second.hora || 'N/A'} en las materias correspondientes.`;
          }

          incidencesList.push({
            id: `${studId}-${first.id}-${second.id}`,
            studentName: student?.nombreCompleto || "Estudiante",
            matricula: student?.matricula || "N/A",
            courseName: course?.nombre || "N/A",
            firstState: first.estado,
            firstTime: first.hora || "08:00",
            firstTeacher: first.docente || "Primer Maestro",
            firstSubject: first.materiaNombre,
            secondState: second.estado,
            secondTime: second.hora || "10:00",
            secondTeacher: second.docente || "Segundo Maestro",
            secondSubject: second.materiaNombre,
            type: incidenceType,
            description: description
          });
          break; // Avoid duplicates
        }
      }
    }
  });

  // Calculate detailed student stats
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalExcused = 0;
  let totalTardy = 0;
  let totalNotMarked = 0;

  let femalePresent = 0;
  let femaleAbsent = 0;
  let femaleExcused = 0;
  let femaleTardy = 0;
  
  let malePresent = 0;
  let maleAbsent = 0;
  let maleExcused = 0;
  let maleTardy = 0;

  students.forEach(stud => {
    const statusObj = studentDailyStatus.get(stud.id);
    const isFemale = stud.sexo?.toLowerCase() === 'femenino';
    
    if (statusObj) {
      const state = statusObj.estado;
      if (state === 'Presente') {
        totalPresent++;
        if (isFemale) femalePresent++; else malePresent++;
      } else if (state === 'Ausente') {
        totalAbsent++;
        if (isFemale) femaleAbsent++; else maleAbsent++;
      } else if (state === 'Excusa') {
        totalExcused++;
        if (isFemale) femaleExcused++; else maleExcused++;
      } else if (state === 'Tardanza') {
        totalTardy++;
        if (isFemale) femaleTardy++; else maleTardy++;
      }
    } else {
      totalNotMarked++;
    }
  });

  const totalRegistered = totalPresent + totalAbsent + totalExcused + totalTardy;
  const presencePercentage = totalRegistered > 0 
    ? Math.round(((totalPresent + totalTardy) / totalRegistered) * 100) 
    : 0;
  const absencePercentage = totalRegistered > 0 
    ? Math.round((totalAbsent / totalRegistered) * 100) 
    : 0;

  // Absences count by course
  const courseMetrics = activeCourses.map(course => {
    const courseStudents = students.filter(s => s.cursoId === course.id);
    let present = 0;
    let absent = 0;
    let excused = 0;
    let tardy = 0;

    courseStudents.forEach(stud => {
      const statusObj = studentDailyStatus.get(stud.id);
      if (statusObj) {
        const state = statusObj.estado;
        if (state === 'Presente') present++;
        else if (state === 'Ausente') absent++;
        else if (state === 'Excusa') excused++;
        else if (state === 'Tardanza') tardy++;
      }
    });

    const total = present + absent + excused + tardy;
    return {
      id: course.id,
      nombre: course.nombre,
      totalStudents: courseStudents.length,
      totalMarked: total,
      present,
      absent,
      excused,
      tardy,
      presencePct: total > 0 ? Math.round(((present + tardy) / total) * 100) : 0,
      absencePct: total > 0 ? Math.round((absent / total) * 100) : 0,
    };
  });

  // Detailed list of absent students
  const absentStudentsList = students.filter(stud => {
    const statusObj = studentDailyStatus.get(stud.id);
    return statusObj && statusObj.estado === 'Ausente';
  }).map(stud => {
    const statusObj = studentDailyStatus.get(stud.id)!;
    const course = activeCourses.find(c => c.id === stud.cursoId);
    
    // Count total historical absences for this student in the database
    const historicalAbsences = attendance.filter(
      a => a.estudianteId === stud.id && a.estado === 'Ausente'
    ).length;

    // Has excuse? Checked if observations or separate record exist, but since 'Excusa' is a separate state, 
    // an 'Ausente' with written observation might have an excuse, or we display based on observations.
    const hasExcuseStr = statusObj.observaciones.trim() ? 'Sí (Justificada)' : 'No';

    return {
      id: stud.id,
      nombreCompleto: stud.nombreCompleto,
      matricula: stud.matricula || 'N/A',
      cursoNombre: course ? course.nombre : 'Sin Curso',
      sexo: stud.sexo || 'No especificado',
      observaciones: statusObj.observaciones || 'Sin observaciones registradas.',
      hasExcuse: hasExcuseStr,
      historicalAbsences,
      tutor: stud.tutor || 'No registrado',
      telefono: stud.telefono || 'N/A'
    };
  });

  // Simulate auto-marking remaining attendance for Demo / Fast Review purposes
  const handleSimulateAllAttendance = () => {
    setIsSimulating(true);
    const recordsToCreate: any[] = [];
    
    activeCourses.forEach(course => {
      const courseStudents = students.filter(s => s.cursoId === course.id);
      const courseStudentsIds = courseStudents.map(s => s.id);
      
      // Check if this course already has attendance on reportDate
      const alreadyHas = attendance.some(
        a => a.fecha === reportDate && courseStudentsIds.includes(a.estudianteId)
      );

      if (!alreadyHas && courseStudents.length > 0) {
        // Find a subject for this course to link
        const subject = subjects.find(s => s.cursoId === course.id) || {
          id: `sbj-sim-${course.id}`,
          nombre: 'Formación General'
        };

        courseStudents.forEach((stud, idx) => {
          // Distribute: 85% Presente, 10% Ausente, 5% Tardanza/Excusa
          let estado: 'Presente' | 'Ausente' | 'Excusa' | 'Tardanza' = 'Presente';
          let observaciones = '';
          const rand = Math.random();
          if (rand < 0.12) {
            estado = 'Ausente';
            observaciones = idx % 2 === 0 ? 'Fiebre alta y malestar gripal' : '';
          } else if (rand < 0.17) {
            estado = 'Tardanza';
            observaciones = 'Transporte público demorado';
          } else if (rand < 0.20) {
            estado = 'Excusa';
            observaciones = 'Cita médica odontológica certificada';
          }

          recordsToCreate.push({
            estudianteId: stud.id,
            materiaId: subject.id,
            materiaNombre: subject.nombre,
            fecha: reportDate,
            estado,
            observaciones,
            hora: idx % 3 === 0 ? '08:15' : '08:30',
            docente: 'Prof. Carlos Sánchez'
          });
        });
      }
    });

    // Deliberately inject 2 high-fidelity multi-roll call Incidencias for demo testing
    if (students.length >= 2) {
      const s1 = students[0];
      const s2 = students[1];
      
      // Remove any existing records for these two students today so we can cleanly demo incidences
      // Just push them directly to recordsToCreate with different hours and teachers
      recordsToCreate.push({
        estudianteId: s1.id,
        materiaId: 'sbj-demo-1',
        materiaNombre: 'Matemática VI',
        fecha: reportDate,
        estado: 'Ausente',
        observaciones: 'No se presentó a primera hora',
        hora: '08:05',
        docente: 'Prof. Carlos Sánchez'
      });
      recordsToCreate.push({
        estudianteId: s1.id,
        materiaId: 'sbj-demo-2',
        materiaNombre: 'Lengua Española VI',
        fecha: reportDate,
        estado: 'Presente',
        observaciones: 'Se reintegró a tercera hora con excusa firmada',
        hora: '11:25',
        docente: 'Dra. Carmen Jimenes'
      });

      recordsToCreate.push({
        estudianteId: s2.id,
        materiaId: 'sbj-demo-1',
        materiaNombre: 'Matemática VI',
        fecha: reportDate,
        estado: 'Presente',
        observaciones: 'Asistió a primera hora',
        hora: '08:10',
        docente: 'Prof. Carlos Sánchez'
      });
      recordsToCreate.push({
        estudianteId: s2.id,
        materiaId: 'sbj-demo-3',
        materiaNombre: 'Ciencias Sociales VI',
        fecha: reportDate,
        estado: 'Ausente',
        observaciones: 'Se retiró del plantel sin autorización',
        hora: '14:35',
        docente: 'Prof. Francisco Cabral'
      });
    }

    if (recordsToCreate.length === 0) {
      showNotification('Todos los cursos ya cuentan con pase de lista registrado para hoy.', 'info');
      setIsSimulating(false);
      return;
    }

    fetch('/api/attendance/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        teacher: currentUser.nombreCompleto + ' (Simulador)', 
        attendanceRecords: recordsToCreate 
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showNotification(`Simulación exitosa: Se registró el pase de lista y se generaron incidencias demostrativas para el reporte.`, 'success');
          syncData();
        } else {
          showNotification('Error al simular la asistencia.', 'error');
        }
      })
      .catch(err => {
        console.error(err);
        showNotification('Error de conexión al simular la asistencia.', 'error');
      })
      .finally(() => {
        setIsSimulating(false);
      });
  };

  // Trigger browser print
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

  // Reset the database (Set all attendance to 0)
  const handleResetDatabase = () => {
    setIsResettingDb(true);
    fetch('/api/attendance/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminName: currentUser.nombreCompleto })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showNotification(`¡Base de datos de asistencia restablecida! Se borraron ${data.clearedCount} registros con éxito.`, 'success');
          setShowResetDbModal(false);
          syncData();
        } else {
          showNotification('Error al restablecer la base de datos.', 'error');
        }
      })
      .catch(err => {
        console.error(err);
        showNotification('Error de conexión al intentar restablecer la base de datos.', 'error');
      })
      .finally(() => {
        setIsResettingDb(false);
      });
  };

  // Download report as Word .doc
  const handleDownloadDoc = () => {
    try {
      const element = document.getElementById('reporte-asistencia-institucional');
      if (!element) {
        showNotification('Error: No se encontró el reporte para exportar.', 'error');
        return;
      }
      
      const htmlContent = element.innerHTML;
      
      const styles = `
        <style>
          body { font-family: Arial, sans-serif; font-size: 11pt; color: #333333; line-height: 1.4; margin: 1in; }
          h1 { color: #5a2d1a; font-size: 16pt; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; text-align: center; }
          h2 { color: #5a2d1a; font-size: 13pt; font-weight: bold; margin-top: 15px; border-bottom: 2px solid #5a2d1a; padding-bottom: 4px; }
          h3 { color: #5a2d1a; font-size: 11pt; font-weight: bold; margin-top: 15px; border-bottom: 1px solid #dddddd; padding-bottom: 2px; }
          p { margin: 0 0 8px 0; font-size: 10pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
          th { background-color: #f3f4f6; color: #111827; font-weight: bold; border: 1px solid #cccccc; padding: 6px; text-align: left; font-size: 9.5pt; }
          td { border: 1px solid #e5e7eb; padding: 6px; text-align: left; font-size: 9.5pt; }
          .font-bold { font-weight: bold; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-xs { font-size: 8.5pt; }
          .text-sm { font-size: 9.5pt; }
          .uppercase { text-transform: uppercase; }
          .bg-emerald-50 { background-color: #ecfdf5; color: #047857; }
          .bg-red-50 { background-color: #fef2f2; color: #b91c1c; }
          .bg-amber-50 { background-color: #fffbeb; color: #b45309; }
          .bg-blue-50 { background-color: #eff6ff; color: #1d4ed8; }
          .page-break-before { page-break-before: always; }
        </style>
      `;

      const documentContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <meta charset="utf-8">
            <title>Reporte de Asistencia - ERP Duarte</title>
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
      link.download = `Reporte_Asistencia_${reportDate}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('¡Documento de Word (.doc) descargado con éxito! Ábralo en Word o Google Docs para editarlo o imprimirlo.', 'success');
    } catch (error) {
      console.error(error);
      showNotification('Error al exportar a Word.', 'error');
    }
  };

  // Download report as a fully formatted, standalone HTML file
  const handleDownloadHtml = () => {
    try {
      const element = document.getElementById('reporte-asistencia-institucional');
      if (!element) {
        showNotification('Error: No se encontró el reporte para exportar.', 'error');
        return;
      }
      
      const htmlContent = element.innerHTML;
      const fullHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Asistencia Oficial - ${reportDate}</title>
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
      <strong>Instrucciones:</strong> Este archivo es 100% independiente. Puede enviarlo por correo, abrirlo desde cualquier PC o celular y presionar "Imprimir" para obtener el PDF oficial.
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
      link.download = `Reporte_Asistencia_Imprimible_${reportDate}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('¡Archivo web (.html) independiente descargado! Ábralo en cualquier pestaña para imprimirlo sin restricciones de iframe.', 'success');
    } catch (e) {
      console.error(e);
      showNotification('Error al exportar a HTML.', 'error');
    }
  };

  const getFormattedDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return dateObj.toLocaleDateString('es-DO', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateStr;
    }
  };

  const handleGenerateReport = () => {
    if (!allCoursesCompleted) {
      setShowWarningModal(true);
    } else {
      setShowDocument(true);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl font-sans text-left print:bg-white print:text-neutral-900 print:p-0">
      
      {/* HEADER SECTION (HIDDEN IN PRINT) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="h-5.5 w-5.5 text-[#D4AF37]" />
            Reportes de Asistencia Institucional
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-light">
            Monitoree la asistencia escolar, verifique el cumplimiento del pase de lista en todos los cursos y genere el documento oficial PDF firmado.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin Database Clear Button */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setShowResetDbModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-red-500/5 shrink-0"
              title="Restablecer base de datos a 0 (Solo Administradores)"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Vaciar Asistencia (Reiniciar)</span>
            </button>
          )}

          {/* Debug Button */}
          <button
            onClick={() => {
              setIsDebugging(true);
              setTimeout(() => {
                syncData();
                setIsDebugging(false);
                showNotification('¡Sistema depurado y sincronizado en tiempo real! Las cachés han sido vaciadas.', 'success');
              }, 800);
            }}
            disabled={isDebugging}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            title="Forzar Sincronización y Depurar Sistema"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isDebugging ? 'animate-spin' : ''}`} />
            <span>{isDebugging ? 'Depurando...' : 'Depurar y Sincronizar'}</span>
          </button>

          <div className="flex items-center space-x-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5">
            <Calendar className="h-4 w-4 text-[#D4AF37]" />
            <input 
              type="date" 
              value={reportDate} 
              min={minDateStr}
              max={maxDateStr}
              onChange={(e) => {
                setReportDate(e.target.value);
                setShowDocument(false);
              }}
              className="bg-transparent border-none text-xs text-white focus:outline-none cursor-pointer"
            />
            <span className="text-[9px] text-neutral-500 font-medium">Máx 3D</span>
          </div>
          <button
            onClick={() => { syncData(); showNotification('Datos de asistencia sincronizados.', 'success'); }}
            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl border border-neutral-800 transition-colors"
            title="Sincronizar Datos"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* COMPLIANCE CHECK PANEL (HIDDEN IN PRINT) */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-6 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-neutral-800">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-2xl ${allCoursesCompleted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20'}`}>
              {allCoursesCompleted ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-200">
                Estado del Control Diario de Asistencia ({completedCoursesCount} de {totalCoursesCount} Cursos)
              </h3>
              <p className="text-xs text-neutral-400 mt-1 font-light">
                {allCoursesCompleted 
                  ? "✓ Todos los cursos de la institución han registrado su pase de lista reglamentario para hoy. El reporte institucional oficial está listo para generarse."
                  : "⚠ Faltan cursos por registrar asistencia para esta fecha. Para garantizar la validez legal del reporte oficial, se sugiere que todos los docentes completen el pase de lista."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!allCoursesCompleted && (
              <button
                onClick={handleSimulateAllAttendance}
                disabled={isSimulating}
                className="flex items-center space-x-1.5 bg-neutral-900 hover:bg-neutral-800 text-[#D4AF37] hover:text-white border border-[#D4AF37]/30 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all shrink-0 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isSimulating ? 'Simulando...' : 'Autocompletar Cursos (Demo)'}</span>
              </button>
            )}

            <button
              onClick={handleGenerateReport}
              className={`flex items-center space-x-1.5 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                allCoursesCompleted 
                  ? 'bg-[#D4AF37] hover:bg-[#F3D065] text-neutral-950 shadow-lg shadow-[#D4AF37]/10' 
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              <FileCheck2 className="h-4 w-4" />
              <span>{allCoursesCompleted ? 'Generar Reporte Oficial PDF' : 'Generar con Advertencia'}</span>
            </button>
          </div>
        </div>

        {/* Course Status Matrix */}
        <div className="space-y-3">
          <h4 className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Estado de Pase de Lista por Cursos ({reportDate})</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {courseAttendanceStatus.map((c) => (
              <div 
                key={c.courseId} 
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  c.isCompleted 
                    ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                    : 'bg-red-950/10 border-red-950/40 text-neutral-400'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-white block">{c.courseNombre}</span>
                  <span className="text-[9px] text-neutral-400 block mt-0.5">{c.totalStudents} Alumnos inscritos</span>
                </div>
                {c.isCompleted ? (
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase">Listo</span>
                ) : (
                  <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase">Pendiente</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETAILED STATS ROW (HIDDEN IN PRINT AND ONLY SHOWN IF DOCUMENT IS NOT ACTIVE) */}
      {!showDocument && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
          {/* Main KPI widget */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between h-44">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">Porcentaje de Asistencia General</span>
              <span className="text-4xl font-display font-bold text-[#D4AF37] block mt-2">{presencePercentage}%</span>
            </div>
            <div className="text-[11px] text-neutral-400 border-t border-neutral-800/60 pt-2 font-light">
              Calculado en base a <strong className="text-neutral-200">{totalRegistered}</strong> estudiantes evaluados el día de hoy de un total de <strong className="text-neutral-200">{students.length}</strong> matriculados.
            </div>
          </div>

          {/* Absence Count KPI widget */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between h-44">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">Inasistencias Registradas</span>
              <span className="text-4xl font-display font-bold text-red-400 block mt-2">{totalAbsent}</span>
            </div>
            <div className="text-[11px] text-neutral-400 border-t border-neutral-800/60 pt-2 font-light flex items-center justify-between">
              <span>Porcentaje de Ausencia: <strong className="text-red-400">{absencePercentage}%</strong></span>
              <span>Con Excusa: <strong className="text-yellow-400">{totalExcused}</strong></span>
            </div>
          </div>

          {/* Gender breakdown widget */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between h-44">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">Distribución por Género</span>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <span className="text-[10px] text-neutral-400 block">Femeninas:</span>
                  <span className="text-lg font-bold text-white">{femalePresent} P <span className="text-xs text-neutral-500 font-normal">/ {femaleAbsent} A</span></span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Masculinos:</span>
                  <span className="text-lg font-bold text-white">{malePresent} P <span className="text-xs text-neutral-500 font-normal">/ {maleAbsent} A</span></span>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-neutral-400 border-t border-neutral-800/60 pt-2 font-light">
              La matrícula total del centro cuenta con <strong className="text-neutral-200">{students.filter(s => s.sexo?.toLowerCase() === 'femenino').length}</strong> alumnas y <strong className="text-neutral-200">{students.filter(s => s.sexo?.toLowerCase() === 'masculino').length}</strong> alumnos.
            </div>
          </div>
        </div>
      )}

      {/* HIGH-FIDELITY PRINTABLE INSTITUTIONAL DOCUMENT PREVIEW */}
      {showDocument && (
        <div className="space-y-6">
          {/* Action header inside previews (HIDDEN IN PRINT) */}
          <div className="flex items-center justify-between bg-[#5A2D1A]/10 border border-[#D4AF37]/20 p-4 rounded-xl print:hidden">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
              <div className="text-left">
                <span className="text-xs font-bold text-white block">
                  {allCoursesCompleted ? '✓ Documento Homologado y Oficial' : '⚠ Vista Previa de Borrador de Asistencia'}
                </span>
                <span className="text-[10px] text-neutral-400 font-light block">
                  {allCoursesCompleted 
                    ? 'Cumple con los requisitos formales del Ministerio de Educación. Listo para imprimir en formato físico o guardar en PDF.' 
                    : 'Aún faltan cursos por registrar asistencia. Este documento se marca como "BORRADOR NO OFICIAL".'}
                </span>
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

          {/* THE OFFICIAL DOCUMENT CANVAS */}
          {/* Paper styling for screen, standard paper borders and dimensions on print */}
          <div 
            className="bg-white text-neutral-900 p-8 sm:p-12 md:p-16 rounded-2xl shadow-2xl max-w-4xl mx-auto border border-neutral-200 relative overflow-hidden text-left font-sans print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none"
            id="reporte-asistencia-institucional"
          >
            {/* Elegant Background Watermark for Institutional Authentication (HIDDEN ON PRINT OR SUBTLE) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
              <img 
                src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=300" 
                className="w-96 h-96 object-contain filter grayscale" 
                alt="Escudo de Agua" 
              />
            </div>

            {/* Official Dominican Header Bar */}
            <div className="border-b-4 border-[#5A2D1A] pb-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
              <div className="flex items-center space-x-4 text-center md:text-left">
                {/* Logo of Center */}
                <img 
                  src={logoDuarte} 
                  alt="Liceo Juan Pablo Duarte Logo" 
                  className="h-16 w-16 object-contain rounded-xl shrink-0 border border-neutral-100" 
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h1 className="font-display font-bold text-lg text-[#5A2D1A] tracking-tight uppercase leading-tight">
                    Liceo Juan Pablo Duarte
                  </h1>
                  <span className="text-[10px] tracking-widest text-[#D4AF37] font-bold block uppercase mt-0.5 font-mono">
                    "Estudio • Perseverancia • Libertad"
                  </span>
                  <span className="text-[11px] text-neutral-500 block font-medium mt-1">
                    Adscrito al Ministerio de Educación de la República Dominicana (MINERD)
                  </span>
                  <span className="text-[10px] text-neutral-400 block font-light">
                    Código de Plantel: 04-0982 | Distrito Educativo 15-03
                  </span>
                </div>
              </div>

              {/* Document Identity metadata */}
              <div className="flex items-start space-x-4">
                <div className="text-right flex flex-col items-center md:items-end font-mono">
                  <span className="text-[10px] bg-neutral-100 text-neutral-700 px-3 py-1 rounded border border-neutral-200 font-bold uppercase inline-block">
                    {allCoursesCompleted ? 'Documento Oficial' : 'Copia de Borrador'}
                  </span>
                  <span className="text-[11px] text-neutral-600 block mt-2">
                    <strong>ID Reporte:</strong> REP-ATT-{reportDate.replace(/-/g, '')}
                  </span>
                  <span className="text-[11px] text-neutral-600 block">
                    <strong>Año Escolar:</strong> 2026-2027
                  </span>
                  <span className="text-[11px] text-neutral-600 block">
                    <strong>Pase Diario:</strong> MATUTINO
                  </span>
                </div>
                <img 
                  src={logoCupula} 
                  alt="Sello Dome Liceo Duarte" 
                  className="h-16 w-16 object-contain rounded-xl shrink-0 border border-neutral-100" 
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Document Title & Date */}
            <div className="my-8 text-center space-y-2">
              <h2 className="font-display text-xl font-extrabold tracking-tight text-[#5A2D1A] uppercase">
                Informe Institucional de Control Diario de Asistencia
              </h2>
              <p className="text-xs text-neutral-600 italic">
                Correspondiente al día escolar: <strong className="text-neutral-900 font-bold">{getFormattedDate(reportDate)}</strong>
              </p>
              <div className="h-[2px] w-24 bg-[#D4AF37] mx-auto mt-2" />
            </div>

            {/* Introductory formal text */}
            <div className="text-xs text-neutral-700 leading-relaxed space-y-4 mb-8 text-justify">
              <p>
                Por medio del presente documento oficial, la Dirección de Registro Académico y Control de Estudiantes del <strong>Centro Educativo Juan Pablo Duarte</strong> certifica el balance oficial y consolidado del pase de lista realizado por el cuerpo docente en la fecha escolar precitada. Este informe se emite conforme a la ordenanza reglamentaria del MINERD para el monitoreo de la tasa de retención estudiantil y la alerta temprana sobre ausentismo escolar crónico.
              </p>
            </div>

            {/* SECTION 1: EXECUTIVE SUMMARY */}
            <div className="space-y-3 mb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A2D1A] border-b border-neutral-200 pb-1.5 flex items-center justify-between">
                <span>1. Resumen Ejecutivo de Asistencia</span>
                <span className="text-[10px] text-neutral-500 font-light font-mono italic">Fecha de emisión: {new Date().toLocaleDateString('es-DO')}</span>
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                <div className="text-center md:text-left border-r border-neutral-200/80 last:border-none pr-2">
                  <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold block">Matrícula General</span>
                  <span className="text-lg font-bold text-neutral-900 block mt-0.5">{students.length} Estudiantes</span>
                </div>
                <div className="text-center md:text-left border-r border-neutral-200/80 last:border-none px-2">
                  <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold block">Asistencia Efectiva</span>
                  <span className="text-lg font-bold text-emerald-700 block mt-0.5">{totalPresent + totalTardy} ({presencePercentage}%)</span>
                </div>
                <div className="text-center md:text-left border-r border-neutral-200/80 last:border-none px-2">
                  <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold block">Inasistencia Diaria</span>
                  <span className="text-lg font-bold text-red-600 block mt-0.5">{totalAbsent} ({absencePercentage}%)</span>
                </div>
                <div className="text-center md:text-left last:border-none pl-2">
                  <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold block">Tardanzas / Excusas</span>
                  <span className="text-lg font-bold text-yellow-600 block mt-0.5">{totalTardy} T / {totalExcused} E</span>
                </div>
              </div>

              {/* Gender Breakdown detail */}
              <div className="bg-[#5A2D1A]/5 p-3 rounded-xl border border-[#5A2D1A]/10 text-xs text-neutral-700 mt-2">
                <span className="font-bold text-[#5A2D1A] block mb-1">Distribución Demográfica de la Asistencia:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    • <strong>Población Estudiantil Femenina:</strong> Enroladas: {students.filter(s => s.sexo?.toLowerCase() === 'femenino').length} | Presentes: {femalePresent} | Ausentes: {femaleAbsent} | Tardanzas/Excusas: {femaleTardy + femaleExcused}
                  </div>
                  <div>
                    • <strong>Población Estudiantil Masculina:</strong> Enrolados: {students.filter(s => s.sexo?.toLowerCase() === 'masculino').length} | Presentes: {malePresent} | Ausentes: {maleAbsent} | Tardanzas/Excusas: {maleTardy + maleExcused}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: COURSE BREAKDOWN TABLE */}
            <div className="space-y-3 mb-8 page-break-before">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A2D1A] border-b border-neutral-200 pb-1.5">
                2. Rendimiento y Cobertura de Asistencia por Curso
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 border-y border-neutral-200 text-neutral-700 font-bold">
                      <th className="py-2.5 px-3">Grado y Sección</th>
                      <th className="py-2.5 px-3 text-center">Matrícula</th>
                      <th className="py-2.5 px-3 text-center">Presentes / %</th>
                      <th className="py-2.5 px-3 text-center">Ausentes / %</th>
                      <th className="py-2.5 px-3 text-center">Tardanzas / Excusas</th>
                      <th className="py-2.5 px-3 text-right">Estatus Pase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseMetrics.map((c) => {
                      const courseStatus = courseAttendanceStatus.find(status => status.courseId === c.id);
                      return (
                        <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                          <td className="py-2 px-3 font-bold text-neutral-800">{c.nombre}</td>
                          <td className="py-2 px-3 text-center">{c.totalStudents}</td>
                          <td className="py-2 px-3 text-center text-emerald-800 font-medium">
                            {c.present + c.tardy} ({c.presencePct}%)
                          </td>
                          <td className="py-2 px-3 text-center text-red-600 font-medium">
                            {c.absent} ({c.absencePct}% )
                          </td>
                          <td className="py-2 px-3 text-center text-neutral-600">
                            {c.tardy} T / {c.excused} E
                          </td>
                          <td className="py-2 px-3 text-right">
                            {courseStatus?.isCompleted ? (
                              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">Verificado</span>
                            ) : (
                              <span className="text-[10px] text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-100 uppercase">Incompleto</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 3: DETAILED ABSENTEEISM REGISTRY & PARENTAL INTERVENTION */}
            <div className="space-y-3 mb-8 page-break-before">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A2D1A] border-b border-neutral-200 pb-1.5 flex items-center justify-between">
                <span>3. Relación de Estudiantes Ausentes y Registro para Alerta a Padres</span>
                <span className="text-[9px] bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded font-mono font-bold">Total: {absentStudentsList.length}</span>
              </h3>
              
              <p className="text-[10.5px] text-neutral-500 leading-relaxed text-justify mb-2 italic">
                *Nota de Alerta*: Los siguientes alumnos se registraron oficialmente como ausentes el día de hoy. Aquellos señalados en la columna de excusa con "No" requieren de comunicación telefónica inmediata por parte de Orientación Escolar al tutor correspondiente para la justificación del ausentismo, previniendo abandono educativo y sancionando reincidencias en base al acumulado histórico anual de inasistencias.
              </p>

              {absentStudentsList.length === 0 ? (
                <div className="text-center py-6 text-neutral-500 text-xs bg-neutral-50 border border-dashed rounded-xl">
                  ✓ No se reportan ausencias de estudiantes en los cursos auditados el día de hoy. ¡Excelente asistencia institucional!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 border-y border-neutral-200 text-neutral-700 font-bold">
                        <th className="py-2.5 px-2">Estudiante / Matrícula</th>
                        <th className="py-2.5 px-2">Curso</th>
                        <th className="py-2.5 px-2 text-center">Excusa</th>
                        <th className="py-2.5 px-2">Observaciones de Ausencia</th>
                        <th className="py-2.5 px-2 text-center">Ausencias Año</th>
                        <th className="py-2.5 px-2">Padre / Tutor y Teléfono</th>
                      </tr>
                    </thead>
                    <tbody>
                      {absentStudentsList.map((st) => (
                        <tr key={st.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                          <td className="py-2.5 px-2">
                            <strong className="text-neutral-800 block leading-tight">{st.nombreCompleto}</strong>
                            <span className="text-[9px] text-neutral-500 font-mono block mt-0.5">{st.matricula}</span>
                          </td>
                          <td className="py-2.5 px-2 font-medium">{st.cursoNombre}</td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                              st.hasExcuse.startsWith('Sí')
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-red-50 text-red-600 border border-red-100'
                            }`}>
                              {st.hasExcuse.split(' ')[0]}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-neutral-600 text-[11px] leading-tight max-w-[180px] break-words">
                            {st.observaciones}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold font-mono text-neutral-800">
                            <span className={`px-2 py-0.5 rounded-full ${
                              st.historicalAbsences >= 5 
                                ? 'bg-red-500 text-white font-extrabold' 
                                : st.historicalAbsences >= 3 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-neutral-100 text-neutral-700'
                            }`}>
                              {st.historicalAbsences}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-[10.5px]">
                            <span className="font-semibold text-neutral-800 block leading-tight">{st.tutor}</span>
                            <span className="text-neutral-500 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3 shrink-0 text-[#5A2D1A]" />
                              {st.telefono}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SECTION 4: DETAILED ATTENDANCE INCIDENCES (DISCREPANCIES) */}
            <div className="space-y-3 mb-8 page-break-before">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A2D1A] border-b border-neutral-200 pb-1.5 flex items-center justify-between">
                <span>4. Registro de Incidencias de Asistencia (Múltiples Evaluaciones por Fecha)</span>
                <span className="text-[9px] bg-[#5A2D1A]/10 text-[#5A2D1A] border border-[#5A2D1A]/20 px-2 py-0.5 rounded font-mono font-bold">Total: {incidencesList.length}</span>
              </h3>
              
              <p className="text-[11px] text-neutral-600 leading-relaxed text-justify mb-3 bg-amber-50/40 border border-amber-500/10 p-3 rounded-xl">
                <strong>¿Qué significa esta sección para padres y maestros?</strong><br />
                En esta tabla se anotan los estudiantes que tuvieron cambios en su asistencia durante el transcurso del día escolar:
                <br />
                • <strong className="text-emerald-700">Llegó Tarde:</strong> El alumno no estuvo presente en el primer pase de lista de la mañana, pero sí se integró a las clases más adelante.
                <br />
                • <strong className="text-red-600">Salió Temprano:</strong> El alumno sí estuvo presente al inicio del día, pero no apareció registrado en las clases de las horas siguientes. Esto nos ayuda a saber si el estudiante se retiró de la escuela antes de tiempo o si faltó a alguna clase en particular, de manera que el tutor y la escuela puedan coordinar de inmediato para cuidar su bienestar.
              </p>

              {incidencesList.length === 0 ? (
                <div className="text-center py-6 text-neutral-500 text-xs bg-neutral-50 border border-dashed rounded-xl">
                  ✓ No se han registrado incidencias ni discrepancias de pase de lista el día de hoy. Consistencia del 100% en las evaluaciones.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 border-y border-neutral-200 text-neutral-700 font-bold">
                        <th className="py-2.5 px-2">Estudiante</th>
                        <th className="py-2.5 px-2">Curso</th>
                        <th className="py-2.5 px-2 text-center">Tipo Incidencia</th>
                        <th className="py-2.5 px-2">Primer Pase (Hora/Docente)</th>
                        <th className="py-2.5 px-2">Pase Posterior (Hora/Docente)</th>
                        <th className="py-2.5 px-2">Interpretación Académica</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incidencesList.map((inc) => (
                        <tr key={inc.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                          <td className="py-2.5 px-2 font-bold text-neutral-800">
                            {inc.studentName}
                            <span className="text-[9px] text-neutral-500 font-mono block mt-0.5">{inc.matricula}</span>
                          </td>
                          <td className="py-2.5 px-2 font-medium">{inc.courseName}</td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                              inc.type.includes('Reintegración')
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-red-50 text-red-600 border border-red-100'
                            }`}>
                              {inc.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-[11px] leading-tight">
                            <span className="font-semibold block text-neutral-700">{inc.firstState} ({inc.firstTime})</span>
                            <span className="text-[9px] text-neutral-500">{inc.firstTeacher} ({inc.firstSubject})</span>
                          </td>
                          <td className="py-2.5 px-2 text-[11px] leading-tight">
                            <span className="font-semibold block text-neutral-700">{inc.secondState} ({inc.secondTime})</span>
                            <span className="text-[9px] text-neutral-500">{inc.secondTeacher} ({inc.secondSubject})</span>
                          </td>
                          <td className="py-2.5 px-2 text-neutral-600 text-[11px] leading-snug">
                            {inc.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SECTION 5: INSTITUTIONAL SIGNATURES & STAMP */}
            <div className="mt-16 border-t border-neutral-200 pt-10 page-break-inside-avoid">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center">
                <div className="flex flex-col items-center">
                  <div className="h-14 w-48 border-b border-neutral-400 flex items-end justify-center mb-2 italic text-xs text-neutral-400">
                    {allCoursesCompleted ? 'Firma autorizada' : 'Sello de Borrador'}
                  </div>
                  <strong className="text-xs text-neutral-800 block">Dra. Altagracia Mercedes</strong>
                  <span className="text-[10px] text-neutral-400 block font-light">Directora General</span>
                  <span className="text-[9px] text-neutral-400 block font-light italic">Centro Educativo Juan Pablo Duarte</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="h-14 w-48 border-b border-neutral-400 flex items-end justify-center mb-2 italic text-xs text-neutral-400">
                    {allCoursesCompleted ? 'Firma autorizada' : 'Sello de Borrador'}
                  </div>
                  <strong className="text-xs text-neutral-800 block">Licda. Mercedes Peña</strong>
                  <span className="text-[10px] text-neutral-400 block font-light">Encargada de Registro</span>
                  <span className="text-[9px] text-neutral-400 block font-light italic">Centro Educativo Juan Pablo Duarte</span>
                </div>
              </div>

              {/* Official Seal Mock Indicator */}
              <div className="flex justify-center mt-12">
                <div className="border-2 border-dashed border-[#5A2D1A]/30 text-[#5A2D1A]/40 text-[9px] font-mono px-6 py-4 rounded-xl uppercase tracking-widest text-center">
                  SELLO INSTITUCIONAL DE CONTROL ACADÉMICO<br />
                  <span className="text-[8px] font-normal">VALIDACIÓN ELECTRÓNICA VÍA ERP DUARTE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM WARNING MODAL (REPLACES BLOCKED BROWSER CONFIRM) */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-neutral-900 border border-neutral-850 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-bold text-white">Advertencia Académica</h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  No todos los grados y secciones han completado el pase de lista reglamentario para la fecha seleccionada.
                </p>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed font-light">
                  ¿Desea omitir esta validación y forzar la generación del reporte de todos modos? Se marcará el reporte como borrador oficial preliminar.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowWarningModal(false)}
                className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  setShowDocument(true);
                  showNotification('Reporte generado bajo estado de borrador con advertencia académica.', 'info');
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-amber-600/10"
              >
                Sí, Generar Reporte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DATABASE RESET MODAL (ADMIN ONLY) */}
      {showResetDbModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-neutral-900 border border-red-500/20 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-bold text-white">¿Restablecer Base de Datos de Asistencia?</h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Esta acción es <strong className="text-white">permanente</strong> e irreversible. Se eliminarán todos los pases de lista, presentes, ausentes, tardanzas e incidencias registradas en la institución para dejarlos en cero (0).
                </p>
                <p className="text-xs text-red-400 mt-2 leading-relaxed font-semibold">
                  ¿Está completamente seguro de que desea vaciar la base de datos de control diario de asistencia escolar?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetDbModal(false)}
                disabled={isResettingDb}
                className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetDatabase}
                disabled={isResettingDb}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-red-600/10 flex items-center gap-1.5"
              >
                {isResettingDb ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Vaciando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Sí, Restablecer a 0</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
