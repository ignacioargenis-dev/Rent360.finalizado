// Script para verificar si existe una base de datos SQLite con usuarios reales
const fs = require('fs');
const path = require('path');

function checkSqlite() {
  // Posibles ubicaciones de la base de datos SQLite
  const possibleDbPaths = [
    './dev.db',
    './prisma/dev.db',
    './database/dev.db',
    path.join(process.cwd(), 'dev.db'),
    path.join(process.cwd(), 'prisma', 'dev.db'),
  ];

  console.log('🔍 Buscando base de datos SQLite local...\n');

  // Verificar si existe algún archivo de BD
  let foundDb = null;
  for (const dbPath of possibleDbPaths) {
    if (fs.existsSync(dbPath)) {
      console.log(`✅ Encontrada base de datos SQLite: ${dbPath}`);
      foundDb = dbPath;
      break;
    }
  }

  if (!foundDb) {
    console.log('❌ No se encontró ningún archivo de base de datos SQLite');
    console.log('📍 Ubicaciones verificadas:');
    possibleDbPaths.forEach(dbPath => console.log(`  - ${dbPath}`));

    // Verificar si hay algún archivo .db en el directorio
    console.log('\n🔍 Buscando cualquier archivo .db en el proyecto...');
    const allDbFiles = [];
    function findDbFiles(dir) {
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            findDbFiles(fullPath);
          } else if (file.endsWith('.db')) {
            allDbFiles.push(fullPath);
          }
        }
      } catch (e) {
        // Ignorar errores de permisos
      }
    }
    findDbFiles(process.cwd());

    if (allDbFiles.length > 0) {
      console.log('📁 Archivos .db encontrados:');
      allDbFiles.forEach(file => console.log(`  - ${file}`));
    } else {
      console.log('❌ No se encontraron archivos .db');
    }
  } else {
    // Intentar conectar a SQLite
    console.log('\n🔌 Intentando conectar a SQLite...');
    try {
      // Configurar DATABASE_URL para SQLite
      process.env.DATABASE_URL = `file:${foundDb}`;

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      console.log('✅ Conexión exitosa a SQLite');

      prisma.user
        .count()
        .then(userCount => {
          console.log(`👥 Usuarios en SQLite: ${userCount}`);

          if (userCount > 0) {
            return prisma.user.findMany({
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 20,
            });
          } else {
            return [];
          }
        })
        .then(users => {
          if (users && users.length > 0) {
            console.log('\n📋 Usuarios en SQLite:');
            users.forEach((user, index) => {
              console.log(
                `${index + 1}. ${user.email} - ${user.name} - ${user.role} - ${user.isActive ? 'Activo' : 'Inactivo'}`
              );
            });

            // Buscar usuarios específicos
            const targetUsers = [
              'ignacio.antonio.b@hotmail.com',
              'ingerlisesg@gmail.com',
              'lucbjork@gmail.com',
            ];
            const foundUsers = users.filter(user => targetUsers.includes(user.email));

            console.log('\n🎯 Usuarios objetivo en SQLite:');
            if (foundUsers.length > 0) {
              foundUsers.forEach(user => {
                console.log(`✅ ENCONTRADO: ${user.email} - ${user.name} - ${user.role}`);
              });
              console.log(
                '\n🚀 ¡EXITO! Los usuarios reales están en SQLite. Preparando migración...'
              );
            } else {
              console.log('❌ Los usuarios objetivo no están en SQLite tampoco');
            }
          }

          return prisma.$disconnect();
        })
        .catch(error => {
          console.error('❌ Error:', error.message);
          return prisma.$disconnect();
        });
    } catch (error) {
      console.error('❌ Error conectando a SQLite:', error.message);
    }
  }

  console.log('\n💡 Resumen:');
  console.log('- Si los usuarios están en SQLite: Migrar a DigitalOcean');
  console.log('- Si no están en ningún lado: Verificar proceso de registro');
  console.log('- Si están en DigitalOcean pero no aparecen: Verificar filtros de API');
}

checkSqlite();
