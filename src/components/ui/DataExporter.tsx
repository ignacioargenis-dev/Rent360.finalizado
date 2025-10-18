'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Database,
  Calendar,
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { logger } from '@/lib/logger-minimal';

interface DataExporterProps {
  userRole: string;
  userId: string;
}

export function DataExporter({ userRole, userId }: DataExporterProps) {
  const [format, setFormat] = useState<'csv' | 'excel' | 'json'>('csv');
  const [dataType, setDataType] = useState<'all' | 'properties' | 'contracts' | 'payments' | 'users'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const getAvailableDataTypes = () => {
    switch (userRole) {
      case 'ADMIN':
        return [
          { value: 'all', label: 'Todos los datos', icon: Database },
          { value: 'properties', label: 'Propiedades', icon: FileText },
          { value: 'contracts', label: 'Contratos', icon: FileText },
          { value: 'payments', label: 'Pagos', icon: FileText },
          { value: 'users', label: 'Usuarios', icon: FileText },
        ];
      case 'OWNER':
        return [
          { value: 'all', label: 'Todos mis datos', icon: Database },
          { value: 'properties', label: 'Mis propiedades', icon: FileText },
          { value: 'contracts', label: 'Mis contratos', icon: FileText },
          { value: 'payments', label: 'Mis pagos', icon: FileText },
        ];
      case 'BROKER':
        return [
          { value: 'all', label: 'Todos mis datos', icon: Database },
          { value: 'properties', label: 'Propiedades gestionadas', icon: FileText },
          { value: 'contracts', label: 'Contratos gestionados', icon: FileText },
          { value: 'payments', label: 'Pagos gestionados', icon: FileText },
        ];
      case 'TENANT':
        return [
          { value: 'all', label: 'Todos mis datos', icon: Database },
          { value: 'contracts', label: 'Mis contratos', icon: FileText },
          { value: 'payments', label: 'Mis pagos', icon: FileText },
        ];
      case 'RUNNER':
        return [
          { value: 'all', label: 'Todos mis datos', icon: Database },
          { value: 'payments', label: 'Mis pagos', icon: FileText },
        ];
      case 'PROVIDER':
      case 'MAINTENANCE':
        return [
          { value: 'all', label: 'Todos mis datos', icon: Database },
          { value: 'payments', label: 'Mis pagos', icon: FileText },
        ];
      default:
        return [];
    }
  };

  const getFormatIcon = (formatType: string) => {
    switch (formatType) {
      case 'csv':
        return FileText;
      case 'excel':
        return FileSpreadsheet;
      case 'json':
        return Database;
      default:
        return FileText;
    }
  };

  const getFormatDescription = (formatType: string) => {
    switch (formatType) {
      case 'csv':
        return 'Archivo CSV compatible con Excel y Google Sheets';
      case 'excel':
        return 'Archivo Excel (.xlsx) con formato avanzado';
      case 'json':
        return 'Archivo JSON para desarrolladores y análisis';
      default:
        return '';
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportStatus('idle');
      setErrorMessage('');

      // Construir URL con parámetros
      const params = new URLSearchParams({
        format,
        type: dataType,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await fetch(`/api/export/data?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al exportar datos');
      }

      // Obtener el nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `rent360_export_${dataType}_${new Date().toISOString().split('T')[0]}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Crear blob y descargar
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportStatus('success');
      
      logger.info('Datos exportados exitosamente', {
        userId,
        userRole,
        format,
        dataType,
        startDate,
        endDate
      });

    } catch (error) {
      logger.error('Error exportando datos:', error);
      setExportStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsExporting(false);
    }
  };

  const availableDataTypes = getAvailableDataTypes();
  const FormatIcon = getFormatIcon(format);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exportar Datos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formato de exportación */}
        <div className="space-y-2">
          <Label htmlFor="format">Formato de archivo</Label>
          <Select value={format} onValueChange={(value: any) => setFormat(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  CSV
                </div>
              </SelectItem>
              <SelectItem value="excel">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  JSON
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {getFormatDescription(format)}
          </p>
        </div>

        {/* Tipo de datos */}
        <div className="space-y-2">
          <Label htmlFor="dataType">Tipo de datos</Label>
          <Select value={dataType} onValueChange={(value: any) => setDataType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tipo de datos" />
            </SelectTrigger>
            <SelectContent>
              {availableDataTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Filtros de fecha */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Label>Filtros de fecha (opcional)</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Estado de exportación */}
        {exportStatus === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              Datos exportados exitosamente
            </span>
          </div>
        )}

        {exportStatus === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">
              {errorMessage}
            </span>
          </div>
        )}

        {/* Botón de exportación */}
        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="w-full"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Exportando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Exportar Datos
            </>
          )}
        </Button>

        {/* Información adicional */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Los datos exportados incluyen solo la información a la que tienes acceso según tu rol</p>
          <p>• Los archivos se descargan automáticamente a tu carpeta de descargas</p>
          <p>• Para archivos grandes, la exportación puede tomar unos minutos</p>
        </div>
      </CardContent>
    </Card>
  );
}
