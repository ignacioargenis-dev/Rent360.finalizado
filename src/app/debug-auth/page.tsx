'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';

interface AuthInfo {
  userId?: string;
  email?: string;
  role?: string;
  name?: string;
  error?: string;
}

interface CookieInfo {
  name: string;
  value: string;
}

export default function DebugAuthPage() {
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [cookies, setCookies] = useState<CookieInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiTestResult, setApiTestResult] = useState<string>('');

  useEffect(() => {
    const loadAuthInfo = async () => {
      try {
        // Test API /auth/me
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setAuthInfo(data);
        } else {
          setAuthInfo({ error: `Error ${response.status}: ${response.statusText}` });
        }
      } catch (error) {
        setAuthInfo({
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }

      // Obtener cookies
      const cookieString = document.cookie;
      if (cookieString) {
        const cookiePairs = cookieString.split(';');
        const cookieList: CookieInfo[] = cookiePairs.map(pair => {
          const trimmedPair = pair.trim();
          const [name, value] = trimmedPair.split('=');
          return {
            name: name || 'unknown',
            value: value || '',
          };
        });
        setCookies(cookieList);
      }

      setLoading(false);
    };

    loadAuthInfo();
  }, []);

  const testApiEndpoint = async (endpoint: string) => {
    try {
      setApiTestResult(`Testing ${endpoint}...`);
      const response = await fetch(endpoint, {
        credentials: 'include',
      });

      const result = await response.text();
      setApiTestResult(`[${response.status}] ${endpoint}:\n${result}`);
    } catch (error) {
      setApiTestResult(
        `Error testing ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Debug Auth</h1>
          <div className="bg-white p-6 rounded-lg shadow">
            <p>Cargando información de autenticación...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Debug Autenticación</h1>

        {/* Información de Usuario */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Información de Usuario (/api/auth/me)</h2>
          {authInfo ? (
            <div className="space-y-2">
              {authInfo.error ? (
                <div className="text-red-600">
                  <strong>Error:</strong> {authInfo.error}
                </div>
              ) : (
                <>
                  <div>
                    <strong>User ID:</strong> {authInfo.userId}
                  </div>
                  <div>
                    <strong>Email:</strong> {authInfo.email}
                  </div>
                  <div>
                    <strong>Role:</strong> {authInfo.role}
                  </div>
                  <div>
                    <strong>Name:</strong> {authInfo.name}
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No se pudo obtener información de autenticación</p>
          )}
        </div>

        {/* Cookies */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Cookies del Navegador</h2>
          {cookies.length > 0 ? (
            <div className="space-y-2">
              {cookies.map((cookie, index) => (
                <div key={index} className="flex justify-between bg-gray-50 p-2 rounded">
                  <span className="font-medium">{cookie.name}:</span>
                  <span className="text-gray-600 break-all">{cookie.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No hay cookies</p>
          )}
        </div>

        {/* Test de APIs */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Test de APIs Protegidas</h2>
          <div className="space-y-2 mb-4">
            <button
              onClick={() => testApiEndpoint('/api/admin/tickets/list')}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600"
            >
              Test /api/admin/tickets/list
            </button>
            <button
              onClick={() => testApiEndpoint('/api/messages')}
              className="bg-green-500 text-white px-4 py-2 rounded mr-2 hover:bg-green-600"
            >
              Test /api/messages
            </button>
            <button
              onClick={() => testApiEndpoint('/api/admin/user-reports')}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Test /api/admin/user-reports
            </button>
          </div>
          {apiTestResult && (
            <div className="bg-gray-50 p-4 rounded font-mono text-sm">
              <pre>{apiTestResult}</pre>
            </div>
          )}
        </div>

        {/* Información del Entorno */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Información del Entorno</h2>
          <div className="space-y-2">
            <div>
              <strong>URL Actual:</strong> {window.location.href}
            </div>
            <div>
              <strong>User Agent:</strong> {navigator.userAgent}
            </div>
            <div>
              <strong>Timestamp:</strong> {new Date().toISOString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
