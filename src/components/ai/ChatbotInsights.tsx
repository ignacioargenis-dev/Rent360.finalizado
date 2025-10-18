'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Target,
  BarChart3,
  PieChart,
  Activity,
  Lightbulb,
  Download,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { logger } from '@/lib/logger-minimal';

interface LearningInsights {
  globalInsights: {
    totalInteractions: number;
    totalUsers: number;
    averageSatisfaction: number;
    mostCommonQuestions: Array<{ question: string; frequency: number }>;
    bestPerformingResponses: Array<{ response: string; successRate: number }>;
    userSatisfactionTrend: Array<{ date: string; score: number }>;
    topPerformingPatterns: Array<{
      pattern: string;
      intent: string;
      confidence: number;
      frequency: number;
      successRate: number;
    }>;
  };
  patterns: Array<{
    pattern: string;
    intent: string;
    confidence: number;
    frequency: number;
    successRate: number;
  }>;
  suggestions: string[];
}

export function ChatbotInsights() {
  const [insights, setInsights] = useState<LearningInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const loadInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/learning-insights?type=all');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setInsights(result.data);
          return;
        }
      }
      
      logger.warn('Error cargando insights del chatbot');
    } catch (error) {
      logger.error('Error cargando insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    try {
      const response = await fetch('/api/ai/learning-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup', daysToKeep: 30 })
      });

      if (response.ok) {
        await loadInsights(); // Recargar datos
      }
    } catch (error) {
      logger.error('Error limpiando datos:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/ai/learning-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export' })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Descargar archivo
          const blob = new Blob([JSON.stringify(result.data, null, 2)], {
            type: 'application/json'
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `chatbot-insights-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      logger.error('Error exportando datos:', error);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Insights del Chatbot IA</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Cargando...
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="text-center py-8">
        <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">No se pudieron cargar los insights del chatbot</p>
        <Button onClick={loadInsights} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatNumber = (num: number) => new Intl.NumberFormat('es-CL').format(num);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Insights del Chatbot IA</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={handleCleanup}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar Datos
          </Button>
          <Button variant="outline" size="sm" onClick={loadInsights}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interacciones</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(insights.globalInsights.totalInteractions)}</div>
            <p className="text-xs text-muted-foreground">
              Desde el inicio del sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(insights.globalInsights.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">
              Han interactuado con el chatbot
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfacción Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(insights.globalInsights.averageSatisfaction)}</div>
            <p className="text-xs text-muted-foreground">
              Basado en feedback de usuarios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrones Aprendidos</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.patterns.length}</div>
            <p className="text-xs text-muted-foreground">
              Patrones de interacción identificados
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="patterns">Patrones</TabsTrigger>
          <TabsTrigger value="questions">Preguntas Frecuentes</TabsTrigger>
          <TabsTrigger value="suggestions">Mejoras</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tendencias de Satisfacción
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {insights.globalInsights.userSatisfactionTrend.slice(-7).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{trend.date}</span>
                      <Badge variant={trend.score > 0.7 ? 'default' : trend.score > 0.5 ? 'secondary' : 'destructive'}>
                        {formatPercentage(trend.score)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Mejores Respuestas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {insights.globalInsights.bestPerformingResponses.slice(0, 5).map((response, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm truncate flex-1 mr-2">
                        {response.response.substring(0, 50)}...
                      </span>
                      <Badge variant="default">
                        {formatPercentage(response.successRate)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Patrones de Aprendizaje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.patterns.slice(0, 10).map((pattern, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{pattern.intent}</Badge>
                      <div className="flex gap-2">
                        <Badge variant="secondary">Freq: {pattern.frequency}</Badge>
                        <Badge variant={pattern.successRate > 0.8 ? 'default' : 'secondary'}>
                          {formatPercentage(pattern.successRate)}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{pattern.pattern}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Preguntas Más Frecuentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.globalInsights.mostCommonQuestions.slice(0, 10).map((question, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm flex-1">{question.question}</span>
                    <Badge variant="outline">{question.frequency} veces</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Sugerencias de Mejora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.suggestions.length > 0 ? (
                  insights.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm text-blue-800">{suggestion}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Lightbulb className="h-8 w-8 mx-auto mb-2" />
                    <p>No hay sugerencias de mejora en este momento</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
