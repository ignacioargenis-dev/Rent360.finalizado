'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Keyboard, 
  X, 
  Search, 
  Bell, 
  Home, 
  Users, 
  Building, 
  FileText,
  DollarSign,
  Settings,
  HelpCircle,
  Zap
} from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  userRole: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ 
  userRole, 
  userId, 
  isOpen, 
  onClose 
}: KeyboardShortcutsHelpProps) {
  const { getShortcutsByCategory, formatShortcut } = useKeyboardShortcuts({
    userId,
    userRole,
    enabled: false // Deshabilitar para evitar conflictos
  });

  const shortcutsByCategory = getShortcutsByCategory();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Navegación':
        return Home;
      case 'Administración':
        return Settings;
      case 'Propietario':
        return Building;
      case 'Corredor':
        return Users;
      case 'Inquilino':
        return FileText;
      case 'Runner':
        return Zap;
      case 'Proveedor':
      case 'Mantenimiento':
        return Settings;
      case 'Ayuda':
        return HelpCircle;
      default:
        return Keyboard;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Navegación':
        return 'bg-blue-100 text-blue-800';
      case 'Administración':
        return 'bg-red-100 text-red-800';
      case 'Propietario':
        return 'bg-green-100 text-green-800';
      case 'Corredor':
        return 'bg-purple-100 text-purple-800';
      case 'Inquilino':
        return 'bg-orange-100 text-orange-800';
      case 'Runner':
        return 'bg-yellow-100 text-yellow-800';
      case 'Proveedor':
      case 'Mantenimiento':
        return 'bg-indigo-100 text-indigo-800';
      case 'Ayuda':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atajos de Teclado
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-4">
            {/* Información general */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">¿Cómo usar los atajos?</span>
              </div>
              <p className="text-sm text-blue-700">
                Presiona las teclas mostradas para ejecutar acciones rápidamente. 
                Los atajos están disponibles en toda la aplicación cuando no estés escribiendo en un campo de texto.
              </p>
            </div>

            {/* Atajos por categoría */}
            <Tabs defaultValue={Object.keys(shortcutsByCategory)[0]} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                {Object.keys(shortcutsByCategory).map((category) => {
                  const Icon = getCategoryIcon(category);
                  return (
                    <TabsTrigger key={category} value={category} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{category}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
                <TabsContent key={category} value={category} className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className={getCategoryColor(category)}>
                      {category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {shortcuts.length} atajo{shortcuts.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="grid gap-3">
                    {shortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{shortcut.description}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {shortcut.ctrlKey && (
                            <Badge variant="outline" className="text-xs">Ctrl</Badge>
                          )}
                          {shortcut.altKey && (
                            <Badge variant="outline" className="text-xs">Alt</Badge>
                          )}
                          {shortcut.shiftKey && (
                            <Badge variant="outline" className="text-xs">Shift</Badge>
                          )}
                          {shortcut.metaKey && (
                            <Badge variant="outline" className="text-xs">Cmd</Badge>
                          )}
                          <Badge variant="secondary" className="text-xs font-mono">
                            {shortcut.key.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Consejos adicionales */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">Consejos adicionales:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Los atajos no funcionan cuando estás escribiendo en campos de texto</li>
                <li>• Presiona <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">?</kbd> en cualquier momento para mostrar esta ayuda</li>
                <li>• Presiona <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> para cerrar modales y overlays</li>
                <li>• Los atajos específicos de tu rol aparecen en las pestañas correspondientes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
