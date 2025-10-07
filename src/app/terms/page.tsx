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
                Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar
                nuestros servicios.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">2. Descripción del Servicio</h2>
              <p className="text-muted-foreground leading-relaxed">
                Rent360 es una plataforma integral de gestión inmobiliaria que conecta propietarios,
                inquilinos, corredores y proveedores de servicios. Ofrecemos herramientas para
                publicar propiedades, gestionar contratos, procesar pagos y coordinar servicios de
                mantenimiento.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">3. Obligaciones del Usuario</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Los usuarios se comprometen a proporcionar información veraz y actualizada, respetar
                la legislación chilena aplicable y utilizar la plataforma de manera responsable y
                ética.
              </p>

              <h3 className="text-lg font-medium mb-2">3.1 Política de Pagos para Proveedores</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Los proveedores de servicios de mantenimiento están obligados a procesar todos los
                pagos exclusivamente a través de la plataforma Rent360. No se permiten pagos en
                efectivo, transferencias directas o cualquier otro método de pago fuera de la
                plataforma.
              </p>

              <h4 className="text-base font-medium mb-1">Razones de esta política:</h4>
              <ul className="text-muted-foreground leading-relaxed ml-6 mb-3">
                <li>
                  • <strong>Comisión de Servicio:</strong> Rent360 cobra una comisión del 10% por
                  conectar clientes con proveedores verificados.
                </li>
                <li>
                  • <strong>Seguridad:</strong> Todas las transacciones están protegidas por
                  sistemas de seguridad avanzados.
                </li>
                <li>
                  • <strong>Garantía de Pago:</strong> Los proveedores reciben pago automático una
                  vez completado el trabajo.
                </li>
                <li>
                  • <strong>Transparencia:</strong> Registro completo de todas las transacciones
                  para cumplimiento legal.
                </li>
                <li>
                  • <strong>Calidad de Servicio:</strong> La plataforma puede garantizar estándares
                  de calidad y verificación.
                </li>
              </ul>

              <p className="text-muted-foreground leading-relaxed">
                El incumplimiento de esta política puede resultar en suspensión o eliminación de la
                cuenta del proveedor.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">4. Propiedad Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                Todo el contenido, diseño y código de Rent360 están protegidos por derechos de
                autor. Los usuarios mantienen los derechos sobre su propio contenido publicado en la
                plataforma.
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
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los
                cambios serán notificados a través de la plataforma.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
