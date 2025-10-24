'use client';

import { logger } from '@/lib/logger-minimal';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building, EyeOff, Eye, LogIn } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderSimple';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  // PROTECCIÓN CRÍTICA: Prevenir que las credenciales aparezcan en la URL
  useEffect(() => {
    // Limpiar cualquier query parameter de la URL inmediatamente
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const hasCredentialsInUrl = url.searchParams.has('email') || url.searchParams.has('password');

      if (hasCredentialsInUrl) {
        console.warn('🚨 SEGURIDAD: Credenciales detectadas en URL - limpiando inmediatamente');
        // Limpiar los parámetros de la URL sin recargar la página
        url.searchParams.delete('email');
        url.searchParams.delete('password');
        window.history.replaceState({}, '', url.pathname + url.hash);

        // Mostrar advertencia al usuario
        setError('Se detectó un problema de seguridad. Las credenciales han sido limpiadas de la URL.');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // SEGURIDAD CRÍTICA: Verificar que no haya datos sensibles en la URL antes de proceder
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has('email') || currentUrl.searchParams.has('password')) {
        console.error('🚨 SEGURIDAD: Intento de envío con credenciales en URL - abortando');
        setError('Error de seguridad detectado. Refresca la página e intenta nuevamente.');
        setIsLoading(false);
        return;
      }
    }

    try {
      console.log('🔐 Iniciando login desde formulario con email:', email);
      // Usar el método login del AuthProvider que maneja todo el flujo correctamente
      await login(email, password);

      // Pequeño delay para asegurar que las cookies HTTP-only estén disponibles
      await new Promise(resolve => setTimeout(resolve, 500));

      // El AuthProvider ya manejó el login, ahora redirigir al dashboard
      // Nota: El AuthProvider no maneja la redirección, así que lo hacemos aquí
      // Primero necesitamos obtener el usuario actual para determinar el dashboard
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const dashboardUrl = getDashboardUrl(user.role);
        try {
          sessionStorage.setItem('r360_splash_after_login', '1');
        } catch {}
        router.push(dashboardUrl);
      } else {
        // Fallback si no hay datos en localStorage
        router.push('/tenant/dashboard');
      }
    } catch (error) {
      logger.error('Error en login:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError(error instanceof Error ? error.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const getDashboardUrl = (role: string) => {
    // Normalizar rol a mayúsculas para comparación consistente
    const normalizedRole = role.toUpperCase();
    switch (normalizedRole) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'TENANT':
        return '/tenant/dashboard';
      case 'OWNER':
        return '/owner/dashboard';
      case 'BROKER':
        return '/broker/dashboard';
      case 'RUNNER':
        return '/runner/dashboard';
      case 'SUPPORT':
        return '/support/dashboard';
      case 'PROVIDER':
        return '/provider/dashboard';
      case 'MAINTENANCE':
        return '/maintenance';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary">
            <Building className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Iniciar Sesión</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ¿No tienes una cuenta?{' '}
            <Link href="/auth/register" className="font-medium text-primary hover:text-primary/80">
              Regístrate aquí
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
