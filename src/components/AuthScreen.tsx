/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, Key, User, ShieldAlert, ArrowRight, BookOpen } from 'lucide-react';
import { User as UserType, UserRole } from '../types';

interface AuthScreenProps {
  onBackToWeb: () => void;
  onLoginSuccess: (user: UserType) => void;
  initialRole?: UserRole;
}

export default function AuthScreen({ onBackToWeb, onLoginSuccess, initialRole }: AuthScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick access accounts to let the user immediately experience the system!
  const shortcuts = [
    { label: 'Administrador', user: 'admin', pass: 'admin123', desc: 'Control institucional absoluto' },
    { label: 'Director', user: 'director', pass: 'director123', desc: 'Vista directiva integral' },
    { label: 'Encargado Registro', user: 'registro', pass: 'registro123', desc: 'Registro y firmas de reportes' },
    { label: 'Docente (Mate)', user: 'profesor1', pass: 'profesor1123', desc: 'Asistencia, Tareas y Notas' },
    { label: 'Estudiante', user: 'estudiante1', pass: 'estudiante1123', desc: 'Ver Notas, Tareas y Descarga de Boletín' },
    { label: 'Padre / Tutor', user: 'padre1', pass: 'padre1123', desc: 'Seguimiento de hijos' },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    setLoading(true);
    setError(null);

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Credenciales inválidas.');
        }
        return res.json();
      })
      .then(data => {
        if (data.success && data.user) {
          onLoginSuccess(data.user);
        } else {
          setError(data.message || 'Error de autenticación.');
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Error al iniciar sesión. Verifique sus credenciales (Ej. contraseña por defecto: usuario + 123).');
        setLoading(false);
      });
  };

  const useShortcut = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Visual background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.08),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(90,45,26,0.25),transparent)] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <button
          onClick={onBackToWeb}
          className="inline-flex items-center space-x-2 text-neutral-400 hover:text-white text-xs font-semibold uppercase tracking-wider mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Sitio Público</span>
        </button>

        <div className="flex items-center justify-center space-x-3">
          <div className="bg-[#D4AF37] p-2.5 rounded-xl shadow-md">
            <BookOpen className="h-6 w-6 text-[#5A2D1A]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl tracking-tight leading-none">PORTAL ACADÉMICO</h2>
            <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold mt-1 block">ERP / CRM Educativo Integrado</span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-[#1E1E1E] border border-neutral-800 py-8 px-4 sm:rounded-3xl sm:px-10 shadow-2xl space-y-6">
          
          <div className="text-center space-y-1">
            <h3 className="font-display font-semibold text-base text-white">Inicio de Sesión Académica</h3>
            <p className="text-xs text-neutral-400 font-light">Ingrese sus credenciales de acceso para acceder a sus tableros personalizados.</p>
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-800/40 p-4 rounded-xl flex items-start space-x-3 text-xs text-red-200">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Nombre de Usuario / Matrícula</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#D4AF37] rounded-xl pl-10 pr-3 py-3 text-xs text-white focus:outline-none focus:ring-0 transition-colors"
                  placeholder="Ej: admin, estudiante1, profesor1"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Contraseña de Seguridad</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                  <Key className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#D4AF37] rounded-xl pl-10 pr-3 py-3 text-xs text-white focus:outline-none focus:ring-0 transition-colors"
                  placeholder="Introduzca su contraseña..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-[#D4AF37] hover:bg-[#F3D065] disabled:bg-neutral-800 text-[#3F1D10] font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-md mt-6"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#5A2D1A] border-t-transparent" />
              ) : (
                <>
                  <span>Ingresar al Portal de Gestión</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Exploration Box */}
          <div className="pt-6 border-t border-neutral-800 space-y-3">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block text-center">Atajos Rápidos de Exploración</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {shortcuts.map((sc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => useShortcut(sc.user, sc.pass)}
                  className="bg-neutral-900 hover:bg-[#5A2D1A]/30 border border-neutral-800 hover:border-[#D4AF37]/30 p-2.5 rounded-xl text-left transition-all text-[11px]"
                  title={sc.desc}
                >
                  <span className="font-semibold block text-[#D4AF37] leading-none mb-1">{sc.label}</span>
                  <span className="text-[9px] text-neutral-500 font-mono block leading-none">Contraseña: 123</span>
                </button>
              ))}
            </div>
            <span className="text-[9px] text-neutral-500 font-light block text-center italic">
              *Nota: Las contraseñas por defecto corresponden al nombre de usuario + &ldquo;123&rdquo; (ej: admin123, estudiante1123).
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
