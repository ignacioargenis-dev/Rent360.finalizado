'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface LeadScoreDisplayProps {
  prospectId: string;
  leadScore: number;
  conversionProbability?: number;
  recommendations?: string[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function LeadScoreDisplay({
  prospectId,
  leadScore,
  conversionProbability,
  recommendations = [],
  onRefresh,
  isRefreshing = false,
}: LeadScoreDisplayProps) {
  // Determinar color y estado según el lead score
  const getScoreColor = (score: number) => {
    if (score >= 80) {
      return 'text-green-600';
    }
    if (score >= 60) {
      return 'text-blue-600';
    }
    if (score >= 40) {
      return 'text-yellow-600';
    }
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) {
      return '🔥 Caliente';
    }
    if (score >= 60) {
      return '👍 Prometedor';
    }
    if (score >= 40) {
      return '⚠️ Tibio';
    }
    return '❄️ Frío';
  };

  const getScoreVariant = (score: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score >= 80) {
      return 'default';
    }
    if (score >= 60) {
      return 'secondary';
    }
    if (score >= 40) {
      return 'outline';
    }
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Lead Score</CardTitle>
            <CardDescription>Probabilidad de conversión y recomendaciones</CardDescription>
          </div>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Principal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-4xl font-bold ${getScoreColor(leadScore)}`}>{leadScore}</div>
            <div>
              <div className="text-sm text-gray-500">de 100</div>
              <Badge variant={getScoreVariant(leadScore)}>{getScoreLabel(leadScore)}</Badge>
            </div>
          </div>
          {conversionProbability !== undefined && (
            <div className="text-right">
              <div className="text-2xl font-semibold text-gray-700">
                {Math.round(conversionProbability)}%
              </div>
              <div className="text-xs text-gray-500">Conversión</div>
            </div>
          )}
        </div>

        {/* Barra de Progreso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Lead Score</span>
            <span className={getScoreColor(leadScore)}>{leadScore}/100</span>
          </div>
          <Progress value={leadScore} className="h-2" />
        </div>

        {conversionProbability !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Probabilidad de Conversión</span>
              <span className="font-medium">{Math.round(conversionProbability)}%</span>
            </div>
            <Progress value={conversionProbability} className="h-2" />
          </div>
        )}

        {/* Recomendaciones */}
        {recommendations && recommendations.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <AlertCircle className="h-4 w-4" />
              <span>Recomendaciones</span>
            </div>
            <ul className="space-y-1 text-sm">
              {recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-600">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Trend Indicator (opcional) */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-2 border-t">
          {leadScore >= 60 ? (
            <>
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>Lead de alta calidad</span>
            </>
          ) : (
            <>
              <TrendingDown className="h-4 w-4 text-gray-400" />
              <span>Requiere más calificación</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Componente compacto para mostrar solo el score en listas
 */
export function LeadScoreBadge({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (s >= 60) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (s >= 40) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border ${getColor(
        score
      )}`}
    >
      <span>{score}</span>
      <span className="text-[10px] opacity-70">/100</span>
    </div>
  );
}
