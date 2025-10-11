export default function DebugLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <title>Debug Layout</title>
      </head>
      <body style={{ fontFamily: 'Arial', margin: 0, padding: '20px' }}>
        <header style={{ background: '#f0f0f0', padding: '10px', marginBottom: '20px' }}>
          <h2>🔧 Debug Layout Header</h2>
        </header>
        <main>{children}</main>
        <footer style={{ background: '#f0f0f0', padding: '10px', marginTop: '20px' }}>
          <p>🔧 Debug Layout Footer</p>
        </footer>
      </body>
    </html>
  );
}
