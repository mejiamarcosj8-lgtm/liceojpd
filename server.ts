/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

dotenv.config();

// Read firebase-applet-config.json
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseApp: any = null;
let firestoreDb: any = null;

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const configData = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    firebaseApp = initializeApp({
      apiKey: configData.apiKey,
      authDomain: configData.authDomain,
      projectId: configData.projectId,
      storageBucket: configData.storageBucket,
      messagingSenderId: configData.messagingSenderId,
      appId: configData.appId
    });
    // Initialize Firestore with custom database ID
    const dbId = configData.firestoreDatabaseId || "(default)";
    firestoreDb = getFirestore(firebaseApp, dbId);
    console.log("Firebase Firestore initialized successfully with Project ID:", configData.projectId, "Database ID:", dbId);
  } catch (err) {
    console.error("Failed to initialize Firebase:", err);
  }
}

// Global in-memory cache of the database
let cachedDb: any = null;

const FIRESTORE_KEYS = [
  "config",
  "users",
  "courses",
  "subjects",
  "grades",
  "attendance",
  "tasks",
  "news",
  "events",
  "auditLogs",
  "landingData",
  "observations",
  "citations",
  "suggestions"
];

async function syncFromFirestore() {
  if (!firestoreDb) return;
  console.log("Starting full sync from Cloud Firestore...");
  const db = loadDb(); // load from local json first to get fallback or existing structure
  
  for (const key of FIRESTORE_KEYS) {
    try {
      const docRef = doc(firestoreDb, "liceo_data", key);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        if (cloudData && cloudData.value !== undefined) {
          db[key] = cloudData.value;
        }
      } else {
        // First-time upload: write current local state of this key to Firestore
        console.log(`Document for key '${key}' does not exist in Firestore. Seeding from local database...`);
        const localValue = db[key] !== undefined ? db[key] : (defaultDb[key] || []);
        await setDoc(docRef, { value: localValue });
      }
    } catch (err) {
      console.error(`Error syncing key '${key}' from Firestore:`, err);
      throw err;
    }
  }
  
  // Save merged state back to cachedDb and local file
  cachedDb = db;
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  console.log("Full sync from Cloud Firestore completed successfully.");
}

async function saveToFirestore(key: string, value: any) {
  if (!firestoreDb) return;
  try {
    const docRef = doc(firestoreDb, "liceo_data", key);
    await setDoc(docRef, { value });
  } catch (err) {
    console.error(`Error saving key '${key}' to Firestore:`, err);
  }
}

// Initialize Express
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database_store.json");

