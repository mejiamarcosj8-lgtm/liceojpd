/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LogOut, User, Settings, Users, BookOpen, GraduationCap, 
  Calendar, Award, ClipboardCheck, FileText, CheckCircle, 
  Plus, Edit, Trash, RotateCcw, AlertCircle, Save, Send, Sparkles,
  Cpu, Upload, Download, ArrowLeft, BarChart, History, Eye,
  Newspaper, FolderOpen, Search, Check, X, ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart as RechartsBarChart, Bar, Legend 
} from 'recharts';
import { User as UserType, Course, Subject, Grade, Attendance, Task, NewsItem, AuditLog, SystemConfig, Observation, Citation, ObservationImportance } from '../types';
import AttendanceReportView from './AttendanceReportView';
import ReportCardView from './ReportCardView';
import StudentMeritView from './StudentMeritView';
import DisciplineReportView from './DisciplineReportView';
// @ts-ignore
import logoDuarte from '../assets/images/logo_duarte_1783545572734.jpg';

interface ERPDashboardProps {
  currentUser: UserType;
  onLogout: () => void;
  onReturnToWeb: () => void;
}

export const isSubjectNameMatch = (name1: string, name2: string): boolean => {
  if (!name1 || !name2) return false;
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  if (n1 === n2) return true;
  
  // Normalize both for comparison
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
  
  // Specific check for natural sciences common variants
  if ((norm1.includes("natural") && norm2.includes("naturaleza")) || 
      (norm1.includes("naturaleza") && norm2.includes("natural"))) {
    return true;
  }
  
  return false;
};

