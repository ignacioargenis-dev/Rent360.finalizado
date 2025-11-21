#!/bin/bash

# Script para configurar variables de entorno de Google AI
# Ejecutar este script antes de iniciar el servidor de desarrollo

export GOOGLE_AI_API_KEY="AIzaSyBV3sbTmC-Sj4IPdxnhd_VXkDn0Ro2B6-0"
export GOOGLE_MODEL="gemini-pro"
export GOOGLE_MAX_TOKENS="1500"
export GOOGLE_TEMPERATURE="0.7"

echo "Variables de Google AI configuradas:"
echo "GOOGLE_AI_API_KEY: $GOOGLE_AI_API_KEY"
echo "GOOGLE_MODEL: $GOOGLE_MODEL"
echo "GOOGLE_MAX_TOKENS: $GOOGLE_MAX_TOKENS"
echo "GOOGLE_TEMPERATURE: $GOOGLE_TEMPERATURE"

echo -e "\nAhora puedes ejecutar: npm run dev"
