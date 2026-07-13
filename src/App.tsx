/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AboutUs from './components/AboutUs';
import StudentLife from './components/StudentLife';
import Academics from './components/Academics';
import Admissions from './components/Admissions';
import Governance from './components/Governance';
import Staff from './components/Staff';
import NewsSection from './components/NewsSection';
import Contact from './components/Contact';
import AuthScreen from './components/AuthScreen';
import ERPDashboard from './components/ERP_Dashboard';
import DuarteBot from './components/DuarteBot';
import { NotFoundPage, MaintenancePage } from './components/ErrorPages';
import { User as UserType, UserRole } from './types';
import { BookOpen, ShieldAlert, Search, X, ChevronRight, FileText } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'web' | 'portal' | '404' | 'maintenance'>('web');
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    try {
      const savedUser = localStorage.getItem('juan_pablo_duarte_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error('Error reading user from localStorage:', e);
      return null;
    }
  });
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [initialPortalRole, setInitialPortalRole] = useState<UserRole | undefined>(undefined);

  // Background state for the Search Engine
  const [newsList, setNewsList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [landingData, setLandingData] = useState<any>(null);

  useEffect(() => {
    // Load lists for real-time search engine
    fetch('/api/news')
      .then((res) => res.json())
      .then((data) => setNewsList(data))
      .catch((err) => console.error("Error loading news for search:", err));

    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => setUsersList(data))
      .catch((err) => console.error("Error loading users for search:", err));

    fetch('/api/landing')
      .then((res) => res.json())
      .then((data) => setLandingData(data))
      .catch((err) => console.error("Error loading landing data for search:", err));
  }, [view]); // reload when switching back to home or dashboard

  const handleEnterPortal = () => {
    setInitialPortalRole(undefined);
    setView('portal');
  };

  const handleSelectRoleFromEntrance = (role: UserRole) => {
    setInitialPortalRole(role);
    setView('portal');
  };

  const handleLoginSuccess = (user: UserType) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('juan_pablo_duarte_user', JSON.stringify(user));
    } catch (e) {
      console.error('Error saving user to localStorage:', e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('juan_pablo_duarte_user');
    } catch (e) {
      console.error('Error removing user from localStorage:', e);
    }
  };

  // Search filter matches
  const hasSearch = searchTerm.trim().length > 0;
  const sTerm = searchTerm.toLowerCase();

  const matchedNews = hasSearch ? newsList.filter(n => 
    n.titulo.toLowerCase().includes(sTerm) || 
    n.resumen.toLowerCase().includes(sTerm) ||
    n.contenido.toLowerCase().includes(sTerm)
  ) : [];

  const matchedActivities = hasSearch && landingData?.studentLife?.activities ? landingData.studentLife.activities.filter((a: any) => 
    a.title.toLowerCase().includes(sTerm) || 
    a.description.toLowerCase().includes(sTerm) || 
    a.category.toLowerCase().includes(sTerm)
  ) : [];

  const matchedOrgans = hasSearch && landingData?.governance?.organs ? landingData.governance.organs.filter((o: any) => 
    o.title.toLowerCase().includes(sTerm) || 
    o.desc.toLowerCase().includes(sTerm) ||
    o.integrantes.toLowerCase().includes(sTerm)
  ) : [];

  const matchedFaqs = hasSearch && landingData?.admissions?.faqs ? landingData.admissions.faqs.filter((f: any) => 
    f.q.toLowerCase().includes(sTerm) || 
    f.a.toLowerCase().includes(sTerm)
  ) : [];

  const matchedStaff = hasSearch ? usersList.filter(u => 
    (u.role === 'admin' || u.role === 'director' || u.role === 'docente') && 
    (u.nombreCompleto.toLowerCase().includes(sTerm) || 
     (u.especialidad && u.especialidad.toLowerCase().includes(sTerm)) || 
     (u.biografia && u.biografia.toLowerCase().includes(sTerm)))
  ) : [];

  const totalMatches = matchedNews.length + matchedActivities.length + matchedOrgans.length + matchedFaqs.length + matchedStaff.length;

  const navigateToResult = (sectionHash: string) => {
    setSearchTerm('');
    setTimeout(() => {
      const target = document.querySelector(sectionHash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // If logged in, show ERP Dashboard
  if (currentUser) {
    return (
      <div className={darkMode ? 'dark bg-neutral-900 text-white' : 'bg-neutral-900 text-white'}>
        <ERPDashboard 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          onReturnToWeb={() => { handleLogout(); setView('web'); }} 
        />
      </div>
    );
  }

  // If view is Auth Portal screen
  if (view === 'portal') {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <AuthScreen 
          onBackToWeb={() => setView('web')} 
          onLoginSuccess={handleLoginSuccess}
          initialRole={initialPortalRole}
        />
      </div>
    );
  }

  // If view is 404
  if (view === '404') {
    return <NotFoundPage onBackToHome={() => setView('web')} />;
  }

  // If view is Maintenance
  if (view === 'maintenance') {
    return <MaintenancePage onBackToHome={() => setView('web')} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-neutral-950 text-white' : 'bg-white text-neutral-900'}`}>
      
      {/* Dynamic Navigation */}
      <Navbar 
        onEnterPortal={handleEnterPortal} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Main Sections */}
      <main className="pt-20">
        <Hero 
          onLearnMore={() => {
            const target = document.querySelector('#nosotros');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          onAdmissions={() => {
            const target = document.querySelector('#admisiones');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />

        <AboutUs />
        <StudentLife />
        <Academics />
        <Admissions />
        <Governance />
        <Staff />
        <NewsSection />
        <Contact />
      </main>

      {/* Elegant Search Results Overlay Modal (UX Masterclass) */}
      {hasSearch && (
        <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#5A2D1A] dark:text-[#D4AF37]">
                <Search className="h-5 w-5" />
                <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-white">
                  Resultados para: &ldquo;{searchTerm}&rdquo;
                </h3>
              </div>
              <button 
                onClick={() => setSearchTerm('')}
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Match list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
              {totalMatches === 0 ? (
                <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                  <span className="text-sm font-light">No se encontraron resultados para su búsqueda en el sitio. Pruebe palabras clave como &ldquo;admisiones&rdquo;, &ldquo;robótica&rdquo;, &ldquo;consejo&rdquo;, etc.</span>
                </div>
              ) : (
                <>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-light mt-1">
                    Se encontraron <strong className="font-semibold text-neutral-800 dark:text-white">{totalMatches} coincidencias</strong> agrupadas por sección:
                  </p>

                  {/* Matches: News */}
                  {matchedNews.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">Noticias y Boletines</span>
                      <div className="space-y-1.5">
                        {matchedNews.map((n) => (
                          <button 
                            key={n.id}
                            onClick={() => navigateToResult('#noticias')}
                            className="w-full text-left p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-100/50 dark:border-neutral-800 transition-all flex items-center justify-between"
                          >
                            <div>
                              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">{n.titulo}</span>
                              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block truncate max-w-md">{n.resumen}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-neutral-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matches: Activities */}
                  {matchedActivities.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">Vida Estudiantil</span>
                      <div className="space-y-1.5">
                        {matchedActivities.map((a: any) => (
                          <button 
                            key={a.id}
                            onClick={() => navigateToResult('#vida-estudiantil')}
                            className="w-full text-left p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-100/50 dark:border-neutral-800 transition-all flex items-center justify-between"
                          >
                            <div>
                              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">{a.title}</span>
                              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block truncate max-w-md">{a.description}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-neutral-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matches: Organs */}
                  {matchedOrgans.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">Órganos de Co-Gestión</span>
                      <div className="space-y-1.5">
                        {matchedOrgans.map((o: any) => (
                          <button 
                            key={o.id}
                            onClick={() => navigateToResult('#organos')}
                            className="w-full text-left p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-100/50 dark:border-neutral-800 transition-all flex items-center justify-between"
                          >
                            <div>
                              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">{o.title}</span>
                              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block truncate max-w-md">{o.desc}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-neutral-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matches: FAQs */}
                  {matchedFaqs.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">Preguntas Frecuentes</span>
                      <div className="space-y-1.5">
                        {matchedFaqs.map((f: any, idx: number) => (
                          <button 
                            key={idx}
                            onClick={() => navigateToResult('#admisiones')}
                            className="w-full text-left p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-100/50 dark:border-neutral-800 transition-all flex items-center justify-between"
                          >
                            <div>
                              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">{f.q}</span>
                              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block truncate max-w-md">{f.a}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-neutral-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matches: Staff */}
                  {matchedStaff.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">Docentes y Directores</span>
                      <div className="space-y-1.5">
                        {matchedStaff.map((u: any) => (
                          <button 
                            key={u.id}
                            onClick={() => navigateToResult('#gestion')}
                            className="w-full text-left p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-100/50 dark:border-neutral-800 transition-all flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-3">
                              <img src={u.fotografia} alt={u.nombreCompleto} className="w-8 h-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                              <div>
                                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">{u.nombreCompleto}</span>
                                <span className="text-[10px] text-neutral-400 block">{u.especialidad || 'Cuerpo Docente'}</span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-neutral-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Elegant Sitemap Footer */}
      <footer className="bg-neutral-950 text-neutral-400 py-16 border-t border-neutral-900 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Identity column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-left">
              <div className="bg-[#D4AF37] p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-[#5A2D1A]" />
              </div>
              <span className="font-display font-bold text-white text-base tracking-tight">JUAN PABLO DUARTE</span>
            </div>
            <p className="text-xs leading-relaxed font-light text-neutral-500 text-left">
              Formando líderes íntegros, patriotas y con competencias intelectuales y científicas globales de cara al porvenir de la República Dominicana.
            </p>
          </div>

          {/* Directory Links */}
          <div className="space-y-4 text-left">
            <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-[#D4AF37]">Directorio del Liceo</h4>
            <ul className="space-y-2 text-xs font-light">
              <li><a href="#nosotros" className="hover:text-white transition-colors">Ideario & Historia</a></li>
              <li><a href="#oferta-academica" className="hover:text-white transition-colors">Nivel Inicial y Primaria</a></li>
              <li><a href="#oferta-academica" className="hover:text-white transition-colors">Nivel Secundaria</a></li>
              <li><a href="#gestion" className="hover:text-white transition-colors">Equipo de Dirección</a></li>
            </ul>
          </div>

          {/* Quick Access links */}
          <div className="space-y-4 text-left">
            <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-[#D4AF37]">Trámites y Enlaces</h4>
            <ul className="space-y-2 text-xs font-light">
              <li><a href="#admisiones" className="hover:text-white transition-colors">Proceso de Inscripción</a></li>
              <li><a href="#admisiones" className="hover:text-white transition-colors">Preguntas Frecuentes</a></li>
              <li><button onClick={handleEnterPortal} className="hover:text-white text-left transition-colors">Acceso al Portal Académico</button></li>
              <li><a href="#contacto" className="hover:text-white transition-colors">Contacto de Secretaría</a></li>
            </ul>
          </div>

          {/* Accessibility Demonstration / Debug panel */}
          <div className="space-y-4 bg-neutral-900/60 border border-neutral-900 p-5 rounded-2xl text-left">
            <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-[#D4AF37] flex items-center space-x-1.5">
              <ShieldAlert className="h-4.5 w-4.5" />
              <span>Controles de Demostración</span>
            </h4>
            <p className="text-[10px] text-neutral-500 leading-snug font-light">Simule vistas especiales del sistema para evaluar la experiencia de usuario y manejo de errores:</p>
            <div className="space-y-1.5 pt-2">
              <button 
                onClick={() => setView('404')} 
                className="w-full text-left bg-neutral-950 hover:bg-neutral-900 text-[11px] font-semibold text-neutral-400 px-3 py-2 rounded-lg border border-neutral-800 transition-colors"
              >
                Ver Pantalla de Error 404
              </button>
              <button 
                onClick={() => setView('maintenance')} 
                className="w-full text-left bg-neutral-950 hover:bg-neutral-900 text-[11px] font-semibold text-neutral-400 px-3 py-2 rounded-lg border border-neutral-800 transition-colors"
              >
                Ver Pantalla de Mantenimiento
              </button>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 mt-12 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-600 gap-4">
          <span>&copy; {new Date().getFullYear()} Centro Educativo Juan Pablo Duarte. Todos los derechos reservados.</span>
          <div className="flex space-x-4">
            <span className="hover:text-neutral-500 cursor-pointer">Políticas de Privacidad</span>
            <span>•</span>
            <span className="hover:text-neutral-500 cursor-pointer">Términos de Servicio del Portal</span>
          </div>
        </div>
      </footer>

      {/* Floating DuarteBot for public visitors */}
      <DuarteBot />

    </div>
  );
}
