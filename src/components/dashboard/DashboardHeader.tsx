'use client';

import { Button } from '@/components/ui/button';
import { Bell, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';

interface DashboardHeaderProps {
  user: User | null;
  title: string;
  subtitle: string;
  showNotifications?: boolean;
  notificationCount?: number;
}

export default function DashboardHeader({ 
  user, 
  title, 
  subtitle, 
  showNotifications = true,
  notificationCount = 0, 
}: DashboardHeaderProps) {
  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user ? `Bienvenido, ${user.name}` : title}
            </h1>
            <p className="text-gray-600">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {showNotifications && (
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Notificaciones
                {notificationCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
