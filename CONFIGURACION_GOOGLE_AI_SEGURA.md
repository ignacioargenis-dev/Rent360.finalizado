# 🔒 Configuración Segura de Google AI para Chatbot

## 📋 Información de la API Key

**IMPORTANTE**: Esta API key debe configurarse como variable de entorno y NUNCA debe estar en el código fuente.

### Credenciales Proporcionadas:

- **Clave de API**: `AlzaSyBV3sbTmC-Sj4IPdxnhd_VXkDn0Ro2B6-0`
- **Nombre**: Default Gemini API Key
- **Proyecto**: projects/581670601972
- **Número de Proyecto**: 581670601972

## 🔐 Configuración Segura

### 1. Variable de Entorno Local (.env)

Agregar al archivo `.env` en la raíz del proyecto:

```env
# Google AI (Gemini) - Chatbot
GOOGLE_AI_API_KEY="AlzaSyBV3sbTmC-Sj4IPdxnhd_VXkDn0Ro2B6-0"
GOOGLE_MODEL="gemini-pro"
GOOGLE_MAX_TOKENS="1500"
GOOGLE_TEMPERATURE="0.7"
```

### 2. Configuración en Digital Ocean

En la consola de Digital Ocean App Platform:

1. Ve a **Settings** → **App-Level Environment Variables**
2. Agrega las siguientes variables:
   - `GOOGLE_AI_API_KEY`: `AlzaSyBV3sbTmC-Sj4IPdxnhd_VXkDn0Ro2B6-0`
   - `GOOGLE_MODEL`: `gemini-pro`
   - `GOOGLE_MAX_TOKENS`: `1500`
   - `GOOGLE_TEMPERATURE`: `0.7`

### 3. Verificación de Seguridad

✅ **Implementado**:

- La API key se lee solo desde variables de entorno
- No se almacena en el código fuente
- No se loggea completa (solo primeros caracteres)
- Validación de respuestas para evitar información confidencial
- Prompt con restricciones de seguridad estrictas

## 🛡️ Medidas de Seguridad Implementadas

### 1. **Prompt con Restricciones Estrictas**

- Prohibición explícita de compartir datos personales
- Bloqueo de información técnica del sistema
- Restricción de acceso a datos de otros usuarios
- Instrucciones claras sobre qué NO puede hacer

### 2. **Validación de Respuestas**

- Detección de patrones de información confidencial (RUTs, tarjetas, emails)
- Bloqueo de información técnica (passwords, API keys, configuraciones)
- Filtrado de datos financieros específicos
- Detección de información de otros usuarios

### 3. **Contexto de Seguridad por Rol**

- Cada rol tiene temas permitidos y restringidos
- Validación antes de enviar a IA
- Validación después de recibir respuesta

### 4. **Modalidad Híbrida**

- Primero intenta con datos de entrenamiento (sin enviar a IA externa)
- Solo usa IA externa si es necesario
- Fallback a lógica local si IA falla
- Nunca envía datos confidenciales a IA externa

## ⚠️ Advertencias Importantes

1. **NUNCA** compartir la API key públicamente
2. **NUNCA** commitear el archivo `.env` al repositorio
3. **NUNCA** loggear la API key completa
4. **SIEMPRE** validar respuestas antes de mostrar al usuario
5. **SIEMPRE** usar el prompt seguro con restricciones

## 🔍 Verificación

Para verificar que Google AI está funcionando:

1. El chatbot debe responder con mayor naturalidad
2. Los logs deben mostrar: `✅ Google AI (Gemini) inicializado correctamente`
3. Las respuestas deben ser más contextuales y útiles
4. NO debe mostrar información confidencial

## 📝 Notas

- La API key tiene límites de uso según el plan de Google Cloud
- Si se excede el límite, el sistema automáticamente usa lógica local
- Las respuestas siempre pasan por validación de seguridad
- El sistema registra todas las interacciones para aprendizaje
