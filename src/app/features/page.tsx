'use client';

import React from 'react';

// Forzar renderizado dinámico para evitar errores de prerendering
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Globe,
  Smartphone,
  Cpu,
  TrendingUp,
  MessageSquare,
  Zap,
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react';

export default function FeaturesPage() {
  const t = useTranslations();

  const features = [
    {
      id: 'i18n',
      icon: Globe,
      title: 'Internacionalización Completa',
      description: 'Soporte multiidioma con español e inglés, detección automática de idioma y traducciones completas.',
      status: 'completed',
      benefits: [
        'Interfaz completamente traducida',
        'Detección automática de idioma del navegador',
        'Selector de idioma integrado',
        'Preparado para múltiples idiomas'
      ]
    },
    {
      id: 'pwa',
      icon: Smartphone,
      title: 'PWA con Capacidades Offline',
      description: 'Aplicación web progresiva que funciona sin conexión a internet.',
      status: 'completed',
      benefits: [
        'Instalación como aplicación nativa',
        'Funcionamiento offline completo',
        'Sincronización automática de datos',
        'Notificaciones push'
      ]
    },
    {
      id: 'microservices',
      icon: Cpu,
      title: 'Arquitectura Microservicios',
      description: 'Sistema modular con servicios independientes para máxima escalabilidad.',
      status: 'completed',
      benefits: [
        'Servicio de autenticación independiente',
        'Servicio de propiedades dedicado',
        'API Gateway centralizado',
        'Escalabilidad horizontal'
      ]
    },
    {
      id: 'ml',
      icon: TrendingUp,
      title: 'Machine Learning Predictivo',
      description: 'Inteligencia artificial para predicciones de precios y recomendaciones.',
      status: 'completed',
      benefits: [
        'Predicción de precios de propiedades',
        'Análisis de demanda del mercado',
        'Recomendaciones personalizadas',
        'Modelos de ML entrenados'
      ]
    },
    {
      id: 'websockets',
      icon: MessageSquare,
      title: 'Notificaciones en Tiempo Real',
      description: 'Comunicación bidireccional en tiempo real con WebSockets.',
      status: 'completed',
      benefits: [
        'Chat en tiempo real',
        'Notificaciones instantáneas',
        'Actualizaciones en vivo',
        'Estado de conexión en tiempo real'
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'planned':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in-progress':
        return <Zap className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'in-progress':
        return 'En Progreso';
      case 'planned':
        return 'Planificado';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <section className="bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 text-white pt-16">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-emerald-800 text-emerald-100">
              🚀 Nuevas Funcionalidades
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Rent360 Avanzado
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-emerald-100">
              Tecnología de vanguardia para la gestión inmobiliaria del futuro
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
                <Link href="/auth/register">
                  Probar Ahora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-emerald-900">
                <Link href="#features">
                  Ver Funcionalidades
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Funcionalidades Avanzadas
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Tecnología de última generación integrada en Rent360
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
              <TabsTrigger value="overview">Vista General</TabsTrigger>
              <TabsTrigger value="i18n">i18n</TabsTrigger>
              <TabsTrigger value="pwa">PWA</TabsTrigger>
              <TabsTrigger value="microservices">Microservicios</TabsTrigger>
              <TabsTrigger value="ml">ML</TabsTrigger>
              <TabsTrigger value="websockets">WebSockets</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature) => {
                  const IconComponent = feature.icon;

                  return (
                    <Card key={feature.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <IconComponent className="h-6 w-6 text-primary" />
                          </div>
                          <Badge className={getStatusColor(feature.status)}>
                            {getStatusIcon(feature.status)}
                            <span className="ml-1">{getStatusText(feature.status)}</span>
                          </Badge>
                        </div>

                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                        <CardDescription className="text-base">
                          {feature.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        <ul className="space-y-2">
                          {feature.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Feature-specific tabs */}
            {features.map((feature) => {
              const IconComponent = feature.icon;

              return (
                <TabsContent key={feature.id} value={feature.id} className="space-y-8">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                          <IconComponent className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl">{feature.title}</CardTitle>
                          <CardDescription className="text-lg">
                            {feature.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3 text-green-600">Beneficios</h4>
                          <ul className="space-y-2">
                            {feature.benefits.map((benefit, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3 text-blue-600">Estado</h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(feature.status)}>
                                {getStatusIcon(feature.status)}
                                <span className="ml-1">{getStatusText(feature.status)}</span>
                              </Badge>
                            </div>

                            {feature.status === 'completed' && (
                              <div className="text-sm text-gray-600">
                                ✅ Implementación completa y funcional
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Demo section */}
                      <div className="border-t pt-6">
                        <h4 className="font-semibold mb-3">Demo Interactivo</h4>
                        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                          <div className="text-center">
                            <IconComponent className="h-12 w-12 text-primary mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">
                              Demo interactivo próximamente disponible
                            </p>
                            <Button className="mt-4" disabled>
                              Probar Demo
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              ¿Listo para experimentar la próxima generación de Rent360?
            </h2>
            <p className="text-xl mb-8 text-emerald-100">
              Todas estas funcionalidades avanzadas están disponibles ahora mismo en Rent360
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="bg-white text-emerald-600 hover:bg-emerald-50">
                <Link href="/auth/register">
                  Comenzar Ahora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button asChild size="lg" variant="secondary" className="bg-white text-emerald-600 hover:bg-emerald-50">
                <Link href="/features">
                  Explorar Más
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
