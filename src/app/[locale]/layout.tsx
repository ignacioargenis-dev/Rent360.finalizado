import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '../../../next-intl.config';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth/AuthProviderSimple';
import Chatbot from '@/components/ai/Chatbot';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import LanguageSelector from '@/components/LanguageSelector';
import Header from '@/components/header';
import UnifiedSidebar from '@/components/layout/UnifiedSidebar';

const inter = Inter({ subsets: ['latin'] });

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default async function LocaleLayout({ children, params: { locale } }: LocaleLayoutProps) {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                <UnifiedSidebar>{children}</UnifiedSidebar>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <header>
                    <LanguageSelector />
                  </header>
                  <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
                    <div className="container mx-auto px-6 py-8">{children}</div>
                  </main>
                </div>
              </div>

              {/* Componentes adicionales */}
              <Chatbot position="bottom-right" initialOpen={false} />

              <PWAInstallPrompt position="bottom" autoShow={true} delay={5000} />

              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
