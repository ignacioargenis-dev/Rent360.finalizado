// Página simple con layout principal
export default function SimpleTest() {
  return (
    <div>
      <h1>Página Simple con Layout Principal</h1>
      <p>Esta página usa el layout principal de la aplicación</p>
      <p>Si esta página falla, el problema está en el layout principal o sus providers</p>

      <div
        style={{
          backgroundColor: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px',
        }}
      >
        <h2>Test de componentes básicos</h2>
        <p>Este es un párrafo simple</p>
        <button
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Botón de prueba
        </button>
      </div>
    </div>
  );
}
