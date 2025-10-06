import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Star,
  Shield,
  CreditCard,
  FileText,
  Search,
  Users,
  MessageCircle,
  Bot,
  HelpCircle,
} from 'lucide-react';
import Header from '@/components/header';

export default function Home() {
  const features = [
    {
      icon: Shield,
      title: 'Seguridad Garantizada',
      description:
        'Validación de identidad y documentos para propietarios e inquilinos con verificación completa.',
    },
    {
      icon: FileText,
      title: 'Contratos Digitales',
      description:
        'Firma electrónica de contratos con validez legal, seguros y siempre accesibles.',
    },
    {
      icon: CreditCard,
      title: 'Pagos Seguros',
      description: 'Integración con Khipu y otros métodos de pago para transacciones confiables.',
    },
    {
      icon: Star,
      title: 'Sistema de Calificaciones',
      description: 'Calificaciones mutuas entre usuarios para construir una comunidad confiable.',
    },
  ];

  const stats = [
    { label: 'Propiedades', value: '1,200+' },
    { label: 'Usuarios Activos', value: '850+' },
    { label: 'Contratos', value: '650+' },
    { label: 'Satisfacción', value: '98%' },
  ];

  const testimonials = [
    {
      name: 'María González',
      role: 'Propietaria',
      content:
        'Como administradora, la plataforma me permite gestionar todos los arriendos de forma eficiente y segura.',
      rating: 5,
    },
    {
      name: 'Carlos Ramírez',
      role: 'Inquilino',
      content:
        'Encontré el departamento perfecto y todo el proceso fue transparente. ¡Excelente servicio!',
      rating: 5,
    },
    {
      name: 'Ana Martínez',
      role: 'Corredora',
      content:
        'La plataforma me ha ayudado a conectar propietarios con inquilinos de manera más profesional.',
      rating: 4.5,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 text-white pt-16">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 text-emerald-100 bg-emerald-800/50">
              Plataforma Líder en Arriendos
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Rent360: Tu Solución Integral de
              <span className="text-emerald-300"> Arriendos</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-emerald-100 max-w-3xl mx-auto">
              Gestiona, arrienda y encuentra propiedades con la seguridad y transparencia que
              mereces. La plataforma completa para propietarios, inquilinos y corredores.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
                <Link href="/auth/register">
                  Comenzar Ahora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
                <Link href="/properties/search">
                  <Search className="mr-2 h-4 w-4" />
                  Buscar Propiedades
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            className="w-full h-16 text-white"
            viewBox="0 0 1440 64"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0 64L60 58.7C120 53 240 43 360 37.3C480 32 600 32 720 37.3C840 43 960 53 1080 53.3C1200 53 1320 43 1380 37.3L1440 32V64H0Z"
              fill="currentColor"
              stroke="none"
            />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">
              Características Principales
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Todo lo que necesitas para gestionar arriendos
            </h2>
            <p className="text-xl text-gray-600">
              Diseñada para simplificar cada aspecto del proceso de arriendo, desde la búsqueda
              hasta la firma del contrato.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardHeader>
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Chatbot Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <Badge variant="outline" className="mb-4 bg-blue-100 text-blue-800">
              <Bot className="w-3 h-3 mr-1" />
              Asistente IA Rent360
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Necesitas ayuda? ¡Pregúntale a nuestro Asistente IA!
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Nuestro chatbot inteligente te ayuda con toda la información que necesitas sobre
              Rent360
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Chat Preview */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Rent360 Assistant</h3>
                  <p className="text-sm text-gray-500">Asistente IA 24/7</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold">Tú</span>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                    <p className="text-sm text-gray-800">¿Cómo puedo registrarme como corredor?</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-blue-600 rounded-lg p-3 max-w-sm">
                    <p className="text-sm text-white">
                      Para registrarte como corredor: 1) Ve a &quot;Crear cuenta&quot; 2) Selecciona
                      &quot;Corredor&quot; como rol 3) Completa tu perfil profesional 4) Sube tu
                      certificación de corredor. ¡Es gratis comenzar!
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    ¿Cómo arriendo?
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    ¿Cómo publicar propiedad?
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    ¿Cómo ser corredor?
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    ¿Cómo ser Runner360?
                  </Badge>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <HelpCircle className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Información 24/7</h3>
                </div>
                <p className="text-gray-600">
                  Resuelve tus dudas sobre arriendos, contratos, pagos y más, en cualquier momento
                  del día.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Guías por Rol</h3>
                </div>
                <p className="text-gray-600">
                  Información específica para propietarios, inquilinos, corredores y proveedores de
                  servicios.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Procesos Completos</h3>
                </div>
                <p className="text-gray-600">
                  Te guía paso a paso por todos los procesos: registro, publicación, contratos,
                  pagos, etc.
                </p>
              </div>

              <Button asChild size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                <Link href="/chat">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chatear con el Asistente IA
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">
              Cómo Funciona
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, rápido y seguro</h2>
            <p className="text-xl text-gray-600">
              Sigue estos sencillos pasos y comienza a gestionar tus arriendos en minutos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                title: 'Regístrate',
                description: 'Crea tu cuenta como propietario, inquilino o corredor en minutos.',
              },
              {
                step: 2,
                title: 'Verifica',
                description: 'Sube tus documentos y completa tu perfil para mayor confianza.',
              },
              {
                step: 3,
                title: 'Publica o Busca',
                description: 'Propietarios publican, inquilinos encuentran su hogar ideal.',
              },
              {
                step: 4,
                title: 'Gestiona',
                description: 'Firma contratos digitales, gestiona pagos y comunica.',
              },
            ].map((item, index) => (
              <Card key={index} className="text-center border-0 shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {item.step}
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">
              Testimonios
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Lo que dicen nuestros usuarios</h2>
            <p className="text-xl text-gray-600">
              Miles de usuarios ya confían en Rent360 para sus necesidades de arriendo.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(testimonial.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">&ldquo;{testimonial.content}&rdquo;</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                      <Users className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <h6 className="font-bold text-gray-800">{testimonial.name}</h6>
                      <p className="text-gray-600 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 text-emerald-100 bg-emerald-500/30">
              ¿Listo para comenzar?
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Únete a la revolución del arriendo en Chile
            </h2>
            <p className="text-xl mb-8 text-emerald-100">
              Miles de propietarios e inquilinos ya están usando Rent360 para gestionar sus
              arriendos de manera eficiente y segura.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-emerald-600 hover:bg-emerald-50"
              >
                <Link href="/auth/register">
                  Crear Cuenta Gratuita
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-emerald-600 hover:bg-emerald-50"
              >
                <Link href="/properties/search">Explorar Propiedades</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Runner360 CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 text-gray-300 bg-gray-800">
              ¿Eres Runner360?
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Únete a nuestro equipo de Runner360
            </h2>
            <p className="text-xl mb-8 text-gray-300">
              Ofrece visitas presenciales a propiedades y gana dinero flexibilizando tu horario. Sé
              parte de la red de confianza de Rent360.
            </p>
            <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
              <Link href="/auth/register?role=RUNNER">
                Postular como Runner360
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
