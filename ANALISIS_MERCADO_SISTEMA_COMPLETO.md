# 📊 SISTEMA DE ANÁLISIS DE MERCADO INMOBILIARIO - DOCUMENTACIÓN COMPLETA

## 🎯 Descripción General

Sistema completo de análisis de mercado inmobiliario con **datos reales y dinámicos** extraídos directamente de la base de datos de propiedades, contratos y actividad de usuarios.

## ✨ Características Principales

### 1. **Datos Reales y Dinámicos**

- ✅ Calculados desde la base de datos de propiedades
- ✅ Basados en contratos activos reales
- ✅ Análisis de vistas e inquiries reales
- ✅ Tendencias de precios basadas en datos históricos
- ✅ Tasas de ocupación reales por ubicación

### 2. **Análisis por Ubicación**

- Estadísticas por región y comuna
- Datos demográficos de Chile (INE 2024)
- Índices económicos y turísticos
- Infraestructura (universidades, puertos, aeropuertos)

### 3. **Métricas Calculadas**

- **Arriendo promedio** por ubicación
- **Tasa de ocupación** basada en contratos activos
- **Nivel de demanda** (basado en vistas e inquiries)
- **Tendencia de precios** (comparación mensual)
- **Días promedio para arrendar**
- **Tiempo de respuesta** estimado
- **Competencia** (número de propiedades)
- **Rango de precios** (mín/máx)

### 4. **Insights Inteligentes**

- Oportunidades de inversión
- Alertas de tendencias negativas
- Mercados emergentes
- Análisis de competencia
- Recomendaciones personalizadas

### 5. **Sistema de Caché**

- Caché en memoria con expiración automática
- Duración: 1 hora
- Actualización manual disponible
- Optimización de rendimiento

### 6. **Actualización Periódica**

- Endpoint para actualización manual
- Soporte para cron jobs
- Limpieza automática de caché

---

## 📁 Estructura de Archivos

```
src/
├── lib/
│   └── market-analysis-service.ts        # Servicio principal de análisis
│
├── app/api/broker/
│   └── market-analysis/
│       ├── route.ts                       # API: Obtener datos de mercado
│       ├── summary/
│       │   └── route.ts                   # API: Resumen ejecutivo
│       └── refresh/
│           └── route.ts                   # API: Actualización forzada
│
└── app/broker/analytics/
    ├── page.tsx                           # Dashboard principal (con resumen)
    └── market-analysis/
        └── page.tsx                       # Análisis de mercado completo
```

---

## 🔧 Configuración

### Variables de Entorno

Agrega a tu archivo `.env`:

```bash
# Opcional: Token secreto para cron jobs de actualización automática
CRON_SECRET=tu_token_secreto_aqui
```

---

## 📡 API Endpoints

### 1. **GET /api/broker/market-analysis**

Obtiene datos completos de mercado con análisis e insights.

**Query Parameters:**

- `region` (opcional): Filtrar por región específica
- `commune` (opcional): Filtrar por comuna específica
- `forceRefresh` (opcional): Forzar actualización (`true`/`false`)

**Response:**

```json
{
  "success": true,
  "data": {
    "marketData": [
      {
        "region": "Metropolitana de Santiago",
        "commune": "Las Condes",
        "regionCode": "XIII",
        "population": 330759,
        "averageRent": 850000,
        "demandLevel": "very_high",
        "occupancyRate": 92.5,
        "priceTrend": "up",
        "trendPercentage": 5.2,
        "competitorCount": 145,
        "averageViews": 85,
        "averageInquiries": 12,
        "totalProperties": 145,
        "activeProperties": 112,
        "avgDaysToRent": 18,
        "priceRange": { "min": 450000, "max": 2500000 },
        "popularPropertyTypes": ["Departamento", "Casa"],
        "economicIndex": 98,
        "tourismIndex": 65,
        "housingSupply": "scarce",
        "lastUpdated": "2024-11-25T..."
      }
    ],
    "insights": [
      {
        "type": "opportunity",
        "title": "Oportunidad de alto valor en Las Condes",
        "description": "...",
        "impact": "high",
        "recommendation": "..."
      }
    ],
    "metadata": {
      "totalLocations": 85,
      "lastUpdated": "2024-11-25T...",
      "filters": { "region": null, "commune": null }
    }
  }
}
```

