'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, DollarSign, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface OverdueCommission {
  contractId: string;
  baseAmount: number;
  commissionAmount: number;
  dueDate: Date;
  daysOverdue: number;
}

export function CommissionAlerts() {
  const [overdueCommissions, setOverdueCommissions] = useState<OverdueCommission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalOverdue, setTotalOverdue] = useState(0);

  useEffect(() => {
    loadOverdueCommissions();
  }, []);

  const loadOverdueCommissions = async () => {
    try {
      const response = await fetch('/api/broker/commissions?view=overdue');
      const data = await response.json();

      if (data.success) {
        const commissions = data.data || [];
        setOverdueCommissions(commissions);
        setTotalOverdue(
          commissions.reduce((sum: number, c: OverdueCommission) => sum + c.commissionAmount, 0)
        );
      }
    } catch (error) {
      console.error('Error loading overdue commissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendReminders = async () => {
    try {
      const response = await fetch('/api/broker/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_reminders' }),
      });

      if (response.ok) {
        alert('Recordatorios enviados exitosamente');
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Cargando comisiones...</div>
        </CardContent>
      </Card>
    );
  }

  if (overdueCommissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <DollarSign className="h-5 w-5" />
            Sin Comisiones Vencidas
          </CardTitle>
          <CardDescription>Todas tus comisiones están al día</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Comisiones Vencidas
            </CardTitle>
            <CardDescription>
              {overdueCommissions.length} comisiones pendientes de pago
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={sendReminders}>
            Enviar Recordatorios
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen Total */}
        <Alert variant="destructive">
          <DollarSign className="h-4 w-4" />
          <AlertTitle>Total Vencido</AlertTitle>
          <AlertDescription className="text-lg font-bold">
            ${totalOverdue.toLocaleString('es-CL')}
          </AlertDescription>
        </Alert>

        {/* Lista de Comisiones Vencidas */}
        <div className="space-y-3">
          {overdueCommissions.slice(0, 5).map((commission, index) => (
            <div
              key={`${commission.contractId}-${index}`}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    ${commission.commissionAmount.toLocaleString('es-CL')}
                  </span>
                  <Badge
                    variant={commission.daysOverdue > 30 ? 'destructive' : 'default'}
                    className="text-xs"
                  >
                    {commission.daysOverdue} días vencida
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>
                    Vencimiento: {new Date(commission.dueDate).toLocaleDateString('es-CL')}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Arriendo base: ${commission.baseAmount.toLocaleString('es-CL')}
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href={`/broker/commissions/${commission.contractId}`}>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          ))}

          {overdueCommissions.length > 5 && (
            <Button variant="link" className="w-full" asChild>
              <a href="/broker/commissions">Ver todas ({overdueCommissions.length}) →</a>
            </Button>
          )}
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <strong>💡 Tip:</strong> Configura recordatorios automáticos para evitar retrasos en el
          cobro de tus comisiones.
        </div>
      </CardContent>
    </Card>
  );
}