// Define Gemini AI
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// Initialize Database structure
const defaultDb = {
  config: {
    nombreCentro: "Centro Educativo Juan Pablo Duarte",
    eslogan: "Formando los Líderes del Mañana con Valores de la Patria",
    logo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80",
    colorPrimario: "#5A2D1A", // Harvard Dark Brown
    colorSecundario: "#D4AF37", // Elegant gold
    telefono: "809-555-0123",
    correo: "info@liceojuanpabloduarte.edu.do",
    direccion: "Av. Abraham Lincoln #404, Santo Domingo, República Dominicana",
    redesSociales: {
      facebook: "https://facebook.com/liceojuanpabloduarte",
      instagram: "https://instagram.com/liceojuanpabloduarte",
      twitter: "https://twitter.com/liceojpduarte",
      youtube: "https://youtube.com/liceojuanpabloduarte"
    },
    bannerPrincipal: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&auto=format&fit=crop&q=80",
    calendarioEscolarUrl: "#",
    anoEscolar: "2026-2027",
    periodoActivo: "P1"
  },
  users: [
    // Admin
    {
      id: "usr-admin",
      username: "admin",
      nombreCompleto: "Lic. Manuel Henríquez Ureña",
      role: "admin",
      correo: "m.henriquez@liceojuanpabloduarte.edu.do",
      telefono: "809-555-1001",
      fotografia: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
      activo: true,
      biografia: "Administrador general del sistema con más de 15 años de experiencia en gestión de plataformas ERP y CRM educativas."
    },
    // Director
    {
      id: "usr-director",
      username: "director",
      nombreCompleto: "Dra. Altagracia Mercedes",
      role: "director",
      correo: "a.mercedes@liceojuanpabloduarte.edu.do",
      telefono: "809-555-1002",
      fotografia: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      activo: true,
      biografia: "Directora general del Centro Educativo Juan Pablo Duarte. Doctora en Educación, apasionada por la excelencia y la innovación educativa en el país."
    },
    // Encargado de Registro
    {
      id: "usr-registro1",
      username: "registro",
      nombreCompleto: "Licda. Mercedes Peña",
      role: "registro",
      correo: "m.pena@liceojuanpabloduarte.edu.do",
      telefono: "809-555-1003",
      fotografia: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      activo: true,
      biografia: "Encargada de Registro del Centro Educativo Juan Pablo Duarte. Responsable de velar por la integridad y validez de las actas y reportes oficiales de asistencia y rendimiento."
    },
    // Teachers
    {
      id: "usr-doc1",
      username: "profesor1",
      nombreCompleto: "Prof. Carlos Sánchez",
      role: "docente",
      correo: "c.sanchez@liceojuanpabloduarte.edu.do",
      telefono: "809-555-2001",
      fotografia: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      activo: true,
      especialidad: "Matemáticas y Física",
      biografia: "Licenciado en Educación mención Matemáticas con maestría en Tecnología Educativa."
    },
    {
      id: "usr-doc2",
      username: "profesor2",
      nombreCompleto: "Dra. Carmen Jimenes",
      role: "docente",
      correo: "c.jimenes@liceojuanpabloduarte.edu.do",
      telefono: "809-555-2002",
      fotografia: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      activo: true,
      especialidad: "Lengua Española y Literatura",
      biografia: "Especialista en lingüística y fomento de la lectura creativa en el bachillerato dominicano."
    },
    {
      id: "usr-doc3",
      username: "profesor3",
      nombreCompleto: "Prof. Francisco Cabral",
      role: "docente",
      correo: "f.cabral@liceojuanpabloduarte.edu.do",
      telefono: "809-555-2003",
      fotografia: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      activo: true,
      especialidad: "Ciencias Sociales e Historia Dominicana",
      biografia: "Historiador dedicado a la formación cívica y patriótica de los jóvenes estudiantes dominicanos."
    },
    // Students & Parents Pair 1
    {
      id: "usr-stud1",
      username: "estudiante1",
      nombreCompleto: "Juan Pablo Duarte Hijo",
      role: "estudiante",
      correo: "j.duarte@estudiantes.edu.do",
      telefono: "829-555-3001",
      fotografia: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
      activo: true,
      cursoId: "crs-6a",
      seccion: "A",
      matricula: "MAT-2026-0091",
      sexo: "Masculino",
      fechaNacimiento: "2010-01-26",
      edad: 16,
      tutor: "Marcos Duarte",
      padreId: "usr-padre1"
    },
    {
      id: "usr-padre1",
      username: "padre1",
      nombreCompleto: "Sr. Marcos Duarte",
      role: "padre",
      correo: "m.duarte@gmail.com",
      telefono: "809-555-4001",
      fotografia: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      activo: true,
      estudiantesVinculadosIds: ["usr-stud1"]
    },
    // Student 2 & Parent 2
    {
      id: "usr-stud2",
      username: "estudiante2",
      nombreCompleto: "Camila María Almonte",
      role: "estudiante",
      correo: "c.almonte@estudiantes.edu.do",
      telefono: "829-555-3002",
      fotografia: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      activo: true,
      cursoId: "crs-6a",
      seccion: "A",
      matricula: "MAT-2026-0044",
      sexo: "Femenino",
      fechaNacimiento: "2011-05-12",
      edad: 15,
      tutor: "Sofía Almonte",
      padreId: "usr-padre2"
    },
    {
      id: "usr-padre2",
      username: "padre2",
      nombreCompleto: "Sra. Sofía Almonte",
      role: "padre",
      correo: "s.almonte@gmail.com",
      telefono: "809-555-4002",
      fotografia: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      activo: true,
      estudiantesVinculadosIds: ["usr-stud2"]
    }
  ],
  courses: [
    { id: "crs-3a", nombre: "3.º A", activo: true },
    { id: "crs-3b", "nombre": "3.º B", activo: true },
    { id: "crs-3c", "nombre": "3.º C", activo: true },
    { id: "crs-4a", "nombre": "4.º A", activo: true },
    { id: "crs-4b", "nombre": "4.º B", activo: true },
    { id: "crs-4c", "nombre": "4.º C", activo: true },
    { id: "crs-5a", "nombre": "5.º A", activo: true },
    { id: "crs-5b", "nombre": "5.º B", activo: true },
    { id: "crs-5c", "nombre": "5.º C", activo: true },
    { id: "crs-6a", "nombre": "6.º A", activo: true },
    { id: "crs-6b", "nombre": "6.º B", activo: true },
    { id: "crs-6c", "nombre": "6.º C", activo: true }
  ],
  subjects: [
    { id: "sbj-mat6", nombre: "Matemática VI", cursoId: "crs-6a", docenteId: "usr-doc1" },
    { id: "sbj-leng6", nombre: "Lengua Española VI", cursoId: "crs-6a", docenteId: "usr-doc2" },
    { id: "sbj-soc6", nombre: "Ciencias Sociales VI", cursoId: "crs-6a", docenteId: "usr-doc3" }
  ],
  grades: [
    // Grades for Juan Pablo Duarte Filho
    {
      id: "grd-mat1",
      estudianteId: "usr-stud1",
      materiaId: "sbj-mat6",
      materiaNombre: "Matemática VI",
      p1: 85,
      p2: 90,
      p3: 88,
      p4: 92,
      promedio: 89,
      estado: "Aprobado",
      observaciones: "Excelente desempeño y puntualidad en entregas.",
      updatedAt: "2026-06-15"
    },
    {
      id: "grd-leng1",
      estudianteId: "usr-stud1",
      materiaId: "sbj-leng6",
      materiaNombre: "Lengua Española VI",
      p1: 92,
      p2: 95,
      p3: 94,
      p4: 96,
      promedio: 94,
      estado: "Aprobado",
      observaciones: "Gran orador e increíble redacción de ensayos.",
      updatedAt: "2026-06-16"
    },
    {
      id: "grd-soc1",
      estudianteId: "usr-stud1",
      materiaId: "sbj-soc6",
      materiaNombre: "Ciencias Sociales VI",
      p1: 90,
      p2: 88,
      p3: 91,
      p4: 93,
      promedio: 91,
      estado: "Aprobado",
      observaciones: "Dominio excepcional de la historia dominicana.",
      updatedAt: "2026-06-17"
    },
    // Grades for Camila Almonte
    {
      id: "grd-mat2",
      estudianteId: "usr-stud2",
      materiaId: "sbj-mat6",
      materiaNombre: "Matemática VI",
      p1: 72,
      p2: 78,
      p3: 80,
      p4: 85,
      promedio: 79,
      estado: "Aprobado",
      observaciones: "Muestra gran esfuerzo y mejora continua.",
      updatedAt: "2026-06-15"
    },
    {
      id: "grd-leng2",
      estudianteId: "usr-stud2",
      materiaId: "sbj-leng6",
      materiaNombre: "Lengua Española VI",
      p1: 88,
      p2: 85,
      p3: 90,
      p4: 87,
      promedio: 88,
      estado: "Aprobado",
      observaciones: "Muy participativa en debates literarios.",
      updatedAt: "2026-06-16"
    },
    {
      id: "grd-soc2",
      estudianteId: "usr-stud2",
      materiaId: "sbj-soc6",
      materiaNombre: "Ciencias Sociales VI",
      p1: 82,
      p2: 85,
      p3: 86,
      p4: 88,
      promedio: 85,
      estado: "Aprobado",
      observaciones: "Cumple con todas las asignaciones con rigor.",
      updatedAt: "2026-06-17"
    }
  ],
  attendance: [
    { id: "att-1", estudianteId: "usr-stud1", materiaId: "sbj-mat6", materiaNombre: "Matemática VI", fecha: "2026-07-01", estado: "Presente" },
    { id: "att-2", estudianteId: "usr-stud1", materiaId: "sbj-mat6", materiaNombre: "Matemática VI", fecha: "2026-07-02", estado: "Presente" },
    { id: "att-3", estudianteId: "usr-stud1", materiaId: "sbj-mat6", materiaNombre: "Matemática VI", fecha: "2026-07-03", estado: "Tardanza", observaciones: "Llegó 10 minutos tarde." },
    { id: "att-4", estudianteId: "usr-stud2", materiaId: "sbj-mat6", materiaNombre: "Matemática VI", fecha: "2026-07-01", estado: "Presente" },
    { id: "att-5", estudianteId: "usr-stud2", materiaId: "sbj-mat6", materiaNombre: "Matemática VI", fecha: "2026-07-02", estado: "Ausente", observaciones: "Sin justificación." },
    { id: "att-6", estudianteId: "usr-stud2", materiaId: "sbj-mat6", materiaNombre: "Matemática VI", fecha: "2026-07-03", estado: "Excusa", observaciones: "Cita médica reportada." }
  ],
  tasks: [
    {
      id: "tsk-1",
      titulo: "Ecuaciones Cuadráticas en la Vida Real",
      descripcion: "Desarrollar un reporte escrito detallando al menos dos problemas cotidianos modelados por ecuaciones cuadráticas. Entregar en PDF.",
      materiaId: "sbj-mat6",
      materiaNombre: "Matemática VI",
      cursoId: "crs-sec6",
      seccion: "A",
      fechaEntrega: "2026-07-15",
      archivoAdjunto: "guia_ecuaciones.pdf",
      entregas: [
        {
          id: "sub-1",
          taskId: "tsk-1",
          estudianteId: "usr-stud1",
          estudianteNombre: "Juan Pablo Duarte Hijo",
          fechaEntrega: "2026-07-05",
          archivo: "Duarte_Ecuaciones_Cuadraticas.pdf",
          calificacion: 95,
          comentario: "Excelente modelo matemático, muy detallado.",
          estado: "Calificado"
        }
      ]
    },
    {
      id: "tsk-2",
      titulo: "Análisis del Discurso de Incorporación de Duarte",
      descripcion: "Realizar un análisis literario e histórico sobre el juramento de los Trinitarios. Mínimo 3 páginas.",
      materiaId: "sbj-leng6",
      materiaNombre: "Lengua Española VI",
      cursoId: "crs-sec6",
      seccion: "A",
      fechaEntrega: "2026-07-18",
      archivoAdjunto: "discurso_referencia.pdf",
      entregas: []
    }
  ],
  news: [
    {
      id: "nws-1",
      titulo: "Ceremonia de Graduación Promoción LÍDERES 2026",
      resumen: "Con gran orgullo celebramos el egreso de nuestra sexagésima promoción de Bachilleres, formados bajo los más altos estándares éticos e intelectuales.",
      contenido: "El Centro Educativo Juan Pablo Duarte vistió sus mejores galas para celebrar el acto de graduación de la promoción 2026. Con la presencia de la Directora Dra. Altagracia Mercedes, el consejo docente y distinguidos familiares, los jóvenes bachilleres recibieron sus diplomas que los habilitan para la educación superior. El discurso de honor estuvo a cargo del estudiante destacado Juan Pablo Duarte Hijo, quien motivó a sus compañeros a transformar nuestra patria a través del conocimiento y el civismo. ¡Felicitaciones a todos los egresados!",
      imagen: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop&q=80",
      fecha: "2026-06-30",
      autor: "Equipo de Comunicaciones"
    },
    {
      id: "nws-2",
      titulo: "Inauguración de la Nueva Aula de Robótica y Ciencias Aplicadas",
      resumen: "Contamos ahora con tecnología de punta en robótica, impresión 3D y simuladores interactivos para potenciar las habilidades STEAM de nuestros alumnos.",
      contenido: "Como parte de nuestro plan estratégico de innovación académica, dejamos formalmente inaugurada el nuevo laboratorio multimedia STEAM. Este espacio cuenta con kits de desarrollo de robótica avanzada, impresoras 3D de alta velocidad y estaciones de software CAD. La Dra. Altagracia Mercedes destacó que esta inversión sitúa a nuestra institución a la vanguardia nacional, impulsando la curiosidad científica desde la educación primaria.",
      imagen: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80",
      fecha: "2026-07-02",
      autor: "Coordinación Tecnológica"
    },
    {
      id: "nws-3",
      titulo: "Victoria Histórica en las Olimpiadas Nacionales de Matemática",
      resumen: "Nuestros estudiantes se alzaron con 2 medallas de oro y una de bronce en la competencia intercolegial celebrada este fin de semana.",
      contenido: "El Liceo Juan Pablo Duarte continúa brillando en los escenarios de competencia más importantes. En la edición 2026 de las Olimpiadas Nacionales Intercolegiales de Matemáticas, nuestros representantes conquistaron el primer lugar nacional por equipos, con reconocimientos individuales de oro para Juan Pablo Duarte Hijo y de plata para Camila Almonte. Este logro corona un año completo de arduo entrenamiento en el Club de Ciencias del centro.",
      imagen: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80",
      fecha: "2026-07-04",
      autor: "Club de Matemáticas"
    }
  ],
  events: [
    { id: "evt-1", titulo: "Inicio del Año Escolar 2026-2027", descripcion: "Ceremonia formal y recibimiento de los estudiantes en sus respectivas aulas.", fecha: "2026-08-24", hora: "07:30 AM", tipo: "Academico" },
    { id: "evt-2", titulo: "Gala Patriótica: Tributo a los Padres de la Patria", descripcion: "Exposición cultural, bailes folclóricos y dramatizaciones a cargo del Club de Arte.", fecha: "2026-07-16", hora: "09:00 AM", tipo: "Cultural" },
    { id: "evt-3", titulo: "Feria de Ciencias e Innovación Tecnológica 2026", descripcion: "Presentación de proyectos científicos de Robótica, Química y Biología de todos los bachilleratos.", fecha: "2026-07-28", hora: "08:30 AM", tipo: "Cultural" }
  ],
  auditLogs: [
    { id: "aud-1", usuario: "admin", accion: "Inicio de Sesión", detalles: "El usuario admin inició sesión correctamente desde la dirección IP 127.0.0.1.", fecha: "2026-07-06T10:00:00Z" },
    { id: "aud-2", usuario: "admin", accion: "Modificar Configuración", detalles: "Actualización de números telefónicos de contacto institucional.", fecha: "2026-07-06T10:15:00Z" }
  ],
  landingData: {
    hero: {
      slides: [
        {
          image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&auto=format&fit=crop&q=80",
          title: "Liceo de Prestigio y Excelencia Académica",
          subtitle: "Educamos para el futuro con raíces firmes en los valores de nuestra patria."
        },
        {
          image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&auto=format&fit=crop&q=80",
          title: "Innovación Tecnológica y Competencias STEAM",
          subtitle: "Nuevas aulas de robótica y laboratorios equipados para forjar los líderes científicos de mañana."
        },
        {
          image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&auto=format&fit=crop&q=80",
          title: "Formación de Líderes Integrales",
          subtitle: "Fomentamos el deporte, el arte y la cultura cívica en un entorno de primer nivel."
        }
      ]
    },
    aboutUs: {
      title: "Nuestra Institución",
      subtitle: "Formación con Rigor Académico y Conciencia Ciudadana",
      whoWeAre: "Fundado con la firme convicción de proveer una formación del más alto nivel, el Centro Educativo Juan Pablo Duarte conjuga las corrientes psicopedagógicas más innovadoras con el fomento del patriotismo dominicano. Nos dedicamos a guiar a niños, niñas y jóvenes por una ruta de excelencia integral que les permita destacar a nivel internacional sin perder su arraigo cultural.",
      philosophy: "El verdadero conocimiento sirve a la patria y promueve la libertad de pensamiento. Forjamos el carácter tanto como el intelecto.",
      mission: "Proveer una educación integral, innovadora y de calidad que promueva el desarrollo del pensamiento crítico, las habilidades científicas y el fomento de valores cívicos y patrióticos, formando ciudadanos comprometidos con el desarrollo nacional.",
      vision: "Ser reconocidos a nivel nacional e internacional como un centro educativo modelo por nuestra excelencia académica, el uso de tecnologías aplicadas, y la sólida formación ética de nuestros egresados, líderes de la sociedad dominicana.",
      history: "Fundado en honor a nuestro prócer de la patria Juan Pablo Duarte, nacimos como una respuesta académica a la demanda de excelencia en Santo Domingo. Con el paso de los años, hemos ampliado nuestras instalaciones e integrado metodologías STEAM modernas.",
      directorName: "Dra. Altagracia Mercedes",
      directorRole: "Directora General / Ph.D en Educación",
      directorPhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      directorMsg: "Estimada comunidad educativa duartiana, nos honra darles la bienvenida a este espacio virtual. Nuestra labor diaria se fundamenta en un compromiso irrenunciable con la excelencia. En estas aulas, sus hijos no solo adquieren habilidades STEAM o lingüísticas avanzadas; cultivan el respeto, la templanza y la convicción de ser ciudadanos transformadores de la República Dominicana.",
      values: [
        { name: "Patriotismo", desc: "Inculcamos el amor a los símbolos patrios, a la historia nacional y al legado de Juan Pablo Duarte." },
        { name: "Excelencia", desc: "Buscamos el máximo rendimiento académico e intelectual a través de la disciplina y la innovación." },
        { name: "Integridad", desc: "Formamos ciudadanos con firmes principios éticos, honradez y responsabilidad social." },
        { name: "Innovación", desc: "Abrazamos metodologías modernas, ciencias computacionales y aprendizaje STEAM." }
      ]
    },
    studentLife: {
      title: "Vida Estudiantil",
      subtitle: "Descubre tus Pasiones y Desarrolla tus Talentos",
      activities: [
        {
          id: "act-1",
          title: "Club de Robótica y Tecnología",
          description: "Formación en programación, electrónica y diseño 3D. Nuestros estudiantes construyen prototipos y participan en torneos nacionales.",
          image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80",
          category: "STEAM"
        },
        {
          id: "act-2",
          title: "Arte, Teatro y Música",
          description: "Coro institucional, clases de violín, artes visuales y club dramático. Fomentamos la sensibilidad artística y la expresión libre.",
          image: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=600&auto=format&fit=crop&q=80",
          category: "Cultura"
        },
        {
          id: "act-3",
          title: "Deportes de Alto Rendimiento",
          description: "Instalaciones para Baloncesto, Voleibol, Fútbol y Ajedrez. Equipos competitivos con entrenadores certificados de la federación.",
          image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop&q=80",
          category: "Salud"
        }
      ],
      patrioticTitle: "Actividades Cívicas y Patrióticas",
      patrioticDesc: "Cada lunes iniciamos el día con el izamiento solemne de la bandera y el canto del Himno Nacional. Organizamos conferencias históricas, representaciones cívicas y conmemoraciones de los Padres de la Patria para cimentar el amor y orgullo dominicano en cada alumno.",
      nextEventTitle: "Tributo a los Próceres",
      nextEventDate: "Lunes 16 de Julio, 07:45 AM"
    },
    governance: {
      title: "Órganos Institucionales",
      subtitle: "Democracia, Participación y Co-Gestión",
      organs: [
        {
          id: "org-1",
          title: "Consejo Estudiantil",
          desc: "Máximo órgano de representación de los estudiantes. Vela por la sana convivencia, la defensa de los derechos estudiantiles y la organización de actividades culturales y cívicas.",
          funcs: ["Canalizar inquietudes estudiantiles ante la dirección.", "Organizar torneos deportivos e iniciativas solidarias.", "Colaborar en las comisiones de disciplina y mediación de conflictos."],
          integrantes: "Presidente: Juan Pablo Duarte Hijo; Vicepresidenta: Camila Almonte; Secretaria: Sofía Bello."
        },
        {
          id: "org-2",
          title: "Consejo de Padres, Madres y Tutores (APMAE)",
          desc: "Asociación que promueve la integración activa y coordinada de los representantes legales en las directrices de mejora pedagógica y comunitaria del liceo.",
          funcs: ["Apoyar planes de desarrollo y mantenimiento de infraestructura.", "Garantizar canales de comunicación fluidos entre el hogar y el centro.", "Organizar charlas formativas para padres (Escuela para Padres)."],
          integrantes: "Presidente: Sr. Marcos Duarte; Tesorera: Sra. Sofía Almonte; Vocal: Sra. Clara Martínez."
        },
        {
          id: "org-3",
          title: "Gobierno Escolar",
          desc: "Instancia representativa democrática que fomenta los liderazgos, simulando los procesos cívicos de la República Dominicana para inculcar civismo y respeto al orden constitucional.",
          funcs: ["Celebrar elecciones escolares anuales con supervisión de la Junta Central Electoral.", "Presentar planes anuales de mejora de convivencia.", "Gestionar el presupuesto de proyectos estudiantiles."],
          integrantes: "Gobernador Escolar: Estudiante Juan Pablo Duarte Hijo; Vicegobernadora: Camila Almonte."
        }
      ]
    },
    admissions: {
      title: "Únete a Nuestra Familia Educativa",
      subtitle: "Descubra las pautas necesarias para iniciar el proceso de inscripción y asegurar el porvenir académico de su hijo en el centro con mayor prestigio de Santo Domingo.",
      requirements: [
        "Acta de Nacimiento original y certificada.",
        "Récord de calificaciones del último año escolar (firmado y sellado).",
        "Carta de conducta del centro educativo de procedencia.",
        "Certificado médico oficial actualizado (con firma y exequátur).",
        "Dos (2) fotos tamaño 2x2 del estudiante.",
        "Copia de la cédula de identidad de ambos padres o tutores legales."
      ],
      faqs: [
        { q: "¿Cuándo inicia el proceso de admisiones para el nuevo ciclo?", a: "El proceso inicia formalmente en marzo de cada año y cierra al agotarse el cupo disponible de las respectivas aulas para garantizar un límite óptimo por salón." },
        { q: "¿Tienen facilidades de pago para familias con múltiples hijos?", a: "Sí, contamos con un plan especial de descuentos corporativos y familiares: 10% de descuento en la matrícula del segundo hijo y un 15% a partir del tercer hijo inscrito." },
        { q: "¿Cuál es el costo de la evaluación de admisión?", a: "La prueba diagnóstica y psicopedagógica tiene un costo único no reembolsable de RD$1,500, el cual se liquida el día de la cita evaluativa." },
        { q: "¿Ofrecen becas por excelencia académica o deportiva?", a: "Sí, anualmente el Consejo de Directores otorga becas parciales y completas a estudiantes sobresalientes que califiquen en nuestras convocatorias de honores." }
      ]
    },
    attachments: [
      { id: "att-brochure", title: "Brochure Institucional 2026", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", date: "2026-07-01", type: "Documento" },
      { id: "att-calendario", title: "Calendario Escolar Oficial", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", date: "2026-07-02", type: "Calendario" }
    ]
  }
};

// Ensure database file exists
function loadDb() {
  if (cachedDb) {
    return cachedDb;
  }
  try {
    const officialSubjectList = [
      { name: "Lengua Española", suffix: "leng", defaultDocente: "usr-doc2" },
      { name: "Matemática", suffix: "mat", defaultDocente: "usr-doc1" },
      { name: "Ciencias de la Naturaleza", suffix: "nat", defaultDocente: "usr-doc1" },
      { name: "Ciencias Sociales", suffix: "soc", defaultDocente: "usr-doc3" },
      { name: "Lenguas Extranjeras: Inglés y Francés", suffix: "ext", defaultDocente: "usr-doc2" },
      { name: "Formación Integral Humana y Religiosa", suffix: "rel", defaultDocente: "usr-doc3" },
      { name: "Educación Física", suffix: "edf", defaultDocente: "usr-doc1" },
      { name: "Educación Artística", suffix: "art", defaultDocente: "usr-doc3" }
    ];

    let db: any;
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(data);
    } else {
      db = JSON.parse(JSON.stringify(defaultDb));
    }

    let updated = false;

    if (!db.landingData) {
      db.landingData = defaultDb.landingData;
      updated = true;
    }

    if (!db.observations) {
      db.observations = [];
      updated = true;
    }

    if (!db.citations) {
      db.citations = [];
      updated = true;
    }

    if (!db.suggestions) {
      db.suggestions = [];
      updated = true;
    }

    if (db.users && Array.isArray(db.users)) {
      const hasRegistro = db.users.some((u: any) => u.role === 'registro' || u.username === 'registro');
      if (!hasRegistro) {
        db.users.push({
          id: "usr-registro1",
          username: "registro",
          nombreCompleto: "Licda. Mercedes Peña",
          role: "registro",
          correo: "m.pena@liceojuanpabloduarte.edu.do",
          telefono: "809-555-1003",
          fotografia: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
          activo: true,
          biografia: "Encargada de Registro del Centro Educativo Juan Pablo Duarte. Responsable de velar por la integridad y validez de las actas y reportes oficiales de asistencia y rendimiento."
        });
        updated = true;
      }

      const hasOrientacion = db.users.some((u: any) => u.role === 'orientacion' || u.username === 'orientacion');
      if (!hasOrientacion) {
        db.users.push({
          id: "usr-orientadora",
          username: "orientacion",
          nombreCompleto: "Licda. Clara Luz Cabrera",
          role: "orientacion",
          correo: "c.cabrera@liceojuanpabloduarte.edu.do",
          telefono: "809-555-1004",
          fotografia: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
          activo: true,
          biografia: "Orientadora y Psicóloga Escolar. Responsable de brindar apoyo psicopedagógico, conductual y de mediación familiar."
        });
        updated = true;
      }
    }

    // Rebuild and enforce exactly 8 official subjects per course to avoid missing ones in grades/assignments
    if (db.courses && Array.isArray(db.courses)) {
      const newSubjects: any[] = [];
      db.courses.forEach((course: any) => {
        officialSubjectList.forEach((subj) => {
          let id = `sbj-${course.id}-${subj.suffix}`;
          if (course.id === "crs-6a" || course.id === "crs-3a" || course.id === "crs-3b") {
            if (subj.suffix === "mat") id = "sbj-mat6";
            else if (subj.suffix === "leng") id = "sbj-leng6";
            else if (subj.suffix === "soc") id = "sbj-soc6";
            else id = `sbj-${course.id}-${subj.suffix}`;
          }
          newSubjects.push({
            id,
            nombre: subj.name,
            cursoId: course.id,
            docenteId: subj.defaultDocente
          });
        });
      });
      db.subjects = newSubjects;
      updated = true;
    }

    // Normalize pre-existing grades/attendance/tasks names to official names
    if (db.grades) {
      db.grades.forEach((g: any) => {
        if (g.materiaNombre && g.materiaNombre.includes("Matemática")) g.materiaNombre = "Matemática";
        if (g.materiaNombre && g.materiaNombre.includes("Lengua Española")) g.materiaNombre = "Lengua Española";
        if (g.materiaNombre && g.materiaNombre.includes("Ciencias Sociales")) g.materiaNombre = "Ciencias Sociales";
      });
    }
    if (db.attendance) {
      db.attendance.forEach((a: any) => {
        if (a.materiaNombre && a.materiaNombre.includes("Matemática")) a.materiaNombre = "Matemática";
        if (a.materiaNombre && a.materiaNombre.includes("Lengua Española")) a.materiaNombre = "Lengua Española";
        if (a.materiaNombre && a.materiaNombre.includes("Ciencias Sociales")) a.materiaNombre = "Ciencias Sociales";
      });
    }
    if (db.tasks) {
      db.tasks.forEach((t: any) => {
        if (t.materiaNombre && t.materiaNombre.includes("Matemática")) t.materiaNombre = "Matemática";
        if (t.materiaNombre && t.materiaNombre.includes("Lengua Española")) t.materiaNombre = "Lengua Española";
        if (t.materiaNombre && t.materiaNombre.includes("Ciencias Sociales")) t.materiaNombre = "Ciencias Sociales";
      });
    }

    if (updated) {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    }

    cachedDb = db;
    return db;
  } catch (error) {
    console.error("Error loading database, returning default:", error);
    return defaultDb;
  }
}

function saveDb(data: any) {
  try {
    // 1. Save to local disk cache
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    
    // 2. Identify and sync changes to Firestore asynchronously
    if (firestoreDb) {
      const oldDb = cachedDb || {};
      for (const key of FIRESTORE_KEYS) {
        const oldValueStr = JSON.stringify(oldDb[key]);
        const newValueStr = JSON.stringify(data[key]);
        if (oldValueStr !== newValueStr) {
          saveToFirestore(key, data[key]);
        }
      }
    }
    
    // 3. Update memory cache
    cachedDb = JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error("Error saving database:", error);
  }
}

// Log audit actions helper
function logAction(usuario: string, accion: string, detalles: string) {
  const db = loadDb();
  const newLog = {
    id: "aud-" + Date.now(),
    usuario,
    accion,
    detalles,
    fecha: new Date().toISOString()
  };
  db.auditLogs.unshift(newLog);
  // Cap logs at 100
  if (db.auditLogs.length > 100) {
    db.auditLogs = db.auditLogs.slice(0, 100);
  }
  saveDb(db);
}

// REST API Endpoints

// 0. Firebase Status & Manual Sync Endpoints
app.get("/api/admin/db-status", (req, res) => {
  if (fs.existsSync(firebaseConfigPath)) {
    try {
      const configData = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
      return res.json({
        enabled: true,
        projectId: configData.projectId,
        databaseId: configData.firestoreDatabaseId || "(default)"
      });
    } catch (err) {
      return res.json({ enabled: false, error: "Error leyendo configuración" });
    }
  }
  res.json({ enabled: false });
});

app.post("/api/admin/db-sync", async (req, res) => {
  if (!firestoreDb) {
    return res.status(400).json({ success: false, error: "Firebase no está inicializado en el servidor." });
  }
  try {
    await syncFromFirestore();
    res.json({ success: true });
  } catch (err: any) {
    console.error("Manual sync failed:", err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

// 1. Auth Endpoint
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const db = loadDb();
  
  const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (user) {
    const hasCustomPassword = user.password && user.password.trim() !== "";
    const isValid = hasCustomPassword 
      ? password === user.password 
      : (password === user.username + "123" || password === "admin123");
      
    if (isValid) {
      logAction(user.username, "Inicio de Sesión", `Acceso concedido al rol de ${user.role}.`);
      return res.json({ success: true, user });
    }
  }
  
  logAction(username || "Desconocido", "Fallo de Inicio de Sesión", `Intento fallido de inicio de sesión.`);
  return res.status(401).json({ success: false, message: "Credenciales incorrectas o usuario inactivo." });
});

// 2. Configuration Endpoint
app.get("/api/config", (req, res) => {
  const db = loadDb();
  res.json(db.config);
});

app.post("/api/config/update", (req, res) => {
  const { username, config } = req.body;
  const db = loadDb();
  db.config = { ...db.config, ...config };
  saveDb(db);
  logAction(username || "admin", "Modificación de Configuración", "Se actualizaron las propiedades generales del centro escolar.");
  res.json({ success: true, config: db.config });
});

// 3. User Endpoints
app.get("/api/users", (req, res) => {
  const db = loadDb();
  res.json(db.users);
});

app.post("/api/users/create", (req, res) => {
  const { creator, newUser } = req.body;
  const db = loadDb();
  
  const id = "usr-" + Date.now();
  const user = {
    id,
    activo: true,
    ...newUser
  };
  
  db.users.push(user);
  saveDb(db);
  logAction(creator || "admin", "Creación de Usuario", `Se creó el usuario con nombre: ${user.nombreCompleto} y rol ${user.role}.`);
  res.json({ success: true, user });
});

app.post("/api/users/update", (req, res) => {
  const { modifier, updatedUser } = req.body;
  const db = loadDb();
  
  const idx = db.users.findIndex(u => u.id === updatedUser.id);
  if (idx !== -1) {
    db.users[idx] = { ...db.users[idx], ...updatedUser };
    saveDb(db);
    logAction(modifier || "admin", "Edición de Usuario", `Se modificaron los datos del usuario: ${updatedUser.nombreCompleto}.`);
    return res.json({ success: true, user: db.users[idx] });
  }
  res.status(404).json({ success: false, message: "Usuario no encontrado." });
});

app.post("/api/users/delete", (req, res) => {
  const { modifier, id } = req.body;
  const db = loadDb();
  
  const user = db.users.find(u => u.id === id);
  if (user) {
    db.users = db.users.filter(u => u.id !== id);
    saveDb(db);
    logAction(modifier || "admin", "Eliminación de Usuario", `Se eliminó al usuario: ${user.nombreCompleto}.`);
    return res.json({ success: true });
  }
  res.status(404).json({ success: false, message: "Usuario no encontrado." });
});

app.post("/api/users/reset-password", (req, res) => {
  const { modifier, id, newPassword } = req.body;
  const db = loadDb();
  const idx = db.users.findIndex(u => u.id === id);
  if (idx !== -1) {
    const user = db.users[idx];
    const passwordToSet = newPassword || (user.username + "123");
    db.users[idx].password = passwordToSet;
    saveDb(db);
    logAction(modifier || "admin", "Restaurar Contraseña", `Se cambió o restauró la contraseña para ${user.nombreCompleto}.`);
    return res.json({ success: true, message: `La contraseña para ${user.nombreCompleto} ha sido actualizada con éxito a: ${passwordToSet}` });
  }
  res.status(404).json({ success: false, message: "Usuario no encontrado." });
});

// 4. Courses and Subjects
app.get("/api/courses", (req, res) => {
  const db = loadDb();
  res.json(db.courses);
});

app.get("/api/subjects", (req, res) => {
  const db = loadDb();
  res.json(db.subjects);
});

app.post("/api/courses/create", (req, res) => {
  const { creator, newCourse } = req.body;
  const db = loadDb();
  const id = "crs-" + Date.now();
  const course = { id, ...newCourse, activo: newCourse.activo !== undefined ? newCourse.activo : true };
  db.courses.push(course);
  saveDb(db);
  logAction(creator || "admin", "Creación de Curso", `Se creó el curso: ${course.nombre}.`);
  res.json({ success: true, course });
});

app.post("/api/courses/update", (req, res) => {
  const { modifier, updatedCourse } = req.body;
  const db = loadDb();
  const idx = db.courses.findIndex((c: any) => c.id === updatedCourse.id);
  if (idx !== -1) {
    db.courses[idx] = { ...db.courses[idx], ...updatedCourse };
    saveDb(db);
    logAction(modifier || "admin", "Edición de Curso", `Se actualizó el curso: ${updatedCourse.nombre}.`);
    return res.json({ success: true, course: db.courses[idx] });
  }
  res.status(404).json({ success: false, message: "Curso no encontrado." });
});

app.post("/api/courses/delete", (req, res) => {
  const { modifier, id } = req.body;
  const db = loadDb();
  const course = db.courses.find((c: any) => c.id === id);
  if (course) {
    db.courses = db.courses.filter((c: any) => c.id !== id);
    // Unset course ID for any assigned student
    db.users.forEach((u: any) => {
      if (u.cursoId === id) {
        u.cursoId = "";
      }
    });
    saveDb(db);
    logAction(modifier || "admin", "Eliminación de Curso", `Se eliminó el curso: ${course.nombre}.`);
    return res.json({ success: true });
  }
  res.status(404).json({ success: false, message: "Curso no encontrado." });
});

app.post("/api/courses/assign-students", (req, res) => {
  const { modifier, cursoId, studentIds } = req.body;
  const db = loadDb();
  let count = 0;
  db.users.forEach((u: any) => {
    if (studentIds.includes(u.id) && u.role === "estudiante") {
      u.cursoId = cursoId;
      count++;
    }
  });
  saveDb(db);
  const course = db.courses.find((c: any) => c.id === cursoId);
  logAction(modifier || "admin", "Asignación de Estudiantes", `Se asignaron ${count} estudiantes al curso ${course ? course.nombre : cursoId}.`);
  res.json({ success: true });
});

app.post("/api/courses/remove-student", (req, res) => {
  const { modifier, studentId } = req.body;
  const db = loadDb();
  const u = db.users.find((u: any) => u.id === studentId);
  if (u) {
    const oldCursoId = u.cursoId;
    u.cursoId = "";
    saveDb(db);
    const course = db.courses.find((c: any) => c.id === oldCursoId);
    logAction(modifier || "admin", "Desasignación de Estudiante", `Se removió al estudiante ${u.nombreCompleto} del curso ${course ? course.nombre : "desconocido"}.`);
    return res.json({ success: true });
  }
  res.status(404).json({ success: false, message: "Estudiante no encontrado." });
});

// 5. Grades Endpoints
app.get("/api/grades", (req, res) => {
  const db = loadDb();
  res.json(db.grades);
});

app.post("/api/grades/update", (req, res) => {
  const { teacher, grade } = req.body;
  const db = loadDb();
  
  // Robust check to prevent duplicate grade rows for same student & subject (by ID or exact name)
  let idx = db.grades.findIndex(g => g.id === grade.id);
  if (idx === -1 && grade.estudianteId) {
    idx = db.grades.findIndex(g => 
      g.estudianteId === grade.estudianteId && 
      (g.materiaId === grade.materiaId || g.materiaNombre.toLowerCase().trim() === grade.materiaNombre.toLowerCase().trim())
    );
  }
  
  const p1 = Number(grade.p1 || 0);
  const p2 = Number(grade.p2 || 0);
  const p3 = Number(grade.p3 || 0);
  const p4 = Number(grade.p4 || 0);
  const filledPeriods = [p1, p2, p3, p4].filter(p => p > 0);
  const promedio = filledPeriods.length > 0 ? Math.round(filledPeriods.reduce((a, b) => a + b, 0) / filledPeriods.length) : 0;
  const estado = promedio >= 70 ? "Aprobado" : "Reprobado";
  
  const updatedGrade = {
    ...grade,
    id: idx !== -1 ? db.grades[idx].id : (grade.id || "grd-" + Date.now()),
    promedio,
    estado,
    updatedAt: new Date().toISOString().split("T")[0]
  };

  if (idx !== -1) {
    db.grades[idx] = updatedGrade;
  } else {
    db.grades.push(updatedGrade);
  }
  
  saveDb(db);
  
  // Retrieve student name
  const student = db.users.find(u => u.id === grade.estudianteId);
  const studentName = student ? student.nombreCompleto : "Estudiante";
  
  logAction(teacher || "Docente", "Registro de Calificaciones", `Se actualizaron las notas de ${studentName} en la asignatura con promedio ${promedio}.`);
  res.json({ success: true, grade: updatedGrade });
});

app.post("/api/grades/reset-course", (req, res) => {
  const { courseId, modifier } = req.body;
  const db = loadDb();
  
  // Find all student IDs in this course
  const students = db.users.filter((u: any) => u.role === 'estudiante' && u.cursoId === courseId);
  const studentIds = students.map((u: any) => u.id);
  
  // Count how many grade records we are removing
  const initialCount = db.grades.length;
  db.grades = db.grades.filter((g: any) => !studentIds.includes(g.estudianteId));
  const removedCount = initialCount - db.grades.length;
  
  const course = db.courses.find((c: any) => c.id === courseId);
  const courseName = course ? course.nombre : "desconocido";
  
  saveDb(db);
  
  logAction(modifier || "admin", "Reinicio de Calificaciones", `Se reiniciaron las calificaciones de todos los estudiantes del curso ${courseName} (${removedCount} registros eliminados).`);
  res.json({ success: true, removedCount });
});

app.post("/api/grades/reset-student", (req, res) => {
  const { studentId, modifier } = req.body;
  const db = loadDb();
  
  const student = db.users.find((u: any) => u.id === studentId);
  const studentName = student ? student.nombreCompleto : "Estudiante";
  
  const initialCount = db.grades.length;
  db.grades = db.grades.filter((g: any) => g.estudianteId !== studentId);
  const removedCount = initialCount - db.grades.length;
  
  saveDb(db);
  
  logAction(modifier || "admin", "Reinicio de Calificaciones", `Se reiniciaron las calificaciones del estudiante ${studentName} (${removedCount} registros eliminados).`);
  res.json({ success: true, removedCount });
});

app.post("/api/grades/update-bulk", (req, res) => {
  const { modifier, studentId, gradesList } = req.body;
  const db = loadDb();
  
  const student = db.users.find(u => u.id === studentId);
  const studentName = student ? student.nombreCompleto : "Estudiante";
  
  for (const item of gradesList) {
    const p1 = Number(item.p1 || 0);
    const p2 = Number(item.p2 || 0);
    const p3 = Number(item.p3 || 0);
    const p4 = Number(item.p4 || 0);
    const filledPeriods = [p1, p2, p3, p4].filter(p => p > 0);
    const promedio = filledPeriods.length > 0 ? Math.round(filledPeriods.reduce((a, b) => a + b, 0) / filledPeriods.length) : 0;
    const estado = promedio >= 70 ? "Aprobado" : "Reprobado";
    
    const idx = db.grades.findIndex(g => 
      g.estudianteId === studentId && 
      (g.materiaId === item.materiaId || g.materiaNombre.toLowerCase().trim() === item.materiaNombre.toLowerCase().trim())
    );
    
    const updatedGrade = {
      id: idx !== -1 ? db.grades[idx].id : ("grd-" + Date.now() + Math.random().toString(36).substr(2, 5)),
      estudianteId: studentId,
      materiaId: item.materiaId,
      materiaNombre: item.materiaNombre,
      p1,
      p2,
      p3,
      p4,
      promedio,
      estado,
      updatedAt: new Date().toISOString().split("T")[0]
    };
    
    if (idx !== -1) {
      db.grades[idx] = updatedGrade;
    } else {
      db.grades.push(updatedGrade);
    }
  }
  
  saveDb(db);
  logAction(modifier || "admin", "Edición de Calificaciones (Bulk)", `Se actualizaron las calificaciones de ${studentName} en múltiples asignaturas.`);
  res.json({ success: true });
});

// 6. Attendance Endpoints
app.get("/api/attendance", (req, res) => {
  const db = loadDb();
  
  // Prune records older than 3 days from the current date
  const todayStr = new Date().toISOString().split('T')[0];
  const todayNum = new Date(todayStr + "T12:00:00").getTime();
  const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
  
  const originalLength = db.attendance.length;
  db.attendance = db.attendance.filter((att: any) => {
    try {
      const attTime = new Date(att.fecha + "T12:00:00").getTime();
      const diff = todayNum - attTime;
      return diff <= threeDaysInMs && diff >= -threeDaysInMs; // keep if within +/- 3 days
    } catch (e) {
      return true;
    }
  });
  
  if (db.attendance.length !== originalLength) {
    saveDb(db);
  }
  
  res.json(db.attendance);
});

app.post("/api/attendance/reset", (req, res) => {
  const { adminName } = req.body;
  const db = loadDb();
  const originalCount = db.attendance.length;
  db.attendance = [];
  saveDb(db);
  logAction(adminName || "Administrador", "Restablecer Asistencia", `Se eliminaron de forma permanente ${originalCount} registros de asistencia, dejando la base de datos de control diario en cero.`);
  res.json({ success: true, clearedCount: originalCount });
});

app.post("/api/attendance/mark", (req, res) => {
  const { teacher, attendanceRecords } = req.body; // Array of records
  const db = loadDb();
  
  const currentLocalTime = new Date().toLocaleTimeString('es-DO', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
  
  attendanceRecords.forEach((record: any) => {
    const id = "att-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    db.attendance.push({
      id,
      estudianteId: record.estudianteId,
      materiaId: record.materiaId,
      materiaNombre: record.materiaNombre,
      fecha: record.fecha,
      estado: record.estado,
      observaciones: record.observaciones || "",
      hora: record.hora || currentLocalTime,
      docente: record.docente || teacher || "Docente"
    });
  });
  
  // Also prune after marking
  const todayStr = new Date().toISOString().split('T')[0];
  const todayNum = new Date(todayStr + "T12:00:00").getTime();
  const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
  
  db.attendance = db.attendance.filter((att: any) => {
    try {
      const attTime = new Date(att.fecha + "T12:00:00").getTime();
      const diff = todayNum - attTime;
      return diff <= threeDaysInMs && diff >= -threeDaysInMs;
    } catch (e) {
      return true;
    }
  });
  
  saveDb(db);
  logAction(teacher || "Docente", "Pase de Asistencia", `Se registró la asistencia para ${attendanceRecords.length} alumnos en la fecha ${attendanceRecords[0]?.fecha}.`);
  res.json({ success: true, attendance: db.attendance });
});

// 7. Tasks Endpoints
app.get("/api/tasks", (req, res) => {
  const db = loadDb();
  res.json(db.tasks);
});

app.post("/api/tasks/create", (req, res) => {
  const { teacher, newTask } = req.body;
  const db = loadDb();
  
  const id = "tsk-" + Date.now();
  const task = {
    id,
    titulo: newTask.titulo,
    descripcion: newTask.descripcion,
    materiaId: newTask.materiaId,
    materiaNombre: newTask.materiaNombre,
    cursoId: newTask.cursoId,
    seccion: newTask.seccion,
    fechaEntrega: newTask.fechaEntrega,
    archivoAdjunto: newTask.archivoAdjunto || "",
    entregas: []
  };
  
  db.tasks.push(task);
  saveDb(db);
  logAction(teacher || "Docente", "Creación de Tarea", `Se asignó la nueva tarea '${task.titulo}' para la materia ${task.materiaNombre}.`);
  res.json({ success: true, task });
});

app.post("/api/tasks/submit", (req, res) => {
  const { studentId, studentName, taskId, filename } = req.body;
  const db = loadDb();
  
  const taskIdx = db.tasks.findIndex(t => t.id === taskId);
  if (taskIdx !== -1) {
    const submissionId = "sub-" + Date.now();
    const submission = {
      id: submissionId,
      taskId,
      estudianteId: studentId,
      estudianteNombre: studentName,
      fechaEntrega: new Date().toISOString().split("T")[0],
      archivo: filename,
      estado: "Entregado" as const
    };
    
    // Add or replace student's submission
    db.tasks[taskIdx].entregas = db.tasks[taskIdx].entregas.filter(e => e.estudianteId !== studentId);
    db.tasks[taskIdx].entregas.push(submission);
    saveDb(db);
    
    logAction(studentName, "Entrega de Tarea", `Entrega del archivo ${filename} para la tarea '${db.tasks[taskIdx].titulo}'.`);
    return res.json({ success: true, task: db.tasks[taskIdx] });
  }
  res.status(404).json({ success: false, message: "Tarea no encontrada." });
});

app.post("/api/tasks/grade-submission", (req, res) => {
  const { teacher, taskId, submissionId, calificacion, comentario } = req.body;
  const db = loadDb();
  
  const taskIdx = db.tasks.findIndex(t => t.id === taskId);
  if (taskIdx !== -1) {
    const subIdx = db.tasks[taskIdx].entregas.findIndex(e => e.id === submissionId);
    if (subIdx !== -1) {
      db.tasks[taskIdx].entregas[subIdx].calificacion = Number(calificacion);
      db.tasks[taskIdx].entregas[subIdx].comentario = comentario || "";
      db.tasks[taskIdx].entregas[subIdx].estado = "Calificado" as const;
      
      saveDb(db);
      logAction(teacher || "Docente", "Calificación de Tarea", `Se calificó la entrega de ${db.tasks[taskIdx].entregas[subIdx].estudianteNombre} con nota ${calificacion}.`);
      return res.json({ success: true, task: db.tasks[taskIdx] });
    }
  }
  res.status(404).json({ success: false, message: "Entrega no encontrada." });
});

// 8. News Endpoints
app.get("/api/news", (req, res) => {
  const db = loadDb();
  res.json(db.news);
});

app.post("/api/news/create", (req, res) => {
  const { author, newsItem } = req.body;
  const db = loadDb();
  const id = "nws-" + Date.now();
  const newItem = {
    id,
    titulo: newsItem.titulo,
    resumen: newsItem.resumen,
    contenido: newsItem.contenido,
    imagen: newsItem.imagen || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80",
    fecha: new Date().toISOString().split("T")[0],
    autor: author || "Comunicaciones"
  };
  db.news.unshift(newItem);
  saveDb(db);
  logAction(author || "admin", "Creación de Noticia", `Nueva noticia publicada: '${newItem.titulo}'.`);
  res.json({ success: true, newsItem: newItem });
});

app.post("/api/news/update", (req, res) => {
  const { author, newsItem } = req.body;
  const db = loadDb();
  const idx = db.news.findIndex(n => n.id === newsItem.id);
  if (idx !== -1) {
    db.news[idx] = { ...db.news[idx], ...newsItem };
    saveDb(db);
    logAction(author || "admin", "Edición de Noticia", `Se modificó la noticia: '${newsItem.titulo}'.`);
    return res.json({ success: true, newsItem: db.news[idx] });
  }
  res.status(404).json({ success: false, message: "Noticia no encontrada." });
});

app.post("/api/news/delete", (req, res) => {
  const { author, id } = req.body;
  const db = loadDb();
  const newsItem = db.news.find(n => n.id === id);
  if (newsItem) {
    db.news = db.news.filter(n => n.id !== id);
    saveDb(db);
    logAction(author || "admin", "Eliminación de Noticia", `Se eliminó la noticia: '${newsItem.titulo}'.`);
    return res.json({ success: true });
  }
  res.status(404).json({ success: false, message: "Noticia no encontrada." });
});

// 9. Events Endpoints
app.get("/api/events", (req, res) => {
  const db = loadDb();
  res.json(db.events);
});

app.post("/api/events/create", (req, res) => {
  const { creator, event } = req.body;
  const db = loadDb();
  const id = "evt-" + Date.now();
  const newEvent = { id, ...event };
  db.events.push(newEvent);
  saveDb(db);
  logAction(creator || "admin", "Creación de Evento", `Se agregó el evento escolar '${newEvent.titulo}' en fecha ${newEvent.fecha}.`);
  res.json({ success: true, event: newEvent });
});

// 10. Audit Logs Endpoints
app.get("/api/audit-logs", (req, res) => {
  const db = loadDb();
  res.json(db.auditLogs);
});

// 10.1 Observations Endpoints
app.get("/api/observations", (req, res) => {
  const db = loadDb();
  res.json(db.observations || []);
});

app.post("/api/observations/create", (req, res) => {
  const { observation, authorName } = req.body;
  const db = loadDb();
  if (!db.observations) db.observations = [];
  
  const id = "obs-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  const newObs = { id, ...observation, fecha: new Date().toISOString() };
  db.observations.push(newObs);
  saveDb(db);
  
  logAction(authorName || "Docente", "Registro de Observación", `Observación registrada para ${newObs.estudianteNombre}: ${newObs.detalle.substring(0, 50)}...`);
  res.json({ success: true, observation: newObs });
});

app.post("/api/observations/delete", (req, res) => {
  const { id, authorName } = req.body;
  const db = loadDb();
  if (!db.observations) db.observations = [];
  
  const obsIndex = db.observations.findIndex((o: any) => o.id === id);
  if (obsIndex !== -1) {
    const obs = db.observations[obsIndex];
    db.observations.splice(obsIndex, 1);
    
    // Also delete any associated citation
    if (db.citations) {
      db.citations = db.citations.filter((c: any) => c.observacionId !== id);
    }
    
    saveDb(db);
    logAction(authorName || "Usuario", "Eliminación de Observación", `Se eliminó la observación del estudiante ${obs.estudianteNombre}.`);
    return res.json({ success: true });
  }
  res.status(404).json({ success: false, message: "Observación no encontrada." });
});

app.post("/api/observations/reset", (req, res) => {
  const { estudianteId, authorName } = req.body;
  const db = loadDb();
  if (!db.observations) db.observations = [];
  
  const student = db.users.find((u: any) => u.id === estudianteId);
  const studentName = student ? student.nombreCompleto : "Estudiante";
  
  const initialCount = db.observations.length;
  db.observations = db.observations.filter((o: any) => o.estudianteId !== estudianteId);
  const clearedCount = initialCount - db.observations.length;
  
  // Also clear citations for this student
  if (db.citations) {
    db.citations = db.citations.filter((c: any) => c.estudianteId !== estudianteId);
  }
  
  saveDb(db);
  logAction(authorName || "Orientación", "Reinicio de Observaciones", `Se reiniciaron todas las observaciones (${clearedCount}) para el estudiante ${studentName}.`);
  res.json({ success: true, clearedCount });
});

// 10.2 Citations Endpoints
app.get("/api/citations", (req, res) => {
  const db = loadDb();
  res.json(db.citations || []);
});

app.post("/api/citations/create", (req, res) => {
  const { citation, authorName } = req.body;
  const db = loadDb();
  if (!db.citations) db.citations = [];
  
  const id = "cit-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  const newCitation = { id, ...citation, fechaCreacion: new Date().toISOString() };
  db.citations.push(newCitation);
  saveDb(db);
  
  logAction(authorName || "Orientación", "Emisión de Citación", `Se citó al tutor de ${newCitation.estudianteNombre} para el ${newCitation.fechaCitacion}.`);
  res.json({ success: true, citation: newCitation });
});

app.post("/api/citations/delete", (req, res) => {
  const { id, authorName } = req.body;
  const db = loadDb();
  if (!db.citations) db.citations = [];
  
  const citIndex = db.citations.findIndex((c: any) => c.id === id);
  if (citIndex !== -1) {
    const cit = db.citations[citIndex];
    db.citations.splice(citIndex, 1);
    saveDb(db);
    logAction(authorName || "Orientación", "Cancelación de Citación", `Se canceló la citación para el estudiante ${cit.estudianteNombre}.`);
    return res.json({ success: true });
  }
  res.status(404).json({ success: false, message: "Citación no encontrada." });
});

// 11. AI Analytics (Gemini integration via Google GenAI SDK)
app.post("/api/ai/analyse", async (req, res) => {
  const { prompt, studentGrades, studentAttendance } = req.body;
  
  if (!ai) {
    return res.json({
      advice: "🤖 **Asistente de Orientación IA**: Para activar los consejos personalizados basados en IA, configura tu variable de entorno `GEMINI_API_KEY` en el menú Secrets.\n\n*Recomendación de sistema*: El estudiante muestra un excelente potencial. Se aconseja continuar reforzando las áreas técnicas con tutorías dinámicas y promover el club de robótica."
    });
  }

  try {
    const gradesSummary = studentGrades.map((g: any) => `${g.materiaNombre}: P1=${g.p1}, P2=${g.p2}, P3=${g.p3}, P4=${g.p4}, Promedio=${g.promedio}`).join("; ");
    const attendanceSummary = studentAttendance.map((a: any) => `${a.materiaNombre} (${a.fecha}): ${a.estado}`).join("; ");
    
    const aiPrompt = `Actúa como un psicopedagogo y orientador del Liceo Dominicano Juan Pablo Duarte.
    Analiza el rendimiento del estudiante con los siguientes datos académicos:
    Calificaciones: ${gradesSummary}
    Historial de asistencia: ${attendanceSummary}
    
    Pregunta o solicitud del usuario: ${prompt}
    
    Por favor, genera un análisis educativo y de orientación con tono profesional, empático y motivador (máximo 250 palabras). Utiliza formato Markdown. Dirígete directamente al estudiante o a su tutor según corresponda en español dominicano formal.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: aiPrompt
    });

    res.json({ advice: response.text });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Error interactuando con la Inteligencia Artificial: " + error.message });
  }
});

// 11b. General Chatbot Endpoint
app.post("/api/ai/chatbot", async (req, res) => {
  const { message, history, user } = req.body;
  if (!ai) {
    return res.json({
      reply: "Hola. El sistema de Inteligencia Artificial de la escuela está en modo sin conexión porque no se ha configurado la variable de entorno `GEMINI_API_KEY` en el panel de secretos. ¿En qué puedo ayudarte manualmente?"
    });
  }

  try {
    const db = loadDb();
    const systemInstruction = `Eres DuarteBot, el Asistente de Inteligencia Artificial del Liceo Dominicano Juan Pablo Duarte.
    Estás interactuando con ${user?.nombreCompleto || 'un usuario'}, quien tiene el rol de ${user?.role || 'visitante'}.
    Información general del centro para tu conocimiento (no la reveles de golpe, úsala para responder preguntas si es relevante):
    - Nombre del centro: ${db.sysConfig?.nombreCentro || 'Liceo Juan Pablo Duarte'}
    - Año escolar: ${db.sysConfig?.anoEscolar || '2025-2026'}
    - Teléfono: ${db.sysConfig?.telefono || '809-555-0199'}
    - Dirección: ${db.sysConfig?.direccion || 'Av. 27 de Febrero, Santo Domingo'}
    - Total de usuarios registrados: ${db.users.length}
    - Total de cursos activos: ${db.courses.filter((c: any) => c.activo !== false).length}
    - Total de noticias publicadas: ${db.news.length}

    Responde de manera empática, profesional, clara y concisa (en español dominicano formal y educado). Ayuda al usuario con dudas sobre el funcionamiento del sistema, cómo registrar notas o asistencia, o cualquier consulta general escolar.`;

    let conversationHistory = "";
    if (history && history.length > 0) {
      conversationHistory = history.map((h: any) => `${h.sender === 'user' ? 'Usuario' : 'Asistente'}: ${h.text}`).join("\n");
    }

    const aiPrompt = `${systemInstruction}\n\nHistorial reciente de la conversación:\n${conversationHistory}\n\nUsuario actual dice: "${message}"\n\nRespuesta del Asistente:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: aiPrompt
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini chatbot error:", error);
    res.status(500).json({ reply: "Lo siento, ha ocurrido un error al procesar tu solicitud con el motor de Inteligencia Artificial. ¿Puedes intentar de nuevo?" });
  }
});

// 11c. AI Behavior/Conduct Analyzer for Counselor Citations
app.post("/api/ai/analyze-conduct", async (req, res) => {
  const { estudianteNombre, detalle, docenteNombre, tipo } = req.body;
  
  if (!ai) {
    return res.json({
      paragraph: `En mi calidad de orientador/a del Liceo Juan Pablo Duarte, he analizado detenidamente el reporte de conducta del estudiante ${estudianteNombre} registrado por el/la docente ${docenteNombre || "del centro"}. El reporte detalla la siguiente conducta: "${detalle}". En nuestra institución, consideramos de máxima prioridad intervenir ante este tipo de incidencias disciplinarias para salvaguardar el clima de respeto y la convivencia escolar armónica de todos los estudiantes.`
    });
  }

  try {
    const aiPrompt = `Actúa como psicólogo(a) y orientador(a) principal del "Liceo Juan Pablo Duarte" en la República Dominicana.
    Has recibido un reporte de conducta del docente ${docenteNombre || 'del aula'} sobre el estudiante: "${estudianteNombre}".
    Tipo de incidencia: ${tipo || 'conducta'}.
    Detalle de la falta cometido por el estudiante: "${detalle}".
    
    Tu tarea es redactar un análisis profesional o dictamen de orientación, de alta calidad institucional, riguroso, persuasivo y sumamente detallado, dirigido al padre, madre o tutor del estudiante.
    
    Lineamientos de redacción:
    1. Redacta obligatoriamente en primera persona del singular (como orientador/a principal, ej: "En mi rol de orientador...", "He evaluado con detenimiento...", "Como profesional del departamento de psicología...", "Considero imprescindible...").
    2. Explica y analiza la falta de manera detallada: por qué es grave y de qué manera vulnera las normas de respeto y la sana convivencia escolar. Por ejemplo, si el reporte dice "llamándolo feo de forma violenta" o algo similar, explica de forma académica y psicológica por qué calificar despectivamente a un compañero de manera agresiva no es una broma inofensiva, sino que constituye acoso verbal (bullying) que lacera la autoestima, la integridad emocional del prójimo y fomenta la violencia escolar.
    3. Convence firmemente al tutor de la gravedad del hecho y de por qué es indispensable que asista a esta citación formal para estructurar y firmar un acuerdo de mejoramiento conductual inmediato.
    4. El tono debe ser formal, académico, sumamente institucional, reflexivo, respetuoso pero firme.
    5. No uses títulos de secciones, listas de viñetas, caracteres de encabezado (#) ni asteriscos de formato de negrita exagerados. Redacta de 1 a 2 párrafos de prosa fluida y elegante listos para imprimirse formalmente.
    
    Respuesta:`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: aiPrompt
    });

    res.json({ paragraph: response.text });
  } catch (error: any) {
    console.error("AI conduct analysis error:", error);
    res.json({
      paragraph: `En mi calidad de orientador/a del Liceo Juan Pablo Duarte, tras evaluar el reporte disciplinario del estudiante ${estudianteNombre} registrado por ${docenteNombre || "el docente"} ("${detalle}"), considero fundamental sostener un diálogo presencial con usted para coordinar acciones correctivas y de apoyo psicopedagógico inmediatas.`
    });
  }
});