**Autenticación:** Requiere rol `BROKER`, `ADMIN` o `SUPPORT`

---

### 2. **GET /api/broker/market-analysis/summary**

Obtiene un resumen ejecutivo del mercado.

**Query Parameters:**

- `forceRefresh` (opcional): Forzar actualización (`true`/`false`)

**Response:**

```json
{
  "success": true,
  "data": {
    "totalProperties": 3542,
    "totalActiveContracts": 2876,
    "averageRent": 625000,
    "occupancyRate": 81.2,
    "topRegions": [
      {
        "region": "Metropolitana de Santiago",
        "count": 1845,
        "avgRent": 725000
      }
    ],
    "topCommunes": [
      {
        "commune": "Las Condes",
        "count": 145,
        "avgRent": 850000
      }
    ],
    "propertyTypeDistribution": [
      {
        "type": "Departamento",
        "count": 1823,
        "percentage": 51.5
      }
    ],
    "marketTrends": {
      "priceChange": 3.2,
      "demandChange": 5.8,
      "supplyChange": 2.1
    }
  },
  "metadata": {
    "lastUpdated": "2024-11-25T..."
  }
}
```

**Autenticación:** Requiere rol `BROKER`, `ADMIN` o `SUPPORT`

---

### 3. **POST /api/broker/market-analysis/refresh**

Fuerza la actualización de todos los datos de mercado.

**Headers:**

```
Authorization: Bearer CRON_SECRET  (para cron jobs)
```

O autenticación normal de usuario `ADMIN`/`SUPPORT`

**Response:**

```json
{
  "success": true,
  "data": {
    "updated": true,
    "timestamp": "2024-11-25T...",
    "stats": {
      "totalLocations": 85,
      "totalInsights": 6,
      "totalProperties": 3542,
      "totalActiveContracts": 2876
    },
    "executionTime": 2450
  },
  "message": "Datos de mercado actualizados correctamente"
}
```

---

### 4. **GET /api/broker/market-analysis/refresh**

Verifica el estado del sistema de actualización.

**Response:**

```json
{
  "success": true,
  "data": {
    "cacheEnabled": true,
    "cacheExpiration": "1 hour",
    "lastUpdate": "2024-11-25T...",
    "cronJobStatus": "configured"
  }
}
```

---

## ⏰ Configuración de Actualización Automática

### Opción 1: Cron Job en DigitalOcean App Platform

1. Ve a tu App en DigitalOcean
2. Navega a **Settings** > **App-Level Environment Variables**
3. Agrega la variable `CRON_SECRET` con un valor seguro
4. Ve a **Components** > **+ Add Component**
5. Selecciona **Job**
6. Configura:
   ```yaml
   Name: market-analysis-refresh
   Source: Same as web component
   Command: curl -X POST -H "Authorization: Bearer ${CRON_SECRET}" https://tu-dominio.com/api/broker/market-analysis/refresh
   Schedule: 0 */2 * * *  # Cada 2 horas
   ```

### Opción 2: Vercel Cron Jobs

1. Crea un archivo `vercel.json` en la raíz:

   ```json
   {
     "crons": [
       {
         "path": "/api/broker/market-analysis/refresh",
         "schedule": "0 */2 * * *"
       }
     ]
   }
   ```

2. Agrega `CRON_SECRET` a tus variables de entorno en Vercel

### Opción 3: Cron Job Manual (Linux/Mac)

1. Abre tu crontab:

   ```bash
   crontab -e
   ```

2. Agrega la línea:
   ```bash
   0 */2 * * * curl -X POST -H "Authorization: Bearer TU_TOKEN_SECRETO" https://tu-dominio.com/api/broker/market-analysis/refresh
   ```

