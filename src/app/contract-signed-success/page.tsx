'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileSignature, Mail, Download, Home } from 'lucide-react';

export default function ContractSignedSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Success Animation/Icon */}
        <div className="text-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-green-200 animate-ping"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Contrato Firmado Exitosamente!</h1>
          <p className="text-gray-600">Su firma electrónica ha sido registrada correctamente</p>
        </div>

        {/* Success Card */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-green-700">
              <FileSignature className="w-5 h-5" />
              Firma Electrónica Completada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-800 mb-1">✅ Firma Registrada</p>
                  <p className="text-green-700">
                    Su firma electrónica ha sido aplicada al contrato con clave única.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 mb-1">📧 Confirmación Enviada</p>
                  <p className="text-blue-700">
                    Se ha enviado una copia del contrato firmado a su email.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Download className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-gray-800 mb-1">📄 Documento Seguro</p>
                  <p className="text-gray-700">
                    El contrato firmado está almacenado de forma segura y auditada.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button onClick={() => router.push('/')} className="w-full bg-blue-600 hover:bg-blue-700">
            <Home className="w-4 h-4 mr-2" />
            Ir al Inicio
          </Button>

          <Button variant="outline" onClick={() => window.print()} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Imprimir Confirmación
          </Button>
        </div>

        {/* Legal Information */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            Esta firma electrónica cumple con la Ley N° 19.799 sobre documentos electrónicos y tiene
            el mismo valor legal que una firma manuscrita.
          </p>
          <p className="mt-2">Fecha y hora de firma: {new Date().toLocaleString('es-CL')}</p>
        </div>
      </div>
    </div>
  );
}
