'use client';

import React from 'react';
import { User } from '@/types';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: User | null;
  title?: string;
  subtitle?: string;
  showNotifications?: boolean;
  notificationCount?: number;
}

export default function DashboardLayout({
  children,
  user,
  title,
  subtitle,
  showNotifications = true,
  notificationCount = 0,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar simplificado temporalmente */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Rent360</h2>
            <p className="text-sm text-gray-600">Panel de Control</p>
          </div>
          <nav className="mt-4">
            <div className="px-4 py-2 text-sm text-gray-700">Dashboard</div>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="p-6">
            {(title || subtitle) && (
              <div className="mb-6">
                {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
                {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
