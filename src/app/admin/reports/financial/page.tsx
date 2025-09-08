'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Building, 
  Users, 
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';

interface FinancialMetric {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  growth: number;
}

interface RevenueByCategory {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
  budget: number;
  variance: number;
}

export default function AdminFinancialReportsPage() {

  const [financialData, setFinancialData] = useState<FinancialMetric[]>([]);

  const [revenueByCategory, setRevenueByCategory] = useState<RevenueByCategory[]>([]);

  const [expenses, setExpenses] = useState<ExpenseBreakdown[]>([]);

  const [loading, setLoading] = useState(true);

  const [timeRange, setTimeRange] = useState('6months');

  const [reportType, setReportType] = useState('overview');

  useEffect(() => {
    fetchFinancialData();
  }, [timeRange, reportType]);

  const fetchFinancialData = async () => {
    try {
      // Simular datos financieros
      const mockFinancialData: FinancialMetric[] = [
        {
          period: 'Enero 2024',
          revenue: 8500000,
          expenses: 3200000,
          profit: 5300000,
          profitMargin: 62.4,
          growth: 5.2,
        },
        {
          period: 'Febrero 2024',
          revenue: 8200000,
          expenses: 3100000,
          profit: 5100000,
          profitMargin: 62.2,
          growth: -3.5,
        },
        {
          period: 'Marzo 2024',
          revenue: 8800000,
          expenses: 3300000,
          profit: 5500000,
          profitMargin: 62.5,
          growth: 7.3,
        },
        {
          period: 'Abril 2024',
          revenue: 9100000,
          expenses: 3400000,
          profit: 5700000,
          profitMargin: 62.6,
          growth: 3.4,
        },
        {
          period: 'Mayo 2024',
          revenue: 8900000,
          expenses: 3350000,
          profit: 5550000,
          profitMargin: 62.4,
          growth: -2.2,
        },
        {
          period: 'Junio 2024',
          revenue: 9200000,
          expenses: 3450000,
          profit: 5750000,
          profitMargin: 62.5,
          growth: 3.4,
        },
      ];

      const mockRevenueByCategory: RevenueByCategory[] = [
        { category: 'Arriendo Residencial', amount: 15600000, percentage: 45, trend: 'up' },
        { category: 'Arriendo Comercial', amount: 8900000, percentage: 25, trend: 'up' },
        { category: 'Comisiones', amount: 6800000, percentage: 19, trend: 'stable' },
        { category: 'Servicios Adicionales', amount: 3800000, percentage: 11, trend: 'up' },
      ];

      const mockExpenses: ExpenseBreakdown[] = [
        { category: 'Mantenimiento', amount: 850000, percentage: 25, budget: 800000, variance: 6.25 },
        { category: 'Personal', amount: 1200000, percentage: 35, budget: 1150000, variance: 4.35 },
        { category: 'Marketing', amount: 450000, percentage: 13, budget: 500000, variance: -10.0 },
        { category: 'Tecnología', amount: 380000, percentage: 11, budget: 400000, variance: -5.0 },
        { category: 'Seguros', amount: 280000, percentage: 8, budget: 300000, variance: -6.67 },
        { category: 'Otros', amount: 290000, percentage: 8, budget: 300000, variance: -3.33 },
      ];

      setFinancialData(mockFinancialData);
      setRevenueByCategory(mockRevenueByCategory);
      setExpenses(mockExpenses);
    } catch (error) {
      logger.error('Error fetching financial data:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    return financialData.reduce((acc, period) => ({
      revenue: acc.revenue + period.revenue,
      expenses: acc.expenses + period.expenses,
      profit: acc.profit + period.profit,
      growth: acc.growth + period.growth,
    }), {
      revenue: 0,
      expenses: 0,
      profit: 0,
      growth: 0,
    });
  };

  const totals = calculateTotals();
  const averageProfitMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;
  const averageGrowth = financialData.length > 0 ? totals.growth / financialData.length : 0;

  const exportFinancialReport = () => {
    const headers = ['Período', 'Ingresos', 'Egresos', 'Utilidad', 'Margen de Utilidad', 'Crecimiento'];
    const csvContent = [
      headers.join(','),
      ...financialData.map(period => [
        period.period,
        period.revenue,
        period.expenses,
        period.profit,
        `${period.profitMargin}%`,
        `${period.growth}%`,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'reporte_financiero.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <EnhancedDashboardLayout title="Reportes Financieros" subtitle="Análisis financiero completo">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout title="Reportes Financieros" subtitle="Análisis financiero completo">
      <div className="space-y-6">
        {/* Controles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Configuración de Reporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rango de Tiempo</label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">Último mes</SelectItem>
                    <SelectItem value="3months">Últimos 3 meses</SelectItem>
                    <SelectItem value="6months">Últimos 6 meses</SelectItem>
                    <SelectItem value="1year">Último año</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Reporte</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Resumen General</SelectItem>
                    <SelectItem value="detailed">Análisis Detallado</SelectItem>
                    <SelectItem value="forecast">Pronósticos</SelectItem>
                    <SelectItem value="comparison">Comparativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end gap-2">
                <Button onClick={fetchFinancialData} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
                <Button onClick={exportFinancialReport}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs Financieros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totals.revenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {averageGrowth > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">+{averageGrowth.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-red-600" />
                    <span className="text-red-600">{averageGrowth.toFixed(1)}%</span>
                  </>
                )}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilidad Neta</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totals.profit.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {averageProfitMargin.toFixed(1)}% margen
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Egresos</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totals.expenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((totals.expenses / totals.revenue) * 100).toFixed(1)}% de ingresos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageProfitMargin.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Margen de utilidad promedio
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ingresos por Categoría */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Ingresos por Categoría
            </CardTitle>
            <CardDescription>
              Desglose de ingresos por tipo de servicio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {revenueByCategory.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded bg-blue-600"></div>
                      <span className="font-medium">{category.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">${category.amount.toLocaleString()}</span>
                      <span className="text-sm text-gray-500">({category.percentage}%)</span>
                      {category.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                      {category.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Distribución de Ingresos</div>
                  <div className="relative w-32 h-32 mx-auto">
                    {/* Simulación de gráfico circular */}
                    <div className="absolute inset-0 rounded-full border-8 border-blue-600"></div>
                    <div className="absolute inset-0 rounded-full border-8 border-green-600" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%)' }}></div>
                    <div className="absolute inset-0 rounded-full border-8 border-yellow-600" style={{ clipPath: 'polygon(50% 50%, 100% 0%, 100% 30%, 50% 50%)' }}></div>
                    <div className="absolute inset-0 rounded-full border-8 border-red-600" style={{ clipPath: 'polygon(50% 50%, 100% 30%, 100% 50%, 50% 50%)' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Análisis de Egresos */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis de Egresos</CardTitle>
            <CardDescription>
              Desglose de gastos y variación vs presupuesto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Porcentaje</TableHead>
                  <TableHead className="text-right">Presupuesto</TableHead>
                  <TableHead className="text-right">Varianza</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{expense.category}</TableCell>
                    <TableCell className="text-right">${expense.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{expense.percentage}%</TableCell>
                    <TableCell className="text-right">${expense.budget.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={expense.variance > 0 ? 'text-red-600' : 'text-green-600'}>
                        {expense.variance > 0 ? '+' : ''}{expense.variance.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={expense.variance <= 0 ? 'default' : expense.variance <= 5 ? 'secondary' : 'destructive'}>
                        {expense.variance <= 0 ? 'Bajo presupuesto' : expense.variance <= 5 ? 'Límite' : 'Sobre presupuesto'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Evolución Financiera */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución Financiera</CardTitle>
            <CardDescription>
              Tendencias de ingresos, egresos y utilidad neta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">Egresos</TableHead>
                  <TableHead className="text-right">Utilidad</TableHead>
                  <TableHead className="text-right">Margen</TableHead>
                  <TableHead className="text-right">Crecimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financialData.map((period, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{period.period}</TableCell>
                    <TableCell className="text-right">${period.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${period.expenses.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">${period.profit.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{period.profitMargin.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {period.growth > 0 ? (
                          <>
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">+{period.growth}%</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-4 h-4 text-red-600" />
                            <span className="text-red-600">{period.growth}%</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </EnhancedDashboardLayout>
  );
}
