import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth/AuthProviderSimple';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { SkipLinks } from '@/components/ui/skip-links';
import { NotificationProvider } from '@/components/ui/notification-provider';
import { NotificationToast } from '@/components/ui/notification-toast';
// import { DataSyncProvider } from '@/components/providers/DataSyncProvider';
import dynamic from 'next/dynamic';

// Lazy loading de componentes pesados
const Chatbot = dynamic(() => import('@/components/ai/Chatbot'), {
  loading: () => null,
  ssr: false,
});

const PWAInstallPrompt = dynamic(() => import('@/components/pwa/PWAInstallPrompt'), {
  loading: () => null,
  ssr: false,
});

// Componente cliente para footer condicional
const ConditionalFooter = dynamic(() => import('@/components/ui/ConditionalFooter'), {
  loading: () => null,
  ssr: false,
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Rent360 - Plataforma Integral de Gestión Inmobiliaria',
  description:
    'Plataforma completa de arrendamiento con gestión de propiedades, contratos, pagos y servicios de mantenimiento.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Rent360',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export const viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* SCRIPT DE DIAGNÓSTICO: Verificar si JavaScript se está ejecutando */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log('🟢 [DIAGNOSTIC] JavaScript IS EXECUTING');
              console.log('🔍 [DIAGNOSTIC] User Agent:', navigator.userAgent);
              console.log('🔍 [DIAGNOSTIC] Location:', window.location.href);
              console.log('🔍 [DIAGNOSTIC] React:', typeof React);
              console.log('🔍 [DIAGNOSTIC] Next:', typeof __NEXT_DATA__);
              
              // Verificar si hay errores globales
              window.addEventListener('error', function(event) {
                console.error('❌ [DIAGNOSTIC] Global Error:', event.error);
                console.error('❌ [DIAGNOSTIC] Error Message:', event.message);
                console.error('❌ [DIAGNOSTIC] Error Filename:', event.filename);
                console.error('❌ [DIAGNOSTIC] Error Line:', event.lineno);
                console.error('❌ [DIAGNOSTIC] Error Column:', event.colno);
              });
              
              window.addEventListener('unhandledrejection', function(event) {
                console.error('❌ [DIAGNOSTIC] Unhandled Rejection:', event.reason);
                console.error('❌ [DIAGNOSTIC] Promise:', event.promise);
              });
              
              // Verificar si Next.js está disponible después de cargar los scripts
              setTimeout(function() {
                console.log('🔍 [DIAGNOSTIC] Checking Next.js availability after 3 seconds...');
                console.log('🔍 [DIAGNOSTIC] window.__NEXT_DATA__:', typeof window.__NEXT_DATA__);
                console.log('🔍 [DIAGNOSTIC] window.__NEXT_DATA__ content:', window.__NEXT_DATA__);
                console.log('🔍 [DIAGNOSTIC] window.React:', typeof window.React);
                console.log('🔍 [DIAGNOSTIC] window.next:', typeof window.next);
                
                // Verificar si hay un elemento con id="__next"
                const nextElement = document.getElementById('__next');
                console.log('🔍 [DIAGNOSTIC] #__next element:', nextElement);
                
                // VERIFICAR HTML COMPLETO PARA __NEXT_DATA__
                console.log('🔍 [DIAGNOSTIC] Checking HTML for __NEXT_DATA__ script...');
                const htmlContent = document.documentElement.outerHTML;
                const hasNextDataScript = htmlContent.includes('__NEXT_DATA__');
                console.log('🔍 [DIAGNOSTIC] HTML contains __NEXT_DATA__ script:', hasNextDataScript);
                
                if (hasNextDataScript) {
                  const scriptMatch = htmlContent.match(/<script[^>]*>.*?__NEXT_DATA__.*?<\/script>/s);
                  if (scriptMatch) {
                    console.log('🔍 [DIAGNOSTIC] Found __NEXT_DATA__ script:', scriptMatch[0].substring(0, 200) + '...');
                  }
                } else {
                  console.error('❌ [DIAGNOSTIC] __NEXT_DATA__ script NOT FOUND in HTML!');
                }
                
                // Verificar si hay algún error en la consola
                const originalError = console.error;
                console.error = function(...args) {
                  console.log('🚨 [DIAGNOSTIC] Console Error Captured:', args);
                  originalError.apply(console, args);
                };
              }, 3000);
              
              // Service Worker cleanup
              if ('serviceWorker' in navigator) {
                console.log('🚨 [DIAGNOSTIC] Unregistering ALL Service Workers...');
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  console.log('🔍 [DIAGNOSTIC] Found', registrations.length, 'Service Worker(s)');
                  for(let registration of registrations) {
                    registration.unregister().then(function(success) {
                      if (success) {
                        console.log('✅ [DIAGNOSTIC] Service Worker unregistered');
                      } else {
                        console.error('❌ [DIAGNOSTIC] Service Worker unregister failed');
                      }
                    });
                  }
                });
                
                // Limpiar cachés
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    console.log('🗑️ [DIAGNOSTIC] Deleting', names.length, 'cache(s)');
                    for (let name of names) {
                      caches.delete(name).then(function() {
                        console.log('✅ [DIAGNOSTIC] Cache deleted:', name);
                      });
                    }
                  });
                }
              }
              
              // FORZAR LIMPIEZA DE CACHE DEL NAVEGADOR
              console.log('🧹 [DIAGNOSTIC] Forcing browser cache cleanup...');
              if ('caches' in window) {
                // Limpiar todos los caches
                caches.keys().then(function(cacheNames) {
                  return Promise.all(
                    cacheNames.map(function(cacheName) {
                      console.log('🗑️ [DIAGNOSTIC] Deleting cache:', cacheName);
                      return caches.delete(cacheName);
                    })
                  );
                }).then(function() {
                  console.log('✅ [DIAGNOSTIC] All caches cleared');
                });
              }
              
              // Verificar si hay chunks de Next.js cargados
              setTimeout(function() {
                console.log('🔍 [DIAGNOSTIC] Checking Next.js chunks...');
                const scripts = document.querySelectorAll('script[src*="_next/static"]');
                console.log('🔍 [DIAGNOSTIC] Found', scripts.length, 'Next.js script tags');
                scripts.forEach(function(script, index) {
                  console.log('🔍 [DIAGNOSTIC] Script', index + 1, ':', script.src);
                });
              }, 2000);
              
              // Verificar hydration
              window.addEventListener('DOMContentLoaded', function() {
                console.log('🟢 [DIAGNOSTIC] DOMContentLoaded fired');
                setTimeout(function() {
                  console.log('🔍 [DIAGNOSTIC] Checking React hydration...');
                  const rootDiv = document.getElementById('__next');
                  if (rootDiv) {
                    console.log('🟢 [DIAGNOSTIC] #__next found, children:', rootDiv.children.length);
                    
                    // Verificar si los botones tienen event listeners
                    const buttons = document.querySelectorAll('button');
                    console.log('🔍 [DIAGNOSTIC] Found', buttons.length, 'buttons');
                    if (buttons.length > 0) {
                      const firstButton = buttons[0];
                      const hasClickListener = firstButton.onclick !== null || 
                                              firstButton.getAttribute('onclick') !== null;
                      console.log('🔍 [DIAGNOSTIC] First button has onclick:', hasClickListener);
                    }
                  } else {
                    console.error('❌ [DIAGNOSTIC] #__next NOT found!');
                  }
                }, 1000);
              });
            `,
          }}
        />
        <meta name="application-name" content="Rent360" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Rent360" />
        <meta name="description" content="Plataforma integral de gestión inmobiliaria" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#059669" />
        <meta name="msapplication-tap-highlight" content="no" />

        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#059669" />
        <link rel="shortcut icon" href="/logo-rent360.png" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://rent360.cl" />
        <meta name="twitter:title" content="Rent360" />
        <meta name="twitter:description" content="Plataforma integral de gestión inmobiliaria" />
        <meta name="twitter:image" content="/icons/icon-192x192.png" />
        <meta name="twitter:creator" content="@rent360" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Rent360" />
        <meta property="og:description" content="Plataforma integral de gestión inmobiliaria" />
        <meta property="og:site_name" content="Rent360" />
        <meta property="og:url" content="https://rent360.cl" />
        <meta property="og:image" content="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <SkipLinks />
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NotificationProvider>
              <AuthProvider>
                {children}

                {/* Componentes de la Fase 1 */}
                <Chatbot position="bottom-right" initialOpen={false} />

                <PWAInstallPrompt position="bottom" autoShow={true} delay={5000} />
                <Toaster />
              </AuthProvider>
            </NotificationProvider>
          </ThemeProvider>
        </ErrorBoundary>

        {/* Footer solo en homepage */}
        <ConditionalFooter />
      </body>
    </html>
  );
}
