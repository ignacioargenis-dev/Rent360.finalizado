'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Users,
  Target,
  Calendar,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsTutorialPage() {
  return (
    <UnifiedDashboardLayout
      title="Tutorial de Analytics"
      subtitle="Aprende a interpretar y utilizar las métricas de rendimiento"
    >
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/broker/analytics">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Analytics
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tutorial: Analytics de Rendimiento</h1>
            <p className="text-gray-600">Guía completa para entender y optimizar tus métricas</p>
          </div>
        </div>

        {/* Introduction */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Introducción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              El sistema de analytics te proporciona métricas clave para entender el rendimiento de
              tu negocio inmobiliario. Aprender a interpretar estos datos te ayudará a tomar mejores
              decisiones y optimizar tus resultados.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <p className="text-blue-800 text-sm">
                <strong>Consejo:</strong> Revisa tus métricas semanalmente para identificar
                tendencias y oportunidades de mejora.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Guide */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Métricas Principales
            </CardTitle>
            <CardDescription>Interpretación de cada indicador clave</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold">Vistas de Propiedades</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Número de veces que tus propiedades han sido vistas por potenciales inquilinos.
                </p>
                <div className="text-xs text-green-600">
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  Meta: Aumentar 15% mensual
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold">Consultas Generadas</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Número de consultas o mensajes recibidos sobre tus propiedades.
                </p>
                <div className="text-xs text-green-600">
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  Meta: 8-12 consultas por propiedad mensual
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold">Tasa de Conversión</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Porcentaje de consultas que resultan en contratos firmados.
                </p>
                <div className="text-xs text-orange-600">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  Meta: Mínimo 5-8%
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <h4 className="font-semibold">Tiempo de Respuesta</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Tiempo promedio que tardas en responder consultas.
                </p>
                <div className="text-xs text-green-600">
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  Meta: Menos de 2 horas
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Optimization Strategies */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Estrategias de Optimización
            </CardTitle>
            <CardDescription>Acciones recomendadas para mejorar cada métrica</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Mejorar Fotos de Propiedades</h4>
                <p className="text-sm text-blue-800 mb-2">
                  Las propiedades con fotos profesionales generan hasta 40% más consultas.
                </p>
                <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                  <li>Usa fotos de alta calidad tomadas con buena iluminación</li>
                  <li>Incluye fotos de todos los ambientes</li>
                  <li>Evita fotos borrosas o desordenadas</li>
                  <li>Considera contratar un fotógrafo profesional</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Reducir Tiempo de Respuesta</h4>
                <p className="text-sm text-green-800 mb-2">
                  Responder en menos de 1 hora aumenta las conversiones en 25%.
                </p>
                <ul className="text-sm text-green-800 list-disc list-inside space-y-1">
                  <li>Configura notificaciones push para nuevos mensajes</li>
                  <li>Establece horarios dedicados para responder consultas</li>
                  <li>Usa respuestas rápidas para preguntas comunes</li>
                  <li>Considera contratar asistencia administrativa</li>
                </ul>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">Optimizar Precios</h4>
                <p className="text-sm text-purple-800 mb-2">
                  Precios adecuados al mercado aumentan las consultas en 30%.
                </p>
                <ul className="text-sm text-purple-800 list-disc list-inside space-y-1">
                  <li>Investiga precios de propiedades similares en la zona</li>
                  <li>Ajusta precios según temporada y demanda</li>
                  <li>Ofrece descuentos por contratos largos</li>
                  <li>Considera factores como antigüedad y estado de la propiedad</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Common Questions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Preguntas Frecuentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">¿Por qué bajaron mis vistas?</h4>
                <p className="text-sm text-gray-600">
                  Puede deberse a cambios en la demanda del mercado, competencia nueva en la zona, o
                  necesidad de actualizar las fotos/descripciones de tus propiedades.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">¿Qué significa una baja tasa de conversión?</h4>
                <p className="text-sm text-gray-600">
                  Indica que aunque recibes consultas, no se están convirtiendo en contratos. Revisa
                  la calidad de tus respuestas, precios, o requisitos de los inquilinos.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">¿Cómo mejorar mi ranking de satisfacción?</h4>
                <p className="text-sm text-gray-600">
                  Envía encuestas de satisfacción periódicamente, responde rápido a consultas, y
                  mantén una comunicación clara y profesional con tus clientes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos Pasos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700">
                Ahora que entiendes tus métricas, aquí tienes acciones concretas para mejorar:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <Link href="/broker/analytics">
                  <Button className="w-full">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Ver Mis Métricas
                  </Button>
                </Link>

                <Link href="/broker/settings/alerts">
                  <Button variant="outline" className="w-full">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Configurar Alertas
                  </Button>
                </Link>
              </div>

              <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-4">
                <p className="text-green-800 text-sm">
                  <strong>Recuerda:</strong> Los pequeños cambios consistentes generan los mejores
                  resultados. Revisa tus métricas semanalmente y ajusta tu estrategia según los
                  resultados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
