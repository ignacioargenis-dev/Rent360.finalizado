import React from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children, className }) => {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
        'bg-primary text-primary-foreground px-4 py-2 rounded-md',
        'z-50 focus:z-50 transition-all duration-200',
        'hover:bg-primary/90 focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
      data-skip-link
    >
      {children}
    </a>
  );
};

interface SkipLinksProps {
  links?: Array<{
    href: string;
    label: string;
  }>;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({
  links = [
    { href: '#main-content', label: 'Ir al contenido principal' },
    { href: '#navigation', label: 'Ir a la navegación' },
    { href: '#search', label: 'Ir a la búsqueda' }
  ]
}) => {
  return (
    <nav aria-label="Enlaces de navegación rápida">
      <div className="sr-only focus-within:not-sr-only">
        {links.map((link, index) => (
          <SkipLink key={index} href={link.href}>
            {link.label}
          </SkipLink>
        ))}
      </div>
    </nav>
  );
};

export default SkipLinks;
