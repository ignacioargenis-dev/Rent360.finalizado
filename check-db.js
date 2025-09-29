const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Verificando conexión a la base de datos...');

    // Intentar hacer una consulta simple
    const result = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    console.log('✅ Conexión exitosa. Tablas encontradas:');
    console.log(result.map(row => row.table_name).join(', '));

    if (result.length === 0) {
      console.log('⚠️  No se encontraron tablas. Las migraciones pueden no haberse aplicado.');
    } else {
      console.log(`📊 Total de tablas: ${result.length}`);

      // Verificar tabla properties específicamente
      const hasProperties = result.some(row => row.table_name === 'properties');
      console.log(
        hasProperties ? '✅ Tabla properties encontrada' : '❌ Tabla properties NO encontrada'
      );
    }
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
