export default function TestStylesPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-foreground">Prueba de Estilos Tailwind</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Colores principales */}
          <div className="bg-primary text-primary-foreground p-4 rounded-lg">
            <h3 className="font-semibold">Primary</h3>
            <p>Texto sobre fondo primary</p>
          </div>

          <div className="bg-secondary text-secondary-foreground p-4 rounded-lg">
            <h3 className="font-semibold">Secondary</h3>
            <p>Texto sobre fondo secondary</p>
          </div>

          <div className="bg-accent text-accent-foreground p-4 rounded-lg">
            <h3 className="font-semibold">Accent</h3>
            <p>Texto sobre fondo accent</p>
          </div>

          {/* Estados */}
          <div className="bg-destructive text-white p-4 rounded-lg">
            <h3 className="font-semibold">Destructive</h3>
            <p>Texto sobre fondo destructive</p>
          </div>

          <div className="bg-muted text-muted-foreground p-4 rounded-lg">
            <h3 className="font-semibold">Muted</h3>
            <p>Texto muted sobre fondo muted</p>
          </div>

          <div className="bg-card text-card-foreground p-4 rounded-lg border">
            <h3 className="font-semibold">Card</h3>
            <p>Texto sobre fondo card</p>
          </div>

          {/* Botones */}
          <div className="space-y-2">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90">
              Botón Primary
            </button>
            <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/80">
              Botón Secondary
            </button>
          </div>

          {/* Bordes y inputs */}
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Input con border"
              className="w-full px-3 py-2 border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="w-full h-10 border-2 border-border rounded"></div>
          </div>

          {/* Texto de diferentes tamaños */}
          <div className="space-y-2">
            <p className="text-xs">Texto extra pequeño</p>
            <p className="text-sm">Texto pequeño</p>
            <p className="text-base">Texto base</p>
            <p className="text-lg">Texto grande</p>
            <p className="text-xl">Texto extra grande</p>
          </div>
        </div>

        {/* Grid responsive */}
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Grid Responsive</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="bg-background p-3 rounded border text-center">
                Item {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
