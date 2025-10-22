'use client';

import { useState, useEffect } from 'react';

export default function DebugAuthPage() {
  const [authStatus, setAuthStatus] = useState('Cargando...');
  const [userData, setUserData] = useState<any>(null);
  const [reportsStatus, setReportsStatus] = useState('No probado');

  useEffect(() => {
    testAuth();
  }, []);

  const testAuth = async () => {
    try {
      setAuthStatus('Probando /api/auth/me...');

      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (!response.ok) {
        setAuthStatus(`Error ${response.status}: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      setUserData(data);
      setAuthStatus('✅ Autenticación exitosa');

      // Probar user-reports si es admin/support
      if (
        data.success &&
        data.user &&
        (data.user.role === 'ADMIN' || data.user.role === 'SUPPORT')
      ) {
        setReportsStatus('Probando /api/admin/user-reports...');

        const reportsResponse = await fetch('/api/admin/user-reports', {
          credentials: 'include',
        });

        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          setReportsStatus(`✅ Reportes: ${reportsData.reports?.length || 0} encontrados`);
        } else {
          setReportsStatus(`❌ Error ${reportsResponse.status} en reportes`);
        }
      } else {
        setReportsStatus('Usuario sin permisos para reportes');
      }
    } catch (error) {
      setAuthStatus(`❌ Error: ${error instanceof Error ? error.message : 'Desconocido'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">🔍 Debug Autenticación</h1>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Estado de Autenticación</h2>
            <p
              className={`text-sm ${authStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}`}
            >
              {authStatus}
            </p>
          </div>

          {userData && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Datos del Usuario</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(userData, null, 2)}
              </pre>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold mb-2">Acceso a Reportes</h2>
            <p
              className={`text-sm ${reportsStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}`}
            >
              {reportsStatus}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Cookies</h2>
            <p className="text-sm text-gray-600">
              Revisa las cookies del navegador para verificar que auth-token esté presente
            </p>
          </div>

          <button
            onClick={testAuth}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔄 Probar Nuevamente
          </button>
        </div>
      </div>
    </div>
  );
}
