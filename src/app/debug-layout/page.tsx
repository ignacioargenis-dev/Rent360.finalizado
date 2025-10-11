// Página con layout personalizado mínimo
export default function DebugLayout() {
  return (
    <div
      style={{
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f0f0f0',
        minHeight: '100vh',
      }}
    >
      <h1>Debug Layout - Layout personalizado mínimo</h1>
      <p>Esta página usa layout personalizado sin providers externos</p>
      <p>Si esta página falla, el problema está en el layout personalizado</p>
      <div
        style={{
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '20px',
        }}
      >
        <h2>Contenido de prueba</h2>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      </div>
    </div>
  );
}
