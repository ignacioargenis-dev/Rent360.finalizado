export default function DebugLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'Arial', minHeight: '100vh' }}>
      <header style={{ background: '#f0f0f0', padding: '10px', marginBottom: '20px' }}>
        <h2>🔧 Debug Layout Header</h2>
        <p>Este layout personalizado NO usa providers ni componentes complejos.</p>
      </header>
      <main style={{ padding: '0 20px' }}>{children}</main>
      <footer style={{ background: '#f0f0f0', padding: '10px', marginTop: '20px' }}>
        <p>🔧 Debug Layout Footer</p>
      </footer>
    </div>
  );
}
