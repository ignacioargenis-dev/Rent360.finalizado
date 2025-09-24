import { useState, useCallback } from 'react';
import { validateAndSanitize, sanitizeInput, sanitizeEmail, sanitizePhone, sanitizeRUT } from '@/lib/input-validation';

// Hook para validación de formularios
export function useValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validateField = useCallback(async (
    fieldName: string,
    value: any,
    schema: any,
    customValidators?: ((value: any) => Promise<string | null>)[]
  ) => {
    setIsValidating(true);

    try {
      // Validación básica con schema
      const fieldSchema = schema.shape?.[fieldName];
      if (fieldSchema) {
        const result = fieldSchema.safeParse(value);
        if (!result.success) {
          const errorMessage = result.error.errors[0]?.message || 'Campo inválido';
          setErrors(prev => ({ ...prev, [fieldName]: errorMessage }));
          return false;
        }
      }

      // Validadores personalizados
      if (customValidators) {
        for (const validator of customValidators) {
          const error = await validator(value);
          if (error) {
            setErrors(prev => ({ ...prev, [fieldName]: error }));
            return false;
          }
        }
      }

      // Si todo está bien, limpiar error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });

      return true;
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: 'Error de validación interno'
      }));
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateForm = useCallback(async (
    data: Record<string, any>,
    schema: any,
    customValidators?: Record<string, ((value: any) => Promise<string | null>)[]>
  ) => {
    setIsValidating(true);
    const newErrors: Record<string, string> = {};

    try {
      // Validación completa del formulario
      const validation = validateAndSanitize(schema, data);

      if (!validation.success) {
        validation.errors.forEach(error => {
          const [fieldName, message] = error.split(': ');
          if (fieldName && message) {
            newErrors[fieldName] = message;
          }
        });
      }

      // Validadores personalizados
      if (customValidators) {
        for (const [fieldName, validators] of Object.entries(customValidators)) {
          for (const validator of validators) {
            const error = await validator(data[fieldName]);
            if (error) {
              newErrors[fieldName] = error;
              break;
            }
          }
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;

    } catch (error) {
      setErrors({ form: 'Error de validación interno' });
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  return {
    errors,
    isValidating,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    hasErrors: Object.keys(errors).length > 0,
  };
}

// Hook para sanitización de inputs
export function useSanitization() {
  const sanitizeText = useCallback((text: string) => sanitizeInput(text), []);
  const sanitizeEmailInput = useCallback((email: string) => sanitizeEmail(email), []);
  const sanitizePhoneInput = useCallback((phone: string) => sanitizePhone(phone), []);
  const sanitizeRUTInput = useCallback((rut: string) => sanitizeRUT(rut), []);

  return {
    sanitizeText,
    sanitizeEmail: sanitizeEmailInput,
    sanitizePhone: sanitizePhoneInput,
    sanitizeRUT: sanitizeRUTInput,
  };
}

// Hook para validación en tiempo real
export function useRealtimeValidation(delay: number = 300) {
  const [debouncedValue, setDebouncedValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [validationMessage, setValidationMessage] = useState('');

  const validateRealtime = useCallback(
    (value: string, validator: (value: string) => Promise<boolean | string>) => {
      const timeoutId = setTimeout(async () => {
        try {
          const result = await validator(value);
          if (typeof result === 'string') {
            setIsValid(false);
            setValidationMessage(result);
          } else {
            setIsValid(result);
            setValidationMessage('');
          }
        } catch (error) {
          setIsValid(false);
          setValidationMessage('Error de validación');
        }
      }, delay);

      return () => clearTimeout(timeoutId);
    },
    [delay]
  );

  return {
    debouncedValue,
    isValid,
    validationMessage,
    setDebouncedValue,
    validateRealtime,
  };
}

// Validadores comunes reutilizables
export const commonValidators = {
  required: (value: any) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return Promise.resolve('Este campo es requerido');
    }
    return Promise.resolve(null);
  },

  email: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Promise.resolve('Email inválido');
    }
    return Promise.resolve(null);
  },

  phone: (phone: string) => {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,20}$/;
    if (!phoneRegex.test(phone)) {
      return Promise.resolve('Teléfono inválido');
    }
    return Promise.resolve(null);
  },

  rut: (rut: string) => {
    const rutRegex = /^\d{7,8}-[\dK]$/;
    if (!rutRegex.test(rut.toUpperCase())) {
      return Promise.resolve('RUT inválido');
    }
    return Promise.resolve(null);
  },

  minLength: (minLength: number) => (value: string) => {
    if (value.length < minLength) {
      return Promise.resolve(`Debe tener al menos ${minLength} caracteres`);
    }
    return Promise.resolve(null);
  },

  maxLength: (maxLength: number) => (value: string) => {
    if (value.length > maxLength) {
      return Promise.resolve(`No puede tener más de ${maxLength} caracteres`);
    }
    return Promise.resolve(null);
  },

  numeric: (value: string) => {
    if (isNaN(Number(value))) {
      return Promise.resolve('Debe ser un número');
    }
    return Promise.resolve(null);
  },

  positive: (value: number) => {
    if (value <= 0) {
      return Promise.resolve('Debe ser un número positivo');
    }
    return Promise.resolve(null);
  },

  url: (url: string) => {
    try {
      new URL(url);
      return Promise.resolve(null);
    } catch {
      return Promise.resolve('URL inválida');
    }
  },
};
