// Página ultra-mínima para diagnosticar problemas críticos
export default function DebugMinimal() {
  return (
    <html lang="es">
      <head>
        <title>Debug Minimal</title>
      </head>
      <body>
        <h1>Debug Minimal - Sin dependencias externas</h1>
        <p>Esta página no usa layout ni providers</p>
        <p>Si esta página falla, el problema está en el núcleo de Next.js</p>
      </body>
    </html>
  );
}
