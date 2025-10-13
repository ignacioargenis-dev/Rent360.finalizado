'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cn } from '@/lib/utils';

// Función para generar iniciales a partir de un nombre
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Función para generar color consistente basado en el nombre
function getColorFromName(name: string): string {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-muted flex size-full items-center justify-center rounded-full',
        className,
      )}
      {...props}
    />
  );
}

// Componente Avatar inteligente con fallback automático
interface SmartAvatarProps extends React.ComponentProps<typeof AvatarPrimitive.Root> {
  src?: string;
  name?: string;
  fallback?: string;
}

function SmartAvatar({ src, name = '', fallback, className, children, ...props }: SmartAvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(!!src);

  // Reset error state when src changes
  React.useEffect(() => {
    setImageError(false);
    setIsLoading(!!src);
  }, [src]);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Generate fallback content
  const fallbackContent = fallback || (name ? getInitials(name) : '?');
  const fallbackColor = name ? getColorFromName(name) : 'bg-gray-500';

  return (
    <Avatar className={className} {...props}>
      {src && !imageError && (
        <AvatarImage
          src={src}
          alt={name || 'Avatar'}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      )}
      <AvatarFallback className={cn(fallbackColor, 'text-white font-medium')}>
        {isLoading ? '...' : fallbackContent}
      </AvatarFallback>
      {children}
    </Avatar>
  );
}

export { Avatar, AvatarImage, AvatarFallback, SmartAvatar };
