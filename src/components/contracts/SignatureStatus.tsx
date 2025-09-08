'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  ExternalLink
} from 'lucide-react';
import { SignatureStatus as StatusType } from '@/lib/signature';

interface SignatureStatusProps {
  status: StatusType;
  signatureId?: string;
  createdAt?: string;
  expiresAt?: string;
  provider?: string;
  onRefresh?: () => void;
  onDownload?: () => void;
  onViewDetails?: () => void;
}

export const SignatureStatus: React.FC<SignatureStatusProps> = ({
  status,
  signatureId,
  createdAt,
  expiresAt,
  provider,
  onRefresh,
  onDownload,
  onViewDetails
}) => {
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendiente',
          variant: 'secondary' as const,
          icon: Clock,
          color: 'text-yellow-600',
          description: 'Esperando firmas de todos los participantes'
        };
      case 'completed':
        return {
          label: 'Completado',
          variant: 'default' as const,
          icon: CheckCircle,
          color: 'text-green-600',
          description: 'Todas las firmas han sido recolectadas'
        };
      case 'cancelled':
        return {
          label: 'Cancelado',
          variant: 'destructive' as const,
          icon: XCircle,
          color: 'text-red-600',
          description: 'El proceso de firma fue cancelado'
        };
      case 'expired':
        return {
          label: 'Expirado',
          variant: 'outline' as const,
          icon: AlertCircle,
          color: 'text-orange-600',
          description: 'El tiempo límite para firmar ha expirado'
        };
      default:
        return {
          label: 'Desconocido',
          variant: 'outline' as const,
          icon: AlertCircle,
          color: 'text-gray-600',
          description: 'Estado desconocido'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${config.color}`} />
            <div>
              <Badge variant={config.variant}>{config.label}</Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {config.description}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                aria-label="Actualizar estado"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}

            {onDownload && status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                aria-label="Descargar documento firmado"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}

            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewDetails}
                aria-label="Ver detalles completos"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {signatureId && (
            <div>
              <span className="font-medium">ID:</span>
              <p className="text-muted-foreground font-mono text-xs">{signatureId}</p>
            </div>
          )}

          {createdAt && (
            <div>
              <span className="font-medium">Creado:</span>
              <p className="text-muted-foreground">
                {new Date(createdAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {expiresAt && (
            <div>
              <span className="font-medium">Expira:</span>
              <p className="text-muted-foreground">
                {new Date(expiresAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {provider && (
            <div>
              <span className="font-medium">Proveedor:</span>
              <p className="text-muted-foreground">{provider}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SignatureStatus;
