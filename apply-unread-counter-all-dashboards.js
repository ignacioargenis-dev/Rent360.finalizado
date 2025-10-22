/**
 * Script para aplicar contador de mensajes no leídos a TODOS los dashboards
 * Ejecutar con: node apply-unread-counter-all-dashboards.js
 */

const fs = require('fs');
const path = require('path');

const dashboards = [
  'src/app/admin/dashboard/page.tsx',
  'src/app/support/dashboard/page.tsx',
  'src/app/provider/dashboard/page.tsx',
  'src/app/runner/dashboard/page.tsx',
];

const stateToAdd = `  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);`;

const functionToAdd = `
  const loadUnreadMessagesCount = async () => {
    try {
      const response = await fetch('/api/messages/unread-count');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnreadMessagesCount(data.unreadCount);
        }
      }
    } catch (error) {
      logger.error('Error loading unread messages count:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };`;

const intervalSetup = `
    loadUnreadMessagesCount();

    // Actualizar contador cada 30 segundos
    const interval = setInterval(() => {
      loadUnreadMessagesCount();
    }, 30000);

    return () => clearInterval(interval);`;

console.log('🔄 Aplicando contador de mensajes no leídos a todos los dashboards...\n');

dashboards.forEach(dashboardPath => {
  if (!fs.existsSync(dashboardPath)) {
    console.log(`❌ No se encontró: ${dashboardPath}`);
    return;
  }

  let content = fs.readFileSync(dashboardPath, 'utf8');

  // Verificar si ya tiene el contador
  if (content.includes('unreadMessagesCount')) {
    console.log(`✅ Ya aplicado: ${dashboardPath}`);
    return;
  }

  console.log(`📝 Procesando: ${dashboardPath}`);

  // 1. Agregar estado después de const [loading, setLoading]
  const loadingPattern = /const \[loading, setLoading\] = useState\([^)]+\);/;
  if (loadingPattern.test(content)) {
    content = content.replace(loadingPattern, match => `${match}\n${stateToAdd}`);
    console.log(`  ✓ Estado agregado`);
  }

  // 2. Agregar función antes del primer useEffect
  const useEffectPattern = /useEffect\(\(\) => \{/;
  if (useEffectPattern.test(content)) {
    content = content.replace(useEffectPattern, match => `${functionToAdd}\n\n  ${match}`);
    console.log(`  ✓ Función agregada`);
  }

  // 3. Agregar llamada y setup de interval en el useEffect (antes del }, []);)
  // Buscar el cierre del primer useEffect
  const useEffectEndPattern = /\n  }, \[\]\);/;
  if (useEffectEndPattern.test(content)) {
    content = content.replace(useEffectEndPattern, `${intervalSetup}\n  }, []);`);
    console.log(`  ✓ Interval setup agregado`);
  }

  // 4. Agregar prop a UnifiedDashboardLayout
  const layoutPattern = /<UnifiedDashboardLayout([^>]*)>/g;
  let matches = [];
  let match;
  while ((match = layoutPattern.exec(content)) !== null) {
    matches.push(match);
  }

  if (matches.length > 0) {
    // Reemplazar en orden inverso para no afectar los índices
    for (let i = matches.length - 1; i >= 0; i--) {
      const fullMatch = matches[i][0];
      const props = matches[i][1];

      // Solo agregar si no existe ya
      if (!props.includes('unreadMessagesCount')) {
        // Buscar el último prop antes del >
        const newProps = props.trimEnd() + '\n      unreadMessagesCount={unreadMessagesCount}';
        const newMatch = `<UnifiedDashboardLayout${newProps}>`;

        content =
          content.substring(0, matches[i].index) +
          newMatch +
          content.substring(matches[i].index + fullMatch.length);
      }
    }
    console.log(`  ✓ Props agregadas a UnifiedDashboardLayout`);
  }

  // Escribir el archivo
  fs.writeFileSync(dashboardPath, content);
  console.log(`✅ Completado: ${dashboardPath}\n`);
});

console.log('🎉 Script completado!');
