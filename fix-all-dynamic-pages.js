// Script para agregar export const dynamic = 'force-dynamic' a todas las páginas que usan 'use client'
// Excluyendo páginas públicas estáticas
const fs = require('fs');
const path = require('path');

// Páginas públicas que NO necesitan renderizado dinámico
const PUBLIC_STATIC_PAGES = [
  'src/app/page.tsx', // Homepage
  'src/app/about/page.tsx',
  'src/app/contact/page.tsx',
  'src/app/privacy/page.tsx',
  'src/app/terms/page.tsx',
  'src/app/cookies/page.tsx',
  'src/app/features/page.tsx',
  'src/app/error.tsx',
  'src/app/_error.tsx',
  'src/app/test-minimal/page.tsx',
  'src/app/simple-test/page.tsx',
  'src/app/debug-minimal/page.tsx',
  'src/app/debug-layout/page.tsx',
  'src/app/test-styles/page.tsx',
  'src/app/error-test/page.tsx',
  'src/app/offline/page.tsx'
];

function findClientPages(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findClientPages(fullPath, files);
    } else if (item.endsWith('.tsx') && fullPath.includes('src/app/')) {
      // Solo procesar si no es una página pública estática
      const relativePath = fullPath.replace(/\\/g, '/');
      if (!PUBLIC_STATIC_PAGES.some(publicPage => relativePath.includes(publicPage.replace('src/app/', '')))) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function addDynamicExport(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Verificar si ya tiene la directiva
    if (content.includes("export const dynamic = 'force-dynamic'")) {
      console.log(`✅ Ya configurado: ${filePath}`);
      return;
    }

    // Verificar si es una página con 'use client'
    if (!content.includes("'use client'")) {
      console.log(`⏭️  Saltando (no es client component): ${filePath}`);
      return;
    }

    // Agregar la directiva después de 'use client'
    const lines = content.split('\n');
    let insertIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("'use client'")) {
        insertIndex = i + 1;
        break;
      }
    }

    if (insertIndex !== -1) {
      lines.splice(insertIndex, 0, '', '// Forzar renderizado dinámico para evitar prerendering de páginas protegidas', "export const dynamic = 'force-dynamic';", '');
      content = lines.join('\n');

      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Configurado: ${filePath}`);
    } else {
      console.log(`❌ No se pudo encontrar 'use client' en: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
  }
}

console.log('🔍 Buscando páginas cliente no públicas...');
const clientPages = findClientPages('src/app');

console.log(`📝 Encontradas ${clientPages.length} páginas cliente no públicas`);
console.log('🔧 Agregando configuración de renderizado dinámico...');

clientPages.forEach(addDynamicExport);

console.log('✅ Proceso completado!');
