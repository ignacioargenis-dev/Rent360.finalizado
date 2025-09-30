'use client';

import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FooterProps {
  className?: string;
}

// Configuración por defecto del footer
const defaultFooterConfig = {
  footerDescription: "Plataforma integral de gestión inmobiliaria que conecta propietarios, inquilinos y profesionales del sector inmobiliario.",
  footerEmail: "contacto@rent360.cl",
  footerPhone: "+56 9 1234 5678",
  footerAddress: "Santiago, Chile",
  footerCopyright: "Desarrollado con ❤️ para el sector inmobiliario chileno",
  termsUrl: "/terms",
  privacyUrl: "/privacy",
  cookiesUrl: "/cookies",
  footerEnabled: true
};

export function Footer({ className }: FooterProps) {
  const [config, setConfig] = useState(defaultFooterConfig);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    // Aquí se podría cargar la configuración desde una API
    // Por ahora usamos valores por defecto
    const loadFooterConfig = async () => {
      try {
        // En el futuro: const response = await fetch('/api/admin/settings/footer');
        // const footerSettings = await response.json();
        // setConfig({ ...defaultFooterConfig, ...footerSettings });
      } catch (error) {
        console.warn('Error loading footer config, using defaults');
      }
    };

    loadFooterConfig();
  }, []);

  if (!config.footerEnabled) {
    return null;
  }

  return (
    <footer className={`bg-card border-t border-border ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img
                src="/logo-rent360-small.png"
                alt="Rent360 Logo"
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-foreground">Rent360</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {config.footerDescription}
            </p>
          </div>

          {/* Enlaces legales */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={config.termsUrl}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link
                  href={config.privacyUrl}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href={config.cookiesUrl}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Contacto</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{config.footerEmail}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{config.footerPhone}</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm text-muted-foreground">
                  {config.footerAddress}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Rent360. Todos los derechos reservados.
          </p>
          <p className="text-sm text-muted-foreground">
            {config.footerCopyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
