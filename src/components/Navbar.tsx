/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Menu, X, Search, LogIn, Moon, Sun } from 'lucide-react';
// @ts-ignore
import logoDuarte from '../assets/images/logo_duarte_1783545572734.jpg';

interface NavbarProps {
  onEnterPortal: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
}

interface MenuLink {
  name: string;
  href?: string;
  submenu?: { name: string; href: string }[];
}

export default function Navbar({ onEnterPortal, darkMode, setDarkMode, searchTerm, setSearchTerm }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems: MenuLink[] = [
    { name: 'Inicio', href: '#inicio' },
    {
      name: 'Institución',
      submenu: [
        { name: 'Historia e Ideario', href: '#nosotros' },
        { name: 'Órganos de Gobierno', href: '#organos' },
        { name: 'Equipo de Dirección', href: '#gestion' },
      ]
    },
    {
      name: 'Académico',
      submenu: [
        { name: 'Oferta Académica', href: '#oferta-academica' },
        { name: 'Proceso de Admisiones', href: '#admisiones' },
      ]
    },
    {
      name: 'Vida Estudiantil',
      submenu: [
        { name: 'Vida Escolar', href: '#vida-estudiantil' },
        { name: 'Noticias y Boletines', href: '#noticias' },
        { name: 'Logros y Honores', href: '#logros' },
      ]
    },
    { name: 'Contacto', href: '#contacto' },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav
      id="main-navbar"
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-neutral-900/95 text-white shadow-md backdrop-blur-md py-2'
          : 'bg-[#5A2D1A]/95 text-neutral-100 py-2.5 border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo Brand with custom SVG seal of Liceo JP Duarte */}
          <div className="flex-shrink-0 flex items-center space-x-3 cursor-pointer" onClick={(e) => {
            const target = document.querySelector('#inicio');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}>
            <div className="p-0.5 rounded-full bg-white shadow-md flex items-center justify-center border border-neutral-200">
              <img 
                src={logoDuarte} 
                alt="Liceo Juan Pablo Duarte Logo" 
                className="h-10 w-10 object-contain rounded-full select-none" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="font-display font-bold tracking-tight text-sm sm:text-base block leading-none">
                JUAN PABLO DUARTE
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold block mt-0.5">
                Centro Educativo
              </span>
            </div>
          </div>

          {/* Desktop Navigation - Compact & Structured Dropdowns */}
          <div className="hidden lg:flex items-center space-x-1">
            {menuItems.map((link) => (
              link.submenu ? (
                <div key={link.name} className="relative group px-1">
                  <button className="px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide hover:text-[#D4AF37] hover:bg-white/5 transition-all flex items-center space-x-1">
                    <span>{link.name}</span>
                    <svg className="w-3 h-3 text-neutral-400 group-hover:text-[#D4AF37] group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {/* Hover Dropdown */}
                  <div className="absolute top-full left-0 mt-1 w-52 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 shadow-xl opacity-0 translate-y-1 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-200 p-1.5 z-50">
                    {link.submenu.map((sub) => (
                      <a
                        key={sub.name}
                        href={sub.href}
                        onClick={(e) => handleLinkClick(e, sub.href)}
                        className="block px-3 py-2.5 rounded-lg text-xs font-medium hover:bg-neutral-900 hover:text-[#D4AF37] transition-all duration-150"
                      >
                        {sub.name}
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href!)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide hover:text-[#D4AF37] hover:bg-white/5 transition-all"
                >
                  {link.name}
                </a>
              )
            ))}
          </div>

          {/* Actions & Utilities */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Search bar */}
            <div className="relative">
              {showSearch ? (
                <div className="flex items-center bg-white/10 rounded-full px-3 py-1 text-xs border border-white/15 transition-all">
                  <input
                    type="text"
                    placeholder="Buscar y Enter..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setSearchTerm(localSearch);
                      }
                    }}
                    className="bg-transparent text-white focus:outline-none w-32 placeholder-neutral-400 text-xs font-light font-sans"
                  />
                  <X className="h-3.5 w-3.5 cursor-pointer text-neutral-400 hover:text-white ml-1" onClick={() => { setLocalSearch(''); setSearchTerm(''); setShowSearch(false); }} />
                </div>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Buscar contenido"
                >
                  <Search className="h-4 w-4 text-neutral-200 hover:text-white" />
                </button>
              )}
            </div>

            {/* Dark Mode toggler */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-[#D4AF37]"
              title={darkMode ? "Modo Claro" : "Modo Oscuro"}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Portal Académico button */}
            <button
              onClick={onEnterPortal}
              className="flex items-center space-x-1.5 bg-[#D4AF37] hover:bg-[#F3D065] text-[#3F1D10] font-bold text-xs tracking-wider uppercase px-4 py-2 rounded-xl transition-all duration-300 shadow-sm hover:scale-102"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Portal Académico</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-[#D4AF37]"
            >
              {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md hover:bg-white/10 focus:outline-none transition-colors"
            >
              {isOpen ? <X className="h-5.5 w-5.5" /> : <Menu className="h-5.5 w-5.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden bg-neutral-950 text-neutral-100 border-t border-neutral-800 animate-fade-in py-4 px-4 space-y-4 shadow-2xl">
          {/* Mobile Search */}
          <div className="flex items-center bg-white/5 rounded-xl px-3 py-2 text-sm border border-neutral-800">
            <Search className="h-4 w-4 text-neutral-400 mr-2" />
            <input
              type="text"
              placeholder="Buscar y presione Enter..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchTerm(localSearch);
                }
              }}
              className="bg-transparent text-white focus:outline-none w-full text-xs font-light"
            />
            {localSearch && <X className="h-4 w-4 cursor-pointer text-neutral-400" onClick={() => { setLocalSearch(''); setSearchTerm(''); }} />}
          </div>

          <div className="grid grid-cols-1 gap-4 text-left border-t border-neutral-800 pt-4">
            {menuItems.map((item) => (
              <div key={item.name} className="space-y-1">
                {item.submenu ? (
                  <>
                    <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold block px-3">
                      {item.name}
                    </span>
                    <div className="pl-3 grid grid-cols-2 gap-1">
                      {item.submenu.map((sub) => (
                        <a
                          key={sub.name}
                          href={sub.href}
                          onClick={(e) => handleLinkClick(e, sub.href)}
                          className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-400 hover:bg-white/5 hover:text-white block"
                        >
                          {sub.name}
                        </a>
                      ))}
                    </div>
                  </>
                ) : (
                  <a
                    href={item.href}
                    onClick={(e) => handleLinkClick(e, item.href!)}
                    className="px-3 py-2 rounded-md text-xs font-bold text-neutral-100 hover:bg-white/5 block"
                  >
                    {item.name}
                  </a>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => { setIsOpen(false); onEnterPortal(); }}
            className="w-full flex items-center justify-center space-x-2 bg-[#D4AF37] text-[#3F1D10] font-bold text-xs uppercase tracking-wider py-3 rounded-xl shadow-md mt-4"
          >
            <LogIn className="h-4 w-4" />
            <span>Acceder Portal Académico</span>
          </button>
        </div>
      )}
    </nav>
  );
}
