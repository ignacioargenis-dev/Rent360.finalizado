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
      className="h-auto p-4 flex flex-col items-center justify-center gap-2 min-h-[100px] w-full hover:scale-105 transition-transform duration-200"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="w-6 h-6 flex-shrink-0" />
      <div className="text-center w-full space-y-1">
        <div
          className={cn(
            'font-medium text-xs leading-tight break-words',
            isDefaultVariant && 'text-white'
          )}
        >
          {label}
        </div>
        {description && (
          <div
            className={cn(
              'text-[10px] leading-tight break-words px-1',
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
