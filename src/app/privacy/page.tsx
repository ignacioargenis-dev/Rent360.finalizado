import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Rent360',
  description: 'Conoce cómo manejamos y protegemos tus datos personales en Rent360.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Política de Privacidad</CardTitle>
            <CardDescription>
              Última actualización: {new Date().toLocaleDateString('es-CL')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">1. Información que Recopilamos</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Recopilamos información que nos proporcionas directamente al registrarte y utilizar nuestros servicios:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Nombre completo y datos de contacto</li>
                <li>RUT y documentos de identificación</li>
                <li>Información de propiedades y contratos</li>
                <li>Datos de pago y transacciones</li>
                <li>Información de navegación y uso de la plataforma</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">2. Uso de la Información</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Utilizamos tu información para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Proporcionar y mejorar nuestros servicios</li>
                <li>Procesar transacciones y contratos</li>
                <li>Comunicarnos contigo sobre tu cuenta</li>
                <li>Cumplir con obligaciones legales</li>
                <li>Prevenir fraudes y actividades ilícitas</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">3. Protección de Datos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos personales
                contra acceso no autorizado, alteración, divulgación o destrucción. Cumplimos con la Ley
                19.628 sobre Protección de Datos Personales de Chile.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">4. Compartir Información</h2>
              <p className="text-muted-foreground leading-relaxed">
                No vendemos ni alquilamos tu información personal. Podemos compartir datos únicamente
                cuando sea necesario para prestar el servicio, cumplir con la ley o proteger nuestros derechos.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">5. Tus Derechos</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Tienes derecho a:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Acceder a tus datos personales</li>
                <li>Rectificar información inexacta</li>
                <li>Solicitar eliminación de datos</li>
                <li>Oponerte al tratamiento de tus datos</li>
                <li>Portabilidad de datos</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">6. Contacto</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para ejercer tus derechos o hacer consultas sobre privacidad, contáctanos en
                privacidad@rent360.cl o a través de nuestro formulario de soporte.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