### Opción 4: GitHub Actions (CI/CD)

Crea `.github/workflows/market-refresh.yml`:

```yaml
name: Market Analysis Refresh

on:
  schedule:
    - cron: '0 */2 * * *' # Cada 2 horas
  workflow_dispatch: # Permitir ejecución manual

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Market Refresh
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://tu-dominio.com/api/broker/market-analysis/refresh
```

---

## 💻 Uso en el Frontend

### Dashboard de Analytics (Resumen)

```typescript
// En src/app/broker/analytics/page.tsx
const [marketSummary, setMarketSummary] = useState(null);

useEffect(() => {
  const loadMarketSummary = async () => {
    const response = await fetch('/api/broker/market-analysis/summary');
    const result = await response.json();
    if (result.success) {
      setMarketSummary(result.data);
    }
  };
  loadMarketSummary();
}, []);
```

### Análisis de Mercado Completo

```typescript
// En src/app/broker/analytics/market-analysis/page.tsx
const [marketData, setMarketData] = useState([]);
const [insights, setInsights] = useState([]);

useEffect(() => {
  const loadMarketData = async () => {
    const params = new URLSearchParams();
    if (selectedRegion !== 'all') {
      params.append('region', selectedRegion);
    }
    if (selectedCommune !== 'all') {
      params.append('commune', selectedCommune);
    }

    const response = await fetch(`/api/broker/market-analysis?${params}`);
    const result = await response.json();

    if (result.success) {
      setMarketData(result.data.marketData);
      setInsights(result.data.insights);
    }
  };
  loadMarketData();
}, [selectedRegion, selectedCommune]);
```

### Actualización Manual

```typescript
const handleRefreshData = async () => {
  setIsRefreshing(true);
  try {
    const params = new URLSearchParams({ forceRefresh: 'true' });
    const response = await fetch(`/api/broker/market-analysis?${params}`);
    const result = await response.json();

    if (result.success) {
      setMarketData(result.data.marketData);
      setInsights(result.data.insights);
    }
  } finally {
    setIsRefreshing(false);
  }
};
```

---

## 📊 Datos Demográficos Incluidos

El sistema incluye datos demográficos reales de Chile (2024) para 16 regiones:

1. **Arica y Parinacota** (XV)
2. **Tarapacá** (I)
3. **Antofagasta** (II)
4. **Atacama** (III)
5. **Coquimbo** (IV)
6. **Valparaíso** (V)
7. **Metropolitana de Santiago** (XIII) - **40+ comunas**
8. **O'Higgins** (VI)
9. **Maule** (VII)
10. **Ñuble** (XVI)
11. **Biobío** (VIII)
12. **Araucanía** (IX)
13. **Los Ríos** (XIV)
14. **Los Lagos** (X)
15. **Aysén** (XI)
16. **Magallanes** (XII)

Cada ubicación incluye:

- Población (INE)
- Índice económico
- Índice turístico
- Presencia universitaria
- Acceso a puertos y aeropuertos
- Actividad industrial

---

## 🎯 Insights Generados Automáticamente

El sistema genera automáticamente hasta 6 insights basados en:

### 1. **Oportunidades de Alta Demanda**

- Comunas con demanda muy alta + oferta escasa
- Tasa de ocupación elevada
- Recomendaciones de inversión

### 2. **Alertas de Tendencias Negativas**

- Mercados en declive (>5% negativo)
- Baja ocupación
- Recomendaciones de monitoreo

### 3. **Mercados Emergentes**

- Crecimiento positivo reciente
- Demanda en aumento
- Oportunidades de entrada temprana

### 4. **Análisis de Competencia**

- Alta concentración de propiedades
- Tiempos de respuesta lentos
- Recomendaciones de diferenciación

### 5. **Oportunidades por Tipo de Propiedad**

- Tipos con alta demanda
- Análisis por ubicación
- Recomendaciones de portafolio

### 6. **Análisis Regional**

