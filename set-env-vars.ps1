# Script para configurar variables de entorno de Google AI
# Ejecutar este script antes de iniciar el servidor de desarrollo

$env:GOOGLE_AI_API_KEY = "AIzaSyBV3sbTmC-Sj4IPdxnhd_VXkDn0Ro2B6-0"
$env:GOOGLE_MODEL = "gemini-pro"
$env:GOOGLE_MAX_TOKENS = "1500"
$env:GOOGLE_TEMPERATURE = "0.7"

Write-Host "Variables de Google AI configuradas:"
Write-Host "GOOGLE_AI_API_KEY: $env:GOOGLE_AI_API_KEY"
Write-Host "GOOGLE_MODEL: $env:GOOGLE_MODEL"
Write-Host "GOOGLE_MAX_TOKENS: $env:GOOGLE_MAX_TOKENS"
Write-Host "GOOGLE_TEMPERATURE: $env:GOOGLE_TEMPERATURE"

Write-Host "`nAhora puedes ejecutar: npm run dev"
