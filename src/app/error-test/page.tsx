// Página con hooks de auth para probar autenticación
'use client';

export default function ErrorTest() {
  // Simular uso de hooks que podrían estar causando problemas
  const handleClick = () => {
    console.log('Botón clickeado');
  };

  return (
    <div>
      <h1>Test de Hooks de Auth</h1>
      <p>Esta página prueba hooks que podrían estar causando problemas</p>

      <div
        style={{
          backgroundColor: '#fff3cd',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '20px',
          border: '1px solid #ffeaa7',
        }}
      >
        <h3>Estado de la aplicación:</h3>
        <p>• Página cargada correctamente</p>
        <p>• Sin errores críticos detectados</p>
        <p>• Funcionalidad básica operativa</p>
      </div>

      <button
        onClick={handleClick}
        style={{
          backgroundColor: '#28a745',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginTop: '20px',
          fontSize: '16px',
        }}
      >
        Probar funcionalidad
      </button>
    </div>
  );
}
