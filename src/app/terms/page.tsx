import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Rent360',
  description: 'Lee nuestros términos y condiciones de uso de la plataforma Rent360.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Términos y Condiciones</CardTitle>
            <CardDescription>
              Última actualización: {new Date().toLocaleDateString('es-CL')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">1. Aceptación de los Términos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Al acceder y utilizar Rent360, aceptas estar sujeto a estos términos y condiciones.
                Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestros servicios.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">2. Descripción del Servicio</h2>
              <p className="text-muted-foreground leading-relaxed">
                Rent360 es una plataforma integral de gestión inmobiliaria que conecta propietarios,
                inquilinos, corredores y proveedores de servicios. Ofrecemos herramientas para
                publicar propiedades, gestionar contratos, procesar pagos y coordinar servicios de mantenimiento.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">3. Obligaciones del Usuario</h2>
              <p className="text-muted-foreground leading-relaxed">
                Los usuarios se comprometen a proporcionar información veraz y actualizada,
                respetar la legislación chilena aplicable y utilizar la plataforma de manera
                responsable y ética.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">4. Propiedad Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                Todo el contenido, diseño y código de Rent360 están protegidos por derechos de autor.
                Los usuarios mantienen los derechos sobre su propio contenido publicado en la plataforma.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">5. Limitación de Responsabilidad</h2>
              <p className="text-muted-foreground leading-relaxed">
                Rent360 actúa como intermediario tecnológico. No somos responsables por acuerdos
                entre usuarios ni por daños indirectos derivados del uso de la plataforma.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">6. Modificaciones</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nos reservamos el derecho de modificar estos términos en cualquier momento.
                Los cambios serán notificados a través de la plataforma.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
