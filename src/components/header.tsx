'use client';

import { logger } from '@/lib/logger-minimal';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { User as UserType } from '@/types';
import { User, LogOut, LogIn, X, Menu, Building } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderSimple';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Save user role to localStorage when user changes
  useEffect(() => {
    if (user?.role) {
      localStorage.setItem('user-role', user.role.toLowerCase());
    } else {
      localStorage.removeItem('user-role');
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      // Clear any stored user data
      localStorage.removeItem('user');
      localStorage.removeItem('user-role');
      router.push('/');
    } catch (error) {
      logger.error('Error logging out:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const getDashboardUrl = (role: string) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'tenant':
        return '/tenant/dashboard';
      case 'owner':
        return '/owner/dashboard';
      case 'broker':
        return '/broker/dashboard';
      case 'runner':
        return '/runner/dashboard';
      case 'support':
        return '/support/dashboard';
      default:
        return '/';
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Building className="w-8 h-8 text-emerald-600" />
            <span className="text-xl font-bold text-gray-900">Rent360</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-emerald-600 transition-colors">
              Inicio
            </Link>
            <Link
              href="/properties/search"
              className="text-gray-700 hover:text-emerald-600 transition-colors"
            >
              Buscar Propiedades
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-emerald-600 transition-colors">
              Nosotros
            </Link>
            <Link
              href="/contact"
              className="text-gray-700 hover:text-emerald-600 transition-colors"
            >
              Contacto
            </Link>
          </nav>

          {/* Auth Buttons - Always visible */}
          <div className="flex items-center space-x-2">
            {loading ? (
              <div className="w-20 h-10 bg-gray-200 rounded animate-pulse"></div>
            ) : user ? (
              <>
                <Button asChild variant="outline" size="sm" className="hidden sm:flex">
                  <Link href={getDashboardUrl(user.role)}>
                    <User className="w-4 h-4 mr-2" />
                    Mi Panel
                  </Link>
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  size="sm"
                >
                  <Link href="/auth/login">
                    <LogIn className="w-4 h-4 mr-2" />
                    Iniciar Sesión
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="hidden sm:flex">
                  <Link href="/auth/register">Registrarse</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={toggleMenu}>
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-gray-700 hover:text-emerald-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link
                href="/properties/search"
                className="text-gray-700 hover:text-emerald-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Buscar Propiedades
              </Link>
              <Link
                href="/about"
                className="text-gray-700 hover:text-emerald-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Nosotros
              </Link>
              <Link
                href="/contact"
                className="text-gray-700 hover:text-emerald-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contacto
              </Link>
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                {loading ? (
                  <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
                ) : user ? (
                  <>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={getDashboardUrl(user.role)} onClick={() => setIsMenuOpen(false)}>
                        <User className="w-4 h-4 mr-2" />
                        Mi Panel
                      </Link>
                    </Button>
                    <Button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar Sesión
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      asChild
                      className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}>
                        Registrarse
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
