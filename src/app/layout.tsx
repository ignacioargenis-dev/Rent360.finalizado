import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { SkipLinks } from '@/components/ui/skip-links';
import { NotificationProvider } from '@/components/ui/notification-provider';
import { Footer } from '@/components/ui/Footer';
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

        {/* Footer global */}
        <Footer />
      </body>
    </html>
  );
}
