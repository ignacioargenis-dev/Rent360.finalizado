'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Solo mostrar footer en la página de inicio
  if (pathname !== '/') {
    return null;
  }

  return <Footer />;
}
