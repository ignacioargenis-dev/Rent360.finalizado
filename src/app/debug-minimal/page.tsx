export default function DebugMinimalPage() {
  return (
    <div style={{ fontFamily: 'Arial', padding: '20px' }}>
      <h1>🚀 Debug Minimal Page</h1>
      <p>Esta página NO usa layout ni providers.</p>
      <p>Si ves este mensaje, Next.js básico funciona.</p>
      <p>Hora del servidor: {new Date().toISOString()}</p>
      <p>✅ Página cargada exitosamente</p>
    </div>
  );
}
