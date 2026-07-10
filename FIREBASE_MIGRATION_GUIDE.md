# Guía de Migración del Sistema a Firebase Firestore 🔥
**Liceo Juan Pablo Duarte - Sistema de Gestión Académica (ERP)**

Esta guía detalla el proceso paso a paso para migrar la base de datos local basada en JSON (`db.json`) del servidor Express a **Firebase Firestore**, la base de datos NoSQL escalable y en tiempo real de Google, ideal para aplicaciones móviles y web.

---

## 📋 Índice
1. [Paso 1: Creación del Proyecto en Firebase Console](#paso-1)
2. [Paso 2: Modelado de Colecciones NoSQL](#paso-2)
3. [Paso 3: Instalación del SDK en el Frontend y Servidor](#paso-3)
4. [Paso 4: Inicialización de Firebase en el Proyecto](#paso-4)
5. [Paso 5: Script de Migración Inicial (Subir datos de db.json)](#paso-5)
6. [Paso 6: Adaptar el Backend/Frontend para Consultar Firestore](#paso-6)
7. [Paso 7: Reglas de Seguridad Esenciales](#paso-7)

---

<a name="paso-1"></a>
## 1. Paso 1: Creación del Proyecto en Firebase Console
1. Entra a [Firebase Console](https://console.firebase.google.com/).
2. Haz clic en **Crear un proyecto** (o "Add project") y asígnale un nombre (ej. `liceo-duarte-erp`).
3. (Opcional) Desactiva Google Analytics para este proyecto de prueba o actívalo si deseas estadísticas.
4. Una vez creado, ve a la sección **Compilación** (Build) en la barra lateral y selecciona **Cloud Firestore**.
5. Haz clic en **Crear base de datos**.
6. Selecciona el modo de inicio:
   - **Modo producción** (Recomendado, podrás aplicar reglas de seguridad después).
7. Selecciona la ubicación del servidor de base de datos más cercana a tus usuarios (por ejemplo, `us-central1` o `southamerica-east1` para Latinoamérica) y haz clic en **Habilitar**.

---

<a name="paso-2"></a>
## 2. Paso 2: Modelado de Colecciones NoSQL
Firestore almacena datos en **Colecciones** y **Documentos**. Cada documento contiene campos de clave-valor.
Nuestra estructura actual de `db.json` se mapeará directamente de la siguiente manera:

| Nombre de Colección | Tipo de ID de Documento | Campos Clave |
| :--- | :--- | :--- |
| **`users`** | ID de Usuario (ej. `user-1`) | `username`, `nombreCompleto`, `role`, `correo`, `telefono`, `fotografia`, `activo`, `cursoId` (solo estudiantes), `matricula` |
| **`courses`** | ID de Curso (ej. `course-1`) | `nombre`, `nivel`, `activo`, `secciones` (array) |
| **`subjects`** | ID de Materia (ej. `subject-1`) | `nombre`, `cursoId`, `docenteId` |
| **`grades`** | ID de Nota generado | `estudianteId`, `materiaId`, `materiaNombre`, `p1`, `p2`, `p3`, `p4`, `promedio`, `estado` (`'Aprobado' \| 'Reprobado'`), `updatedAt` |
| **`attendance`** | ID autogenerado | `estudianteId`, `materiaId`, `materiaNombre`, `fecha` (YYYY-MM-DD), `estado` (`'Presente' \| 'Ausente' \| 'Excusa' \| 'Tardanza'`), `hora`, `docente`, `observaciones` |
| **`systemConfig`** | Un único documento `config` | `nombreCentro`, `eslogan`, `logo`, `colorPrimario`, `colorSecundario`, `telefono`, `correo`, `direccion`, `anoEscolar`, `periodoActivo` |

---

<a name="paso-3"></a>
## 3. Paso 3: Instalación de Dependencias
Para conectar la aplicación con Firebase, debes instalar el paquete de Firebase en el proyecto:

```bash
npm install firebase
```

Si vas a realizar la migración o consultas desde el backend de Node/Express en un futuro, también puedes usar `firebase-admin` (el SDK de servidor de Firebase):

```bash
npm install firebase-admin
```

---

<a name="paso-4"></a>
## 4. Paso 4: Inicialización de Firebase en el Proyecto
Crea un archivo llamado `src/firebase.ts` para conectar tu frontend directamente con la base de datos de Firebase:

```typescript
// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Estos datos te los provee Firebase Console al registrar tu aplicación Web
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "liceo-duarte-erp.firebaseapp.com",
  projectId: "liceo-duarte-erp",
  storageBucket: "liceo-duarte-erp.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializar la App de Firebase
const app = initializeApp(firebaseConfig);

// Exportar instancias de servicios
export const db = getFirestore(app);
export const auth = getAuth(app);
```

---

<a name="paso-5"></a>
## 5. Paso 5: Script de Migración Inicial (Subir datos de db.json)
Puedes crear un script temporal en Node (`migrate.js`) para leer los datos actuales de `db.json` e insertarlos automáticamente a Firestore utilizando tu cuenta de servicio.

1. En Firebase Console, ve a **Configuración del proyecto** ⚙️ > **Cuentas de servicio**.
2. Haz clic en **Generar nueva clave privada**. Esto descargará un archivo `.json` con tus credenciales seguras de servidor.
3. Coloca el archivo descargado en la raíz y llámalo `serviceAccountKey.json` (asegúrate de que esté en tu `.gitignore`).
4. Crea un script llamado `migrate.js` en tu raíz con el siguiente código:

```javascript
// migrate.js
const admin = require("firebase-admin");
const fs = require("fs");

// Inicializar Firebase Admin con la cuenta de servicio
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

// Leer el archivo local db.json
const localData = JSON.parse(fs.readFileSync("./db.json", "utf8"));

async function migrateCollection(collectionName, dataArray) {
  console.log(`Migrando colección: ${collectionName}...`);
  const batch = firestore.batch();
  
  dataArray.forEach((item) => {
    // Si el objeto tiene un campo ID definido lo usamos como ID del documento, de lo contrario Firestore lo autogenera
    const docRef = item.id 
      ? firestore.collection(collectionName).doc(item.id)
      : firestore.collection(collectionName).doc();
      
    batch.set(docRef, item);
  });
  
  await batch.commit();
  console.log(`✅ Colección ${collectionName} migrada con éxito.`);
}

async function runMigration() {
  try {
    if (localData.users) await migrateCollection("users", localData.users);
    if (localData.courses) await migrateCollection("courses", localData.courses);
    if (localData.subjects) await migrateCollection("subjects", localData.subjects);
    if (localData.grades) await migrateCollection("grades", localData.grades);
    if (localData.attendance) await migrateCollection("attendance", localData.attendance);
    if (localData.news) await migrateCollection("news", localData.news);
    if (localData.events) await migrateCollection("events", localData.events);
    if (localData.sysConfig) {
      console.log("Migrando systemConfig...");
      await firestore.collection("systemConfig").doc("config").set(localData.sysConfig);
      console.log("✅ Configuración del sistema migrada.");
    }
    
    console.log("🌟 ¡MIGRACIÓN COMPLETADA CON ÉXITO! Toda la base de datos está en Firebase Firestore.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en la migración:", error);
    process.exit(1);
  }
}

runMigration();
```

Ejecuta el script con:
```bash
node migrate.js
```

---

<a name="paso-6"></a>
## 6. Paso 6: Adaptar el Backend/Frontend para Consultar Firestore
Una vez migrados los datos, en lugar de usar llamadas `fetch('/api/grades')`, puedes consultar Firestore directamente desde el Frontend React para una experiencia ultra rápida en tiempo real.

### Ejemplo: Leer calificaciones en tiempo real en React
```typescript
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useState, useEffect } from "react";
import { Grade } from "./types";

export function useGrades(studentId?: string) {
  const [grades, setGrades] = useState<Grade[]>([]);

  useEffect(() => {
    let q = query(collection(db, "grades"));
    
    if (studentId) {
      q = query(collection(db, "grades"), where("estudianteId", "==", studentId));
    }

    // Escucha en tiempo real (cualquier cambio de un docente se reflejará instantáneamente sin recargar la página)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gradesData: Grade[] = [];
      snapshot.forEach((doc) => {
        gradesData.push({ id: doc.id, ...doc.data() } as Grade);
      });
      setGrades(gradesData);
    });

    return () => unsubscribe();
  }, [studentId]);

  return grades;
}
```

### Ejemplo: Guardar/Editar notas directamente
```typescript
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export const updateStudentGrade = async (gradeId: string, updatedFields: Partial<Grade>) => {
  const gradeRef = doc(db, "grades", gradeId);
  await updateDoc(gradeRef, {
    ...updatedFields,
    updatedAt: new Date().toISOString().split("T")[0]
  });
};
```

---

<a name="paso-7"></a>
## 7. Paso 7: Reglas de Seguridad Esenciales
Para evitar que estudiantes o personas externas alteren las notas, debes configurar las **Reglas de Seguridad** en la pestaña "Rules" de Firestore en Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función auxiliar para obtener el rol del usuario autenticado
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    // Regla para usuarios: Cualquiera autenticado lee, solo administradores escriben
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && getUserRole() == 'admin';
    }
    
    // Reglas para calificaciones
    match /grades/{gradeId} {
      // Cualquiera autenticado puede ver notas (para mostrar promedios generales y reportes)
      allow read: if request.auth != null;
      
      // Solo docentes, administradores o personal de registro pueden registrar/editar calificaciones
      allow write: if request.auth != null && (
        getUserRole() == 'docente' || 
        getUserRole() == 'admin' || 
        getUserRole() == 'registro'
      );
    }
    
    // Reglas para configuraciones del sistema
    match /systemConfig/{configId} {
      allow read: if true; // Lectura pública
      allow write: if request.auth != null && getUserRole() == 'admin'; // Solo administradores
    }
    
    // Por defecto, cualquier otro documento requiere estar autenticado
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---
¡Con estos pasos tendrás un sistema sumamente profesional, con bases de datos en tiempo real de estándar industrial, protegido contra intrusiones y con capacidad de escalar a miles de estudiantes sin costo adicional gracias al plan gratuito de Firebase! 🚀
