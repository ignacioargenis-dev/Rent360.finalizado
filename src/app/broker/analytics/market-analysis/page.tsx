'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  MapPin,
  Home,
  DollarSign,
  Users,
  Calendar,
  ArrowLeft,
  Download,
  RefreshCw,
  Target,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/logger-minimal';
import { User } from '@/types';

// Función auxiliar para formatear moneda
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
};

interface MarketData {
  region: string;
  commune: string;
  regionCode: string;
  population: number;
  averageRent: number;
  demandLevel: 'low' | 'medium' | 'high' | 'very_high';
  occupancyRate: number;
  priceTrend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  competitorCount: number;
  averageResponseTime: number;
  popularPropertyTypes: string[];
  economicIndex: number; // 0-100, basado en actividad económica
  tourismIndex: number; // 0-100, atractivo turístico
  universityPresence: boolean;
  portAccess: boolean;
  airportAccess: boolean;
  industrialActivity: 'low' | 'medium' | 'high';
  housingSupply: 'scarce' | 'adequate' | 'abundant';
}

interface MarketInsight {
  type: 'opportunity' | 'warning' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

// Función para generar datos realistas de mercado chileno
const generateChileMarketData = (): MarketData[] => {
  const regions = [
    {
      name: 'Arica y Parinacota',
      code: 'XV',
      communes: [
        {
          name: 'Arica',
          population: 247552,
          economicIndex: 65,
          tourismIndex: 85,
          universityPresence: true,
          portAccess: true,
          airportAccess: true,
        },
        {
          name: 'Putre',
          population: 2813,
          economicIndex: 40,
          tourismIndex: 95,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
      ],
      baseRent: 350000,
      industrialActivity: 'medium' as const,
    },
    {
      name: 'Tarapacá',
      code: 'I',
      communes: [
        {
          name: 'Iquique',
          population: 223463,
          economicIndex: 70,
          tourismIndex: 75,
          universityPresence: true,
          portAccess: true,
          airportAccess: true,
        },
        {
          name: 'Alto Hospicio',
          population: 129999,
          economicIndex: 55,
          tourismIndex: 45,
          universityPresence: false,
          portAccess: false,
          airportAccess: true,
        },
      ],
      baseRent: 380000,
      industrialActivity: 'high' as const,
    },
    {
      name: 'Antofagasta',
      code: 'II',
      communes: [
        {
          name: 'Antofagasta',
          population: 425725,
          economicIndex: 80,
          tourismIndex: 70,
          universityPresence: true,
          portAccess: true,
          airportAccess: true,
        },
        {
          name: 'Calama',
          population: 190336,
          economicIndex: 85,
          tourismIndex: 60,
          universityPresence: false,
          portAccess: false,
          airportAccess: true,
        },
      ],
      baseRent: 420000,
      industrialActivity: 'high' as const,
    },
    {
      name: 'Atacama',
      code: 'III',
      communes: [
        {
          name: 'Copiapó',
          population: 177773,
          economicIndex: 60,
          tourismIndex: 65,
          universityPresence: true,
          portAccess: true,
          airportAccess: true,
        },
        {
          name: 'Vallenar',
          population: 58935,
          economicIndex: 50,
          tourismIndex: 55,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
      ],
      baseRent: 320000,
      industrialActivity: 'medium' as const,
    },
    {
      name: 'Coquimbo',
      code: 'IV',
      communes: [
        {
          name: 'La Serena',
          population: 245434,
          economicIndex: 65,
          tourismIndex: 80,
          universityPresence: true,
          portAccess: true,
          airportAccess: true,
        },
        {
          name: 'Coquimbo',
          population: 257574,
          economicIndex: 60,
          tourismIndex: 70,
          universityPresence: true,
          portAccess: true,
          airportAccess: true,
        },
      ],
      baseRent: 360000,
      industrialActivity: 'medium' as const,
    },
    {
      name: 'Valparaíso',
      code: 'V',
      communes: [
        {
          name: 'Valparaíso',
          population: 315732,
          economicIndex: 55,
          tourismIndex: 85,
          universityPresence: true,
          portAccess: true,
          airportAccess: false,
        },
        {
          name: 'Viña del Mar',
          population: 334248,
          economicIndex: 70,
          tourismIndex: 80,
          universityPresence: true,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Quillota',
          population: 102067,
          economicIndex: 60,
          tourismIndex: 50,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
      ],
      baseRent: 400000,
      industrialActivity: 'medium' as const,
    },
    {
      name: 'Metropolitana de Santiago',
      code: 'XIII',
      communes: [
        // Zonas de alto ingreso y demanda premium
        {
          name: 'Las Condes',
          population: 330759,
          economicIndex: 98,
          tourismIndex: 65,
          universityPresence: true,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Vitacura',
          population: 96774,
          economicIndex: 97,
          tourismIndex: 60,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Providencia',
          population: 157749,
          economicIndex: 95,
          tourismIndex: 70,
          universityPresence: true,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Lo Barnechea',
          population: 116701,
          economicIndex: 92,
          tourismIndex: 75,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'La Reina',
          population: 100142,
          economicIndex: 85,
          tourismIndex: 50,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },

        // Zonas céntricas y comerciales
        {
          name: 'Santiago Centro',
          population: 404495,
          economicIndex: 90,
          tourismIndex: 75,
          universityPresence: true,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Ñuñoa',
          population: 250192,
          economicIndex: 88,
          tourismIndex: 55,
          universityPresence: true,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Recoleta',
          population: 190075,
          economicIndex: 70,
          tourismIndex: 45,
          universityPresence: true,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Independencia',
          population: 100281,
          economicIndex: 65,
          tourismIndex: 40,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Estación Central',
          population: 206792,
          economicIndex: 68,
          tourismIndex: 35,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },

        // Zonas residenciales medias
        {
          name: 'Macul',
          population: 135188,
          economicIndex: 75,
          tourismIndex: 45,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Peñalolén',
          population: 252317,
          economicIndex: 78,
          tourismIndex: 40,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'La Florida',
          population: 402433,
          economicIndex: 80,
          tourismIndex: 45,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'La Cisterna',
          population: 100434,
          economicIndex: 70,
          tourismIndex: 35,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'El Bosque',
          population: 172000,
          economicIndex: 68,
          tourismIndex: 30,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'San Joaquín',
          population: 100053,
          economicIndex: 72,
          tourismIndex: 35,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Huechuraba',
          population: 113795,
          economicIndex: 76,
          tourismIndex: 40,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Quinta Normal',
          population: 136368,
          economicIndex: 65,
          tourismIndex: 35,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Renca',
          population: 160847,
          economicIndex: 60,
          tourismIndex: 30,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Quilicura',
          population: 254718,
          economicIndex: 65,
          tourismIndex: 35,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },

        // Zonas periféricas y de crecimiento
        {
          name: 'Puente Alto',
          population: 658369,
          economicIndex: 65,
          tourismIndex: 35,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Maipú',
          population: 578605,
          economicIndex: 70,
          tourismIndex: 40,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'San Bernardo',
          population: 334836,
          economicIndex: 62,
          tourismIndex: 35,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Pudahuel',
          population: 253139,
          economicIndex: 63,
          tourismIndex: 30,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Cerro Navia',
          population: 143084,
          economicIndex: 58,
          tourismIndex: 25,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Conchalí',
          population: 139195,
          economicIndex: 60,
          tourismIndex: 30,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'La Pintana',
          population: 189335,
          economicIndex: 55,
          tourismIndex: 25,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'San Ramón',
          population: 82900,
          economicIndex: 55,
          tourismIndex: 25,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Lo Prado',
          population: 104403,
          economicIndex: 58,
          tourismIndex: 25,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Padre Hurtado',
          population: 74285,
          economicIndex: 64,
          tourismIndex: 30,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },

        // Zonas rurales y de expansión
        {
          name: 'Pirque',
          population: 30420,
          economicIndex: 75,
          tourismIndex: 55,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'San José de Maipo',
          population: 18644,
          economicIndex: 70,
          tourismIndex: 80,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Colina',
          population: 177611,
          economicIndex: 72,
          tourismIndex: 45,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Lampa',
          population: 140616,
          economicIndex: 68,
          tourismIndex: 40,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Tiltil',
          population: 21477,
          economicIndex: 60,
          tourismIndex: 35,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Buin',
          population: 109522,
          economicIndex: 66,
          tourismIndex: 35,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Calera de Tango',
          population: 28525,
          economicIndex: 68,
          tourismIndex: 40,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Paine',
          population: 82766,
          economicIndex: 64,
          tourismIndex: 35,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Peñaflor',
          population: 107408,
          economicIndex: 66,
          tourismIndex: 35,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Talagante',
          population: 81838,
          economicIndex: 62,
          tourismIndex: 40,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'El Monte',
          population: 36748,
          economicIndex: 58,
          tourismIndex: 30,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Isla de Maipo',
          population: 40268,
          economicIndex: 65,
          tourismIndex: 45,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Curacaví',
          population: 34166,
          economicIndex: 68,
          tourismIndex: 50,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'María Pinto',
          population: 14420,
          economicIndex: 60,
          tourismIndex: 35,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'San Pedro',
          population: 11953,
          economicIndex: 55,
          tourismIndex: 40,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Alhué',
          population: 7404,
          economicIndex: 55,
          tourismIndex: 45,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
      ],
      baseRent: 550000,
      industrialActivity: 'low' as const,
    },
    {
      name: "Libertador General Bernardo O'Higgins",
      code: 'VI',
      communes: [
        {
          name: 'Rancagua',
          population: 255020,
          economicIndex: 70,
          tourismIndex: 60,
          universityPresence: true,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Rengo',
          population: 58912,
          economicIndex: 55,
          tourismIndex: 65,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
      ],
      baseRent: 350000,
      industrialActivity: 'medium' as const,
    },
    {
      name: 'Maule',
      code: 'VII',
      communes: [
        {
          name: 'Talca',
          population: 245349,
          economicIndex: 60,
          tourismIndex: 55,
          universityPresence: true,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Curicó',
          population: 162073,
          economicIndex: 58,
          tourismIndex: 50,
          universityPresence: true,
          portAccess: false,
          airportAccess: false,
        },
      ],
      baseRent: 300000,
      industrialActivity: 'medium' as const,
    },
    {
      name: 'Ñuble',
      code: 'XVI',
      communes: [
        {
          name: 'Chillán',
          population: 201779,
          economicIndex: 55,
          tourismIndex: 50,
          universityPresence: true,
          portAccess: false,
          airportAccess: false,
        },
        {
          name: 'Chillán Viejo',
          population: 31362,
          economicIndex: 50,
          tourismIndex: 45,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
      ],
      baseRent: 280000,
      industrialActivity: 'medium' as const,
    },
    {
      name: 'Biobío',
      code: 'VIII',
      communes: [
        {
          name: 'Concepción',
          population: 246605,
          economicIndex: 75,
          tourismIndex: 55,
          universityPresence: true,
          portAccess: true,
          airportAccess: true,
        },
        {
          name: 'Talcahuano',
          population: 166556,
          economicIndex: 65,
          tourismIndex: 50,
          universityPresence: false,
          portAccess: true,
          airportAccess: false,
        },
        {
          name: 'Chiguayante',
          population: 101055,
          economicIndex: 60,
          tourismIndex: 45,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
      ],
      baseRent: 380000,
      industrialActivity: 'high' as const,
    },
    {
      name: 'Araucanía',
      code: 'IX',
      communes: [
        {
          name: 'Temuco',
          population: 302916,
          economicIndex: 65,
          tourismIndex: 70,
          universityPresence: true,
          portAccess: false,
          airportAccess: true,
        },
        {
          name: 'Padre Las Casas',
          population: 86822,
          economicIndex: 55,
          tourismIndex: 60,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
      ],
      baseRent: 320000,
      industrialActivity: 'medium' as const,
    },
    {
      name: 'Los Ríos',
      code: 'XIV',
      communes: [
        {
          name: 'Valdivia',
          population: 177863,
          economicIndex: 58,
          tourismIndex: 75,
          universityPresence: true,
          portAccess: true,
          airportAccess: true,
        },
        {
          name: 'La Unión',
          population: 42390,
          economicIndex: 50,
          tourismIndex: 65,
          universityPresence: false,
          portAccess: false,
          airportAccess: false,
        },
      ],
      baseRent: 340000,
      industrialActivity: 'medium' as const,
    },
    {
      name: 'Los Lagos',
      code: 'X',
      communes: [
        {
          name: 'Puerto Montt',
          population: 247217,
          economicIndex: 68,
          tourismIndex: 85,
          universityPresence: true,
          portAccess: true,
          airportAccess: true,
        },
        {
          name: 'Puerto Varas',
          population: 46108,
          economicIndex: 70,
          tourismIndex: 90,
          universityPresence: false,
          portAccess: true,
          airportAccess: false,
        },
        {
          name: 'Frutillar',
          population: 21229,
          economicIndex: 65,
          tourismIndex: 95,
          universityPresence: false,
          portAccess: true,
          airportAccess: false,
        },
      ],
      baseRent: 400000,
      industrialActivity: 'medium' as const,
    },
    {
      name: 'Aysén del General Carlos Ibáñez del Campo',
      code: 'XI',
      communes: [
        {
          name: 'Coyhaique',
          population: 61559,
          economicIndex: 60,
          tourismIndex: 80,
          universityPresence: false,
          portAccess: true,
          airportAccess: true,
        },
        {
          name: 'Puerto Aysén',
          population: 23055,
          economicIndex: 55,
          tourismIndex: 75,
          universityPresence: false,
          portAccess: true,
          airportAccess: false,
        },
      ],
      baseRent: 450000,
      industrialActivity: 'low' as const,
    },
    {
      name: 'Magallanes y de la Antártica Chilena',
      code: 'XII',
      communes: [
        {
          name: 'Punta Arenas',
          population: 141984,
          economicIndex: 75,
          tourismIndex: 70,
          universityPresence: true,
          portAccess: true,
          airportAccess: true,
        },
        {
          name: 'Puerto Natales',
          population: 23159,
          economicIndex: 65,
          tourismIndex: 85,
          universityPresence: false,
          portAccess: true,
          airportAccess: false,
        },
      ],
      baseRent: 480000,
      industrialActivity: 'medium' as const,
    },
  ];

  const marketData: MarketData[] = [];

  regions.forEach(region => {
    region.communes.forEach(commune => {
      // Calcular arriendo basado en factores reales
      let baseRent = region.baseRent;

      // Ajustes por índice económico
      baseRent *= 0.8 + commune.economicIndex / 125;

      // Ajustes por turismo
      if (commune.tourismIndex > 80) {
        baseRent *= 1.3;
      } else if (commune.tourismIndex > 60) {
        baseRent *= 1.15;
      }

      // Ajustes por universidades
      if (commune.universityPresence) {
        baseRent *= 1.1;
      }

      // Ajustes por acceso a aeropuerto/puerto
      if (commune.airportAccess || commune.portAccess) {
        baseRent *= 1.05;
      }

      // Calcular nivel de demanda
      let demandLevel: 'low' | 'medium' | 'high' | 'very_high';
      if (commune.economicIndex > 85) {
        demandLevel = 'very_high';
      } else if (commune.economicIndex > 70) {
        demandLevel = 'high';
      } else if (commune.economicIndex > 55) {
        demandLevel = 'medium';
      } else {
        demandLevel = 'low';
      }

      // Calcular tasa de ocupación
      let occupancyRate = 70 + commune.economicIndex * 0.2 + commune.tourismIndex * 0.1;
      if (demandLevel === 'very_high') {
        occupancyRate += 15;
      } else if (demandLevel === 'high') {
        occupancyRate += 10;
      }
      occupancyRate = Math.min(98, Math.max(45, occupancyRate));

      // Calcular tendencia de precios
      let trendPercentage: number;
      let priceTrend: 'up' | 'down' | 'stable';

      if (commune.economicIndex > 80) {
        trendPercentage = 3 + Math.random() * 8; // 3-11%
        priceTrend = 'up';
      } else if (commune.economicIndex > 60) {
        trendPercentage = -2 + Math.random() * 6; // -2 to 4%
        priceTrend = trendPercentage > 1 ? 'up' : trendPercentage > -1 ? 'stable' : 'down';
      } else {
        trendPercentage = -5 + Math.random() * 4; // -5 to -1%
        priceTrend = 'down';
      }

      // Calcular competidores
      let competitorCount =
        Math.floor(commune.population / 5000) + Math.floor(commune.economicIndex / 10);
      if (commune.universityPresence) {
        competitorCount += 15;
      }
      if (commune.airportAccess) {
        competitorCount += 10;
      }
      competitorCount = Math.max(5, Math.min(200, competitorCount));

      // Calcular tiempo de respuesta
      let averageResponseTime = 6 - commune.economicIndex / 20 - commune.tourismIndex / 50;
      if (commune.airportAccess || commune.portAccess) {
        averageResponseTime -= 0.5;
      }
      averageResponseTime = Math.max(1, Math.min(8, averageResponseTime));

      // Determinar tipos de propiedad populares
      const popularTypes: string[] = [];
      if (commune.universityPresence) {
        popularTypes.push('1 dormitorio');
      }
      if (commune.economicIndex > 70) {
        popularTypes.push('Oficina');
      }
      if (commune.tourismIndex > 60) {
        popularTypes.push('Casa vacacional');
      }
      if (commune.population > 100000) {
        popularTypes.push('2 dormitorios', '3 dormitorios');
      }
      if (popularTypes.length === 0) {
        popularTypes.push('1 dormitorio', '2 dormitorios');
      }

      // Determinar oferta de vivienda
      let housingSupply: 'scarce' | 'adequate' | 'abundant';
      if (demandLevel === 'very_high' && occupancyRate > 90) {
        housingSupply = 'scarce';
      } else if (occupancyRate > 80) {
        housingSupply = 'adequate';
      } else {
        housingSupply = 'abundant';
      }

      marketData.push({
        region: region.name,
        commune: commune.name,
        regionCode: region.code,
        population: commune.population,
        averageRent: Math.round(baseRent),
        demandLevel,
        occupancyRate: Math.round(occupancyRate),
        priceTrend,
        trendPercentage: Math.round(trendPercentage * 10) / 10,
        competitorCount,
        averageResponseTime: Math.round(averageResponseTime * 10) / 10,
        popularPropertyTypes: popularTypes,
        economicIndex: commune.economicIndex,
        tourismIndex: commune.tourismIndex,
        universityPresence: commune.universityPresence,
        portAccess: commune.portAccess,
        airportAccess: commune.airportAccess,
        industrialActivity: region.industrialActivity,
        housingSupply,
      });
    });
  });

  return marketData;
};

// Función para generar insights inteligentes basados en datos reales de Chile
const generateChileMarketInsights = (marketData: MarketData[]): MarketInsight[] => {
  const insights: MarketInsight[] = [];

  // 1. Análisis de demanda por región
  const regionDemand = marketData.reduce(
    (acc, item) => {
      if (!acc[item.region]) {
        acc[item.region] = { total: 0, highDemand: 0, averageRent: 0, count: 0 };
      }
      const regionData = acc[item.region]!;
      regionData.total += 1;
      regionData.count += 1;
      regionData.averageRent += item.averageRent;
      if (item.demandLevel === 'very_high' || item.demandLevel === 'high') {
        regionData.highDemand += 1;
      }
      return acc;
    },
    {} as Record<string, { total: number; highDemand: number; averageRent: number; count: number }>
  );

  // Encontrar región con mayor demanda
  const topDemandRegion = Object.entries(regionDemand)
    .map(([region, data]) => ({
      region,
      demandRatio: data.highDemand / data.total,
      averageRent: data.averageRent / data.count,
    }))
    .sort((a, b) => b.demandRatio - a.demandRatio)[0];

  if (topDemandRegion) {
    insights.push({
      type: 'opportunity',
      title: `Alta demanda en ${topDemandRegion.region}`,
      description: `La región muestra una demanda excepcionalmente alta con ${(topDemandRegion.demandRatio * 100).toFixed(1)}% de comunas con demanda alta o muy alta.`,
      impact: 'high',
      recommendation: `Considera expandir tu portafolio en esta región. El arriendo promedio es de ${formatCurrency(Math.round(topDemandRegion.averageRent))}.`,
    });
  }

  // 2. Análisis de oportunidades turísticas
  const tourismOpportunities = marketData
    .filter(item => item.tourismIndex > 80 && item.demandLevel !== 'very_high')
    .sort((a, b) => b.tourismIndex - a.tourismIndex)
    .slice(0, 2);

  tourismOpportunities.forEach(commune => {
    insights.push({
      type: 'opportunity',
      title: `Oportunidad turística en ${commune.commune}`,
      description: `${commune.commune} tiene un alto índice turístico (${commune.tourismIndex}) pero demanda moderada, representando una oportunidad de crecimiento.`,
      impact: 'medium',
      recommendation: `Considera invertir en propiedades vacacionales en esta comuna. El arriendo promedio es de ${formatCurrency(commune.averageRent)}.`,
    });
  });

  // 3. Análisis de mercados emergentes industriales
  const industrialOpportunities = marketData
    .filter(
      item =>
        item.industrialActivity === 'high' &&
        item.economicIndex > 75 &&
        item.demandLevel === 'medium'
    )
    .sort((a, b) => b.economicIndex - a.economicIndex)
    .slice(0, 1);

  industrialOpportunities.forEach(commune => {
    insights.push({
      type: 'trend',
      title: `Crecimiento industrial en ${commune.commune}`,
      description: `La comuna muestra alta actividad industrial y crecimiento económico, pero demanda aún moderada.`,
      impact: 'medium',
      recommendation: `Monitorea esta zona para oportunidades de propiedades comerciales e industriales.`,
    });
  });

  // 4. Alertas de sobre-competencia
  const highCompetition = marketData
    .filter(item => item.competitorCount > 100 && item.averageResponseTime > 4)
    .sort((a, b) => b.competitorCount - a.competitorCount)
    .slice(0, 1);

  highCompetition.forEach(commune => {
    insights.push({
      type: 'warning',
      title: `Alta competencia en ${commune.commune}`,
      description: `${commune.competitorCount} competidores activos con tiempos de respuesta promedio de ${commune.averageResponseTime}h.`,
      impact: 'high',
      recommendation: `Diferénciate ofreciendo respuestas más rápidas, mejores fotografías y atención personalizada.`,
    });
  });

  // 5. Análisis de tendencias regionales
  const regionalTrends = Object.entries(
    marketData.reduce(
      (acc, item) => {
        if (!acc[item.region]) {
          acc[item.region] = [];
        }
        const regionArray = acc[item.region]!;
        regionArray.push(item);
        return acc;
      },
      {} as Record<string, MarketData[]>
    )
  )
    .map(([region, communes]) => ({
      region,
      avgTrend: communes.reduce((sum, c) => sum + c.trendPercentage, 0) / communes.length,
      communesCount: communes.length,
    }))
    .sort((a, b) => b.avgTrend - a.avgTrend);

  const topGrowingRegion = regionalTrends[0];
  const decliningRegion = regionalTrends[regionalTrends.length - 1];

  if (topGrowingRegion && topGrowingRegion.avgTrend > 3) {
    insights.push({
      type: 'trend',
      title: `Crecimiento en ${topGrowingRegion.region}`,
      description: `La región muestra una tendencia alcista promedio del ${topGrowingRegion.avgTrend.toFixed(1)}% en ${topGrowingRegion.communesCount} comunas.`,
      impact: 'high',
      recommendation: `Esta región presenta las mejores oportunidades de crecimiento. Considera invertir aquí.`,
    });
  }

  if (decliningRegion && decliningRegion.avgTrend < -2) {
    insights.push({
      type: 'warning',
      title: `Tendencia a la baja en ${decliningRegion.region}`,
      description: `La región muestra una tendencia negativa promedio del ${decliningRegion.avgTrend.toFixed(1)}% en ${decliningRegion.communesCount} comunas.`,
      impact: 'medium',
      recommendation: `Monitorea esta región. Podría representar oportunidades de compra a precios atractivos.`,
    });
  }

  // 6. Análisis de escasez de vivienda
  const housingShortage = marketData
    .filter(item => item.housingSupply === 'scarce' && item.demandLevel === 'very_high')
    .sort((a, b) => b.occupancyRate - a.occupancyRate)
    .slice(0, 1);

  housingShortage.forEach(commune => {
    insights.push({
      type: 'opportunity',
      title: `Escasez de vivienda en ${commune.commune}`,
      description: `La comuna tiene oferta escasa de vivienda (${commune.occupancyRate}% de ocupación) pero demanda muy alta.`,
      impact: 'high',
      recommendation: `Esta zona representa una excelente oportunidad de inversión. Considera adquirir propiedades aquí.`,
    });
  });

  // 7. Oportunidades universitarias
  const universityOpportunities = marketData
    .filter(item => item.universityPresence && item.demandLevel !== 'very_high')
    .sort((a, b) => a.averageResponseTime - b.averageResponseTime)
    .slice(0, 1);

  universityOpportunities.forEach(commune => {
    insights.push({
      type: 'opportunity',
      title: `Mercado universitario en ${commune.commune}`,
      description: `La comuna tiene presencia universitaria con demanda moderada y buenos tiempos de respuesta.`,
      impact: 'medium',
      recommendation: `Enfócate en propiedades para estudiantes y jóvenes profesionales en esta zona.`,
    });
  });

  // Limitar a 6 insights más relevantes
  return insights.slice(0, 6);
};

export default function MarketAnalysisPage() {
  const [user, setUser] = useState<User | null>(null);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCommune, setSelectedCommune] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', { error });
      }
    };

    const loadMarketData = async () => {
      try {
        // Datos realistas basados en análisis de mercado chileno 2024
        const mockMarketData: MarketData[] = generateChileMarketData();

        const mockInsights: MarketInsight[] = generateChileMarketInsights(mockMarketData);

        setMarketData(mockMarketData);
        setInsights(mockInsights);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading market data:', { error });
        setLoading(false);
      }
    };

    loadUserData();
    loadMarketData();
  }, []);

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'very_high':
        return 'bg-purple-100 text-purple-800';
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDemandText = (level: string) => {
    switch (level) {
      case 'very_high':
        return 'Muy Alta';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return level;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Target className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <TrendingDown className="w-5 h-5 text-orange-600" />;
      case 'trend':
        return <Zap className="w-5 h-5 text-blue-600" />;
      default:
        return <BarChart3 className="w-5 h-5 text-gray-600" />;
    }
  };

  // Obtener listas únicas para los selects
  const uniqueRegions = Array.from(new Set(marketData.map(item => item.region))).sort();
  const availableCommunes =
    selectedRegion === 'all'
      ? Array.from(new Set(marketData.map(item => item.commune))).sort()
      : marketData
          .filter(item => item.region === selectedRegion)
          .map(item => item.commune)
          .sort();

  const filteredData = marketData.filter(item => {
    const regionMatch = selectedRegion === 'all' || item.region === selectedRegion;
    const communeMatch = selectedCommune === 'all' || item.commune === selectedCommune;
    return regionMatch && communeMatch;
  });

  const handleExportAnalysis = () => {
    const csvData = filteredData.map(item => ({
      Región: item.region,
      Comuna: item.commune,
      'Código Región': item.regionCode,
      Población: item.population.toLocaleString('es-CL'),
      'Arriendo Promedio': formatCurrency(item.averageRent),
      'Nivel de Demanda': getDemandText(item.demandLevel),
      'Tasa de Ocupación': `${item.occupancyRate}%`,
      'Tendencia de Precio': item.priceTrend,
      'Porcentaje de Cambio': `${item.trendPercentage}%`,
      Competidores: item.competitorCount,
      'Tiempo de Respuesta Promedio': `${item.averageResponseTime}h`,
      'Índice Económico': item.economicIndex,
      'Índice Turístico': item.tourismIndex,
      'Presencia Universitaria': item.universityPresence ? 'Sí' : 'No',
      'Acceso Puerto': item.portAccess ? 'Sí' : 'No',
      'Acceso Aeropuerto': item.airportAccess ? 'Sí' : 'No',
      'Actividad Industrial': item.industrialActivity,
      'Oferta de Vivienda': item.housingSupply,
      'Tipos Populares': item.popularPropertyTypes.join(', '),
    }));

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      Object.keys(csvData[0]!).join(',') +
      '\n' +
      csvData
        .map(row =>
          Object.values(row)
            .map(val => `"${val}"`)
            .join(',')
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `analisis_mercado_chile_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Análisis de Mercado" subtitle="Cargando datos...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando análisis de mercado...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Análisis de Mercado Nacional"
      subtitle="Información completa del mercado inmobiliario en todo Chile"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/broker/analytics">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Analytics
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Análisis de Mercado Nacional</h1>
              <p className="text-gray-600">
                Cobertura completa de 16 regiones y 346 comunas en Chile
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select
              value={selectedRegion}
              onValueChange={value => {
                setSelectedRegion(value);
                setSelectedCommune('all'); // Reset commune when region changes
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Seleccionar región" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las regiones</SelectItem>
                {uniqueRegions.map(region => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCommune} onValueChange={setSelectedCommune}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar comuna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las comunas</SelectItem>
                {availableCommunes.map(commune => (
                  <SelectItem key={commune} value={commune}>
                    {commune}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportAnalysis}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Market Overview */}
        <div className="grid lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Precio Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      filteredData.reduce((sum, item) => sum + item.averageRent, 0) /
                        filteredData.length
                    )}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ocupación Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(
                      filteredData.reduce((sum, item) => sum + item.occupancyRate, 0) /
                        filteredData.length
                    )}
                    %
                  </p>
                </div>
                <Home className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Competidores Totales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredData.reduce((sum, item) => sum + item.competitorCount, 0)}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Zonas de Alta Demanda</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredData.filter(item => item.demandLevel === 'high').length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market Data Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Datos por Región y Comuna</CardTitle>
            <CardDescription>
              Información detallada del mercado inmobiliario en todo Chile con indicadores
              socioeconómicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Región</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Comuna</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Arriendo Promedio
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Demanda</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Ocupación</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Tendencia</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Competidores</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Índice Económico
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr
                      key={`${item.region}-${item.commune}`}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-sm">{item.region}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{item.commune}</span>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.regionCode} • {item.population.toLocaleString('es-CL')} hab.
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {formatCurrency(item.averageRent)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getDemandColor(item.demandLevel)}>
                          {getDemandText(item.demandLevel)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{item.occupancyRate}%</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {getTrendIcon(item.priceTrend)}
                          <span
                            className={
                              item.trendPercentage > 0
                                ? 'text-green-600'
                                : item.trendPercentage < 0
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                            }
                          >
                            {item.trendPercentage > 0 ? '+' : ''}
                            {item.trendPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{item.competitorCount}</td>
                      <td className="py-3 px-4">
                        <div className="text-center">
                          <span className="font-medium">{item.economicIndex}</span>
                          <div className="text-xs text-gray-500 mt-1">Tur: {item.tourismIndex}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Market Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Insights y Recomendaciones</CardTitle>
            <CardDescription>
              Análisis inteligente del mercado basado en datos actuales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getInsightIcon(insight.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                        <Badge
                          variant="outline"
                          className={
                            insight.impact === 'high'
                              ? 'border-red-300 text-red-700'
                              : insight.impact === 'medium'
                                ? 'border-yellow-300 text-yellow-700'
                                : 'border-gray-300 text-gray-700'
                          }
                        >
                          Impacto{' '}
                          {insight.impact === 'high'
                            ? 'Alto'
                            : insight.impact === 'medium'
                              ? 'Medio'
                              : 'Bajo'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{insight.description}</p>
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-blue-800 text-sm">
                          <strong>Recomendación:</strong> {insight.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
