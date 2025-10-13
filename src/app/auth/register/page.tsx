'use client';

import { logger } from '@/lib/logger-minimal';
import { validateRut, isValidRut, formatRut } from '@/lib/rut-validation';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, EyeOff, Eye, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'TENANT',
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
    { value: 'TENANT', label: 'Inquilino' },
    { value: 'OWNER', label: 'Propietario' },
    { value: 'BROKER', label: 'Corredor' },
    { value: 'PROVIDER', label: 'Proveedor de Servicios' },
    { value: 'MAINTENANCE', label: 'Servicio de Mantenimiento' },
    { value: 'RUNNER', label: 'Runner360' },
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
      setError('El teléfono debe tener formato chileno válido (ej: +56 9 1234 5678)');
      setIsLoading(false);
      return;
    }

    // Validación de campos obligatorios adicionales
    if (!formData.name || formData.name.trim().length < 2) {
      setError('El nombre es obligatorio y debe tener al menos 2 caracteres');
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
          confirmPassword: formData.confirmPassword,
          role: formData.role,
          // Campos obligatorios
          rut: rutValidation.cleanRut,
          // Campos opcionales
          phone: formData.phone || undefined,
          dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
          gender: formData.gender || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          commune: formData.commune || undefined,
          region: formData.region || undefined,
          // Campos adicionales
          phoneSecondary: formData.phoneSecondary || undefined,
          emergencyContact: formData.emergencyContact || undefined,
          emergencyPhone: formData.emergencyPhone || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Hacer login automático después del registro exitoso
        try {
          const loginResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
            }),
          });

          if (loginResponse.ok) {
            // Login exitoso, redirigir al dashboard
            const dashboardUrl = getDashboardUrl(data.user.role);
            try {
              sessionStorage.setItem('r360_splash_after_login', '1');
            } catch {}
            router.push(dashboardUrl);
            router.refresh();
          } else {
            // Si falla el login automático, redirigir al login manual
            router.push('/auth/login?message=Registro exitoso, por favor inicia sesión');
          }
        } catch (loginError) {
          logger.error('Error en login automático después del registro:', { error: loginError });
          router.push('/auth/login?message=Registro exitoso, por favor inicia sesión');
        }
      } else {
        // Si ya hay un error específico de validación, no lo sobrescribir
        if (!error) {
          setError(data.error || 'Error al registrarse. Por favor verifica tus datos.');
        }
      }
    } catch (error) {
      logger.error('Error en registro:', { error: error instanceof Error ? error.message : String(error) });
      setError('Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const getDashboardUrl = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return '/admin/dashboard';
      case 'tenant': return '/tenant/dashboard';
      case 'owner': return '/owner/dashboard';
      case 'broker': return '/broker/dashboard';
      case 'runner': return '/runner/dashboard';
      case 'support': return '/support/dashboard';
      case 'provider': return '/provider/dashboard';
      case 'maintenance': return '/maintenance';
      default: return '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary">
            <Building className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">
                Nombre Completo
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Juan Pérez"
              />
            </div>
            
            <div>
              <Label htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
              />
            </div>

            {/* Campo RUT obligatorio */}
            <div>
              <Label htmlFor="rut">
                RUT <span className="text-destructive">*</span>
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="rut"
                  name="rut"
                  type="text"
                  required
                  value={formData.rut}
                  onChange={handleChange}
                  className={`pr-10 ${
                    rutError ? 'border-destructive focus:border-destructive' :
                    rutValid ? 'border-green-500 focus:border-green-500' : ''
                  }`}
                  placeholder="12.345.678-9"
                  maxLength={12}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {rutValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : rutError ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : null}
                </div>
              </div>
              {rutError && (
                <p className="mt-1 text-sm text-destructive">{rutError}</p>
              )}
              {rutValid && (
                <p className="mt-1 text-sm text-green-600">RUT válido ✓</p>
              )}
            </div>

            {/* Campo teléfono opcional */}
            <div>
              <Label htmlFor="phone">
                Teléfono
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
              />
            </div>

            {/* Campos opcionales de perfil */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">
                  Fecha de Nacimiento
                </Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="gender">
                  Género
                </Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Femenino</SelectItem>
                    <SelectItem value="OTHER">Otro</SelectItem>
                    <SelectItem value="PREF_NOT_SAY">Prefiero no decir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="role">
                Tipo de Usuario
              </Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de usuario" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="password">
                Contraseña
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">
                Confirmar Contraseña
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground" />
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
