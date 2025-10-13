'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  X, 
  Smartphone, 
  Wifi, 
  Zap, 
  Shield, 
  CheckCircle,
  Clock,
  Star,
  ArrowRight
} from 'lucide-react';
import { usePWA } from '@/lib/pwa';
import { cn } from '@/lib/utils';

interface PWAInstallPromptProps {
  className?: string;
  position?: 'top' | 'bottom' | 'modal';
  autoShow?: boolean;
  delay?: number;
}

export default function PWAInstallPrompt({ 
  className,
  position = 'bottom',
  autoShow = true,
  delay = 3000
}: PWAInstallPromptProps) {
  const { canInstall, isInstalled, showInstallPrompt } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (autoShow && canInstall && !isInstalled && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);

      return () => clearTimeout(timer);
    }
    // No cleanup needed when conditions are not met
    return undefined;
  }, [autoShow, canInstall, isInstalled, isDismissed, delay]);

  useEffect(() => {
    if (isInstalled) {
      setIsVisible(false);
    }
    // No cleanup needed for this effect
    return undefined;
  }, [isInstalled]);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await showInstallPrompt();
      if (success) {
        setIsVisible(false);
      }
    } catch (error) {
      logger.error('Error durante la instalación:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    
    // Guardar en localStorage para no mostrar de nuevo
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // No mostrar si ya está instalada o no se puede instalar
  if (!canInstall || isInstalled || isDismissed) {
    return null;
  }

  // Verificar si fue descartada anteriormente
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  const features = [
    {
      icon: Smartphone,
      title: 'Experiencia Nativa',
      description: 'Funciona como una aplicación nativa en tu dispositivo'
    },
    {
      icon: Wifi,
      title: 'Funciona Offline',
      description: 'Accede a tus datos incluso sin conexión a internet'
    },
    {
      icon: Zap,
      title: 'Carga Rápida',
      description: 'Velocidad optimizada y actualizaciones automáticas'
    },
    {
      icon: Shield,
      title: 'Seguro y Privado',
      description: 'Tus datos están protegidos y seguros'
    }
  ];

  if (position === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Download className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Instalar Rent360</CardTitle>
            <CardDescription>
              Instala Rent360 en tu dispositivo para una mejor experiencia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{feature.title}</div>
                    <div className="text-xs text-muted-foreground">{feature.description}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleInstall} 
                disabled={isInstalling}
                className="flex-1"
              >
                {isInstalling ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Instalando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Instalar
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDismiss}
                className="px-3"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground text-center">
              Puedes instalar la app desde el menú del navegador en cualquier momento
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(
      'fixed z-50 w-full max-w-sm mx-auto',
      position === 'top' ? 'top-4 left-1/2 transform -translate-x-1/2' : 'bottom-4 left-1/2 transform -translate-x-1/2',
      className
    )}>
      <Card className="shadow-lg border-0">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Download className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm">Instalar Rent360</h4>
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Nuevo
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Obtén acceso rápido y funcionalidad offline
              </p>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="flex-1"
                >
                  {isInstalling ? (
                    <>
                      <Clock className="h-3 w-3 mr-1 animate-spin" />
                      Instalando
                    </>
                  ) : (
                    <>
                      <Download className="h-3 w-3 mr-1" />
                      Instalar
                    </>
                  )}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleClose}
                  className="px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
