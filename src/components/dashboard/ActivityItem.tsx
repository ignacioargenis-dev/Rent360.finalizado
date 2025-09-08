'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LucideIcon } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface ActivityItemProps {
  id: string;
  type: 'payment' | 'maintenance' | 'contract' | 'message' | 'system';
  title: string;
  description: string;
  user: User;
  timestamp: Date;
  icon: LucideIcon;
  onView?: () => void;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({
  type,
  title,
  description,
  user,
  timestamp,
  icon: Icon,
  onView,
}) => {
  const getTypeColor = () => {
    switch (type) {
      case 'payment':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      case 'contract':
        return 'bg-blue-100 text-blue-800';
      case 'message':
        return 'bg-purple-100 text-purple-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours} h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onView}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className={`w-10 h-10 rounded-full ${getTypeColor()} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {title}
              </h4>
              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                {formatTimestamp(timestamp)}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {description}
            </p>
            
            <div className="flex items-center mt-3">
              <Avatar className="w-6 h-6 mr-2">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-xs">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-500">
                {user.name}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
