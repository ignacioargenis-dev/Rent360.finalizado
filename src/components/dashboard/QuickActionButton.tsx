'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

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
  return (
    <Button
      variant={variant}
      className="h-auto p-6 flex flex-col items-center justify-center gap-3 min-h-[120px] hover:scale-105 transition-transform duration-200"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="w-8 h-8" />
      <div className="text-center">
        <div className="font-medium text-sm leading-tight">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-1 leading-tight">{description}</div>
        )}
      </div>
    </Button>
  );
};
