'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon: Icon,
  onClick,
  color = 'blue',
  disabled = false,
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      hover: 'hover:bg-blue-50',
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      hover: 'hover:bg-green-50',
    },
    orange: {
      bg: 'bg-orange-100',
      text: 'text-orange-600',
      hover: 'hover:bg-orange-50',
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      hover: 'hover:bg-purple-50',
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      hover: 'hover:bg-red-50',
    },
  };

  const currentColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-transparent hover:border-gray-200 ${
        disabled ? 'opacity-50 cursor-not-allowed' : `hover:scale-105 ${currentColor.hover}`
      }`}
      onClick={disabled ? undefined : onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div
            className={`w-12 h-12 rounded-lg ${currentColor.bg} flex items-center justify-center`}
          >
            <Icon className={`w-6 h-6 ${currentColor.text}`} />
          </div>
          {disabled && (
            <Badge variant="secondary" className="text-xs">
              Próximamente
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardTitle className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
          {title}
        </CardTitle>
        <CardDescription className="text-sm text-gray-600 leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
};
