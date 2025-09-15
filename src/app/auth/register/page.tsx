'use client';

import { logger } from '@/lib/logger-edge';
import { validateRut, isValidRut, formatRut } from '@/lib/rut-validation';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, EyeOff, Eye, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'tenant',
    // Campos obligatorios en Chile
    rut: '',
    // Campos opcionales de perfil
    dateOfBirth: '',
    gender: '',
    phone: '',
    address: '',
    city: '',
    commune: '',
    region: '',
    // Campos adicionales de contacto
    phoneSecondary: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState('');
  const [rutError, setRutError] = useState('');
  const [rutValid, setRutValid] = useState(false);
  const router = useRouter();

  const roles = [
    { value: 'tenant', label: 'Inquilino' },
    { value: 'owner', label: 'Propietario' },
    { value: 'broker', label: 'Corredor' },
    { value: 'runner', label: 'Runner360' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Validación especial para RUT
    if (name === 'rut') {
      const cleanValue = value.replace(/[^0-9kK]/g, '').toUpperCase();
      const formattedValue = cleanValue.length >= 2 ? formatRut(cleanValue) : cleanValue;

      // Validación en tiempo real
      if (cleanValue.length >= 2) {
        const rutValidation = validateRut(cleanValue);
        setRutValid(rutValidation.isValid);
        setRutError(rutValidation.error || '');
      } else {
        setRutValid(false);
        setRutError('');
      }

      setFormData({
        ...formData,
        [name]: formattedValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setRutError('');

    // Validación de contraseñas
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    // Validación de RUT
    if (!formData.rut) {
      setRutError('El RUT es obligatorio');
      setIsLoading(false);
      return;
    }

    const rutValidation = validateRut(formData.rut);
    if (!rutValidation.isValid) {
      setRutError(rutValidation.error || 'RUT inválido');
      setIsLoading(false);
      return;
    }

    // Validación de teléfono si está presente
    if (formData.phone && !/^\+?56\d{8,9}$/.test(formData.phone.replace(/\s+/g, ''))) {
      setError('Formato de teléfono inválido. Use formato chileno (+56XXXXXXXXX)');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          // Campos obligatorios
          rut: rutValidation.cleanRut,
          // Campos opcionales
          phone: formData.phone || null,
          dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
          gender: formData.gender || null,
          address: formData.address || null,
          city: formData.city || null,
          commune: formData.commune || null,
          region: formData.region || null,
          // Campos adicionales
          phoneSecondary: formData.phoneSecondary || null,
          emergencyContact: formData.emergencyContact || null,
          emergencyPhone: formData.emergencyPhone || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirigir al dashboard correspondiente
        const dashboardUrl = getDashboardUrl(data.user.role);
        router.push(dashboardUrl);
        router.refresh();
      } else {
        setError(data.error || 'Error al registrarse');
      }
    } catch (error) {
      logger.error('Error en registro:', { error: error instanceof Error ? error.message : String(error) });
      setError('Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const getDashboardUrl = (role: string) => {
    switch (role) {
      case 'admin': return '/admin/dashboard';
      case 'tenant': return '/tenant/dashboard';
      case 'owner': return '/owner/dashboard';
      case 'broker': return '/broker/dashboard';
      case 'runner': return '/runner/dashboard';
      case 'support': return '/support/dashboard';
      default: return '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-600">
            <Building className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre Completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Juan Pérez"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="tu@email.com"
              />
            </div>

            {/* Campo RUT obligatorio */}
            <div>
              <label htmlFor="rut" className="block text-sm font-medium text-gray-700">
                RUT <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <input
                  id="rut"
                  name="rut"
                  type="text"
                  required
                  value={formData.rut}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-3 py-2 pr-10 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:z-10 sm:text-sm ${
                    rutError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' :
                    rutValid ? 'border-green-500 focus:border-green-500 focus:ring-green-500' :
                    'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="12.345.678-9"
                  maxLength={12}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {rutValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : rutError ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : null}
                </div>
              </div>
              {rutError && (
                <p className="mt-1 text-sm text-red-600">{rutError}</p>
              )}
              {rutValid && (
                <p className="mt-1 text-sm text-green-600">RUT válido ✓</p>
              )}
            </div>

            {/* Campo teléfono opcional */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="+56 9 1234 5678"
              />
            </div>

            {/* Campos opcionales de perfil */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                  Fecha de Nacimiento
                </label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                  Género
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                >
                  <option value="">Seleccionar...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="OTHER">Otro</option>
                  <option value="PREF_NOT_SAY">Prefiero no decir</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Tipo de Usuario
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="••••••••"
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
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Contraseña
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
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
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear Cuenta
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
