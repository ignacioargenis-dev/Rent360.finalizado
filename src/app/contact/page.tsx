import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Building, 
  Users, 
  Headphones,
  Send,
  CheckCircle,
  AlertCircle, 
  Info 
} from 'lucide-react';
import Header from '@/components/header';

export default function Contact() {
  const contactInfo = [
    {
      icon: Phone,
      title: 'Teléfono',
      value: '+56 2 2345 6789',
      description: 'Lunes a Viernes, 9:00 - 18:00',
    },
    {
      icon: Mail,
      title: 'Email',
      value: 'contacto@rent360.cl',
      description: 'Respondemos en 24 horas',
    },
    {
      icon: MapPin,
      title: 'Oficina Principal',
      value: 'Av. Apoquindo 3400, Las Condes',
      description: 'Santiago, Chile',
    },
  ];

  const departments = [
    {
      name: 'Soporte Técnico',
      email: 'soporte@rent360.cl',
      phone: '+56 2 2345 6790',
      description: 'Problemas técnicos y ayuda con la plataforma',
    },
    {
      name: 'Ventas y Marketing',
      email: 'ventas@rent360.cl',
      phone: '+56 2 2345 6791',
      description: 'Información comercial y publicidad',
    },
    {
      name: 'Atención al Cliente',
      email: 'clientes@rent360.cl',
      phone: '+56 2 2345 6792',
      description: 'Consultas generales y soporte',
    },
    {
      name: 'Prensa y Comunicaciones',
      email: 'prensa@rent360.cl',
      phone: '+56 2 2345 6793',
      description: 'Solicitudes de medios y comunicados',
    },
  ];

  const faqs = [
    {
      question: '¿Cómo puedo publicar una propiedad?',
      answer: 'Para publicar una propiedad, debes crear una cuenta como propietario, verificar tu identidad y luego completar el formulario de publicación con todos los detalles de la propiedad.',
    },
    {
      question: '¿Cuáles son los costos de servicio?',
      answer: 'Ofrecemos diferentes planes según tus necesidades. Tenemos un plan básico gratuito para propietarios con hasta 2 propiedades, y planes premium con características adicionales.',
    },
    {
      question: '¿Cómo funciona el sistema de pagos?',
      answer: 'Integramos múltiples métodos de pago seguros incluyendo transferencias bancarias, tarjetas de crédito y plataformas como Khipu para garantizar transacciones seguras.',
    },
    {
      question: '¿Qué documentos necesito para verificar mi cuenta?',
      answer: 'Necesitarás tu cédula de identidad, comprobante de domicilio y, si eres propietario, documentación que acredite la propiedad del inmueble.',
    },
    {
      question: '¿Cómo puedo resolver un problema con un inquilino o propietario?',
      answer: 'Primero intenta resolverlo directamente. Si no es posible, puedes abrir un ticket de soporte a través de nuestra plataforma y nuestro equipo te ayudará a mediar.',
    },
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
              Contacto
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Estamos aquí para
              <span className="text-blue-300"> Ayudarte</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              ¿Tienes preguntas, sugerencias o necesitas asistencia? 
              Nuestro equipo de expertos está listo para atenderte.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">
              Información de Contacto
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Encuéntranos cuando nos necesites
            </h2>
            <p className="text-xl text-gray-600">
              Múltiples canales para comunicarte con nosotros según tus necesidades.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {contactInfo.map((info, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <info.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{info.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-gray-900">{info.value}</p>
                    <p className="text-gray-600">{info.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                Envíanos un Mensaje
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ¿En qué podemos ayudarte?
              </h2>
              <p className="text-xl text-gray-600">
                Completa el formulario y te responderemos lo antes posible.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Formulario de Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre
                      </label>
                      <Input placeholder="Tu nombre" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apellido
                      </label>
                      <Input placeholder="Tu apellido" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <Input type="email" placeholder="tu@email.com" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <Input placeholder="+56 9 1234 5678" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Asunto
                    </label>
                    <Input placeholder="¿Cuál es el motivo de tu consulta?" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensaje
                    </label>
                    <Textarea 
                      placeholder="Describe tu consulta en detalle..."
                      rows={5}
                    />
                  </div>
                  
                  <Button className="w-full" size="lg">
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Mensaje
                  </Button>
                </CardContent>
              </Card>
              
              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Horario de Atención
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Lunes - Viernes</span>
                        <span>9:00 - 18:00</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Sábados</span>
                        <span>10:00 - 14:00</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Domingos</span>
                        <Badge variant="outline">Cerrado</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Headphones className="w-5 h-5" />
                      Soporte 24/7
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Para emergencias técnicas, nuestro sistema de tickets está disponible 24/7.
                    </p>
                    <Button variant="outline" className="w-full">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Abrir Ticket de Soporte
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Respuesta Rápida
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Email: 24 horas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Teléfono: Inmediato</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Tickets: 2-4 horas</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">
              Departamentos
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Contacta al departamento adecuado
            </h2>
            <p className="text-xl text-gray-600">
              Cada departamento tiene especialistas listos para ayudarte con temas específicos.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {departments.map((dept, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl">{dept.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{dept.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{dept.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{dept.phone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">
              Preguntas Frecuentes
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Tienes preguntas?
            </h2>
            <p className="text-xl text-gray-600">
              Encuentra respuestas a las consultas más comunes.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 ml-7">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">
              Ubicación
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Visítanos en nuestra oficina
            </h2>
            <p className="text-xl text-gray-600">
              Estamos ubicados en el corazón de Las Condes, Santiago.
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-96 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Av. Apoquindo 3400, Las Condes
                  </h3>
                  <p className="text-gray-600">
                    Santiago, Región Metropolitana, Chile
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 text-blue-100 bg-blue-500/30">
              ¿Listo para comenzar?
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Únete a miles de chilenos que ya confían en nosotros
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              No esperes más para encontrar la propiedad perfecta o publicar la tuya.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/register"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
              >
                Crear Cuenta
              </a>
              <a
                href="/properties/search"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                Buscar Propiedades
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
