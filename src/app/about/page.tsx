import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Shield, Heart, Target, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/header';

export default function About() {
  const milestones = [
    {
      year: '2020',
      title: 'Fundación',
      description: 'Rent360 nace con la misión de revolucionar el mercado de arriendos en Chile.',
    },
    {
      year: '2021',
      title: 'Lanzamiento Plataforma',
      description: 'Lanzamos nuestra plataforma digital con funcionalidades básicas de búsqueda y gestión.',
    },
    {
      year: '2022',
      title: 'Expansión',
      description: 'Llegamos a las principales ciudades de Chile y superamos los 10,000 usuarios.',
    },
    {
      year: '2023',
      title: 'Innovación',
      description: 'Implementamos contratos digitales, pagos en línea y sistema de calificaciones.',
    },
    {
      year: '2024',
      title: 'Líder del Mercado',
      description: 'Nos convertimos en la plataforma líder de arriendos con más de 50,000 usuarios activos.',
    },
  ];

  const values = [
    {
      icon: Shield,
      title: 'Seguridad',
      description: 'Protegemos a nuestros usuarios con verificación de identidad y documentos.',
    },
    {
      icon: Heart,
      title: 'Confianza',
      description: 'Construimos relaciones basadas en la transparencia y el respeto mutuo.',
    },
    {
      icon: Target,
      title: 'Excelencia',
      description: 'Buscamos la excelencia en cada aspecto de nuestro servicio.',
    },
    {
      icon: Globe,
      title: 'Innovación',
      description: 'Innovamos constantemente para mejorar la experiencia de arriendo.',
    },
  ];

  const stats = [
    { label: 'Usuarios Activos', value: '50,000+' },
    { label: 'Propiedades', value: '25,000+' },
    { label: 'Contratos Digitales', value: '15,000+' },
    { label: 'Ciudades', value: '20+' },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white pt-16">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 text-blue-100 bg-blue-800/50">
              Sobre Nosotros
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Transformando el Futuro del
              <span className="text-blue-300"> Arriendo en Chile</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Somos más que una plataforma, somos una comunidad que cree en un mercado 
              inmobiliario más transparente, seguro y accesible para todos.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Nuestra Misión
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Facilitar el acceso a viviendas de calidad
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              En Rent360, nos dedicamos a simplificar el proceso de arriendo, conectando 
              propietarios serios con inquilinos responsables a través de tecnología innovadora 
              y procesos transparentes. Creemos que todos merecen un hogar seguro y confiable.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
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

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">
              Nuestros Valores
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Los principios que nos guían
            </h2>
            <p className="text-xl text-gray-600">
              Estos valores fundamentales definen quién somos y cómo trabajamos cada día.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">
              Nuestra Historia
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              El camino hacia la excelencia
            </h2>
            <p className="text-xl text-gray-600">
              Desde nuestros inicios hasta convertirnos en líderes del mercado.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-blue-200"></div>
              
              <div className="space-y-12">
                {milestones.map((milestone, index) => (
                  <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className="w-1/2 pr-8">
                      <Card className="shadow-lg">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-blue-100 text-blue-800">{milestone.year}</Badge>
                            <CardTitle className="text-xl">{milestone.title}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-base">
                            {milestone.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow-lg"></div>
                    
                    <div className="w-1/2 pl-8"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">
              Nuestro Equipo
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Apasionados por innovar
            </h2>
            <p className="text-xl text-gray-600">
              Contamos con un equipo multidisciplinario de expertos comprometidos con tu éxito.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Carlos Rodríguez',
                role: 'CEO & Fundador',
                bio: 'Experto en real estate con más de 15 años de experiencia.',
              },
              {
                name: 'María González',
                role: 'CTO',
                bio: 'Ingeniera informática apasionada por la tecnología y la innovación.',
              },
              {
                name: 'Ana Martínez',
                role: 'Directora de Operaciones',
                bio: 'Especialista en gestión de proyectos y experiencia de usuario.',
              },
            ].map((member, index) => (
              <Card key={index} className="text-center border-0 shadow-lg">
                <CardHeader>
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <Badge variant="outline">{member.role}</Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {member.bio}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 text-blue-100 bg-blue-500/30">
              ¿Listo para unirte?
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Sé parte de la revolución del arriendo
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Únete a miles de chilenos que ya confían en Rent360 para sus necesidades de arriendo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/register"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
              >
                Comenzar Ahora
              </a>
              <a
                href="/properties/search"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                Explorar Propiedades
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
