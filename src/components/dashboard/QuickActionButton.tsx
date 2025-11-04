'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  disabled?: boolean;
  description?: string;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  variant = 'outline',
  disabled = false,
  description,
}) => {
  // Para variant="default" (fondo verde esmeralda), usar texto blanco para mejor contraste
  const isDefaultVariant = variant === 'default';

  return (
    <Button
      variant={variant}
      className="h-auto p-6 flex flex-col items-center justify-center gap-3 min-h-[120px] hover:scale-105 transition-transform duration-200"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="w-8 h-8" />
      <div className="text-center">
        <div className={cn('font-medium text-sm leading-tight', isDefaultVariant && 'text-white')}>
          {label}
        </div>
        {description && (
          <div
            className={cn(
              'text-xs mt-1 leading-tight',
              isDefaultVariant
                ? 'text-white/90' // Texto blanco semi-transparente sobre fondo verde
                : 'text-muted-foreground' // Texto gris sobre fondo blanco/gris
            )}
          >
            {description}
          </div>
        )}
      </div>
    </Button>
  );
};
