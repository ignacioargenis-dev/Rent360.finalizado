export default function TestMinimal() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>
        🚀 Test Mínimo - Sin dependencias
      </h1>

      <div style={{
        backgroundColor: '#f8fafc',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#1e40af', marginBottom: '10px' }}>Estado del Sistema</h2>
        <p style={{ margin: '5px 0', color: '#374151' }}>
          ✅ Página cargada correctamente
        </p>
        <p style={{ margin: '5px 0', color: '#374151' }}>
          ✅ React funcionando sin errores
        </p>
        <p style={{ margin: '5px 0', color: '#374151' }}>
          ✅ Next.js app router operativo
        </p>
        <p style={{ margin: '5px 0', color: '#059669' }}>
          ✅ Sin dependencias problemáticas
        </p>
      </div>

      <div style={{
        backgroundColor: '#fef3c7',
        border: '2px solid #fbbf24',
        borderRadius: '8px',
        padding: '15px'
      }}>
        <p style={{ margin: '0', color: '#92400e', fontWeight: 'bold' }}>
          🎯 Si ves este mensaje, todos los problemas críticos han sido resueltos.
        </p>
      </div>
    </div>
  );
}
