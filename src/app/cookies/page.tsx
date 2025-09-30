import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Política de Cookies | Rent360',
  description: 'Información sobre el uso de cookies en Rent360 y cómo gestionar tus preferencias.',
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Política de Cookies</CardTitle>
            <CardDescription>
              Última actualización: {new Date().toLocaleDateString('es-CL')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">¿Qué son las Cookies?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo
                cuando visitas nuestro sitio web. Nos ayudan a mejorar tu experiencia de navegación
                y a proporcionar funcionalidades personalizadas.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">Tipos de Cookies que Utilizamos</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Cookies Esenciales</h3>
                  <p className="text-muted-foreground text-sm">
                    Necesarias para el funcionamiento básico del sitio. Incluyen autenticación,
                    seguridad y preferencias de navegación. No se pueden desactivar.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Cookies de Funcionalidad</h3>
                  <p className="text-muted-foreground text-sm">
                    Permiten recordar tus preferencias y configuraciones, como idioma,
                    ubicación y personalización de la interfaz.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Cookies de Análisis</h3>
                  <p className="text-muted-foreground text-sm">
                    Nos ayudan a entender cómo utilizas la plataforma para mejorar nuestros servicios.
                    Recopilan información de forma anónima.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Cookies de Marketing</h3>
                  <p className="text-muted-foreground text-sm">
                    Utilizadas para mostrar anuncios relevantes y medir la efectividad de nuestras campañas.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">Gestión de Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Puedes gestionar tus preferencias de cookies de las siguientes maneras:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>A través de la configuración de tu navegador</li>
                <li>Utilizando herramientas de bloqueo de anuncios</li>
                <li>Contactándonos para solicitudes específicas</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">Cambios en la Política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos actualizar esta política de cookies periódicamente. Te notificaremos
                sobre cambios significativos a través de la plataforma o por email.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">Contacto</h2>
              <p className="text-muted-foreground leading-relaxed">
                Si tienes preguntas sobre el uso de cookies, contáctanos en cookies@rent360.cl.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
