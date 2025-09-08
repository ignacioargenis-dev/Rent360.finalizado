import { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import SignatureManagement from '@/components/signatures/SignatureManagement';

export const metadata: Metadata = {
  title: 'Firmas Electrónicas | Rent360',
  description: 'Gestiona tus firmas electrónicas avanzadas certificadas por SII',
};

export default async function SignaturesPage() {
  // Verificar autenticación del usuario
  await requireAuth();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Firmas Electrónicas</h1>
        <p className="text-muted-foreground">
          Crea y gestiona firmas electrónicas avanzadas certificadas por el Servicio de Impuestos Internos (SII)
          según la Ley 19.799 sobre Documentos Electrónicos y Firmas Electrónicas.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Información legal */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Información Legal Importante
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Las firmas electrónicas creadas en esta plataforma cumplen con la legislación chilena
                  y tienen plena validez jurídica equivalente a las firmas manuscritas tradicionales.
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li><strong>Ley 19.799:</strong> Sobre Documentos Electrónicos y Firmas Electrónicas</li>
                  <li><strong>Decreto Supremo N° 181/2020:</strong> Del Ministerio de Economía</li>
                  <li><strong>SII Certificado:</strong> Proveedores autorizados por el Servicio de Impuestos Internos</li>
                  <li><strong>Validez Jurídica:</strong> Equivalente a firma manuscrita tradicional</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Componente principal de gestión de firmas */}
        <SignatureManagement />
      </div>
    </div>
  );
}