// 12. Landing Page Data Endpoints
app.get("/api/landing", (req, res) => {
  const db = loadDb();
  res.json(db.landingData || defaultDb.landingData);
});

app.post("/api/landing/update", (req, res) => {
  const { username, landingData } = req.body;
  const db = loadDb();
  db.landingData = { ...db.landingData, ...landingData };
  saveDb(db);
  logAction(username || "admin", "Modificación de Datos Web", "Se actualizaron las secciones informativas y configuraciones del portal web.");
  res.json({ success: true, landingData: db.landingData });
});

// 13. Contact and Suggestion Form Submissions
app.post("/api/contact/submit", (req, res) => {
  const { nombre, correo, telefono, asunto, mensaje } = req.body;
  const db = loadDb();
  
  if (!db.contactSubmissions) {
    db.contactSubmissions = [];
  }
  
  const submission = {
    id: "con-" + Date.now(),
    nombre,
    correo,
    telefono,
    asunto,
    mensaje,
    destinatario: "mejiamarcosj4@gmail.com",
    fecha: new Date().toISOString()
  };
  
  db.contactSubmissions.push(submission);
  saveDb(db);
  
  logAction(
    nombre || "Anónimo", 
    "Formulario de Contacto", 
    `Se recibió formulario de contacto de ${nombre} (Asunto: '${asunto}') dirigido a mejiamarcosj4@gmail.com.`
  );
  
  res.json({ success: true, submission });
});

app.post("/api/suggestions/submit", (req, res) => {
  const { mensaje } = req.body;
  const db = loadDb();
  
  if (!db.suggestions) {
    db.suggestions = [];
  }
  
  const submission = {
    id: "sug-" + Date.now(),
    mensaje,
    destinatario: "mejiamarcosj4@gmail.com",
    fecha: new Date().toISOString()
  };
  
  db.suggestions.push(submission);
  saveDb(db);
  
  logAction(
    "Anónimo", 
    "Buzón de Sugerencias", 
    `Sugerencia virtual depositada con éxito y direccionada a mejiamarcosj4@gmail.com.`
  );
  
  res.json({ success: true, submission });
});

// Serve frontend assets
async function startServer() {
  if (firestoreDb) {
    try {
      await syncFromFirestore();
    } catch (err) {
      console.error("Error during startup Firestore sync:", err);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
