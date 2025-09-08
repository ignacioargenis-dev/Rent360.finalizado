import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
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
  Users
} from 'lucide-react';

export default function HomePage() {
  const t = useTranslations();

  const features = [
    {
      icon: Shield,
      title: t('features.security.title'),
      description: t('features.security.description'),
    },
    {
      icon: FileText,
      title: t('features.contracts.title'),
      description: t('features.contracts.description'),
    },
    {
      icon: CreditCard,
      title: t('features.payments.title'),
      description: t('features.payments.description'),
    },
    {
      icon: Star,
      title: t('features.ratings.title'),
      description: t('features.ratings.description'),
    },
  ];

  const stats = [
    { label: t('stats.properties'), value: '1,200+' },
    { label: t('stats.activeUsers'), value: '850+' },
    { label: t('stats.contracts'), value: '650+' },
    { label: t('stats.satisfaction'), value: '98%' },
  ];

  const testimonials = [
    {
      name: 'María González',
      role: t('testimonials.owner'),
      content: t('testimonials.ownerContent'),
      rating: 5,
    },
    {
      name: 'Carlos Ramírez',
      role: t('testimonials.tenant'),
      content: t('testimonials.tenantContent'),
      rating: 5,
    },
    {
      name: 'Ana Martínez',
      role: t('testimonials.broker'),
      content: t('testimonials.brokerContent'),
      rating: 4.5,
    },
  ];

  const steps = [
    {
      step: 1,
      title: t('steps.register.title'),
      description: t('steps.register.description')
    },
    {
      step: 2,
      title: t('steps.verify.title'),
      description: t('steps.verify.description')
    },
    {
      step: 3,
      title: t('steps.publish.title'),
      description: t('steps.publish.description')
    },
    {
      step: 4,
      title: t('steps.manage.title'),
      description: t('steps.manage.description')
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 text-white pt-16">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 text-emerald-100 bg-emerald-800/50">
              {t('hero.badge')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
              <span className="text-emerald-300">{t('hero.titleHighlight')}</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-emerald-100 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
                <Link href="/auth/register">
                  {t('hero.ctaPrimary')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
                <Link href="/properties/search">
                  <Search className="mr-2 h-4 w-4" />
                  {t('hero.ctaSecondary')}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-16 text-white" viewBox="0 0 1440 64" fill="none" preserveAspectRatio="none">
            <path d="M0 64L60 58.7C120 53 240 43 360 37.3C480 32 600 32 720 37.3C840 43 960 53 1080 53.3C1200 53 1320 43 1380 37.3L1440 32V64H0Z" fill="currentColor" stroke="none"/>
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
                  <div className="text-gray-600 font-medium">
                    {stat.label}
                  </div>
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
              {t('features.title')}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('features.subtitle')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('features.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">
              {t('howItWorks.badge')}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('howItWorks.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('howItWorks.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="text-center border-0 shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {step.step}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {step.description}
                  </CardDescription>
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
              {t('testimonials.badge')}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('testimonials.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('testimonials.description')}
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
                  <p className="text-gray-700 mb-6 italic">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
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
              {t('cta.badge')}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('cta.title')}
            </h2>
            <p className="text-xl mb-8 text-emerald-100">
              {t('cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="bg-white text-emerald-600 hover:bg-emerald-50">
                <Link href="/auth/register">
                  {t('cta.primaryButton')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="bg-white text-emerald-600 hover:bg-emerald-50">
                <Link href="/properties/search">
                  {t('cta.secondaryButton')}
                </Link>
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
              {t('runner.badge')}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('runner.title')}
            </h2>
            <p className="text-xl mb-8 text-gray-300">
              {t('runner.description')}
            </p>
            <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
              <Link href="/auth/register?role=RUNNER">
                {t('runner.button')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
