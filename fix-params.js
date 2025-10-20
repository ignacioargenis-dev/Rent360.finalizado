const fs = require('fs');
const path = require('path');

// Función para buscar archivos recursivamente
function findFiles(dir, pattern, callback) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findFiles(filePath, pattern, callback);
    } else if (pattern.test(file)) {
      callback(filePath);
    }
  });
}

// Función para corregir un archivo
function fixFile(filePath) {
  console.log('Procesando:', filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(/params\.(\w+) as string/g, 'params?.$1 as string');
  fs.writeFileSync(filePath, newContent, 'utf8');
}

// Buscar y corregir todos los archivos .tsx y .ts
findFiles('src', /\.(tsx|ts)$/, fixFile);

console.log('Corrección completada');