export default function ERPDashboard({ currentUser, onLogout, onReturnToWeb }: ERPDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [sysConfig, setSysConfig] = useState<SystemConfig | null>(null);
  
  // Database local states (synced from API)
  const [users, setUsers] = useState<UserType[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);

  // Selected Student for Parent View
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  // AI chat state for Student orientation
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Form Editing States (Administración)
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState<Partial<UserType>>({
    username: '', nombreCompleto: '', role: 'estudiante', correo: '', telefono: '', 
    especialidad: '', cursoId: '', seccion: '', matricula: '', tutor: '', sexo: 'Masculino',
    password: '', fotografia: ''
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Course Management states (Admin)
  const [selectedAdminCourseId, setSelectedAdminCourseId] = useState<string | null>(null);
  const [showCourseModal, setShowCourseModal] = useState<boolean>(false);
  const [courseForm, setCourseForm] = useState<{ nombre: string; activo: boolean }>({ nombre: '', activo: true });
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [showAddStudentsModal, setShowAddStudentsModal] = useState<boolean>(false);
  const [courseStudentSearch, setCourseStudentSearch] = useState<string>('');
  const [unassignedStudentSearch, setUnassignedStudentSearch] = useState<string>('');
  const [selectedUnassignedStudentIds, setSelectedUnassignedStudentIds] = useState<string[]>([]);

  // Course view for Docente
  const [selectedDocenteCourseId, setSelectedDocenteCourseId] = useState<string | null>(null);
  const [selectedDocenteStudentId, setSelectedDocenteStudentId] = useState<string | null>(null);
  const [docenteCourseSubTab, setDocenteCourseSubTab] = useState<'alumnos' | 'asistencia' | 'calificaciones'>('alumnos');
  
  // Custom academic record details modal states (Docente)
  const [showAcademicHistoryModal, setShowAcademicHistoryModal] = useState<boolean>(false);
  const [showObservationModal, setShowObservationModal] = useState<boolean>(false);
  const [showDisciplineModal, setShowDisciplineModal] = useState<boolean>(false);
  const [selectedDiscStudent, setSelectedDiscStudent] = useState<UserType | null>(null);
  const [discType, setDiscType] = useState<string>('conducta'); // conducta, excusa, rendimiento, otra
  const [discDetail, setDiscDetail] = useState<string>('');
  const [discImportance, setDiscImportance] = useState<ObservationImportance>('Regular');
  const [observationText, setObservationText] = useState<string>('');
  const [conductText, setConductText] = useState<string>('');

  // Mark attendance state (Docente)
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<{[key: string]: 'Presente' | 'Ausente' | 'Excusa' | 'Tardanza'}>({});
  const [attendanceObs, setAttendanceObs] = useState<{[key: string]: string}>({});

  // Enter grades state (Docente)
  const [editingGrades, setEditingGrades] = useState<{[key: string]: Partial<Grade>}>({});

  // New task state (Docente)
  const [taskForm, setTaskForm] = useState({
    titulo: '', descripcion: '', materiaId: '', cursoId: '', seccion: 'A', fechaEntrega: ''
  });

  // Simulated file upload state (Estudiante)
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string>('');

  // Config Form state (Administrador)
  const [configForm, setConfigForm] = useState<Partial<SystemConfig>>({});

  // News management state (Administrador)
  const [news, setNews] = useState<NewsItem[]>([]);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [newsForm, setNewsForm] = useState<Partial<NewsItem>>({
    titulo: '', resumen: '', contenido: '', imagen: ''
  });
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);

  // Web CMS states
  const [webContent, setWebContent] = useState<any>(null);
  const [webLoading, setWebLoading] = useState<boolean>(true);
  const [webSubTab, setWebSubTab] = useState<'hero' | 'about' | 'studentLife' | 'governance' | 'admissions' | 'attachments'>('hero');

  // Custom confirmation and prompt dialog modal state
  const [customModal, setCustomModal] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'prompt';
    title: string;
    message: string;
    placeholder?: string;
    defaultValue?: string;
    inputValue?: string;
    onConfirm: (value?: string) => void;
  }>({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setCustomModal({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setCustomModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const triggerPrompt = (title: string, message: string, defaultValue: string, placeholder: string, onConfirm: (val: string) => void) => {
    setCustomModal({
      isOpen: true,
      type: 'prompt',
      title,
      message,
      placeholder,
      defaultValue,
      inputValue: defaultValue,
      onConfirm: (val) => {
        onConfirm(val || '');
        setCustomModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Home page chatbot states
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: '¡Hola! Soy DuarteBot, el asistente de Inteligencia Artificial del Liceo Juan Pablo Duarte. ¿En qué puedo ayudarte hoy? Puedo responder tus inquietudes sobre calificaciones, horarios, asistencia o procesos escolares.' }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  const handleSendChat = (messageText?: string) => {
    const textToSend = messageText || chatInput;
    if (!textToSend.trim()) return;

    const updatedMessages = [...chatMessages, { sender: 'user' as const, text: textToSend }];
    setChatMessages(updatedMessages);
    if (!messageText) {
      setChatInput('');
    }
    setChatLoading(true);

    fetch('/api/ai/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: textToSend,
        history: updatedMessages.slice(-6),
        user: currentUser
      })
    })
      .then(res => res.json())
      .then(data => {
        setChatMessages(prev => [...prev, { sender: 'bot' as const, text: data.reply || 'Sin respuesta.' }]);
      })
      .catch(err => {
        console.error('Chatbot error:', err);
        setChatMessages(prev => [...prev, { sender: 'bot' as const, text: 'Hubo un error de conexión con DuarteBot. Por favor, intente de nuevo.' }]);
      })
      .finally(() => {
        setChatLoading(false);
      });
  };

  useEffect(() => {
    // Initial fetch of config
    fetch('/api/config').then(res => res.json()).then(data => {
      setSysConfig(data);
      setConfigForm(data);
    });
    
    // Fetch DB collections
    syncData();
  }, []);

  const syncData = () => {
    fetch('/api/users').then(res => res.json()).then(setUsers);
    fetch('/api/courses').then(res => res.json()).then(setCourses);
    fetch('/api/subjects').then(res => res.json()).then(setSubjects);
    fetch('/api/grades').then(res => res.json()).then(setGrades);
    fetch('/api/attendance').then(res => res.json()).then(setAttendance);
    fetch('/api/tasks').then(res => res.json()).then(setTasks);
    fetch('/api/audit-logs').then(res => res.json()).then(setAuditLogs);
    fetch('/api/news').then(res => res.json()).then(setNews);
    fetch('/api/observations').then(res => res.json()).then(setObservations);
    fetch('/api/citations').then(res => res.json()).then(setCitations);
    
    // Fetch Web CMS content
    fetch('/api/landing')
      .then(res => res.json())
      .then(data => {
        setWebContent(data);
        setWebLoading(false);
      });
  };

  // Automatically select first child if user is a parent
  useEffect(() => {
    if (currentUser.role === 'padre' && currentUser.estudiantesVinculadosIds && currentUser.estudiantesVinculadosIds.length > 0) {
      setSelectedChildId(currentUser.estudiantesVinculadosIds[0]);
    }
  }, [currentUser]);

  // Automatically select report tab for Encargado de Registro
  useEffect(() => {
    if (currentUser.role === 'registro') {
      setActiveTab('asistencia-reportes');
    }
  }, [currentUser]);

  // Automatically select dynamic subject for a docente when they enter a course
  useEffect(() => {
    if (currentUser.role === 'docente' && selectedAdminCourseId) {
      const teacherSubjectName = currentUser.especialidad || 'Asignatura General';
      const realSubject = subjects.find(s => 
        s.cursoId === selectedAdminCourseId && 
        isSubjectNameMatch(s.nombre, teacherSubjectName)
      );
      setSelectedSubjectId(realSubject ? realSubject.id : `sbj-dynamic-${currentUser.id}-${selectedAdminCourseId}`);
    }
  }, [selectedAdminCourseId, currentUser, subjects]);

  // Auth helper
  const roleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'director': return 'Director General';
      case 'registro': return 'Encargada/o de Registro';
      case 'docente': return 'Docente Titular';
      case 'estudiante': return 'Estudiante';
      case 'padre': return 'Padre / Tutor';
      default: return 'Usuario';
    }
  };

  // Administration actions
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username || !userForm.nombreCompleto) {
      showNotification('Campos obligatorios incompletos.', 'error');
      return;
    }
    const endpoint = editingUserId ? '/api/users/update' : '/api/users/create';
    const payload = editingUserId 
      ? { modifier: currentUser.username, updatedUser: { ...userForm, id: editingUserId } }
      : { creator: currentUser.username, newUser: userForm };

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          syncData();
          setShowUserModal(false);
          setEditingUserId(null);
          setUserForm({
            username: '', nombreCompleto: '', role: 'estudiante', correo: '', telefono: '', 
            especialidad: '', cursoId: '', seccion: '', matricula: '', tutor: '', sexo: 'Masculino',
            password: '', fotografia: ''
          });
          showNotification(editingUserId ? 'Cambios guardados correctamente.' : 'Usuario creado correctamente.', 'success');
        } else {
          showNotification('Error al guardar los cambios.', 'error');
        }
      })
      .catch(() => {
        showNotification('Error al conectar con el servidor.', 'error');
      });
  };

  const handleSubmitDisciplineObservation = () => {
    if (!selectedDiscStudent || !discDetail.trim()) return;
    
    // Find active course info
    const course = courses.find(c => c.id === selectedAdminCourseId || c.id === selectedDiscStudent.cursoId);
    
    const observation = {
      estudianteId: selectedDiscStudent.id,
      estudianteNombre: selectedDiscStudent.nombreCompleto,
      cursoId: course ? course.id : '',
      cursoNombre: course ? course.nombre : '',
      docenteId: currentUser.id,
      docenteNombre: currentUser.nombreCompleto,
      tipo: discType,
      detalle: discDetail,
      importancia: discImportance
    };
    
    fetch('/api/observations/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        observation,
        authorName: currentUser.nombreCompleto
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showNotification('Observación registrada y enviada a Orientación correctamente.', 'success');
        setShowDisciplineModal(false);
        setDiscDetail('');
        setDiscType('conducta');
        setDiscImportance('Regular');
        syncData();
      } else {
        showNotification('Ocurrió un error al guardar la observación.', 'error');
      }
    })
    .catch(err => {
      console.error(err);
      showNotification('Error al conectar con el servidor.', 'error');
    });
  };

  const handleEditUser = (u: UserType) => {
    setEditingUserId(u.id);
    setUserForm({
      ...u,
      password: u.password || '',
      fotografia: u.fotografia || ''
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = (id: string) => {
    triggerConfirm(
      'Eliminar Cuenta de Usuario',
      '¿Está completamente seguro de eliminar este usuario del sistema escolar? Esta acción es irreversible.',
      () => {
        fetch('/api/users/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modifier: currentUser.username, id })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              syncData();
              showNotification('Usuario eliminado correctamente.', 'success');
            } else {
              showNotification('Error al eliminar el usuario.', 'error');
            }
          })
          .catch(() => {
            showNotification('Error de conexión al eliminar usuario.', 'error');
          });
      }
    );
  };

  const handleResetPassword = (id: string) => {
    const userToReset = users.find(u => u.id === id);
    triggerPrompt(
      'Restablecer Contraseña',
      `Ingrese la nueva contraseña manual para ${userToReset?.nombreCompleto || 'este usuario'} (deje en blanco para restablecer al valor por defecto):`,
      '',
      'Nueva contraseña...',
      (customPass) => {
        fetch('/api/users/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modifier: currentUser.username, id, newPassword: customPass })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              syncData();
              showNotification(data.message, 'success');
            } else {
              showNotification('Error al restablecer la contraseña.', 'error');
            }
          });
      }
    );
  };

  // Course action handlers
  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.nombre) {
      showNotification('Por favor ingrese el nombre del curso.', 'error');
      return;
    }
    const endpoint = editingCourseId ? '/api/courses/update' : '/api/courses/create';
    const payload = editingCourseId 
      ? { modifier: currentUser.username, updatedCourse: { id: editingCourseId, ...courseForm } }
      : { creator: currentUser.username, newCourse: courseForm };

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          syncData();
          setShowCourseModal(false);
          setEditingCourseId(null);
          setCourseForm({ nombre: '', activo: true });
          showNotification(editingCourseId ? 'Curso actualizado correctamente.' : 'Curso creado correctamente.', 'success');
        } else {
          showNotification('Error al guardar el curso.', 'error');
        }
      })
      .catch(() => {
        showNotification('Error de conexión al guardar el curso.', 'error');
      });
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourseId(course.id);
    setCourseForm({
      nombre: course.nombre,
      activo: course.activo !== undefined ? course.activo : true
    });
    setShowCourseModal(true);
  };

  const handleDeleteCourse = (id: string) => {
    triggerConfirm(
      'Eliminar Curso',
      '¿Está completamente seguro de eliminar este curso? Los estudiantes inscritos quedarán desasignados y esta acción es irreversible.',
      () => {
        fetch('/api/courses/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modifier: currentUser.username, id })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              syncData();
              if (selectedAdminCourseId === id) {
                setSelectedAdminCourseId(null);
              }
              showNotification('Curso eliminado correctamente.', 'success');
            } else {
              showNotification('Error al eliminar el curso.', 'error');
            }
          })
          .catch(() => {
            showNotification('Error de conexión al eliminar curso.', 'error');
          });
      }
    );
  };

  const handleToggleCourseActive = (course: Course) => {
    const updated = { ...course, activo: !course.activo };
    fetch('/api/courses/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modifier: currentUser.username, updatedCourse: updated })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          syncData();
          showNotification(`Curso ${updated.activo ? 'activado' : 'desactivado'} con éxito.`, 'success');
        } else {
          showNotification('Error al cambiar el estado del curso.', 'error');
        }
      })
      .catch(() => {
        showNotification('Error de conexión al cambiar estado del curso.', 'error');
      });
  };

  const handleAssignStudentsToCourse = () => {
    if (selectedUnassignedStudentIds.length === 0) {
      showNotification('Debe seleccionar al menos un estudiante para agregar.', 'error');
      return;
    }
    fetch('/api/courses/assign-students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modifier: currentUser.username,
        cursoId: selectedAdminCourseId,
        studentIds: selectedUnassignedStudentIds
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          syncData();
          setSelectedUnassignedStudentIds([]);
          setShowAddStudentsModal(false);
          showNotification('Estudiantes asignados correctamente al curso.', 'success');
        } else {
          showNotification('Error al asignar estudiantes.', 'error');
        }
      })
      .catch(() => {
        showNotification('Error de conexión al asignar estudiantes.', 'error');
      });
  };

  const handleRemoveStudentFromCourse = (studentId: string) => {
    triggerConfirm(
      'Remover Estudiante del Curso',
      '¿Está seguro de remover a este estudiante del curso?',
      () => {
        fetch('/api/courses/remove-student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modifier: currentUser.username,
            studentId
          })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              syncData();
              showNotification('Estudiante removido del curso correctamente.', 'success');
            } else {
              showNotification('Error al remover al estudiante.', 'error');
            }
          })
          .catch(() => {
            showNotification('Error de conexión al remover estudiante.', 'error');
          });
      }
    );
  };

  const handleChangeStudentCourse = (studentId: string, newCursoId: string) => {
    if (!newCursoId) return;
    const student = users.find(u => u.id === studentId);
    if (!student) return;
    
    const updated = { ...student, cursoId: newCursoId };
    fetch('/api/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modifier: currentUser.username, updatedUser: updated })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          syncData();
          showNotification('Estudiante cambiado de curso con éxito.', 'success');
        } else {
          showNotification('Error al cambiar de curso al estudiante.', 'error');
        }
      })
      .catch(() => {
        showNotification('Error de conexión al cambiar estudiante de curso.', 'error');
      });
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/config/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser.username, config: configForm })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSysConfig(data.config);
          showNotification('Cambios guardados correctamente.', 'success');
        } else {
          showNotification('Error al guardar la configuración.', 'error');
        }
      });
  };

  const handleSaveNews = (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = editingNewsId ? '/api/news/update' : '/api/news/create';
    const payload = {
      author: currentUser.nombreCompleto,
      newsItem: { ...newsForm, id: editingNewsId || undefined }
    };

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          syncData();
          setShowNewsModal(false);
          setNewsForm({ titulo: '', resumen: '', contenido: '', imagen: '' });
          setEditingNewsId(null);
          showNotification(editingNewsId ? 'Noticia publicada correctamente.' : 'Noticia publicada correctamente.', 'success');
        }
      });
  };

  const handleSaveWebContent = (updatedData: any) => {
    fetch('/api/landing/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser.username,
        landingData: updatedData
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWebContent(data.landingData);
          showNotification('Cambios guardados correctamente.', 'success');
        } else {
          showNotification('Fallo al guardar la información del portal.', 'error');
        }
      })
      .catch(err => {
        console.error('Error actualizando contenido web:', err);
        showNotification('Error al guardar los cambios.', 'error');
      });
  };

  const handleDeleteNews = (id: string) => {
    triggerConfirm(
      'Eliminar Noticia',
      '¿Está seguro de eliminar esta noticia? Esta acción es irreversible.',
      () => {
        fetch('/api/news/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ author: currentUser.nombreCompleto, id })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              syncData();
              showNotification('Noticia eliminada correctamente.', 'success');
            }
          });
      }
    );
  };

  // Docente actions
  const handleMarkAttendance = () => {
    if (!selectedSubjectId) return;
    const teacherSubjectName = currentUser.especialidad || 'Asignatura General';
    const realSubject = subjects.find(s => 
      s.cursoId === selectedAdminCourseId && 
      isSubjectNameMatch(s.nombre, teacherSubjectName)
    );
    const subject = currentUser.role === 'docente' ? {
      id: realSubject ? realSubject.id : `sbj-dynamic-${currentUser.id}-${selectedAdminCourseId}`,
      nombre: realSubject ? realSubject.nombre : teacherSubjectName
    } : subjects.find(s => s.id === selectedSubjectId);
    const subjectName = subject ? subject.nombre : '';

    const records = Object.keys(attendanceRecords).map(studId => ({
      estudianteId: studId,
      materiaId: selectedSubjectId,
      materiaNombre: subjectName,
      fecha: attendanceDate,
      estado: attendanceRecords[studId],
      observaciones: attendanceObs[studId] || ""
    }));

    fetch('/api/attendance/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher: currentUser.nombreCompleto, attendanceRecords: records })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showNotification('Asistencia registrada correctamente.', 'success');
          syncData();
          setAttendanceRecords({});
          setAttendanceObs({});
        }
      });
  };

  const handleSaveGrade = (gradeId: string, studId: string, matId: string, matName: string) => {
    const editState = editingGrades[gradeId || studId];
    if (!editState) return;

    // Find if there is an existing grade record to preserve unmodified periods
    const existingGrade = grades.find(g => g.id === gradeId || (g.estudianteId === studId && g.materiaId === matId));

    const payload = {
      id: gradeId || existingGrade?.id || '',
      estudianteId: studId,
      materiaId: matId,
      materiaNombre: matName,
      p1: Number(editState.p1 !== undefined ? editState.p1 : (existingGrade ? existingGrade.p1 : 0)),
      p2: Number(editState.p2 !== undefined ? editState.p2 : (existingGrade ? existingGrade.p2 : 0)),
      p3: Number(editState.p3 !== undefined ? editState.p3 : (existingGrade ? existingGrade.p3 : 0)),
      p4: Number(editState.p4 !== undefined ? editState.p4 : (existingGrade ? existingGrade.p4 : 0))
    };

    fetch('/api/grades/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher: currentUser.nombreCompleto, grade: payload })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showNotification('Calificación registrada correctamente.', 'success');
          // Clear the edit state for this grade/student
          setEditingGrades(prev => {
            const next = { ...prev };
            delete next[gradeId || studId];
            return next;
          });
          syncData();
        }
      });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const isDocente = currentUser.role === 'docente';

    if (!taskForm.titulo || (!isDocente && !taskForm.materiaId) || !taskForm.fechaEntrega || !taskForm.cursoId) {
      showNotification('Campos obligatorios incompletos. Por favor, seleccione un curso de destino.', 'error');
      return;
    }

    const subjectName = isDocente 
      ? (currentUser.especialidad || 'Asignatura General')
      : (subjects.find(s => s.id === taskForm.materiaId)?.nombre || '');

    const materiaId = isDocente 
      ? `sbj-dynamic-${currentUser.id}`
      : taskForm.materiaId;

    fetch('/api/tasks/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacher: currentUser.nombreCompleto,
        newTask: { 
          ...taskForm, 
          materiaId,
          materiaNombre: subjectName 
        }
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showNotification('Tarea asignada correctamente.', 'success');
          syncData();
          setTaskForm({ titulo: '', descripcion: '', materiaId: '', cursoId: '', seccion: 'A', fechaEntrega: '' });
        }
      });
  };

  // Student actions
  const handleFileUpload = (taskId: string) => {
    if (!uploadedFile) {
      showNotification('Campos obligatorios incompletos.', 'error');
      return;
    }
    fetch('/api/tasks/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: currentUser.id,
        studentName: currentUser.nombreCompleto,
        taskId,
        filename: uploadedFile
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showNotification('Tarea entregada correctamente.', 'success');
          syncData();
          setUploadingTaskId(null);
          setUploadedFile('');
        }
      });
  };

  // AI Orientation advice query
  const handleAskAI = () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    setAiResponse('');

    const studentId = currentUser.role === 'padre' ? selectedChildId : currentUser.id;
    const studentGrades = grades.filter(g => g.estudianteId === studentId);
    const studentAttendance = attendance.filter(a => a.estudianteId === studentId);

    fetch('/api/ai/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: aiPrompt,
        studentGrades,
        studentAttendance
      })
    })
      .then(res => res.json())
      .then(data => {
        setAiResponse(data.advice || 'No se recibió respuesta.');
        setAiLoading(false);
      })
      .catch(err => {
        setAiResponse('Ocurrió un error consultando a la Inteligencia Artificial.');
        setAiLoading(false);
      });
  };

  // Calculations for stats charts (Admin)
  const getRolesStats = () => {
    const adminCount = users.filter(u => u.role === 'admin' || u.role === 'director').length;
    const docCount = users.filter(u => u.role === 'docente').length;
    const studCount = users.filter(u => u.role === 'estudiante').length;
    const parentCount = users.filter(u => u.role === 'padre').length;

    return [
      { name: 'Directivos', cantidad: adminCount },
      { name: 'Docentes', cantidad: docCount },
      { name: 'Estudiantes', cantidad: studCount },
      { name: 'Tutores', cantidad: parentCount }
    ];
  };

  // Student specific statistics
  const getStudentGPAData = (studentId: string) => {
    const sGrades = grades.filter(g => g.estudianteId === studentId);
    return sGrades.map(g => ({
      materia: g.materiaNombre,
      promedio: g.promedio
    }));
  };

  const getAttendanceRate = (studentId: string) => {
    const sAtt = attendance.filter(a => a.estudianteId === studentId);
    if (sAtt.length === 0) return 100;
    const presents = sAtt.filter(a => a.estado === 'Presente' || a.estado === 'Tardanza').length;
    return Math.round((presents / sAtt.length) * 100);
  };

  // Download boletín as a beautiful, printable standalone HTML file for parents/students
  const handleDownloadStudentBoletin = () => {
    try {
      const studentId = currentUser.role === 'padre' ? selectedChildId : currentUser.id;
      const student = users.find(u => u.id === studentId);
      if (!student) {
        showNotification('Error: Estudiante no encontrado.', 'error');
        return;
      }

      const studentCourse = courses.find(c => c.id === student.cursoId)?.nombre || 'Sin Asignar';
      const studentSubjects = subjects.filter(s => !student.cursoId || s.cursoId === student.cursoId);
      const studentGradesList = grades.filter(g => g.estudianteId === student.id);

      // Construct grades table HTML
      let gradesRowsHtml = '';
      let sumPromedio = 0;
      let countEvaluated = 0;

      studentSubjects.forEach(sub => {
        const grd = studentGradesList.find(g => 
          g.materiaId === sub.id || isSubjectNameMatch(g.materiaNombre, sub.nombre)
        ) || {
          p1: 0, p2: 0, p3: 0, p4: 0, promedio: 0, estado: 'Pendiente'
        };

        const finalAvg = grd.promedio > 0 ? grd.promedio : 0;
        if (finalAvg > 0) {
          sumPromedio += finalAvg;
          countEvaluated++;
        }

        const statusLabel = grd.promedio > 0 ? grd.estado : 'Pendiente';
        const statusClass = statusLabel === 'Aprobado' 
          ? 'color: #047857; background-color: #ecfdf5; font-weight: bold; text-align: center;' 
          : statusLabel === 'Reprobado'
            ? 'color: #b91c1c; background-color: #fef2f2; font-weight: bold; text-align: center;'
            : 'color: #6b7280; background-color: #f3f4f6; text-align: center;';

        gradesRowsHtml += `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 10px; font-weight: bold; color: #111827;">${sub.nombre}</td>
            <td style="padding: 12px 10px; text-align: center; font-family: monospace;">${grd.p1 > 0 ? grd.p1 : '-'}</td>
            <td style="padding: 12px 10px; text-align: center; font-family: monospace;">${grd.p2 > 0 ? grd.p2 : '-'}</td>
            <td style="padding: 12px 10px; text-align: center; font-family: monospace;">${grd.p3 > 0 ? grd.p3 : '-'}</td>
            <td style="padding: 12px 10px; text-align: center; font-family: monospace;">${grd.p4 > 0 ? grd.p4 : '-'}</td>
            <td style="padding: 12px 10px; text-align: center; font-weight: bold; font-family: monospace; color: #b45309;">${finalAvg > 0 ? finalAvg : '-'}</td>
            <td style="padding: 12px 10px; text-align: center;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 8pt; text-transform: uppercase; ${statusClass}">
                ${statusLabel}
              </span>
            </td>
          </tr>
        `;
      });

      const generalAverage = countEvaluated > 0 ? Math.round((sumPromedio / countEvaluated) * 10) / 10 : 0;
      const conditionLabel = generalAverage >= 70 ? 'APROBADO' : generalAverage > 0 ? 'REPROBADO' : 'EN CURSO';
      const conditionClass = conditionLabel === 'APROBADO'
        ? 'color: #047857; background-color: #ecfdf5; border: 1px solid #a7f3d0;'
        : conditionLabel === 'REPROBADO'
          ? 'color: #b91c1c; background-color: #fef2f2; border: 1px solid #fecaca;'
          : 'color: #6b7280; background-color: #f3f4f6; border: 1px solid #e5e7eb;';

      const fullHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boletín Académico Oficial - ${student.nombreCompleto}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .font-display { font-family: 'Space Grotesk', sans-serif; }
    @media print {
      body { background: white !important; color: black !important; padding: 0 !important; }
      .no-print { display: none !important; }
      .print-shadow-none { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
    }
  </style>
</head>
<body class="bg-neutral-100 py-10 px-4">
  <div class="max-w-4xl mx-auto mb-6 flex justify-between items-center no-print">
    <div class="text-xs text-neutral-500">
      <strong>Modo de impresión:</strong> Este boletín es un documento oficial. Al presionar imprimir, puede guardarlo como archivo PDF o imprimirlo físicamente.
    </div>
    <div class="flex gap-3">
      <button onclick="window.close()" class="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer">
        Cerrar pestaña
      </button>
      <button onclick="window.print()" class="px-5 py-2.5 bg-[#5A2D1A] hover:bg-[#723c25] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#5A2D1A]/20 flex items-center space-x-2">
        <span>🖨️ Imprimir o Guardar PDF</span>
      </button>
    </div>
  </div>

  <div class="bg-white text-neutral-900 p-8 sm:p-12 rounded-3xl shadow-xl max-w-4xl mx-auto border border-neutral-200 print-shadow-none">
    
    <!-- HEADER -->
    <div class="text-center space-y-3 pb-8 border-b-2 border-[#5A2D1A]/20">
      <div style="font-size: 10pt; font-weight: bold; letter-spacing: 2px; color: #5A2D1A; text-transform: uppercase;">
        REPÚBLICA DOMINICANA
      </div>
      <div style="font-size: 11pt; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 1px;">
        MINISTERIO DE EDUCACIÓN
      </div>
      <h1 class="font-display text-2xl font-black text-[#5A2D1A] uppercase tracking-tight">
        ${sysConfig?.nombreCentro || 'Liceo Científico Dr. Miguel Canela Lázaro'}
      </h1>
      <div class="text-xs text-neutral-500 font-medium">
        BOLETÍN OFICIAL DE CALIFICACIONES — AÑO ESCOLAR ${sysConfig?.anoEscolar || '2025-2026'}
      </div>
    </div>

    <!-- METADATA GRID -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 text-xs border-b border-neutral-100">
      <div>
        <span class="block text-neutral-400 font-bold uppercase tracking-wider" style="font-size: 8pt;">Estudiante</span>
        <span class="text-neutral-900 font-extrabold text-sm block mt-1">${student.nombreCompleto}</span>
      </div>
      <div>
        <span class="block text-neutral-400 font-bold uppercase tracking-wider" style="font-size: 8pt;">Matrícula</span>
        <span class="text-neutral-900 font-mono font-bold text-sm block mt-1">${student.matricula || 'N/A'}</span>
      </div>
      <div>
        <span class="block text-neutral-400 font-bold uppercase tracking-wider" style="font-size: 8pt;">Grado & Sección</span>
        <span class="text-neutral-900 font-extrabold text-sm block mt-1">${studentCourse}</span>
      </div>
      <div>
        <span class="block text-neutral-400 font-bold uppercase tracking-wider" style="font-size: 8pt;">Estatus Escolar</span>
        <span class="inline-block mt-1 px-3 py-1 text-[10px] font-black rounded-lg ${conditionClass}">
          ${conditionLabel}
        </span>
      </div>
    </div>

    <!-- GRADES TABLE -->
    <div class="py-6">
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 9.5pt;">
        <thead>
          <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb; color: #4b5563; font-weight: bold;">
            <th style="padding: 12px; width: 40%;">Asignatura</th>
            <th style="padding: 12px; text-align: center; width: 8%;">P1</th>
            <th style="padding: 12px; text-align: center; width: 8%;">P2</th>
            <th style="padding: 12px; text-align: center; width: 8%;">P3</th>
            <th style="padding: 12px; text-align: center; width: 8%;">P4</th>
            <th style="padding: 12px; text-align: center; width: 13%;">Promedio</th>
            <th style="padding: 12px; text-align: center; width: 15%;">Estatus</th>
          </tr>
        </thead>
        <tbody>
          ${gradesRowsHtml}
        </tbody>
      </table>
    </div>

    <!-- SUMMARY SECTION -->
    <div class="mt-4 bg-neutral-50 rounded-2xl p-6 border border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h4 class="text-xs font-bold uppercase tracking-wider text-neutral-400">Rendimiento Académico Global</h4>
        <p class="text-xs text-neutral-500 mt-1">Este boletín oficial consolida las calificaciones correspondientes a los cuatro períodos evaluativos.</p>
      </div>
      <div class="text-center sm:text-right">
        <span class="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Promedio General</span>
        <span class="text-4xl font-black font-mono text-[#D4AF37]">${generalAverage > 0 ? `${generalAverage}%` : 'S/C'}</span>
      </div>
    </div>

    <!-- SIGNATURES -->
    <div class="grid grid-cols-2 gap-12 mt-16 pt-12 border-t border-dashed border-neutral-200">
      <div class="text-center">
        <div style="width: 200px; border-top: 1px solid #111827; margin: 0 auto; margin-bottom: 6px;"></div>
        <span class="block text-xs font-bold text-neutral-800">Docente Titular</span>
        <span class="block text-[10px] text-neutral-400">Firma y Sello</span>
      </div>
      <div class="text-center">
        <div style="width: 200px; border-top: 1px solid #111827; margin: 0 auto; margin-bottom: 6px;"></div>
        <span class="block text-xs font-bold text-neutral-800">Director(a) de Registro</span>
        <span class="block text-[10px] text-[#5A2D1A] font-bold">Liceo Juan Pablo Duarte</span>
      </div>
    </div>

    <!-- FOOTER DISCLAIMER -->
    <div class="mt-16 text-center text-[9px] text-neutral-400 border-t border-neutral-100 pt-6">
      Documento escolar digital oficial generado el ${new Date().toLocaleDateString('es-ES')}. Válido para trámite de traslados e inscripción universitaria.
    </div>

  </div>
</body>
</html>
      `;

      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Boletin_${student.nombreCompleto.replace(/\s+/g, '_')}_${sysConfig?.anoEscolar || '2025-2026'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification('¡Boletín académico oficial descargado con éxito! Abra el archivo descargado para guardarlo como PDF o imprimirlo.', 'success');
    } catch (e) {
      console.error(e);
      showNotification('Error al exportar el boletín de calificaciones.', 'error');
    }
  };

  // Active student context (for Student or Parent)
  const activeStudentId = currentUser.role === 'padre' ? selectedChildId : currentUser.id;
  const activeStudent = users.find(u => u.id === activeStudentId);
  const studentGrades = grades.filter(g => g.estudianteId === activeStudentId);
  const studentAttendance = attendance.filter(a => a.estudianteId === activeStudentId);
  const studentTasks = tasks.filter(t => t.cursoId === activeStudent?.cursoId);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col md:flex-row font-sans relative">
      
      {/* Notification Toast Component */}
      {notification && (
        <div className={`fixed top-6 right-6 z-[100] max-w-sm w-full border-l-4 p-4 rounded-r-xl flex items-start space-x-3 shadow-2xl animate-fade-in ${
          notification.type === 'error' 
            ? 'bg-red-950 border-red-500 text-red-100' 
            : 'bg-[#1A1A1A] border-[#D4AF37] text-neutral-100'
        }`}>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">SISTEMA DUARTE</p>
            <p className="text-xs mt-1 font-medium">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-neutral-400 hover:text-white transition-colors">
            <span className="text-base font-bold">&times;</span>
          </button>
        </div>
      )}
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col justify-between shrink-0">
        <div className="p-6 space-y-8">
          {/* Brand header */}
          <div className="flex items-center space-x-3">
            <img 
              src={logoDuarte} 
              alt="Liceo Juan Pablo Duarte Logo" 
              className="h-10 w-10 object-contain rounded-lg shrink-0" 
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="font-display font-bold text-sm tracking-tight leading-none text-white">SISTEMA DUARTE</h1>
              <span className="text-[9px] text-[#D4AF37] uppercase tracking-widest font-bold">Liceo Juan Pablo Duarte</span>
            </div>
          </div>

          {/* User badge */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 flex items-center space-x-3">
            <img 
              src={currentUser.fotografia || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"} 
              alt={currentUser.nombreCompleto} 
              className="w-10 h-10 rounded-full object-cover border border-neutral-700"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <span className="text-xs font-bold text-neutral-100 block truncate leading-tight">{currentUser.nombreCompleto}</span>
              <span className="text-[9px] text-neutral-400 font-semibold block uppercase tracking-wider mt-0.5">{roleLabel(currentUser.role)}</span>
            </div>
          </div>

          {/* Sidebar Menu Links based on Roles */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('home')}
              className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                activeTab === 'home' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
              }`}
            >
              <BarChart className="h-4.5 w-4.5 shrink-0 text-[#D4AF37]" />
              <span>Dashboard Principal</span>
            </button>

            <button
              onClick={() => setActiveTab('merito-estudiantil')}
              className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                activeTab === 'merito-estudiantil' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
              }`}
            >
              <Award className="h-4.5 w-4.5 shrink-0 text-[#D4AF37] animate-pulse" />
              <span>Mérito Estudiantil</span>
            </button>

            {/* Administrador / Director links */}
            {(currentUser.role === 'admin' || currentUser.role === 'director') && (
              <>
                <button
                  onClick={() => setActiveTab('usuarios')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                    activeTab === 'usuarios' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <Users className="h-4.5 w-4.5 shrink-0 text-[#D4AF37]" />
                  <span>Gestionar Usuarios</span>
                </button>
                <button
                  onClick={() => { setActiveTab('cursos'); setSelectedAdminCourseId(null); }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                    activeTab === 'cursos' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <FolderOpen className="h-4.5 w-4.5 shrink-0 text-[#D4AF37]" />
                  <span>Gestión de Cursos</span>
                </button>
                <button
                  onClick={() => setActiveTab('noticias')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                    activeTab === 'noticias' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <Newspaper className="h-4.5 w-4.5 shrink-0 text-[#D4AF37]" />
                  <span>Gestionar Noticias</span>
                </button>
                <button
                  onClick={() => setActiveTab('contenido')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                    activeTab === 'contenido' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <FileText className="h-4.5 w-4.5 shrink-0 text-[#D4AF37]" />
                  <span>Gestionar Web</span>
                </button>
                <button
                  onClick={() => setActiveTab('configuracion')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                    activeTab === 'configuracion' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <Settings className="h-4.5 w-4.5 shrink-0 text-[#D4AF37]" />
                  <span>Configurar Centro</span>
                </button>
                <button
                  onClick={() => setActiveTab('auditoria')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                    activeTab === 'auditoria' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <History className="h-4.5 w-4.5 shrink-0 text-[#D4AF37]" />
                  <span>Bitácora Auditoría</span>
                </button>
                <button
                  onClick={() => setActiveTab('asistencia-reportes')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                    activeTab === 'asistencia-reportes' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <ClipboardCheck className="h-4.5 w-4.5 shrink-0 text-[#D4AF37]" />
                  <span>Reportes de Asistencia</span>
                </button>
                <button
                  onClick={() => setActiveTab('boletines-reportes')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                    activeTab === 'boletines-reportes' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <GraduationCap className="h-4.5 w-4.5 shrink-0 text-[#D4AF37]" />
                  <span>Boletines de Nota</span>
                </button>
                <button
                  onClick={() => setActiveTab('observaciones')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                    activeTab === 'observaciones' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-[#D4AF37]" />
                  <span>Observaciones & Conducta</span>
                </button>
              </>
            )}

            {/* Orientación y Psicología links */}
            {currentUser.role === 'orientacion' && (
              <>
                <button
                  onClick={() => setActiveTab('observaciones')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                    activeTab === 'observaciones' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-[#D4AF37]" />
                  <span>Observaciones & Conducta</span>
                </button>
              </>
            )}

            {/* Encargado de Registro links */}
            {currentUser.role === 'registro' && (
              <>
                <button
                  onClick={() => setActiveTab('asistencia-reportes')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                    activeTab === 'asistencia-reportes' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <ClipboardCheck className="h-4.5 w-4.5 shrink-0 text-[#D4AF37]" />
                  <span>Reportes de Asistencia</span>
                </button>
              </>
            )}

            {/* Docente links */}
            {currentUser.role === 'docente' && (
              <>
                <button
                  onClick={() => { setActiveTab('cursos'); setSelectedAdminCourseId(null); }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                    activeTab === 'cursos' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <FolderOpen className="h-4.5 w-4.5 shrink-0 text-[#D4AF37]" />
                  <span>Cursos</span>
                </button>
                <button
                  onClick={() => setActiveTab('tareas')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                    activeTab === 'tareas' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <FileText className="h-4.5 w-4.5 shrink-0 text-[#D4AF37]" />
                  <span>Asignar Tareas</span>
                </button>
                <button
                  onClick={() => setActiveTab('asistencia-reportes')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                    activeTab === 'asistencia-reportes' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <ClipboardCheck className="h-4.5 w-4.5 shrink-0 text-[#D4AF37]" />
                  <span>Reportes de Asistencia</span>
                </button>
                <button
                  onClick={() => setActiveTab('observaciones')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                    activeTab === 'observaciones' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-[#D4AF37]" />
                  <span>Bitácora de Observaciones</span>
                </button>
              </>
            )}

            {/* Estudiante or Parent Link */}
            {(currentUser.role === 'estudiante' || currentUser.role === 'padre') && (
              <>
                <button
                  onClick={() => setActiveTab('estudiante-notas')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                    activeTab === 'estudiante-notas' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <Award className="h-4.5 w-4.5 shrink-0 text-[#D4AF37]" />
                  <span>Boletín Calificaciones</span>
                </button>
                <button
                  onClick={() => setActiveTab('observaciones')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                    activeTab === 'observaciones' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-[#D4AF37]" />
                  <span>Bitácora de Conducta</span>
                </button>
                <button
                  onClick={() => setActiveTab('estudiante-tareas')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                    activeTab === 'estudiante-tareas' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <FileText className="h-4.5 w-4.5 shrink-0 text-[#D4AF37]" />
                  <span>Tareas & Entregas</span>
                </button>
                <button
                  onClick={() => setActiveTab('orientacion-ia')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-3 transition-all ${
                    activeTab === 'orientacion-ia' ? 'bg-[#5A2D1A] text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <Cpu className="h-4.5 w-4.5 shrink-0 text-[#D4AF37] animate-pulse" />
                  <span>Asistente de Orientación IA</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-neutral-800 space-y-2">
          <button
            onClick={onReturnToWeb}
            className="w-full flex items-center justify-center space-x-2 text-neutral-400 hover:text-white text-xs font-semibold uppercase tracking-wider py-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a la Web Pública</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 bg-neutral-900 hover:bg-red-950/40 text-red-400 font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all border border-red-950/20"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 min-h-0 overflow-y-auto p-6 md:p-10 space-y-8">
        
        {/* Child selector for parent role at the top of content */}
        {currentUser.role === 'padre' && currentUser.estudiantesVinculadosIds && currentUser.estudiantesVinculadosIds.length > 0 && (
          <div className="bg-neutral-950 border border-[#D4AF37]/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-[#D4AF37]" />
              <span className="text-xs font-bold uppercase tracking-wider">Hijos vinculados para seguimiento académico:</span>
            </div>
            <select 
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            >
              {currentUser.estudiantesVinculadosIds.map(childId => {
                const child = users.find(u => u.id === childId);
                return (
                  <option key={childId} value={childId}>
                    {child ? child.nombreCompleto : 'Estudiante'}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* TAB 1: home / Dashboard */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fade-in">
            {/* Greeting banner */}
            <div className="bg-[#5A2D1A] text-white p-8 rounded-3xl border-b-4 border-[#D4AF37] relative overflow-hidden shadow-lg">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.12),transparent)] pointer-events-none" />
              <div className="relative z-10">
                <span className="text-[#D4AF37] font-bold text-[10px] uppercase tracking-widest block">Acceso Concedido</span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-1">¡Saludos, {currentUser.nombreCompleto}!</h2>
                <p className="text-xs text-neutral-300 font-light mt-2 max-w-2xl">
                  Bienvenido al panel integrado del {sysConfig?.nombreCentro || 'Centro Educativo Juan Pablo Duarte'}. Año Lectivo activo: {sysConfig?.anoEscolar}. Periodo: {sysConfig?.periodoActivo}.
                </p>
              </div>
            </div>

            {/* Admin Metrics Dashboard */}
            {(currentUser.role === 'admin' || currentUser.role === 'director') && (
              <div className="space-y-8">
                {/* Stats cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl">
                    <Users className="h-5 w-5 text-[#D4AF37] mb-2" />
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">Matrícula Escolar</span>
                    <span className="text-2xl font-display font-bold text-white block mt-1">{users.length}</span>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl">
                    <BookOpen className="h-5 w-5 text-[#D4AF37] mb-2" />
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">Cursos Registrados</span>
                    <span className="text-2xl font-display font-bold text-white block mt-1">{courses.length}</span>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl">
                    <GraduationCap className="h-5 w-5 text-[#D4AF37] mb-2" />
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">Asignaturas</span>
                    <span className="text-2xl font-display font-bold text-white block mt-1">{subjects.length}</span>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl">
                    <FileText className="h-5 w-5 text-[#D4AF37] mb-2" />
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">Evaluaciones Hechas</span>
                    <span className="text-2xl font-display font-bold text-white block mt-1">{grades.length}</span>
                  </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl">
                    <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-400 mb-6">Composición del Alumnado y Personal</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={getRolesStats()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                          <XAxis dataKey="name" stroke="#737373" fontSize={11} />
                          <YAxis stroke="#737373" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#404040' }} />
                          <Bar dataKey="cantidad" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl">
                    <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-400 mb-6">Recientes del Registro de Auditoría</h3>
                    <div className="space-y-4">
                      {auditLogs.slice(0, 4).map((log) => (
                        <div key={log.id} className="border-l-2 border-[#D4AF37] pl-3 py-1 text-xs space-y-1">
                          <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                            <span>Usuario: {log.usuario}</span>
                            <span>{new Date(log.fecha).toLocaleTimeString()}</span>
                          </div>
                          <span className="font-bold text-neutral-200 block">{log.accion}</span>
                          <p className="text-neutral-500 font-light text-[11px] leading-tight">{log.detalles}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Student & Parent overview stats */}
            {(currentUser.role === 'estudiante' || currentUser.role === 'padre') && activeStudent && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl">
                    <Award className="h-5 w-5 text-[#D4AF37] mb-2" />
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">Materias Cursando</span>
                    <span className="text-2xl font-display font-bold text-white block mt-1">{studentGrades.length}</span>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl">
                    <ClipboardCheck className="h-5 w-5 text-[#D4AF37] mb-2" />
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">Porcentaje de Asistencia</span>
                    <span className="text-2xl font-display font-bold text-white block mt-1">{getAttendanceRate(activeStudentId)}%</span>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl">
                    <FileText className="h-5 w-5 text-[#D4AF37] mb-2" />
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">Tareas Pendientes</span>
                    <span className="text-2xl font-display font-bold text-white block mt-1">
                      {studentTasks.filter(t => !t.entregas.some(e => e.estudianteId === activeStudentId)).length}
                    </span>
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-400 mb-6">Gráfico de Rendimiento por Asignatura</h3>
                  {studentGrades.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500 text-xs">Sin calificaciones registradas para este periodo.</div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getStudentGPAData(activeStudentId)}>
                          <defs>
                            <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                          <XAxis dataKey="materia" stroke="#737373" fontSize={10} />
                          <YAxis domain={[0, 100]} stroke="#737373" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#404040' }} />
                          <Area type="monotone" dataKey="promedio" stroke="#D4AF37" fillOpacity={1} fill="url(#colorGpa)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Docente Specific Overview */}
            {currentUser.role === 'docente' && (
              <div className="space-y-6">
                <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">Asignatura Principal</span>
                    <h3 className="font-display font-bold text-neutral-100 text-lg mt-0.5">{currentUser.especialidad || 'Sin Asignatura Asignada'}</h3>
                    <p className="text-xs text-neutral-400 font-light mt-1">Como docente titular del centro, tiene habilitado el acceso global para registrar asistencia y calificaciones en todos los cursos y secciones de la institución.</p>
                  </div>
                  <button 
                    onClick={() => { setActiveTab('cursos'); setSelectedAdminCourseId(null); }} 
                    className="bg-[#D4AF37] hover:bg-[#F3D065] text-neutral-950 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm self-start whitespace-nowrap"
                  >
                    Ver Todos los Cursos
                  </button>
                </div>

                <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-400 mb-4">Acceso Rápido a Secciones Activas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.filter(c => c.activo !== false).map(course => {
                    const enrolledCount = users.filter(u => u.role === 'estudiante' && u.cursoId === course.id).length;
                    return (
                      <div key={course.id} className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between hover:border-[#D4AF37]/50 transition-all">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider block">Sección Activa</span>
                          <h4 className="font-display font-bold text-neutral-100 text-base">Curso {course.nombre}</h4>
                          <p className="text-xs text-neutral-500 font-light mt-1">{enrolledCount} Estudiantes Inscritos</p>
                        </div>
                        <div className="pt-4 border-t border-neutral-800 flex justify-between gap-2">
                          <button 
                            onClick={() => { 
                              setSelectedAdminCourseId(course.id); 
                              setDocenteCourseSubTab('asistencia');
                              setActiveTab('cursos'); 
                            }} 
                            className="text-xs text-[#D4AF37] hover:underline font-bold"
                          >
                            Pase de Lista
                          </button>
                          <button 
                            onClick={() => { 
                              setSelectedAdminCourseId(course.id); 
                              setDocenteCourseSubTab('calificaciones');
                              setActiveTab('cursos'); 
                            }} 
                            className="text-xs text-[#D4AF37] hover:underline font-bold"
                          >
                            Registrar Notas
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: usuarios / CRUD */}
        {activeTab === 'usuarios' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold">Gestión de Usuarios</h2>
                <p className="text-xs text-neutral-500 mt-1 font-light">Cuentas habilitadas en el sistema del centro.</p>
              </div>
              <button
                onClick={() => {
                  setEditingUserId(null);
                  setUserForm({
                    username: '', nombreCompleto: '', role: 'estudiante', correo: '', telefono: '', 
                    especialidad: '', cursoId: 'crs-sec6', seccion: 'A', matricula: '', tutor: '', sexo: 'Masculino'
                  });
                  setShowUserModal(true);
                }}
                className="flex items-center space-x-2 bg-[#D4AF37] hover:bg-[#F3D065] text-[#3F1D10] font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm self-start"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar Nuevo Usuario</span>
              </button>
            </div>

            {/* Users list table */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-900 text-neutral-400 uppercase tracking-wider text-[9px] border-b border-neutral-800">
                      <th className="p-4 font-bold">Fotografía & Nombre</th>
                      <th className="p-4 font-bold">Nombre de Usuario</th>
                      <th className="p-4 font-bold">Rol de Acceso</th>
                      <th className="p-4 font-bold">Correo de Contacto</th>
                      <th className="p-4 font-bold">Estado</th>
                      <th className="p-4 font-bold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-neutral-900/40">
                        <td className="p-4 flex items-center space-x-3 min-w-[200px]">
                          <img src={u.fotografia || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"} alt={u.nombreCompleto} className="w-9 h-9 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                          <div>
                            <span className="font-bold text-neutral-100 block">{u.nombreCompleto}</span>
                            <span className="text-[10px] text-neutral-500 font-medium block">{u.matricula || u.especialidad || 'S/N'}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-neutral-300">{u.username}</td>
                        <td className="p-4">
                          <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-800">
                            {roleLabel(u.role)}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-neutral-400">{u.correo}</td>
                        <td className="p-4">
                          <span className={`h-2.5 w-2.5 rounded-full inline-block ${u.activo ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        </td>
                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                          <button onClick={() => handleResetPassword(u.id)} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-[#D4AF37]" title="Restablecer Contraseña"><RotateCcw className="h-4 w-4" /></button>
                          <button onClick={() => handleEditUser(u)} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-[#D4AF37]" title="Editar Datos"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-red-400" title="Eliminar Cuenta"><Trash className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal for adding/editing user */}
            {showUserModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-neutral-900">
                <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl relative">
                  <h3 className="font-display font-bold text-lg text-[#5A2D1A] mb-4">
                    {editingUserId ? 'Editar Datos de Usuario' : 'Registrar Nuevo Usuario Escolar'}
                  </h3>
                  
                  <form onSubmit={handleSaveUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Nombre Completo</label>
                        <input type="text" required value={userForm.nombreCompleto} onChange={(e) => setUserForm({...userForm, nombreCompleto: e.target.value})} className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5A2D1A]" placeholder="Ej. Camila Mercedes" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Nombre de Usuario</label>
                        <input type="text" required value={userForm.username} onChange={(e) => setUserForm({...userForm, username: e.target.value})} className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5A2D1A]" placeholder="Ej. camila1" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Rol de Acceso</label>
                        <select value={userForm.role} onChange={(e) => setUserForm({...userForm, role: e.target.value as any})} className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-xs focus:outline-none">
                          <option value="estudiante">Estudiante</option>
                          <option value="padre">Padre / Tutor</option>
                          <option value="docente">Docente</option>
                          <option value="director">Director</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Cédula / Matrícula</label>
                        <input type="text" value={userForm.matricula} onChange={(e) => setUserForm({...userForm, matricula: e.target.value})} className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5A2D1A]" placeholder="Ej. MAT-2026-003" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Correo Electrónico</label>
                        <input type="email" value={userForm.correo} onChange={(e) => setUserForm({...userForm, correo: e.target.value})} className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-xs focus:outline-none" placeholder="Ej. correo@gmail.com" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Teléfono</label>
                        <input type="text" value={userForm.telefono} onChange={(e) => setUserForm({...userForm, telefono: e.target.value})} className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-xs focus:outline-none" placeholder="Ej. 809-555-012" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Contraseña de Acceso</label>
                        <input 
                          type="password" 
                          value={userForm.password || ''} 
                          onChange={(e) => setUserForm({...userForm, password: e.target.value})} 
                          className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5A2D1A]" 
                          placeholder="Dejar vacío para usar predeterminada" 
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Sexo / Género</label>
                        <select value={userForm.sexo || 'Masculino'} onChange={(e) => setUserForm({...userForm, sexo: e.target.value as any})} className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-xs focus:outline-none">
                          <option value="Masculino">Masculino</option>
                          <option value="Femenino">Femenino</option>
                        </select>
                      </div>
                    </div>

                    {userForm.role === 'docente' && (
                      <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl space-y-3.5 mt-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase tracking-wider text-amber-950 font-bold block">
                            Asignatura Impartida (Especialidad)
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={userForm.especialidad || ''}
                            onChange={(e) => setUserForm({ ...userForm, especialidad: e.target.value })}
                            className="flex-1 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5A2D1A]"
                          >
                            <option value="">-- Seleccionar Asignatura Oficial --</option>
                            {[
                              "Lengua Española",
                              "Matemática",
                              "Ciencias de la Naturaleza",
                              "Ciencias Sociales",
                              "Lenguas Extranjeras: Inglés y Francés",
                              "Formación Integral Humana y Religiosa",
                              "Educación Física",
                              "Educación Artística"
                            ].map(subjName => (
                              <option key={subjName} value={subjName}>{subjName}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 border-t border-neutral-100 pt-4 mt-2">
                      <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block">Fotografía del Usuario</label>
                      <div className="flex items-center space-x-4">
                        <img 
                          src={userForm.fotografia || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"} 
                          alt="Previsualización" 
                          className="w-12 h-12 rounded-full object-cover border border-neutral-200 shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setUserForm({ ...userForm, fotografia: reader.result as string });
                                    showNotification('Fotografía cargada correctamente.', 'success');
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden" 
                              id="user-photo-upload"
                            />
                            <label 
                              htmlFor="user-photo-upload" 
                              className="inline-block bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg cursor-pointer transition-colors border border-neutral-200"
                            >
                              Subir Archivo de Imagen
                            </label>
                          </div>
                          <input 
                            type="text" 
                            value={userForm.fotografia || ''} 
                            onChange={(e) => setUserForm({ ...userForm, fotografia: e.target.value })} 
                            placeholder="O pegue una dirección URL de imagen aquí..." 
                            className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-[#5A2D1A]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-100 mt-6">
                      <button type="button" onClick={() => setShowUserModal(false)} className="px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-neutral-100 hover:bg-neutral-200 transition-colors">Cancelar</button>
                      <button type="submit" className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#5A2D1A] text-white hover:bg-[#7D4229] transition-colors shadow-md">Guardar Cambios</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: noticias / CRUD (Administrador) */}
        {activeTab === 'noticias' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold">Gestión de Noticias y Boletines</h2>
                <p className="text-xs text-neutral-500 mt-1 font-light">Publique anuncios importantes, logros y circulares en el portal público de noticias.</p>
              </div>
              <button
                onClick={() => {
                  setEditingNewsId(null);
                  setNewsForm({
                    titulo: '', resumen: '', contenido: '', imagen: ''
                  });
                  setShowNewsModal(true);
                }}
                className="flex items-center space-x-2 bg-[#D4AF37] hover:bg-[#F3D065] text-[#3F1D10] font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm self-start"
              >
                <Plus className="h-4 w-4" />
                <span>Publicar Nueva Noticia</span>
              </button>
            </div>

            {/* News list cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item) => (
                <div key={item.id} className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="aspect-video relative overflow-hidden bg-neutral-900 border-b border-neutral-800">
                      <img src={item.imagen} alt={item.titulo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute top-3 left-3 bg-[#5A2D1A] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border border-[#D4AF37]/20">
                        {item.fecha}
                      </div>
                    </div>
                    <div className="p-5 space-y-2">
                      <h3 className="font-display font-bold text-sm text-neutral-200 line-clamp-2">{item.titulo}</h3>
                      <p className="text-xs text-neutral-400 font-light leading-relaxed line-clamp-3">{item.resumen}</p>
                    </div>
                  </div>
                  <div className="p-5 pt-0 border-t border-neutral-900/60 flex justify-between items-center bg-neutral-900/10">
                    <span className="text-[10px] text-neutral-500 font-medium">Por: {item.autor}</span>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setEditingNewsId(item.id);
                          setNewsForm(item);
                          setShowNewsModal(true);
                        }} 
                        className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-[#D4AF37]"
                        title="Editar Noticia"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteNews(item.id)} 
                        className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-red-400"
                        title="Eliminar Noticia"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {news.length === 0 && (
                <div className="col-span-full text-center py-16 text-neutral-500 bg-neutral-950 border border-dashed border-neutral-800 rounded-2xl">
                  No hay noticias publicadas en este momento.
                </div>
              )}
            </div>

            {/* Modal for news form */}
            {showNewsModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-neutral-900">
                <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl relative">
                  <h3 className="font-display font-bold text-lg text-[#5A2D1A] mb-4">
                    {editingNewsId ? 'Editar Noticia / Comunicado' : 'Publicar Noticia en Portal Web'}
                  </h3>
                  
                  <form onSubmit={handleSaveNews} className="space-y-4">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Título de la Noticia</label>
                      <input 
                        type="text" 
                        required 
                        value={newsForm.titulo || ''} 
                        onChange={(e) => setNewsForm({...newsForm, titulo: e.target.value})} 
                        className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5A2D1A]" 
                        placeholder="Ej. Resultados de las Olimpiadas..." 
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Resumen (Subtítulo corto)</label>
                      <input 
                        type="text" 
                        required 
                        value={newsForm.resumen || ''} 
                        onChange={(e) => setNewsForm({...newsForm, resumen: e.target.value})} 
                        className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5A2D1A]" 
                        placeholder="Breve descripción introductoria de 1 o 2 líneas..." 
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Contenido de la Publicación</label>
                      <textarea 
                        required 
                        rows={6}
                        value={newsForm.contenido || ''} 
                        onChange={(e) => setNewsForm({...newsForm, contenido: e.target.value})} 
                        className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5A2D1A] resize-none" 
                        placeholder="Escriba aquí el cuerpo completo de la noticia, comunicado o circular..." 
                      />
                    </div>

                     <div className="space-y-2 border-t border-neutral-100 pt-4">
                      <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block">Imagen de Portada de la Noticia</label>
                      <div className="flex items-center space-x-4">
                        <img 
                          src={newsForm.imagen || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80"} 
                          alt="Previsualización de Portada" 
                          className="w-24 h-14 rounded-lg object-cover border border-neutral-200 shrink-0 bg-neutral-100" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setNewsForm({ ...newsForm, imagen: reader.result as string });
                                    showNotification('Imagen de portada cargada correctamente.', 'success');
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden" 
                              id="news-photo-upload"
                            />
                            <label 
                              htmlFor="news-photo-upload" 
                              className="inline-block bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg cursor-pointer transition-colors border border-neutral-200"
                            >
                              Subir Archivo de Imagen
                            </label>
                          </div>
                          <input 
                            type="text" 
                            value={newsForm.imagen || ''} 
                            onChange={(e) => setNewsForm({...newsForm, imagen: e.target.value})} 
                            placeholder="O pegue una dirección URL de imagen de portada..." 
                            className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-[#5A2D1A]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-100 mt-6">
                      <button type="button" onClick={() => setShowNewsModal(false)} className="px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-neutral-100 hover:bg-neutral-200 transition-colors">Cancelar</button>
                      <button type="submit" className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#5A2D1A] text-white hover:bg-[#7D4229] transition-colors shadow-md">Guardar y Publicar</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Gestion de Cursos (Admin/Docente) */}
        {activeTab === 'cursos' && (
          <div className="space-y-6 animate-fade-in">
            {selectedAdminCourseId === null ? (
              // Course grid list
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-bold">
                      {currentUser.role === 'docente' ? 'Cursos Institucionales' : 'Gestión de Cursos Institucionales'}
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1 font-light">
                      {currentUser.role === 'docente' 
                        ? 'Consulte las secciones habilitadas, visualice la lista de estudiantes inscritos e ingrese las calificaciones y asistencia diaria.'
                        : 'Cree, modifique y configure los cursos y administre manualmente la asignación de sus alumnos.'}
                    </p>
                  </div>
                  {(currentUser.role === 'admin' || currentUser.role === 'director') && (
                    <button
                      onClick={() => {
                        setEditingCourseId(null);
                        setCourseForm({ nombre: '', activo: true });
                        setShowCourseModal(true);
                      }}
                      className="flex items-center space-x-2 bg-[#D4AF37] hover:bg-[#F3D065] text-[#3F1D10] font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm self-start"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Crear Nuevo Curso</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {courses.map(course => {
                    const enrolledCount = users.filter(u => u.role === 'estudiante' && u.cursoId === course.id).length;
                    return (
                      <div key={course.id} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between hover:border-neutral-700 transition-all duration-300">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                              course.activo !== false 
                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' 
                                : 'bg-red-950/40 text-red-400 border border-red-900/40'
                            }`}>
                              {course.activo !== false ? 'Activo' : 'Inactivo'}
                            </span>
                            {(currentUser.role === 'admin' || currentUser.role === 'director') && (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleEditCourse(course)}
                                  className="p-1 text-neutral-400 hover:text-[#D4AF37] transition-colors"
                                  title="Editar nombre"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleCourseActive(course)}
                                  className="p-1 text-neutral-400 hover:text-[#D4AF37] transition-colors"
                                  title={course.activo !== false ? "Desactivar curso" : "Activar curso"}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCourse(course.id)}
                                  className="p-1 text-neutral-400 hover:text-red-400 transition-colors"
                                  title="Eliminar curso"
                                >
                                  <Trash className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          <h3 className="font-display font-bold text-2xl text-neutral-100">{course.nombre}</h3>
                          
                          <div className="text-xs text-neutral-400">
                            <span className="font-bold text-[#D4AF37]">{enrolledCount}</span> estudiantes inscritos
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedAdminCourseId(course.id);
                            setCourseStudentSearch('');
                            setUnassignedStudentSearch('');
                            setSelectedUnassignedStudentIds([]);
                          }}
                          className="mt-6 w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
                        >
                          <span>{currentUser.role === 'docente' ? 'Ver Curso' : 'Administrar Alumnos'}</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              // Detailed Course Student Management View
              (() => {
                const course = courses.find(c => c.id === selectedAdminCourseId);
                if (!course) return null;

                // Students currently in this course
                const assignedStudents = users.filter(u => u.role === 'estudiante' && u.cursoId === selectedAdminCourseId && (
                  courseStudentSearch.trim() === '' ||
                  u.nombreCompleto.toLowerCase().includes(courseStudentSearch.toLowerCase()) ||
                  (u.matricula && u.matricula.toLowerCase().includes(courseStudentSearch.toLowerCase()))
                ));

                if (currentUser.role === 'docente') {
                  const teacherSubjectName = currentUser.especialidad || 'Asignatura General';
                  const realSubject = subjects.find(s => 
                    s.cursoId === selectedAdminCourseId && 
                    isSubjectNameMatch(s.nombre, teacherSubjectName)
                  );
                  
                  const virtualSubject = {
                    id: realSubject ? realSubject.id : `sbj-dynamic-${currentUser.id}-${selectedAdminCourseId}`,
                    nombre: realSubject ? realSubject.nombre : teacherSubjectName,
                    cursoId: selectedAdminCourseId,
                    docenteId: currentUser.id
                  };
                  const displaySubjects = [virtualSubject];

                  // Selected subject ID for the current class view
                  const activeSubjectId = virtualSubject.id;
                  const selectedSubject = virtualSubject;

                  return (
                    <div className="space-y-6 animate-fade-in">
                      {/* Header bar for Docentes */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-950 border border-neutral-800 p-6 rounded-2xl shadow-xl">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => {
                              setSelectedAdminCourseId(null);
                              setSelectedSubjectId('');
                            }}
                            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl border border-neutral-800 transition-colors"
                            title="Volver a la lista de cursos"
                          >
                            <ArrowLeft className="h-4.5 w-4.5" />
                          </button>
                          <div>
                            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">Vista de Curso</span>
                            <h2 className="font-display text-xl font-bold text-neutral-100">Curso: {course.nombre}</h2>
                            <p className="text-xs text-neutral-500 mt-0.5 font-light">
                              Gestione a los estudiantes asignados a este curso.
                            </p>
                          </div>
                        </div>

                        {/* Subject dropdown selector */}
                        {displaySubjects.length > 0 ? (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/80">
                            <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Asignatura a Evaluar:</span>
                            <select
                              value={activeSubjectId}
                              onChange={(e) => {
                                setSelectedSubjectId(e.target.value);
                                setAttendanceRecords({});
                                setAttendanceObs({});
                              }}
                              className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] min-w-[180px]"
                            >
                              {displaySubjects.map(s => (
                                <option key={s.id} value={s.id}>{s.nombre}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="text-xs text-amber-500 bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-900/40">
                            No tienes asignaturas registradas para este curso.
                          </div>
                        )}
                      </div>

                      {/* Course Tabs Navigation */}
                      <div className="flex border-b border-neutral-800 space-x-6 pb-2">
                        <button
                          onClick={() => setDocenteCourseSubTab('alumnos')}
                          className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition-all ${
                            docenteCourseSubTab === 'alumnos' ? 'border-[#D4AF37] text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          Lista de Estudiantes ({assignedStudents.length})
                        </button>
                        <button
                          onClick={() => setDocenteCourseSubTab('asistencia')}
                          className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition-all ${
                            docenteCourseSubTab === 'asistencia' ? 'border-[#D4AF37] text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          Pase de Asistencia
                        </button>
                        <button
                          onClick={() => setDocenteCourseSubTab('calificaciones')}
                          className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition-all ${
                            docenteCourseSubTab === 'calificaciones' ? 'border-[#D4AF37] text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          Registrar Notas (P1-P4)
                        </button>
                      </div>

                      {/* Subtab content */}
                      {docenteCourseSubTab === 'alumnos' && (
                        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
                            <div>
                              <h3 className="text-sm font-display font-bold text-[#D4AF37] uppercase tracking-wider">Estudiantes Inscritos</h3>
                              <p className="text-[11px] text-neutral-500 mt-0.5">Roster de alumnos en {course.nombre}.</p>
                            </div>
                            <div className="relative max-w-xs w-full">
                              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                              <input
                                type="text"
                                placeholder="Buscar estudiante..."
                                value={courseStudentSearch}
                                onChange={(e) => setCourseStudentSearch(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#D4AF37] text-white"
                              />
                            </div>
                          </div>

                          {assignedStudents.length === 0 ? (
                            <div className="text-center py-16 text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-2xl">
                              No se encontraron estudiantes matriculados en este curso.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-neutral-900/60 text-neutral-400 uppercase tracking-wider text-[9px] border-b border-neutral-800">
                                    <th className="p-4 font-bold">Estudiante</th>
                                    <th className="p-4 font-bold">Matrícula</th>
                                    <th className="p-4 font-bold">Correo de Contacto</th>
                                    <th className="p-4 font-bold">Tutor / Apoderado</th>
                                    <th className="p-4 font-bold text-right">Ficha Médica / Conducta</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800">
                                  {assignedStudents.map((stud) => (
                                    <tr key={stud.id} className="hover:bg-neutral-900/30">
                                      <td className="p-4 flex items-center space-x-3">
                                        <img src={stud.fotografia || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"} alt={stud.nombreCompleto} className="w-9 h-9 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                                        <div>
                                          <span className="font-bold text-neutral-200 block">{stud.nombreCompleto}</span>
                                          <span className="text-[10px] text-neutral-500 block">{stud.seccion ? `Sección ${stud.seccion}` : ''} • {stud.sexo}</span>
                                        </div>
                                      </td>
                                      <td className="p-4 font-mono font-medium text-neutral-300">{stud.matricula || 'S/N'}</td>
                                      <td className="p-4 text-neutral-400">{stud.correo}</td>
                                      <td className="p-4 text-neutral-400 font-medium">{stud.tutor || 'No Registrado'}</td>
                                      <td className="p-4 text-right flex items-center justify-end space-x-2">
                                        <button
                                          onClick={() => {
                                            setSelectedDocenteStudentId(stud.id);
                                            // Open observational dialog if existing
                                            const existingGrad = grades.find(g => g.estudianteId === stud.id && g.materiaId === activeSubjectId);
                                            setObservationText(existingGrad?.observaciones || '');
                                            setConductText(existingGrad?.conducta || 'Excelente');
                                            setShowObservationModal(true);
                                          }}
                                          className="text-[10px] bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                                          title="Observación académica de notas"
                                        >
                                          Nota Académica
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSelectedDiscStudent(stud);
                                            setDiscDetail('');
                                            setDiscType('conducta');
                                            setDiscImportance('Regular');
                                            setShowDisciplineModal(true);
                                          }}
                                          className="text-[10px] bg-neutral-900 hover:bg-[#5A2D1A] border border-neutral-800 hover:border-[#D4AF37] text-[#D4AF37] hover:text-white px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm"
                                          title="Registrar observación de conducta o incidencia"
                                        >
                                          Falta / Conducta
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {docenteCourseSubTab === 'asistencia' && (
                        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
                            <div>
                              <h3 className="text-sm font-display font-bold text-[#D4AF37] uppercase tracking-wider">Control Diario de Asistencia</h3>
                              <p className="text-[11px] text-neutral-500 mt-0.5">Complete la asistencia para {selectedSubject?.nombre || 'la materia seleccionada'}.</p>
                            </div>

                            <div className="flex items-center space-x-3">
                              <span className="text-xs text-neutral-400 font-bold">Fecha:</span>
                              <input 
                                type="date"
                                value={attendanceDate}
                                onChange={(e) => setAttendanceDate(e.target.value)}
                                className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                              />
                            </div>
                          </div>

                          {activeSubjectId ? (
                            <div className="space-y-4">
                              <div className="space-y-3.5">
                                {assignedStudents.map((stud) => (
                                  <div key={stud.id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-neutral-900/40 border border-neutral-800/80 p-4 rounded-xl">
                                    <div className="flex items-center space-x-3 min-w-[220px]">
                                      <img src={stud.fotografia} className="w-9 h-9 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                                      <div>
                                        <span className="text-xs font-bold text-neutral-200 block">{stud.nombreCompleto}</span>
                                        <span className="text-[10px] text-neutral-500 font-mono block">{stud.matricula}</span>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      {(['Presente', 'Ausente', 'Excusa', 'Tardanza'] as const).map(state => (
                                        <button
                                          key={state}
                                          type="button"
                                          onClick={() => setAttendanceRecords(prev => ({ ...prev, [stud.id]: state }))}
                                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                            attendanceRecords[stud.id] === state
                                              ? 'bg-[#D4AF37] border-[#D4AF37] text-neutral-950'
                                              : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                                          }`}
                                        >
                                          {state}
                                        </button>
                                      ))}
                                    </div>

                                    <input 
                                      type="text" 
                                      placeholder="Obs. tardanza, excusa médica..."
                                      value={attendanceObs[stud.id] || ''}
                                      onChange={(e) => setAttendanceObs(prev => ({ ...prev, [stud.id]: e.target.value }))}
                                      className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none max-w-xs w-full text-white"
                                    />
                                  </div>
                                ))}
                              </div>

                              <div className="flex justify-end pt-6 border-t border-neutral-800">
                                <button
                                  onClick={handleMarkAttendance}
                                  className="flex items-center space-x-2 bg-[#D4AF37] hover:bg-[#F3D065] text-neutral-950 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl shadow-md"
                                >
                                  <Save className="h-4.5 w-4.5" />
                                  <span>Registrar Pase de Lista</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-12 text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-xl">
                              Debe seleccionar una asignatura para habilitar el pase de lista.
                            </div>
                          )}
                        </div>
                      )}

                      {docenteCourseSubTab === 'calificaciones' && (
                        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
                            <div>
                              <h3 className="text-sm font-display font-bold text-[#D4AF37] uppercase tracking-wider">Libreta de Notas Trimestrales</h3>
                              <p className="text-[11px] text-neutral-500 mt-0.5">Asigne y modifique calificaciones de {selectedSubject?.nombre || 'la materia seleccionada'}.</p>
                            </div>
                          </div>

                          {activeSubjectId ? (
                            <div className="space-y-4">
                              <div className="space-y-4">
                                {assignedStudents.map((stud) => {
                                  const grade = grades.find(g => g.estudianteId === stud.id && g.materiaId === activeSubjectId);
                                  const currentEdit = editingGrades[grade?.id || stud.id] || {};
                                  
                                  return (
                                    <div key={stud.id} className="bg-neutral-900/40 border border-neutral-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                                      <div className="flex items-center space-x-3 min-w-[200px]">
                                        <img src={stud.fotografia} className="w-9 h-9 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                                        <div>
                                          <span className="text-xs font-bold text-neutral-200 block">{stud.nombreCompleto}</span>
                                          <span className="text-[9px] text-neutral-500 font-mono block">{stud.matricula}</span>
                                        </div>
                                      </div>

                                      {/* Inputs of Grades */}
                                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-w-md w-full">
                                        {['p1', 'p2', 'p3', 'p4'].map(p => (
                                          <div key={p}>
                                            <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold block mb-1 text-center">{p}</span>
                                            <input 
                                              type="number"
                                              min="0"
                                              max="100"
                                              value={currentEdit[p as keyof Grade] !== undefined ? currentEdit[p as keyof Grade] : (grade ? grade[p as keyof Grade] : '')}
                                              onChange={(e) => {
                                                setEditingGrades(prev => ({
                                                  ...prev,
                                                  [grade?.id || stud.id]: {
                                                    ...prev[grade?.id || stud.id],
                                                    [p]: Number(e.target.value)
                                                  }
                                                }));
                                              }}
                                              className="w-full text-center bg-neutral-950 border border-neutral-800 rounded-lg py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                                            />
                                          </div>
                                        ))}
                                        <div className="hidden sm:block">
                                          <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold block mb-1 text-center">Prom</span>
                                          <div className="w-full text-center py-1.5 text-xs font-bold text-[#D4AF37]">
                                            {grade ? grade.promedio : '-'}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-neutral-800 pt-3 md:pt-0 shrink-0">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${
                                          grade?.estado === 'Aprobado' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' : 'bg-red-950/40 text-red-400 border border-red-900/50'
                                        }`}>
                                          {grade ? grade.estado : 'Pendiente'}
                                        </span>
                                        <button
                                          onClick={() => handleSaveGrade(grade?.id || '', stud.id, activeSubjectId, selectedSubject?.nombre || '')}
                                          className="bg-[#D4AF37] hover:bg-[#F3D065] text-neutral-950 font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors shadow-xs"
                                        >
                                          Guardar
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-12 text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-xl">
                              Debe seleccionar una asignatura para habilitar el registro de calificaciones.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                // Eligible students to add (not in this course)
                const unassignedStudents = users.filter(u => u.role === 'estudiante' && u.cursoId !== selectedAdminCourseId && (
                  unassignedStudentSearch.trim() === '' ||
                  u.nombreCompleto.toLowerCase().includes(unassignedStudentSearch.toLowerCase()) ||
                  (u.matricula && u.matricula.toLowerCase().includes(unassignedStudentSearch.toLowerCase()))
                ));

                return (
                  <div className="space-y-6">
                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-950 border border-neutral-800 p-6 rounded-2xl">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => setSelectedAdminCourseId(null)}
                          className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl border border-neutral-800 transition-colors"
                        >
                          <ArrowLeft className="h-4.5 w-4.5" />
                        </button>
                        <div>
                          <h2 className="font-display text-xl font-bold text-neutral-100">Curso: {course.nombre}</h2>
                          <p className="text-xs text-neutral-500 mt-0.5 font-light">Asignación y reestructuración manual de alumnos matriculados.</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedUnassignedStudentIds([]);
                          setShowAddStudentsModal(true);
                        }}
                        className="flex items-center space-x-2 bg-[#D4AF37] hover:bg-[#F3D065] text-neutral-950 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md self-start sm:self-center"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Agregar Estudiantes</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* PANEL 1: Estudiantes asignados al curso */}
                      <div className="lg:col-span-12 bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
                          <div>
                            <h3 className="text-sm font-display font-bold text-[#D4AF37] uppercase tracking-wider">Estudiantes Asignados ({assignedStudents.length})</h3>
                            <p className="text-[11px] text-neutral-500 mt-0.5">Lista de alumnos actualmente cursando en esta sección.</p>
                          </div>

                          <div className="relative max-w-xs w-full">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                            <input
                              type="text"
                              placeholder="Buscar por nombre o matrícula..."
                              value={courseStudentSearch}
                              onChange={(e) => setCourseStudentSearch(e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#D4AF37] text-white"
                            />
                          </div>
                        </div>

                        {assignedStudents.length === 0 ? (
                          <div className="text-center py-16 text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-2xl">
                            No se encontraron estudiantes asignados a este curso con los criterios de búsqueda.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-neutral-900/60 text-neutral-400 uppercase tracking-wider text-[9px] border-b border-neutral-800">
                                  <th className="p-4 font-bold">Estudiante</th>
                                  <th className="p-4 font-bold">Matrícula</th>
                                  <th className="p-4 font-bold">Cambiar a otro Curso</th>
                                  <th className="p-4 font-bold text-right">Acciones</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-800">
                                {assignedStudents.map((stud) => (
                                  <tr key={stud.id} className="hover:bg-neutral-900/30">
                                    <td className="p-4 flex items-center space-x-3">
                                      <img src={stud.fotografia || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"} alt={stud.nombreCompleto} className="w-9 h-9 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                                      <div>
                                        <span className="font-bold text-neutral-200 block">{stud.nombreCompleto}</span>
                                        <span className="text-[10px] text-neutral-500 block">{stud.correo}</span>
                                      </div>
                                    </td>
                                    <td className="p-4 font-mono font-medium text-neutral-300">{stud.matricula || 'S/N'}</td>
                                    <td className="p-4">
                                      <select
                                        value={stud.cursoId || ''}
                                        onChange={(e) => handleChangeStudentCourse(stud.id, e.target.value)}
                                        className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none"
                                      >
                                        <option value="">Desasignado</option>
                                        {courses.map(c => (
                                          <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                      <button
                                        onClick={() => handleEditUser(stud)}
                                        className="p-2 hover:bg-neutral-900 rounded-lg text-neutral-400 hover:text-[#D4AF37]"
                                        title="Editar información"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleRemoveStudentFromCourse(stud.id)}
                                        className="p-2 hover:bg-neutral-900 rounded-lg text-neutral-400 hover:text-red-400"
                                        title="Remover de este curso"
                                      >
                                        <Trash className="h-4 w-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Modal: Agregar Estudiantes */}
                    {showAddStudentsModal && (
                      <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="bg-neutral-950 border border-neutral-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                          <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                            <div>
                              <h3 className="font-display font-bold text-lg text-neutral-100">Agregar Estudiantes al Curso</h3>
                              <p className="text-[11px] text-neutral-500 mt-0.5">Seleccione de la lista general de alumnos para incorporarlos a {course.nombre}.</p>
                            </div>
                            <button
                              onClick={() => setShowAddStudentsModal(false)}
                              className="p-2 hover:bg-neutral-900 text-neutral-400 hover:text-white rounded-lg"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>

                          <div className="p-6 border-b border-neutral-800 bg-neutral-900/20">
                            <div className="relative">
                              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                              <input
                                type="text"
                                placeholder="Buscar alumnos elegibles..."
                                value={unassignedStudentSearch}
                                onChange={(e) => setUnassignedStudentSearch(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#D4AF37] text-white"
                              />
                            </div>
                          </div>

                          <div className="p-6 overflow-y-auto space-y-3 flex-1">
                            {unassignedStudents.length === 0 ? (
                              <div className="text-center py-12 text-neutral-500 text-xs">No hay estudiantes elegibles o todos pertenecen a este curso.</div>
                            ) : (
                              unassignedStudents.map((stud) => {
                                const isChecked = selectedUnassignedStudentIds.includes(stud.id);
                                const currentCourse = courses.find(c => c.id === stud.cursoId);
                                return (
                                  <div
                                    key={stud.id}
                                    onClick={() => {
                                      if (isChecked) {
                                        setSelectedUnassignedStudentIds(prev => prev.filter(id => id !== stud.id));
                                      } else {
                                        setSelectedUnassignedStudentIds(prev => [...prev, stud.id]);
                                      }
                                    }}
                                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                                      isChecked 
                                        ? 'bg-[#5A2D1A]/10 border-[#D4AF37] text-neutral-100' 
                                        : 'bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700 text-neutral-300'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                        isChecked ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-neutral-700 bg-neutral-900'
                                      }`}>
                                        {isChecked && <Check className="h-3 w-3 text-neutral-950 font-bold" />}
                                      </div>
                                      <img src={stud.fotografia || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"} className="w-8.5 h-8.5 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                                      <div>
                                        <span className="text-xs font-bold block">{stud.nombreCompleto}</span>
                                        <span className="text-[10px] text-neutral-500 block font-mono">
                                          {stud.matricula || 'S/N'} {currentCourse ? `(Actualmente en ${currentCourse.nombre})` : '(Sin Curso)'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          <div className="p-6 border-t border-neutral-800 flex justify-end space-x-3 bg-neutral-950">
                            <button
                              onClick={() => setShowAddStudentsModal(false)}
                              className="px-5 py-2 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-all"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleAssignStudentsToCourse}
                              disabled={selectedUnassignedStudentIds.length === 0}
                              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#D4AF37] hover:bg-[#F3D065] text-neutral-950 disabled:opacity-50 transition-all flex items-center space-x-1.5"
                            >
                              <Check className="h-4 w-4" />
                              <span>Agregar Seleccionados ({selectedUnassignedStudentIds.length})</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            )}

            {/* General Course Create / Edit Modal */}
            {showCourseModal && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-neutral-950 border border-neutral-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                    <h3 className="font-display font-bold text-base text-neutral-100">{editingCourseId ? 'Editar Curso' : 'Crear Nuevo Curso'}</h3>
                    <button onClick={() => setShowCourseModal(false)} className="p-1 hover:bg-neutral-900 rounded-lg text-neutral-400 hover:text-white"><X className="h-5 w-5" /></button>
                  </div>
                  <form onSubmit={handleSaveCourse} className="p-6 space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1.5">Nombre del Curso</label>
                      <input
                        type="text"
                        required
                        value={courseForm.nombre}
                        onChange={(e) => setCourseForm({ ...courseForm, nombre: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#D4AF37] text-white"
                        placeholder="Ej. 3.º A, 4.º B..."
                      />
                    </div>

                    <div className="flex items-center space-x-3 py-2">
                      <input
                        type="checkbox"
                        id="course_activo"
                        checked={courseForm.activo}
                        onChange={(e) => setCourseForm({ ...courseForm, activo: e.target.checked })}
                        className="h-4 w-4 bg-neutral-900 border-neutral-800 rounded text-[#D4AF37] focus:ring-[#D4AF37]"
                      />
                      <label htmlFor="course_activo" className="text-xs text-neutral-300 select-none cursor-pointer">Habilitar curso en la institución</label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-800 mt-6">
                      <button type="button" onClick={() => setShowCourseModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-all">Cancelar</button>
                      <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D4AF37] hover:bg-[#F3D065] text-neutral-950 transition-all">Guardar Curso</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: configuracion / SystemConfig */}
        {activeTab === 'configuracion' && (
          <div className="space-y-6 animate-fade-in max-w-4xl">
            <div>
              <h2 className="font-display text-xl font-bold">Configuración del Centro Educativo</h2>
              <p className="text-xs text-neutral-500 mt-1 font-light">Modifique el nombre, eslogan, año y contacto escolar del sitio web y del portal sin tocar código.</p>
            </div>

            <form onSubmit={handleSaveConfig} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1.5">Nombre Oficial del Centro</label>
                  <input type="text" required value={configForm.nombreCentro || ''} onChange={(e) => setConfigForm({...configForm, nombreCentro: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1.5">Eslogan Institucional</label>
                  <input type="text" value={configForm.eslogan || ''} onChange={(e) => setConfigForm({...configForm, eslogan: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#D4AF37]" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1.5">Año Escolar Activo</label>
                  <input type="text" value={configForm.anoEscolar || ''} onChange={(e) => setConfigForm({...configForm, anoEscolar: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1.5">Periodo Académico</label>
                  <input type="text" value={configForm.periodoActivo || ''} onChange={(e) => setConfigForm({...configForm, periodoActivo: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1.5">Teléfono Directo</label>
                  <input type="text" value={configForm.telefono || ''} onChange={(e) => setConfigForm({...configForm, telefono: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1.5">Dirección Física</label>
                <input type="text" value={configForm.direccion || ''} onChange={(e) => setConfigForm({...configForm, direccion: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none" />
              </div>

              <div className="flex justify-end pt-6 border-t border-neutral-800">
                <button type="submit" className="flex items-center space-x-2 bg-[#D4AF37] hover:bg-[#F3D065] text-[#3F1D10] font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-md">
                  <Save className="h-4.5 w-4.5" />
                  <span>Guardar Configuración del Sistema</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: auditoria / AuditLog */}
        {activeTab === 'auditoria' && (
          <div className="space-y-6 animate-fade-in max-w-5xl">
            <div>
              <h2 className="font-display text-xl font-bold">Bitácora de Auditoría Escolar</h2>
              <p className="text-xs text-neutral-500 mt-1 font-light">Historial completo y en tiempo real de las acciones operadas en el sistema por alumnos, profesores y administradores.</p>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 overflow-hidden">
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="border-b border-neutral-800/60 pb-3 last:border-b-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-[10px] text-[#D4AF37] font-bold bg-[#D4AF37]/5 px-2 py-0.5 rounded-md border border-[#D4AF37]/10">{log.id}</span>
                        <span className="font-bold text-neutral-200">{log.accion}</span>
                      </div>
                      <p className="text-neutral-400 font-light text-[11px] leading-tight">{log.detalles}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-neutral-500 block">{new Date(log.fecha).toLocaleString()}</span>
                      <span className="text-[10px] text-neutral-500 block font-semibold">Operado por: {log.usuario}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: asistencia / Mark Attendance (Docente) */}
        {activeTab === 'asistencia' && (
          <div className="space-y-6 animate-fade-in max-w-4xl">
            <div>
              <h2 className="font-display text-xl font-bold">Registro de Asistencia Matutina</h2>
              <p className="text-xs text-neutral-500 mt-1 font-light">Seleccione la asignatura y complete el pase de lista diario para los alumnos asignados.</p>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1.5">Asignatura Escolar</label>
                  <select 
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setAttendanceRecords({});
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="">Seleccione asignatura...</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1.5">Fecha del Pase de Lista</label>
                  <input 
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {selectedSubjectId ? (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-800 pb-2">Estudiantes Inscritos en Sección</h3>
                  <div className="space-y-3.5">
                    {(() => {
                      const subject = subjects.find(s => s.id === selectedSubjectId);
                      return users.filter(u => u.role === 'estudiante' && (!subject || u.cursoId === subject.cursoId)).map((stud) => (
                      <div key={stud.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/40 border border-neutral-800/80 p-4 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <img src={stud.fotografia} className="w-9 h-9 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                          <div>
                            <span className="text-xs font-bold text-neutral-200 block">{stud.nombreCompleto}</span>
                            <span className="text-[10px] text-neutral-500 font-mono block">{stud.matricula}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {(['Presente', 'Ausente', 'Excusa', 'Tardanza'] as const).map(state => (
                            <button
                              key={state}
                              type="button"
                              onClick={() => setAttendanceRecords(prev => ({ ...prev, [stud.id]: state }))}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                attendanceRecords[stud.id] === state
                                  ? 'bg-[#D4AF37] border-[#D4AF37] text-neutral-950'
                                  : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                              }`}
                            >
                              {state}
                            </button>
                          ))}
                        </div>

                        <input 
                          type="text" 
                          placeholder="Obs. tardanza, excusa médica..."
                          value={attendanceObs[stud.id] || ''}
                          onChange={(e) => setAttendanceObs(prev => ({ ...prev, [stud.id]: e.target.value }))}
                          className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none max-w-xs w-full text-white"
                        />
                      </div>
                    ))})()}
                  </div>

                  <div className="flex justify-end pt-6 border-t border-neutral-800">
                    <button
                      onClick={handleMarkAttendance}
                      className="flex items-center space-x-2 bg-[#D4AF37] hover:bg-[#F3D065] text-neutral-950 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl shadow-md"
                    >
                      <Save className="h-4.5 w-4.5" />
                      <span>Registrar Pase de Lista</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-xl">Seleccione una asignatura del menú para habilitar la lista de alumnos.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: calificaciones / Grades (Docente) */}
        {activeTab === 'calificaciones' && (
          <div className="space-y-6 animate-fade-in max-w-5xl">
            <div>
              <h2 className="font-display text-xl font-bold">Libreta de Calificaciones (P1 - P4)</h2>
              <p className="text-xs text-neutral-500 mt-1 font-light">Asigne y modifique las notas trimestrales de los estudiantes para su asignatura escolar.</p>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-6">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1.5">Asignatura Impartida</label>
                <select 
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none max-w-md w-full"
                >
                  <option value="">Seleccione asignatura...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              {selectedSubjectId ? (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-800 pb-2">Libreta de Notas</h3>
                  <div className="space-y-4">
                    {(() => {
                      const subject = subjects.find(s => s.id === selectedSubjectId);
                      return users.filter(u => u.role === 'estudiante' && (!subject || u.cursoId === subject.cursoId)).map((stud) => {
                      const grade = grades.find(g => g.estudianteId === stud.id && g.materiaId === selectedSubjectId);
                      const currentEdit = editingGrades[grade?.id || stud.id] || {};
                      
                      return (
                        <div key={stud.id} className="bg-neutral-900/40 border border-neutral-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center space-x-3 min-w-[200px]">
                            <img src={stud.fotografia} className="w-9 h-9 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                            <div>
                              <span className="text-xs font-bold text-neutral-200 block">{stud.nombreCompleto}</span>
                              <span className="text-[9px] text-neutral-500 font-mono block">{stud.matricula}</span>
                            </div>
                          </div>

                          {/* Inputs of Grades */}
                          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-w-md w-full">
                            {['p1', 'p2', 'p3', 'p4'].map(p => (
                              <div key={p}>
                                <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold block mb-1 text-center">{p}</span>
                                <input 
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={currentEdit[p as keyof Grade] !== undefined ? currentEdit[p as keyof Grade] : (grade ? grade[p as keyof Grade] : '')}
                                  onChange={(e) => {
                                    setEditingGrades(prev => ({
                                      ...prev,
                                      [grade?.id || stud.id]: {
                                        ...prev[grade?.id || stud.id],
                                        [p]: Number(e.target.value)
                                      }
                                    }));
                                  }}
                                  className="w-full text-center bg-neutral-950 border border-neutral-800 rounded-lg py-1.5 text-xs text-white focus:outline-none"
                                />
                              </div>
                            ))}
                            <div className="hidden sm:block">
                              <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold block mb-1 text-center">Prom</span>
                              <div className="w-full text-center py-1.5 text-xs font-bold text-[#D4AF37]">
                                {grade ? grade.promedio : '-'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-neutral-800 pt-3 md:pt-0 shrink-0">
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${
                              grade?.estado === 'Aprobado' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' : 'bg-red-950/40 text-red-400 border border-red-900/50'
                            }`}>
                              {grade ? grade.estado : 'Pendiente'}
                            </span>
                            <button
                              onClick={() => handleSaveGrade(grade?.id || '', stud.id, selectedSubjectId, subjects.find(s => s.id === selectedSubjectId)?.nombre || '')}
                              className="bg-[#D4AF37] hover:bg-[#F3D065] text-neutral-950 font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors shadow-xs"
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      );
                    })})()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-xl">Seleccione una asignatura impartida para cargar las notas trimestrales de los alumnos.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: tareas / Assignments (Docente) */}
        {activeTab === 'tareas' && (
          <div className="space-y-6 animate-fade-in max-w-4xl">
            <div>
              <h2 className="font-display text-xl font-bold">Asignación de Tareas y Calificaciones</h2>
              <p className="text-xs text-neutral-500 mt-1 font-light">Publique nuevas directrices de tareas o evalúe los archivos entregados por los alumnos.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Assign Form */}
              <div className="lg:col-span-5 bg-neutral-950 border border-neutral-800 p-6 rounded-2xl space-y-4">
                <h3 className="text-xs uppercase tracking-wider font-bold text-[#D4AF37] border-b border-neutral-800 pb-2">Crear Nueva Tarea</h3>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Título de Tarea</label>
                    <input type="text" required value={taskForm.titulo} onChange={(e) => setTaskForm({...taskForm, titulo: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#D4AF37] text-white" placeholder="Ej. Ecuaciones Lineales" />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Curso Destino</label>
                    <select
                      required
                      value={taskForm.cursoId}
                      onChange={(e) => setTaskForm({...taskForm, cursoId: e.target.value})}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="">Seleccione Curso...</option>
                      {courses.filter(c => c.activo !== false).map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  {currentUser.role === 'docente' ? (
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Asignatura</label>
                      <input
                        type="text"
                        readOnly
                        value={currentUser.especialidad || 'Asignatura General'}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-400 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Asignatura</label>
                      <select required value={taskForm.materiaId} onChange={(e) => setTaskForm({...taskForm, materiaId: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]">
                        <option value="">Seleccione...</option>
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Fecha Límite de Entrega</label>
                    <input type="date" required value={taskForm.fechaEntrega} onChange={(e) => setTaskForm({...taskForm, fechaEntrega: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#D4AF37] text-white" />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Descripción de Criterios</label>
                    <textarea required value={taskForm.descripcion} onChange={(e) => setTaskForm({...taskForm, descripcion: e.target.value})} rows={3} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#D4AF37] text-white resize-none" placeholder="Explicación detallada de la tarea..." />
                  </div>
                  <button type="submit" className="w-full flex items-center justify-center space-x-2 bg-[#D4AF37] hover:bg-[#F3D065] text-neutral-950 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-sm">
                    <Plus className="h-4.5 w-4.5" />
                    <span>Publicar Tarea</span>
                  </button>
                </form>
              </div>

              {/* Submissions view list */}
              <div className="lg:col-span-7 bg-neutral-950 border border-neutral-800 p-6 rounded-2xl space-y-4">
                <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-400 border-b border-neutral-800 pb-2">Entregas Recibidas</h3>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {tasks.filter(t => t.entregas && t.entregas.length > 0).length === 0 ? (
                    <div className="text-center py-12 text-neutral-500 text-xs">Aún no se han registrado entregas de archivos por los estudiantes.</div>
                  ) : (
                    tasks.filter(t => t.entregas && t.entregas.length > 0).map(task => (
                      <div key={task.id} className="space-y-3">
                        <span className="text-[10px] font-bold text-[#D4AF37] block">{task.materiaNombre} — {task.titulo}</span>
                        {task.entregas.map(sub => (
                          <div key={sub.id} className="bg-neutral-900 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-neutral-800">
                            <div>
                              <span className="text-xs font-bold text-neutral-200 block">{sub.estudianteNombre}</span>
                              <span className="text-[10px] text-neutral-400 block font-mono">{sub.archivo} (Fecha: {sub.fechaEntrega})</span>
                            </div>
                            <div className="flex items-center space-x-3 shrink-0">
                              <span className="text-xs text-neutral-400 font-bold">Nota: {sub.calificacion !== undefined ? sub.calificacion : 'S/N'}</span>
                              <button 
                                onClick={() => {
                                  const nota = window.prompt(`Ingrese la calificación para ${sub.estudianteNombre} (0-100):`, '90');
                                  if (nota !== null) {
                                    const comment = window.prompt('Escriba un comentario o retroalimentación:', 'Buen trabajo.');
                                    fetch('/api/tasks/grade-submission', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        teacher: currentUser.nombreCompleto,
                                        taskId: task.id,
                                        submissionId: sub.id,
                                        calificacion: Number(nota),
                                        comentario: comment || ""
                                      })
                                    })
                                      .then(res => res.json())
                                      .then(data => {
                                        if (data.success) {
                                          alert('Nota de tarea guardada correctamente.');
                                          syncData();
                                        }
                                      });
                                  }
                                }}
                                className="bg-[#D4AF37] hover:bg-[#F3D065] text-neutral-950 font-semibold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-md"
                              >
                                Calificar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: estudiante-notas / Student grades book */}
        {activeTab === 'estudiante-notas' && activeStudent && (
          <div className="space-y-6 animate-fade-in max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold">Boletín Oficial de Calificaciones</h2>
                <p className="text-xs text-neutral-500 mt-1 font-light">Detalle de rendimiento de {activeStudent.nombreCompleto} durante el año lectivo {sysConfig?.anoEscolar}.</p>
              </div>
              <button 
                onClick={handleDownloadStudentBoletin}
                className="flex items-center space-x-2 bg-[#D4AF37] hover:bg-[#F3D065] text-neutral-950 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm self-start shrink-0 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <Download className="h-4.5 w-4.5" />
                <span>Descargar Boletín Oficial (PDF)</span>
              </button>
            </div>

            {/* Grades Report Card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-b border-neutral-800 pb-6 text-xs text-neutral-400">
                <div>
                  <span className="block font-bold">Centro de Estudios</span>
                  <span className="text-neutral-100 font-semibold block mt-0.5">{sysConfig?.nombreCentro}</span>
                </div>
                <div>
                  <span className="block font-bold">Estudiante</span>
                  <span className="text-neutral-100 font-semibold block mt-0.5">{activeStudent.nombreCompleto}</span>
                </div>
                <div>
                  <span className="block font-bold">Matrícula</span>
                  <span className="text-neutral-100 font-mono font-semibold block mt-0.5">{activeStudent.matricula}</span>
                </div>
                <div>
                  <span className="block font-bold">Curso y Sección</span>
                  <span className="text-neutral-100 font-semibold block mt-0.5">
                    {courses.find(c => c.id === activeStudent.cursoId)?.nombre || 'Sin Asignar'}
                  </span>
                </div>
              </div>

              {/* Subject scores list */}
              <div className="space-y-4">
                <div className="grid grid-cols-12 text-[10px] uppercase tracking-wider text-neutral-400 font-bold border-b border-neutral-800 pb-2 px-2">
                  <span className="col-span-4">Asignatura</span>
                  <span className="col-span-1 text-center">P1</span>
                  <span className="col-span-1 text-center">P2</span>
                  <span className="col-span-1 text-center">P3</span>
                  <span className="col-span-1 text-center">P4</span>
                  <span className="col-span-2 text-center">Promedio</span>
                  <span className="col-span-2 text-right">Estado</span>
                </div>

                {subjects.filter(s => !activeStudent?.cursoId || s.cursoId === activeStudent.cursoId).map((sub) => {
                  const grd = grades.find(g => 
                    g.estudianteId === activeStudentId && 
                    (g.materiaId === sub.id || isSubjectNameMatch(g.materiaNombre, sub.nombre))
                  ) || {
                    p1: 0, p2: 0, p3: 0, p4: 0, promedio: 0, estado: 'Pendiente'
                  };
                  return (
                    <div key={sub.id} className="grid grid-cols-12 text-xs text-neutral-300 font-medium py-3 border-b border-neutral-900 last:border-b-0 px-2 items-center hover:bg-neutral-900/10">
                      <span className="col-span-4 font-bold text-neutral-100">{sub.nombre}</span>
                      <span className="col-span-1 text-center font-mono">{grd.p1 > 0 ? grd.p1 : '-'}</span>
                      <span className="col-span-1 text-center font-mono">{grd.p2 > 0 ? grd.p2 : '-'}</span>
                      <span className="col-span-1 text-center font-mono">{grd.p3 > 0 ? grd.p3 : '-'}</span>
                      <span className="col-span-1 text-center font-mono">{grd.p4 > 0 ? grd.p4 : '-'}</span>
                      <span className="col-span-2 text-center font-bold font-mono text-[#D4AF37]">{grd.promedio > 0 ? grd.promedio : '-'}</span>
                      <span className="col-span-2 text-right">
                        <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${
                          grd.promedio > 0
                            ? grd.estado === 'Aprobado' ? 'bg-emerald-950/40 text-emerald-400 font-bold' : 'bg-red-950/40 text-red-400 font-bold'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {grd.promedio > 0 ? grd.estado : 'Pendiente'}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: estudiante-tareas / Task board */}
        {activeTab === 'estudiante-tareas' && activeStudent && (
          <div className="space-y-6 animate-fade-in max-w-4xl">
            <div>
              <h2 className="font-display text-xl font-bold">Tareas Asignadas y Entregas</h2>
              <p className="text-xs text-neutral-500 mt-1 font-light">Revise los criterios de evaluación, descargue guías de docentes, y entregue sus archivos para calificar.</p>
            </div>

            <div className="space-y-6">
              {studentTasks.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-xl">No hay tareas pendientes asignadas para su curso.</div>
              ) : (
                studentTasks.map((tsk) => {
                  const submission = tsk.entregas.find(e => e.estudianteId === activeStudentId);
                  return (
                    <div key={tsk.id} className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#D4AF37]/20 transition-all duration-300">
                      <div className="space-y-4 flex-1">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider block">{tsk.materiaNombre}</span>
                          <h3 className="font-display font-bold text-neutral-100 text-base">{tsk.titulo}</h3>
                          <span className="text-[10px] text-neutral-400 font-mono block">Fecha Límite: {tsk.fechaEntrega}</span>
                        </div>
                        <p className="text-xs text-neutral-400 font-light leading-relaxed max-w-xl">{tsk.descripcion}</p>
                        
                        {tsk.archivoAdjunto && (
                          <div className="flex items-center space-x-1.5 text-xs text-[#D4AF37] font-semibold">
                            <Download className="h-4 w-4" />
                            <span className="hover:underline cursor-pointer">Descargar guía adjunta: {tsk.archivoAdjunto}</span>
                          </div>
                        )}
                      </div>

                      {/* Delivery Controls */}
                      <div className="border-t md:border-t-0 border-neutral-800 pt-4 md:pt-0 shrink-0 space-y-3 w-full md:w-auto text-right">
                        {submission ? (
                          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-2 text-left md:text-right">
                            <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">Entrega Registrada</span>
                            <span className="text-xs font-mono font-bold block text-neutral-200">{submission.archivo}</span>
                            <div className="flex items-center md:justify-end gap-2 mt-2">
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                submission.estado === 'Calificado' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
                              }`}>
                                {submission.estado}
                              </span>
                              {submission.calificacion !== undefined && (
                                <span className="text-xs font-bold text-white">Nota: {submission.calificacion}/100</span>
                              )}
                            </div>
                            {submission.comentario && (
                              <p className="text-[10px] text-neutral-500 italic mt-1 font-light">&ldquo;{submission.comentario}&rdquo;</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3 text-left md:text-right">
                            {uploadingTaskId === tsk.id ? (
                              <div className="space-y-2 max-w-xs ml-auto">
                                <label className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold block">Nombre de Archivo a Entregar</label>
                                <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800">
                                  <input 
                                    type="text"
                                    value={uploadedFile}
                                    onChange={(e) => setUploadedFile(e.target.value)}
                                    placeholder="Duarte_Tarea_Mate.pdf"
                                    className="bg-transparent text-xs px-2 focus:outline-none w-full text-white"
                                  />
                                  <button
                                    onClick={() => handleFileUpload(tsk.id)}
                                    className="bg-[#D4AF37] hover:bg-[#F3D065] text-neutral-950 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase"
                                  >
                                    Enviar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setUploadingTaskId(tsk.id)}
                                className="flex items-center space-x-1.5 bg-[#5A2D1A] hover:bg-[#7D4229] text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors shadow-sm ml-auto"
                              >
                                <Upload className="h-4 w-4 text-[#D4AF37]" />
                                <span>Entregar Tarea</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 10: orientacion-ia / Gemini AI Advice */}
        {activeTab === 'orientacion-ia' && activeStudent && (
          <div className="space-y-6 animate-fade-in max-w-3xl">
            <div>
              <h2 className="font-display text-xl font-bold flex items-center space-x-2">
                <Cpu className="h-5 w-5 text-[#D4AF37] animate-pulse" />
                <span>Asistente de Orientación Académica IA</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-1 font-light">Interactúe de manera segura con Gemini para recibir análisis personalizados de rendimiento y recomendaciones de mejora psicopedagógica.</p>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] block">Asistencia y Calificaciones Integradas</span>
                <p className="text-xs text-neutral-400 font-light leading-relaxed">
                  El sistema alimentará de forma segura el modelo de Inteligencia Artificial con sus notas de los periodos activos y su promedio general para entregar una guía académica precisa.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block">¿Qué desea consultar al Orientador?</label>
                  <div className="flex bg-neutral-900 border border-neutral-800 rounded-2xl p-1.5 focus-within:border-[#D4AF37] transition-all">
                    <input 
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ej. ¿Cómo puedo mejorar mis notas en matemáticas o qué Club escolar recomiendas según mi promedio?"
                      className="bg-transparent text-xs px-4 focus:outline-none w-full text-white"
                    />
                    <button
                      onClick={handleAskAI}
                      disabled={aiLoading}
                      className="bg-[#D4AF37] hover:bg-[#F3D065] disabled:bg-neutral-800 text-neutral-950 font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md shrink-0 flex items-center space-x-1.5"
                    >
                      {aiLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#5A2D1A] border-t-transparent" />
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Consultar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* AI advice response screen */}
                {aiResponse && (
                  <div className="bg-neutral-900 border border-neutral-800/80 p-6 rounded-2xl animate-fade-in text-xs leading-relaxed space-y-3 font-light text-neutral-300">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block">Consejo del Orientador Virtual</span>
                    <div className="whitespace-pre-line prose prose-invert max-w-none text-[11px] prose-p:leading-relaxed">
                      {aiResponse}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: contenido / Web Content CMS */}
        {activeTab === 'contenido' && (
          <div className="space-y-6 animate-fade-in max-w-6xl pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-white flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-[#D4AF37]" />
                  <span>Consola de Gestión de Contenidos Web (CMS)</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-1 font-light">Actualice diapositivas, textos institucionales, actividades, órganos de co-gestión y preguntas frecuentes del Liceo.</p>
              </div>
              
              {webContent && (
                <button
                  onClick={() => handleSaveWebContent(webContent)}
                  className="bg-[#D4AF37] hover:bg-[#F3D065] text-neutral-950 font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-md transition-all flex items-center space-x-2 shrink-0 self-start sm:self-center"
                >
                  <Save className="h-4.5 w-4.5" />
                  <span>Publicar Cambios en Vivo</span>
                </button>
              )}
            </div>

            {webLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-neutral-950 rounded-3xl border border-neutral-800 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D4AF37] border-t-transparent" />
                <p className="text-xs text-neutral-400 font-light">Cargando base de datos del portal informativo...</p>
              </div>
            ) : !webContent ? (
              <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-2xl text-center text-xs text-red-400">
                Fallo al inicializar el almacenamiento del portal. Reintente sincronizar.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* CMS sub-tabs selector */}
                <div className="lg:col-span-3 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 p-1 bg-neutral-950 border border-neutral-800 rounded-2xl scrollbar-none shrink-0">
                  {[
                    { id: 'hero', label: 'Diapositivas de Portada' },
                    { id: 'about', label: 'Sobre Nosotros' },
                    { id: 'studentLife', label: 'Vida Estudiantil' },
                    { id: 'governance', label: 'Órganos Co-Gestión' },
                    { id: 'admissions', label: 'Admisión e FAQs' },
                    { id: 'attachments', label: 'Descargas y PDF' }
                  ].map((subTab) => (
                    <button
                      key={subTab.id}
                      onClick={() => setWebSubTab(subTab.id as any)}
                      className={`text-left px-4 py-3 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all ${
                        webSubTab === subTab.id
                          ? 'bg-[#5A2D1A] text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                      }`}
                    >
                      {subTab.label}
                    </button>
                  ))}
                </div>

                {/* CMS Edit Workspace */}
                <div className="lg:col-span-9 bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-8">
                  
                  {/* SUB-TAB: Hero Carrusel */}
                  {webSubTab === 'hero' && (
                    <div className="space-y-6">
                      <div className="border-b border-neutral-800 pb-4">
                        <h3 className="text-sm font-display font-bold text-[#D4AF37]">Carrusel Hero - Diapositivas de Portada</h3>
                        <p className="text-[11px] text-neutral-500 font-light mt-0.5">Modifique o agregue las diapositivas del carrusel interactivo que ven los usuarios al ingresar a la web.</p>
                      </div>

                      <div className="space-y-6">
                        {webContent.hero?.slides?.map((slide: any, idx: number) => (
                          <div key={slide.id || idx} className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl relative space-y-4">
                            <div className="flex justify-between items-center border-b border-neutral-800/60 pb-2 mb-2">
                              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Diapositiva #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = { ...webContent };
                                  updated.hero.slides = updated.hero.slides.filter((_: any, i: number) => i !== idx);
                                  setWebContent(updated);
                                }}
                                className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase flex items-center space-x-1"
                              >
                                <Trash className="h-3.5 w-3.5" />
                                <span>Eliminar</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Título de Diapositiva</label>
                                <input
                                  type="text"
                                  value={slide.title || ''}
                                  onChange={(e) => {
                                    const updated = { ...webContent };
                                    updated.hero.slides[idx].title = e.target.value;
                                    setWebContent(updated);
                                  }}
                                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#D4AF37] text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Subtítulo / Mensaje Corto</label>
                                <input
                                  type="text"
                                  value={slide.subtitle || ''}
                                  onChange={(e) => {
                                    const updated = { ...webContent };
                                    updated.hero.slides[idx].subtitle = e.target.value;
                                    setWebContent(updated);
                                  }}
                                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#D4AF37] text-white"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Dirección de Imagen de Fondo (URL)</label>
                              <div className="flex gap-3">
                                <input
                                  type="url"
                                  value={slide.image || ''}
                                  onChange={(e) => {
                                    const updated = { ...webContent };
                                    updated.hero.slides[idx].image = e.target.value;
                                    setWebContent(updated);
                                  }}
                                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#D4AF37] text-white font-mono"
                                />
                                <img src={slide.image} className="w-10 h-8 rounded-lg object-cover bg-neutral-800" referrerPolicy="no-referrer" onError={(e) => { (e.target as any).src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=100&auto=format&fit=crop&q=80" }} />
                              </div>
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...webContent };
                            if (!updated.hero) updated.hero = { slides: [] };
                            if (!updated.hero.slides) updated.hero.slides = [];
                            updated.hero.slides.push({
                              id: "slide-" + Date.now(),
                              title: "Educación de Alta Gama",
                              subtitle: "Forjando el carácter de ciudadanos globales y patriotas dominicanos.",
                              image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&auto=format&fit=crop&q=80"
                            });
                            setWebContent(updated);
                          }}
                          className="w-full py-4 rounded-2xl border-2 border-dashed border-neutral-800 hover:border-[#D4AF37] text-neutral-500 hover:text-white text-xs font-bold uppercase transition-all flex items-center justify-center space-x-2"
                        >
                          <Plus className="h-4 w-4 text-[#D4AF37]" />
                          <span>Agregar Nueva Diapositiva</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: About Us */}
                  {webSubTab === 'about' && (
                    <div className="space-y-6">
                      <div className="border-b border-neutral-800 pb-4">
                        <h3 className="text-sm font-display font-bold text-[#D4AF37]">Sobre Nosotros - Identidad Institucional</h3>
                        <p className="text-[11px] text-neutral-500 font-light mt-0.5">Modifique la información base del liceo: visión, misión, historia y el mensaje oficial de la Dirección.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Título de la Sección</label>
                          <input
                            type="text"
                            value={webContent.about?.title || ''}
                            onChange={(e) => {
                              const updated = { ...webContent };
                              updated.about.title = e.target.value;
                              setWebContent(updated);
                            }}
                            className="w-full bg-neutral-905 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#D4AF37] text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Subtítulo Académico</label>
                          <input
                            type="text"
                            value={webContent.about?.subtitle || ''}
                            onChange={(e) => {
                              const updated = { ...webContent };
                              updated.about.subtitle = e.target.value;
                              setWebContent(updated);
                            }}
                            className="w-full bg-neutral-905 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#D4AF37] text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">¿Quiénes Somos? (Resumen Ejecutivo)</label>
                        <textarea
                          rows={4}
                          value={webContent.about?.whoWeAre || ''}
                          onChange={(e) => {
                            const updated = { ...webContent };
                            updated.about.whoWeAre = e.target.value;
                            setWebContent(updated);
                          }}
                          className="w-full bg-neutral-905 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#D4AF37] text-white font-light resize-none leading-relaxed"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Nuestra Misión</label>
                          <textarea
                            rows={3}
                            value={webContent.about?.mission || ''}
                            onChange={(e) => {
                              const updated = { ...webContent };
                              updated.about.mission = e.target.value;
                              setWebContent(updated);
                            }}
                            className="w-full bg-neutral-905 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white resize-none font-light leading-relaxed"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Nuestra Visión</label>
                          <textarea
                            rows={3}
                            value={webContent.about?.vision || ''}
                            onChange={(e) => {
                              const updated = { ...webContent };
                              updated.about.vision = e.target.value;
                              setWebContent(updated);
                            }}
                            className="w-full bg-neutral-905 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white resize-none font-light leading-relaxed"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Nuestra Filosofía y Valores</label>
                          <textarea
                            rows={3}
                            value={webContent.about?.philosophy || ''}
                            onChange={(e) => {
                              const updated = { ...webContent };
                              updated.about.philosophy = e.target.value;
                              setWebContent(updated);
                            }}
                            className="w-full bg-neutral-905 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white resize-none font-light leading-relaxed"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Historia del Liceo</label>
                          <textarea
                            rows={3}
                            value={webContent.about?.history || ''}
                            onChange={(e) => {
                              const updated = { ...webContent };
                              updated.about.history = e.target.value;
                              setWebContent(updated);
                            }}
                            className="w-full bg-neutral-905 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white resize-none font-light leading-relaxed"
                          />
                        </div>
                      </div>

                      <div className="bg-neutral-900/30 p-5 rounded-2xl border border-neutral-800/80 space-y-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block mb-2 border-b border-neutral-800/50 pb-1.5">Mensaje de la Dirección</span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Nombre del Director(a)</label>
                            <input
                              type="text"
                              value={webContent.about?.directorName || ''}
                              onChange={(e) => {
                                const updated = { ...webContent };
                                updated.about.directorName = e.target.value;
                                setWebContent(updated);
                              }}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Rol / Cargo Oficial</label>
                            <input
                              type="text"
                              value={webContent.about?.directorRole || ''}
                              onChange={(e) => {
                                const updated = { ...webContent };
                                updated.about.directorRole = e.target.value;
                                setWebContent(updated);
                              }}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Fotografía (URL)</label>
                            <input
                              type="url"
                              value={webContent.about?.directorPhoto || ''}
                              onChange={(e) => {
                                const updated = { ...webContent };
                                updated.about.directorPhoto = e.target.value;
                                setWebContent(updated);
                              }}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white font-mono text-[10px]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Carta Mensaje de Bienvenida</label>
                          <textarea
                            rows={4}
                            value={webContent.about?.directorMessage || ''}
                            onChange={(e) => {
                              const updated = { ...webContent };
                              updated.about.directorMessage = e.target.value;
                              setWebContent(updated);
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white resize-none font-light leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: Student Life */}
                  {webSubTab === 'studentLife' && (
                    <div className="space-y-6">
                      <div className="border-b border-neutral-800 pb-4">
                        <h3 className="text-sm font-display font-bold text-[#D4AF37]">Vida Estudiantil - Actividades y Civismo</h3>
                        <p className="text-[11px] text-neutral-500 font-light mt-0.5">Gestione el encabezado de actividades, los bloques patrióticos, próximos eventos cívicos y la lista de clubes escolares.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Título de Vida Estudiantil</label>
                          <input
                            type="text"
                            value={webContent.studentLife?.title || ''}
                            onChange={(e) => {
                              const updated = { ...webContent };
                              updated.studentLife.title = e.target.value;
                              setWebContent(updated);
                            }}
                            className="w-full bg-neutral-905 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Subtítulo Sección</label>
                          <input
                            type="text"
                            value={webContent.studentLife?.subtitle || ''}
                            onChange={(e) => {
                              const updated = { ...webContent };
                              updated.studentLife.subtitle = e.target.value;
                              setWebContent(updated);
                            }}
                            className="w-full bg-neutral-905 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none text-white"
                          />
                        </div>
                      </div>

                      <div className="bg-neutral-900/30 p-5 rounded-2xl border border-neutral-800/80 space-y-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block border-b border-neutral-800/50 pb-1.5">Bloque Cívico / Conmemorativo</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Título Cívico</label>
                            <input
                              type="text"
                              value={webContent.studentLife?.patrioticTitle || ''}
                              onChange={(e) => {
                                const updated = { ...webContent };
                                updated.studentLife.patrioticTitle = e.target.value;
                                setWebContent(updated);
                              }}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Próxima Convocatoria (Fecha y Hora)</label>
                            <input
                              type="text"
                              value={webContent.studentLife?.nextEventDate || ''}
                              onChange={(e) => {
                                const updated = { ...webContent };
                                updated.studentLife.nextEventDate = e.target.value;
                                setWebContent(updated);
                              }}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Descripción del Compromiso Cívico</label>
                            <textarea
                              rows={3}
                              value={webContent.studentLife?.patrioticDesc || ''}
                              onChange={(e) => {
                                const updated = { ...webContent };
                                updated.studentLife.patrioticDesc = e.target.value;
                                setWebContent(updated);
                              }}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white resize-none font-light leading-relaxed"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Nombre del Próximo Acto Académico</label>
                            <input
                              type="text"
                              value={webContent.studentLife?.nextEventTitle || ''}
                              onChange={(e) => {
                                const updated = { ...webContent };
                                updated.studentLife.nextEventTitle = e.target.value;
                                setWebContent(updated);
                              }}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Student Activities lists */}
                      <div className="space-y-4">
                        <span className="text-xs uppercase tracking-wider font-bold text-[#D4AF37] block">Clubes y Talleres Co-Curriculares</span>
                        
                        <div className="space-y-4">
                          {webContent.studentLife?.activities?.map((act: any, idx: number) => (
                            <div key={act.id || idx} className="bg-neutral-900/40 border border-neutral-800 p-4 rounded-xl space-y-3">
                              <div className="flex justify-between items-center border-b border-neutral-800/50 pb-2">
                                <span className="text-[10px] font-bold text-neutral-300">Club / Taller #{idx + 1} ({act.category})</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = { ...webContent };
                                    updated.studentLife.activities = updated.studentLife.activities.filter((_: any, i: number) => i !== idx);
                                    setWebContent(updated);
                                  }}
                                  className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase flex items-center space-x-1"
                                >
                                  <Trash className="h-3.5 w-3.5" />
                                  <span>Eliminar</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Nombre del Club</label>
                                  <input
                                    type="text"
                                    value={act.title || ''}
                                    onChange={(e) => {
                                      const updated = { ...webContent };
                                      updated.studentLife.activities[idx].title = e.target.value;
                                      setWebContent(updated);
                                    }}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Categoría</label>
                                  <input
                                    type="text"
                                    value={act.category || ''}
                                    onChange={(e) => {
                                      const updated = { ...webContent };
                                      updated.studentLife.activities[idx].category = e.target.value;
                                      setWebContent(updated);
                                    }}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Fotografía (URL)</label>
                                  <input
                                    type="url"
                                    value={act.image || ''}
                                    onChange={(e) => {
                                      const updated = { ...webContent };
                                      updated.studentLife.activities[idx].image = e.target.value;
                                      setWebContent(updated);
                                    }}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white font-mono text-[10px]"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Criterios y Descripción de Objetivos</label>
                                <textarea
                                  rows={2}
                                  value={act.description || ''}
                                  onChange={(e) => {
                                    const updated = { ...webContent };
                                    updated.studentLife.activities[idx].description = e.target.value;
                                    setWebContent(updated);
                                  }}
                                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white font-light resize-none leading-relaxed"
                                />
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...webContent };
                              if (!updated.studentLife) updated.studentLife = { activities: [] };
                              if (!updated.studentLife.activities) updated.studentLife.activities = [];
                              updated.studentLife.activities.push({
                                id: "act-" + Date.now(),
                                title: "Club de Robótica y Programación",
                                description: "Diseño de prototipos mecánicos, programación de microcontroladores y lógica algorítmica aplicada.",
                                image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80",
                                category: "STEAM"
                              });
                              setWebContent(updated);
                            }}
                            className="w-full py-3.5 rounded-xl border border-dashed border-neutral-800 hover:border-[#D4AF37] text-neutral-500 hover:text-white text-xs font-bold uppercase transition-all flex items-center justify-center space-x-2"
                          >
                            <Plus className="h-4 w-4 text-[#D4AF37]" />
                            <span>Agregar Nuevo Club / Taller</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: Governance */}
                  {webSubTab === 'governance' && (
                    <div className="space-y-6">
                      <div className="border-b border-neutral-800 pb-4">
                        <h3 className="text-sm font-display font-bold text-[#D4AF37]">Órganos de Co-Gestión y Representación</h3>
                        <p className="text-[11px] text-neutral-500 font-light mt-0.5">Gestione los comités que rigen la democracia participativa escolar (Consejo Estudiantil, APMAE, Gobierno Escolar).</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Título de la Sección</label>
                          <input
                            type="text"
                            value={webContent.governance?.title || ''}
                            onChange={(e) => {
                              const updated = { ...webContent };
                              updated.governance.title = e.target.value;
                              setWebContent(updated);
                            }}
                            className="w-full bg-neutral-905 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Subtítulo Descriptivo</label>
                          <input
                            type="text"
                            value={webContent.governance?.subtitle || ''}
                            onChange={(e) => {
                              const updated = { ...webContent };
                              updated.governance.subtitle = e.target.value;
                              setWebContent(updated);
                            }}
                            className="w-full bg-neutral-905 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        {webContent.governance?.organs?.map((org: any, idx: number) => (
                          <div key={org.id || idx} className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl space-y-4">
                            <div className="flex justify-between items-center border-b border-neutral-800/60 pb-2 mb-2">
                              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Órgano #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = { ...webContent };
                                  updated.governance.organs = updated.governance.organs.filter((_: any, i: number) => i !== idx);
                                  setWebContent(updated);
                                }}
                                className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase flex items-center space-x-1"
                              >
                                <Trash className="h-3.5 w-3.5" />
                                <span>Eliminar Órgano</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Nombre del Órgano</label>
                                <input
                                  type="text"
                                  value={org.title || ''}
                                  onChange={(e) => {
                                    const updated = { ...webContent };
                                    updated.governance.organs[idx].title = e.target.value;
                                    setWebContent(updated);
                                  }}
                                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Composición / Integrantes Directivos</label>
                                <input
                                  type="text"
                                  value={org.integrantes || ''}
                                  onChange={(e) => {
                                    const updated = { ...webContent };
                                    updated.governance.organs[idx].integrantes = e.target.value;
                                    setWebContent(updated);
                                  }}
                                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Misión y Objetivos Principales</label>
                              <textarea
                                rows={2}
                                value={org.desc || ''}
                                onChange={(e) => {
                                  const updated = { ...webContent };
                                  updated.governance.organs[idx].desc = e.target.value;
                                  setWebContent(updated);
                                }}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white resize-none font-light leading-relaxed"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Funciones Claves (Una por línea)</label>
                              <textarea
                                rows={3}
                                value={org.funcs?.join('\n') || ''}
                                onChange={(e) => {
                                  const updated = { ...webContent };
                                  updated.governance.organs[idx].funcs = e.target.value.split('\n');
                                  setWebContent(updated);
                                }}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white font-mono leading-relaxed resize-none"
                                placeholder="Coloque cada función en una línea nueva..."
                              />
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...webContent };
                            if (!updated.governance) updated.governance = { organs: [] };
                            if (!updated.governance.organs) updated.governance.organs = [];
                            updated.governance.organs.push({
                              id: "org-" + Date.now(),
                              title: "Nuevo Órgano de Gestión",
                              desc: "Descripción de la competencia de esta comisión participativa escolar.",
                              funcs: ["Función principal del órgano.", "Segunda competencia asignada."],
                              integrantes: "Coordinador: Por asignar; Secretario: Por asignar."
                            });
                            setWebContent(updated);
                          }}
                          className="w-full py-3.5 rounded-xl border border-dashed border-neutral-800 hover:border-[#D4AF37] text-neutral-500 hover:text-white text-xs font-bold uppercase transition-all flex items-center justify-center space-x-2"
                        >
                          <Plus className="h-4 w-4 text-[#D4AF37]" />
                          <span>Agregar Órgano de Representación</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: Admissions & FAQs */}
                  {webSubTab === 'admissions' && (
                    <div className="space-y-6">
                      <div className="border-b border-neutral-800 pb-4">
                        <h3 className="text-sm font-display font-bold text-[#D4AF37]">Proceso de Admisiones y Respuestas a Preguntas Frecuentes</h3>
                        <p className="text-[11px] text-neutral-500 font-light mt-0.5">Defina requisitos obligatorios y edite el glosario de preguntas frecuentes de familias interesadas en inscribir alumnos.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Título de Sección Admisiones</label>
                          <input
                            type="text"
                            value={webContent.admissions?.title || ''}
                            onChange={(e) => {
                              const updated = { ...webContent };
                              updated.admissions.title = e.target.value;
                              setWebContent(updated);
                            }}
                            className="w-full bg-neutral-905 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Subtítulo Admisiones</label>
                          <input
                            type="text"
                            value={webContent.admissions?.subtitle || ''}
                            onChange={(e) => {
                              const updated = { ...webContent };
                              updated.admissions.subtitle = e.target.value;
                              setWebContent(updated);
                            }}
                            className="w-full bg-neutral-905 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Requisitos de Inscripción Obligatorios (Uno por línea)</label>
                        <textarea
                          rows={6}
                          value={webContent.admissions?.requirements?.join('\n') || ''}
                          onChange={(e) => {
                            const updated = { ...webContent };
                            updated.admissions.requirements = e.target.value.split('\n');
                            setWebContent(updated);
                          }}
                          className="w-full bg-neutral-905 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#D4AF37] text-white font-mono leading-relaxed resize-none"
                          placeholder="Coloque un requisito en cada línea..."
                        />
                      </div>

                      {/* FAQs manager */}
                      <div className="space-y-4">
                        <span className="text-xs uppercase tracking-wider font-bold text-[#D4AF37] block border-b border-neutral-850 pb-2">Preguntas Frecuentes (FAQ)</span>
                        
                        <div className="space-y-4">
                          {webContent.admissions?.faqs?.map((faq: any, idx: number) => (
                            <div key={idx} className="bg-neutral-900/40 border border-neutral-800 p-4 rounded-xl space-y-3">
                              <div className="flex justify-between items-center border-b border-neutral-800/50 pb-1.5">
                                <span className="text-[10px] font-bold text-neutral-300">Pregunta #{idx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = { ...webContent };
                                    updated.admissions.faqs = updated.admissions.faqs.filter((_: any, i: number) => i !== idx);
                                    setWebContent(updated);
                                  }}
                                  className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase flex items-center space-x-1"
                                >
                                  <Trash className="h-3.5 w-3.5" />
                                  <span>Eliminar</span>
                                </button>
                              </div>

                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Pregunta Formulada</label>
                                <input
                                  type="text"
                                  value={faq.q || ''}
                                  onChange={(e) => {
                                    const updated = { ...webContent };
                                    updated.admissions.faqs[idx].q = e.target.value;
                                    setWebContent(updated);
                                  }}
                                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                                />
                              </div>

                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Respuesta Oficial de Admisiones</label>
                                <textarea
                                  rows={2}
                                  value={faq.a || ''}
                                  onChange={(e) => {
                                    const updated = { ...webContent };
                                    updated.admissions.faqs[idx].a = e.target.value;
                                    setWebContent(updated);
                                  }}
                                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white font-light resize-none leading-relaxed"
                                />
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...webContent };
                              if (!updated.admissions) updated.admissions = { faqs: [] };
                              if (!updated.admissions.faqs) updated.admissions.faqs = [];
                              updated.admissions.faqs.push({
                                q: "¿Cuál es el horario de clases de la institución?",
                                a: "Las clases presenciales inician solemnemente a las 07:30 AM y culminan a las 02:30 PM de lunes a viernes."
                              });
                              setWebContent(updated);
                            }}
                            className="w-full py-3.5 rounded-xl border border-dashed border-neutral-800 hover:border-[#D4AF37] text-neutral-500 hover:text-white text-xs font-bold uppercase transition-all flex items-center justify-center space-x-2"
                          >
                            <Plus className="h-4 w-4 text-[#D4AF37]" />
                            <span>Agregar Nueva Pregunta / Respuesta</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: Attachments / PDFs */}
                  {webSubTab === 'attachments' && (
                    <div className="space-y-6">
                      <div className="border-b border-neutral-800 pb-4">
                        <h3 className="text-sm font-display font-bold text-[#D4AF37]">Documentos de Descarga y Reglamentos PDF</h3>
                        <p className="text-[11px] text-neutral-500 font-light mt-0.5">Adjunte archivos institucionales esenciales (Brochure, Calendario, Código de Ética) que las familias podrán descargar.</p>
                      </div>

                      <div className="space-y-4">
                        {webContent.attachments?.map((att: any, idx: number) => (
                          <div key={att.id || idx} className="bg-neutral-900/40 border border-neutral-800 p-4 rounded-xl space-y-3">
                            <div className="flex justify-between items-center border-b border-neutral-800/50 pb-1.5">
                              <span className="text-[10px] font-bold text-neutral-300">Documento Adjunto #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = { ...webContent };
                                  updated.attachments = updated.attachments.filter((_: any, i: number) => i !== idx);
                                  setWebContent(updated);
                                }}
                                className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase flex items-center space-x-1"
                              >
                                <Trash className="h-3.5 w-3.5" />
                                <span>Eliminar</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Título del Documento</label>
                                <input
                                  type="text"
                                  value={att.title || ''}
                                  onChange={(e) => {
                                    const updated = { ...webContent };
                                    updated.attachments[idx].title = e.target.value;
                                    setWebContent(updated);
                                  }}
                                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Tipo de Archivo</label>
                                <input
                                  type="text"
                                  value={att.type || ''}
                                  onChange={(e) => {
                                    const updated = { ...webContent };
                                    updated.attachments[idx].type = e.target.value;
                                    setWebContent(updated);
                                  }}
                                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1 font-mono">Fecha de Publicación</label>
                                <input
                                  type="date"
                                  value={att.date || ''}
                                  onChange={(e) => {
                                    const updated = { ...webContent };
                                    updated.attachments[idx].date = e.target.value;
                                    setWebContent(updated);
                                  }}
                                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white text-[11px]"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Dirección de descarga de Archivo o PDF (URL)</label>
                              <input
                                type="url"
                                value={att.url || ''}
                                onChange={(e) => {
                                  const updated = { ...webContent };
                                  updated.attachments[idx].url = e.target.value;
                                  setWebContent(updated);
                                }}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white font-mono text-[10px]"
                              />
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...webContent };
                            if (!updated.attachments) updated.attachments = [];
                            updated.attachments.push({
                              id: "att-" + Date.now(),
                              title: "Reglamento de Convivencia Escolar",
                              url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                              date: new Date().toISOString().split('T')[0],
                              type: "Reglamento"
                            });
                            setWebContent(updated);
                          }}
                          className="w-full py-3.5 rounded-xl border border-dashed border-neutral-800 hover:border-[#D4AF37] text-neutral-500 hover:text-white text-xs font-bold uppercase transition-all flex items-center justify-center space-x-2"
                        >
                          <Plus className="h-4 w-4 text-[#D4AF37]" />
                          <span>Agregar Nuevo Archivo PDF / Enlace</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Publicar bar at bottom */}
                  <div className="flex justify-end pt-6 border-t border-neutral-800">
                    <button
                      onClick={() => handleSaveWebContent(webContent)}
                      className="bg-[#D4AF37] hover:bg-[#F3D065] text-neutral-950 font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-xl shadow-md transition-all flex items-center space-x-2"
                    >
                      <Save className="h-4.5 w-4.5" />
                      <span>Guardar y Publicar {
                        webSubTab === 'hero' ? 'Diapositivas' :
                        webSubTab === 'about' ? 'Sobre Nosotros' :
                        webSubTab === 'studentLife' ? 'Vida Estudiantil' :
                        webSubTab === 'governance' ? 'Órganos Directivos' :
                        webSubTab === 'admissions' ? 'Admisiones' : 'Descargables'
                      }</span>
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 12: asistencia-reportes / Attendance Reports */}
        {activeTab === 'asistencia-reportes' && (
          <AttendanceReportView
            currentUser={currentUser}
            users={users}
            courses={courses}
            subjects={subjects}
            attendance={attendance}
            syncData={syncData}
            showNotification={showNotification}
          />
        )}

        {/* TAB 13: boletines-reportes / Report Cards (Boletines de Nota) */}
        {activeTab === 'boletines-reportes' && (
          <ReportCardView
            currentUser={currentUser}
            users={users}
            courses={courses}
            subjects={subjects}
            grades={grades}
            syncData={syncData}
            showNotification={showNotification}
            sysConfig={sysConfig || undefined}
          />
        )}

        {/* TAB 14: merito-estudiantil / Meritorious Student View */}
        {activeTab === 'merito-estudiantil' && (
          <StudentMeritView
            currentUser={currentUser}
            users={users}
            courses={courses}
            grades={grades}
            subjects={subjects}
            syncData={syncData}
            showNotification={showNotification}
          />
        )}

        {/* TAB 15: observaciones / Discipline & Conduct View */}
        {activeTab === 'observaciones' && (
          <DisciplineReportView
            currentUser={currentUser}
            users={users}
            courses={courses}
            observations={observations}
            citations={citations}
            syncData={syncData}
            showNotification={showNotification}
          />
        )}

      </main>

      {/* CUSTOM CONFIRM & PROMPT DIALOG MODAL */}
      {customModal.isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-fade-in">
            <div className="space-y-2">
              <h3 className="font-display text-base font-bold text-[#D4AF37] tracking-wider uppercase border-b border-neutral-900 pb-2">
                {customModal.title}
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed font-light">
                {customModal.message}
              </p>
            </div>

            {customModal.type === 'prompt' && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customModal.inputValue || ''}
                  onChange={(e) => setCustomModal({ ...customModal, inputValue: e.target.value })}
                  placeholder={customModal.placeholder || 'Escriba aquí...'}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#D4AF37] text-white font-light"
                  autoFocus
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setCustomModal({ ...customModal, isOpen: false })}
                className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => customModal.onConfirm(customModal.inputValue)}
                className="bg-[#D4AF37] hover:bg-[#F3D065] text-neutral-950 font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Observación de Conducta y Disciplina (Maestro) */}
      {showDisciplineModal && selectedDiscStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl animate-fade-in text-left">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider block">Registrar Incidencia / Conducta</span>
                <h3 className="font-display text-lg font-bold text-neutral-100 font-black">Nueva Observación</h3>
              </div>
              <button 
                onClick={() => setShowDisciplineModal(false)}
                className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Estudiante Info Card */}
              <div className="bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/60 flex items-center space-x-3">
                <img 
                  src={selectedDiscStudent.fotografia || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"} 
                  alt={selectedDiscStudent.nombreCompleto} 
                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-neutral-850"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <span className="font-bold text-xs text-neutral-100 block">{selectedDiscStudent.nombreCompleto}</span>
                  <span className="text-[10px] text-neutral-400 block">Matrícula: {selectedDiscStudent.matricula || 'S/N'} • Sección {selectedDiscStudent.seccion || 'A'}</span>
                </div>
              </div>

              {/* Tipo de Observación */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Tipo de Reporte</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'conducta', label: 'Conducta' },
                    { id: 'excusa', label: 'Excusa/Licencia' },
                    { id: 'rendimiento', label: 'Rendimiento' },
                    { id: 'otra', label: 'Otra' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDiscType(t.id)}
                      className={`py-2 px-1 text-center rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                        discType === t.id 
                          ? 'bg-[#5A2D1A] text-white border-[#D4AF37]' 
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nivel de Importancia / Severidad */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Gravedad de la Incidencia</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Regular', label: 'Regular' },
                    { id: 'Importante', label: 'Importante' },
                    { id: 'Muy importante', label: 'Muy importante' }
                  ].map((imp) => {
                    const isSelected = discImportance === imp.id;
                    return (
                      <button
                        key={imp.id}
                        type="button"
                        onClick={() => setDiscImportance(imp.id as any)}
                        className={`py-2 px-1 text-center rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          isSelected 
                            ? imp.id === 'Regular'
                              ? 'bg-emerald-900/30 text-emerald-300 border-emerald-400'
                              : imp.id === 'Importante'
                              ? 'bg-amber-900/30 text-amber-300 border-amber-400'
                              : 'bg-rose-900/30 text-rose-300 border-rose-400'
                            : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                        }`}
                      >
                        {imp.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detalle / Panel de Escritura */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Detalle y Observaciones</label>
                <textarea
                  value={discDetail}
                  onChange={(e) => setDiscDetail(e.target.value)}
                  placeholder="Describa de forma precisa la conducta, falta, excusa u observación del estudiante..."
                  rows={4}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-100 focus:outline-none focus:border-[#D4AF37] placeholder-neutral-600 resize-none font-light leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-900">
              <button
                type="button"
                onClick={() => setShowDisciplineModal(false)}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmitDisciplineObservation}
                disabled={!discDetail.trim()}
                className="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#5A2D1A] text-white hover:bg-[#7D4229] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar Reporte
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