- Regiones con mejor crecimiento
- Comparación de tendencias
- Recomendaciones estratégicas

---

## 🚀 Rendimiento y Optimización

### Sistema de Caché

- **Duración:** 1 hora
- **Tipo:** In-memory (Map)
- **Clave:** Por región/comuna
- **Invalidación:** Automática por tiempo o manual

### Optimizaciones

1. **Cálculos eficientes** con agregaciones de Prisma
2. **Caché por ubicación** para consultas específicas
3. **Lazy loading** de datos demográficos
4. **Índices de base de datos** en campos clave

### Tiempos de Respuesta Esperados

- **Primera carga (sin caché):** 2-5 segundos
- **Con caché:** 50-200ms
- **Actualización completa:** 3-8 segundos

---

## 🔒 Seguridad

### Autenticación y Autorización

- **Acceso a datos:** Solo usuarios `BROKER`, `ADMIN`, `SUPPORT`
- **Actualización manual:** Solo `ADMIN`, `SUPPORT`
- **Actualización cron:** Requiere `CRON_SECRET`

### Protección de Datos

- Los datos individuales de propiedades no se exponen
- Sólo estadísticas agregadas
- Sin información personal de usuarios

---

## 📈 Métricas de Éxito

### KPIs Medibles

1. **Precisión de datos:** 100% basado en DB real
2. **Actualización:** Cada 2 horas (configurable)
3. **Cobertura:** 16 regiones, 100+ comunas
4. **Insights:** 6 recomendaciones actualizadas
5. **Rendimiento:** <5s primera carga, <200ms con caché

---

## 🆘 Solución de Problemas

### Error: "No autorizado"

**Causa:** Usuario sin permisos o token incorrecto
**Solución:** Verifica que el usuario tenga rol `BROKER`, `ADMIN` o `SUPPORT`

### Error: "Error al obtener análisis de mercado"

**Causa:** Error en la base de datos o servicio
**Solución:** Revisa los logs del servidor, verifica conexión a DB

### Datos vacíos o ceros

**Causa:** No hay propiedades en la base de datos
**Solución:** Verifica que existan propiedades creadas en el sistema

### Caché desactualizado

**Causa:** Datos han cambiado pero el caché no se ha actualizado
**Solución:** Usa `forceRefresh=true` o espera 1 hora

---

## 🎓 Próximas Mejoras (Roadmap)

### Corto Plazo

- [ ] Dashboard de admin para gestionar caché
- [ ] Exportación a PDF de informes
- [ ] Gráficos interactivos con Chart.js

### Mediano Plazo

- [ ] Integración con APIs externas (INE, Banco Central)
- [ ] Predicciones con Machine Learning
- [ ] Alertas personalizadas por email

### Largo Plazo

- [ ] Sistema de reportes automáticos
- [ ] Comparación histórica multi-año
- [ ] API pública para partners

---

## 📞 Soporte

Para dudas o problemas con el sistema de análisis de mercado:

1. Revisa esta documentación
2. Consulta los logs de la aplicación
3. Verifica las variables de entorno
4. Contacta al equipo de desarrollo

---

## ✅ Resumen Ejecutivo

Este sistema de análisis de mercado proporciona **datos reales, dinámicos y actualizados** del mercado inmobiliario chileno, calculados directamente desde tu base de datos de propiedades y contratos.

**Características principales:**

- ✅ Datos 100% reales (no mock)
- ✅ Actualización automática cada 2 horas
- ✅ Caché optimizado (1 hora)
- ✅ Insights inteligentes automáticos
- ✅ Cobertura nacional (16 regiones)
- ✅ Métricas avanzadas (ocupación, tendencias, demanda)
- ✅ Seguro y escalable

**Beneficios para brokers:**

- Toma de decisiones basada en datos reales
- Identificación de oportunidades de inversión
- Comprensión del mercado en tiempo real
- Ventaja competitiva con insights automáticos
- Exportación de reportes profesionales

---

_Última actualización: 25 de noviembre, 2024_
