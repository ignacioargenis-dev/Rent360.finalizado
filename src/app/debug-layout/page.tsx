export default function DebugLayoutPage() {
  return (
    <div>
      <h1>🎯 Debug Layout Page</h1>
      <p>Esta página usa un layout personalizado mínimo.</p>
      <p>Si ves este mensaje, el layout personalizado funciona.</p>
      <p>Hora del servidor: {new Date().toISOString()}</p>
      <div
        style={{ background: '#e8f5e8', padding: '15px', borderRadius: '5px', margin: '10px 0' }}
      >
        <h3>✅ Éxito del Layout Personalizado</h3>
        <p>El problema debe estar en el layout principal de la aplicación.</p>
      </div>
    </div>
  );
}
