'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Info 
} from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingState({ 
  message = 'Cargando...', 
  size = 'md',
  className = '' 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="text-center">
        <Loader2 className={`${sizeClasses[size]} animate-spin mx-auto mb-4 text-primary`} />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  className?: string;
}

export function ErrorState({ 
  title = 'Error',
  message = 'Ha ocurrido un error inesperado',
  onRetry,
  showRetry = true,
  className = ''
}: ErrorStateProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{message}</p>
          {showRetry && onRetry && (
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  title = 'No hay datos',
  message = 'No se encontraron resultados',
  icon = <Info className="w-12 h-12 text-gray-400" />,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="text-center">
          <div className="mx-auto mb-4">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{message}</p>
          {action && (
            <div className="mt-4">
              {action}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SuccessStateProps {
  title?: string;
  message?: string;
  onContinue?: () => void;
  className?: string;
}

export function SuccessState({ 
  title = 'Éxito',
  message = 'Operación completada exitosamente',
  onContinue,
  className = ''
}: SuccessStateProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{message}</p>
          {onContinue && (
            <Button onClick={onContinue}>
              Continuar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface WarningStateProps {
  title?: string;
  message?: string;
  onAction?: () => void;
  actionText?: string;
  className?: string;
}

export function WarningState({ 
  title = 'Advertencia',
  message = 'Hay algo que debes revisar',
  onAction,
  actionText = 'Revisar',
  className = ''
}: WarningStateProps) {
  return (
    <Alert className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">{title}</h4>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          {onAction && (
            <Button onClick={onAction} variant="outline" size="sm">
              {actionText}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
}

export function LoadingOverlay({ 
  isLoading, 
  children, 
  message = 'Cargando...' 
}: LoadingOverlayProps) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <LoadingState message={message} />
      </div>
    </div>
  );
}

interface AsyncStateProps {
  isLoading: boolean;
  error: Error | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
  loadingMessage?: string;
  errorMessage?: string;
}

export function AsyncState({ 
  isLoading, 
  error, 
  isEmpty = false,
  emptyMessage = 'No hay datos disponibles',
  onRetry,
  children,
  loadingMessage = 'Cargando...',
  errorMessage
}: AsyncStateProps) {
  if (isLoading) {
    return <LoadingState message={loadingMessage} />;
  }

  if (error) {
    return (
      <ErrorState 
        message={errorMessage || error.message}
        onRetry={onRetry}
      />
    );
  }

  if (isEmpty) {
    return <EmptyState message={emptyMessage} />;
  }

  return <>{children}</>;
}

export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
    </div>
  );
}
